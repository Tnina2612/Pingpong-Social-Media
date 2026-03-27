import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { PrismaService } from "src/prisma/prisma.service";
import { FeedStrategy } from "./enums/feed-strategy.enum";
import { FeedConfigService } from "./feed-config.service";

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private readonly FEED_CACHE_VERSION = "v1";
  private readonly FEED_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

  constructor(
    private readonly prisma: PrismaService,
    @Inject("REDIS") private redis: Redis,
    private readonly feedConfig: FeedConfigService,
  ) {}

  /**
   * Invalidate a user's feed cache when posts are edited or deleted.
   * This forces a rebuild on next access.
   */
  async invalidateUserFeedCache(userId: string): Promise<void> {
    const feedKey = `feed:${userId}:${this.FEED_CACHE_VERSION}`;
    await this.redis.del(feedKey);
    console.log(`[Cache] Invalidated feed cache for user ${userId}`);
  }

  /**
   * Invalidate feed cache for all friends when a post is deleted/edited.
   */
  async invalidateFriendsCache(userId: string): Promise<void> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.receiverId === userId ? f.requesterId : f.receiverId,
    );
    friendIds.push(userId);

    const pipeline = this.redis.pipeline();
    for (const friendId of friendIds) {
      const feedKey = `feed:${friendId}:${this.FEED_CACHE_VERSION}`;
      pipeline.del(feedKey);
    }
    await pipeline.exec();
    console.log(`[Cache] Invalidated feed cache for ${friendIds.length} users`);
  }

  // Centralized hydration to ensure identical data structures.
  private async hydratePosts(postIds: string[]) {
    return this.prisma.post.findMany({
      where: { id: { in: postIds }, status: "PUBLISHED" },
      include: this.getPostIncludeStructure(),
    });
  }

  private getPostIncludeStructure() {
    return {
      author: { select: { id: true, username: true, avatar: true } },
      attachments: true,
      _count: { select: { likes: true, comments: true } },
    };
  }

  // PUSH MODEL
  async pushPostToFriends(authorId: string, postId: string, timestamp: number) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: authorId }, { receiverId: authorId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.receiverId === authorId ? f.requesterId : f.receiverId,
    );

    friendIds.push(authorId);

    // Push to Redis using a Pipeline for high performance
    const pipeline = this.redis.pipeline();

    for (const friendId of friendIds) {
      const feedKey = `feed:${friendId}:${this.FEED_CACHE_VERSION}`;

      // Add post to the sorted set
      pipeline.zadd(feedKey, timestamp, postId);

      // Optimization: Cap the feed at 500 posts to save memory
      pipeline.zremrangebyrank(feedKey, 0, -501);

      // Ensure the feed key expires after 7 days, matching the pull model
      pipeline.expire(feedKey, this.FEED_CACHE_TTL);
    }

    await pipeline.exec();
    console.log(
      `[Feed Push] User ${authorId} post ${postId} pushed to ${friendIds.length} friends`,
    );
  }

  // PULL MODEL (Fallback)
  async buildFeedOnTheFly(userId: string) {
    console.log(`[Feed Pull] Building feed on-the-fly for user ${userId}`);

    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.receiverId === userId ? f.requesterId : f.receiverId,
    );

    friendIds.push(userId);

    const recentPosts = await this.prisma.post.findMany({
      where: { authorId: { in: friendIds } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, createdAt: true },
    });

    // Cache them in Redis for future reads
    const feedKey = `feed:${userId}:${this.FEED_CACHE_VERSION}`;
    const pipeline = this.redis.pipeline();

    for (const post of recentPosts) {
      pipeline.zadd(feedKey, post.createdAt.getTime(), post.id);
    }

    // Set an expiration so inactive users' feeds eventually clear out of RAM (e.g., 7 days)
    pipeline.expire(feedKey, this.FEED_CACHE_TTL);
    await pipeline.exec();

    console.log(
      `[Feed Pull] Built feed for user ${userId} with ${recentPosts.length} posts`,
    );
  }

  // SOURCE GENERATORS

  private async getRedisFeed(userId: string, page: number) {
    const take = 30; // Fetch slightly more candidates than we need
    const start = (page - 1) * take;
    const stop = start + take - 1;

    const feedKey = `feed:${userId}:${this.FEED_CACHE_VERSION}`;
    let postIds = await this.redis.zrevrange(feedKey, start, stop);

    // Cache Miss Handler
    if (postIds.length === 0 && page === 1) {
      console.log(`[Feed Cache] Cache miss for user ${userId}, rebuilding...`);
      await this.buildFeedOnTheFly(userId);
      postIds = await this.redis.zrevrange(feedKey, start, stop);
    }

    if (postIds.length === 0) return [];

    const posts = await this.hydratePosts(postIds);

    // Re-order to match Redis chronological sorting and tag source with confidence
    const postById = new Map(posts.map((post) => [post.id, post] as const));
    const sortedPosts = postIds
      .map((id) => postById.get(id))
      .filter((post): post is (typeof posts)[number] => post !== undefined)
      .map((post) => ({
        ...post,
        _source: "FRIEND",
        _confidence: 1.0, // Friend posts are direct social connections
      }));

    return sortedPosts;
  }

  private async getVectorRecommendations(userId: string) {
    // 1. Get the user's vector as a string format for pgvector processing
    const userResult = await this.prisma.$queryRaw<
      [{ interestVector: string }]
    >`
    SELECT "interestVector"::text FROM "User" WHERE id = ${userId}::uuid
    `;

    const vectorStr = userResult[0]?.interestVector;

    // If user has no vector yet (cold start not finished), return empty array
    if (!vectorStr) return [];

    // 2. Query mathematical similarity - fetch 50+ candidates for better diversity
    const startTime = Date.now();
    const recommendations = await this.prisma.$queryRaw<
      { id: string; distance: number }[]
    >`
      SELECT id, "contentVector" <=> ${vectorStr}::vector AS distance
      FROM "Post"
      WHERE "createdAt" > NOW() - INTERVAL '2 days'
      AND "authorId" != ${userId}::uuid
      AND status = 'PUBLISHED'
      ORDER BY distance ASC
      LIMIT 50;
    `;

    const queryTime = Date.now() - startTime;

    const postIds = recommendations.map((r) => r.id);
    if (postIds.length === 0) return [];

    // Create a map for quick confidence lookup
    const confidenceMap = new Map(
      recommendations.map((r) => [r.id, 1 - r.distance]),
    );

    const posts = await this.hydratePosts(postIds);
    console.log(
      `[AI Recommendations] Retrieved ${posts.length} posts for user ${userId} (query: ${queryTime}ms)`,
    );

    // Re-order to match pgvector similarity order
    return postIds
      .map((id) =>
        posts.find((p) => p.id === id)
          ? {
              ...posts.find((p) => p.id === id)!,
              _source: "AI_VECTOR",
              _confidence: confidenceMap.get(id) || 0,
            }
          : null,
      )
      .filter((post): post is NonNullable<typeof post> => post !== null);
  }

  private async getCommunityTrending(userId: string) {
    // Fetch user's community cluster assignment
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { communityId: true },
    });

    if (!user?.communityId) return [];

    // Find the most liked recent posts within their Louvain cluster
    const trending = await this.prisma.post.findMany({
      where: {
        author: { communityId: user.communityId },
        authorId: { not: userId },
        status: "PUBLISHED",
        createdAt: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // Last 48h
      },
      orderBy: [
        { likes: { _count: "desc" } }, // High engagement first
        { createdAt: "desc" },
      ],
      take: 10,
      include: this.getPostIncludeStructure(),
    });

    return trending.map((post) => ({
      ...post,
      _source: "COMMUNITY",
      _confidence: 0.8, // Community posts are pre-filtered by Louvain clustering
    }));
  }

  // SCORING POSTS
  private scoreAndSort(candidates: any[]) {
    // 1. Deduplication Map
    // If a post is both in "FRIEND" and "COMMUNITY", keep the higher priority tag
    const uniqueMap = new Map();
    const sourcePriority = { FRIEND: 3, AI_VECTOR: 2, COMMUNITY: 1 };

    for (const post of candidates) {
      if (!uniqueMap.has(post.id)) {
        uniqueMap.set(post.id, post);
      } else {
        const existing = uniqueMap.get(post.id);
        if (sourcePriority[post._source] > sourcePriority[existing._source]) {
          uniqueMap.set(post.id, post);
        }
      }
    }

    const deduplicated = Array.from(uniqueMap.values());

    // 2. Apply Scoring Algorithm
    const scored = deduplicated.map((post) => {
      let score = 0;
      const source = post._source || "UNKNOWN";
      const confidence = post._confidence || 0;

      // Base Source Weight
      if (source === "FRIEND") score += 20;
      if (source === "AI_VECTOR") score += 15;
      if (source === "COMMUNITY") score += 10;

      // Time Decay (Base 50 points, lose 2 points per hour of age)
      const ageInHours =
        (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 50 - ageInHours * 2);

      // Engagement Weight
      const likes = post._count?.likes || 0;
      const comments = post._count?.comments || 0;
      score += likes * 5 + comments * 10;

      // Media Weight (Visual posts hold attention longer)
      if (post.attachments?.length > 0) score += 10;

      // AI Confidence Boost (for vector recommendations)
      if (source === "AI_VECTOR" && confidence > 0) {
        score += confidence * 5; // Boost by up to +5 pts based on similarity
      }

      return {
        ...post,
        _finalScore: score,
      };
    });

    // 3. Sort descending by score, log top recommendations
    const sorted = scored.sort((a, b) => b._finalScore - a._finalScore);
    console.log(
      `[Feed Ranking] Top post: source=${sorted[0]?._source}, score=${sorted[0]?._finalScore}, confidence=${sorted[0]?._confidence?.toFixed(3)}`,
    );

    // 4. Clean up temporary scoring attributes
    return sorted.map(({ _finalScore, ...cleanPost }) => cleanPost);
  }

  /**
   * FRIENDS_ONLY Strategy: Pure chronological feed without AI/community recommendations.
   * Baseline for A/B testing.
   */
  async generateFriendsOnlyFeed(userId: string, page = 1): Promise<any[]> {
    const friendPosts = await this.getRedisFeed(userId, page);
    this.logger.log(
      `[A/B Test] Friends-only feed: ${friendPosts.length} posts`,
    );
    return friendPosts.slice(0, 20);
  }

  /**
   * AI_FIRST Strategy: Prioritizes AI recommendations above friend posts.
   * Tests if personalization beats social discovery.
   */
  async generateAiFirstFeed(userId: string, page = 1): Promise<any[]> {
    const [friendPosts, aiRecommendedPosts] = await Promise.all([
      this.getRedisFeed(userId, page),
      this.getVectorRecommendations(userId),
    ]);

    // Prioritize AI: 60% AI, 40% friends
    const topAi = aiRecommendedPosts.slice(0, 12);
    const topFriends = friendPosts.slice(0, 8);

    const allCandidates = [...topAi, ...topFriends];
    const rankedFeed = this.scoreAndSort(allCandidates);

    this.logger.log(
      `[A/B Test] AI-first feed: ${topAi.length} AI + ${topFriends.length} friends = ${rankedFeed.length} total`,
    );
    return rankedFeed.slice(0, 20);
  }

  /**
   * COMMUNITY_FIRST Strategy: Prioritizes community-trending posts.
   * Tests if group/community discovery increases engagement.
   */
  async generateCommunityFirstFeed(userId: string, page = 1): Promise<any[]> {
    const [friendPosts, aiRecommendedPosts, communityPosts] = await Promise.all(
      [
        this.getRedisFeed(userId, page),
        this.getVectorRecommendations(userId),
        this.getCommunityTrending(userId),
      ],
    );

    // Prioritize community: 50% community, 30% friends, 20% AI
    const topCommunity = communityPosts.slice(0, 10);
    const topFriends = friendPosts.slice(0, 6);
    const topAi = aiRecommendedPosts.slice(0, 4);

    const allCandidates = [...topCommunity, ...topFriends, ...topAi];
    const rankedFeed = this.scoreAndSort(allCandidates);

    this.logger.log(
      `[A/B Test] Community-first feed: ${topCommunity.length} community + ${topFriends.length} friends + ${topAi.length} AI`,
    );
    return rankedFeed.slice(0, 20);
  }

  // MIXER FEED
  async generateMixedFeed(userId: string, page = 1) {
    // 1. Fetch Candidates (Simultaneous execution for performance)
    const [friendPosts, aiRecommendedPosts, communityPosts] = await Promise.all(
      [
        this.getRedisFeed(userId, page),
        this.getVectorRecommendations(userId),
        this.getCommunityTrending(userId),
      ],
    );

    // 2. The Mixer
    const allCandidates = [
      ...friendPosts,
      ...aiRecommendedPosts,
      ...communityPosts,
    ];

    // 3. The Scorer
    const rankedFeed = this.scoreAndSort(allCandidates);

    // 4. Pagination (Return top 20 for this specific page request)
    return rankedFeed.slice(0, 20);
  }

  /**
   * Route to the appropriate feed strategy based on A/B test assignment.
   */
  async generateFeedByStrategy(
    strategy: FeedStrategy,
    userId: string,
    page: number,
  ): Promise<any[]> {
    switch (strategy) {
      case FeedStrategy.FRIENDS_ONLY:
        return this.generateFriendsOnlyFeed(userId, page);
      case FeedStrategy.AI_FIRST:
        return this.generateAiFirstFeed(userId, page);
      case FeedStrategy.COMMUNITY_FIRST:
        return this.generateCommunityFirstFeed(userId, page);
      case FeedStrategy.MIXED:
      default:
        return this.generateMixedFeed(userId, page);
    }
  }
}
