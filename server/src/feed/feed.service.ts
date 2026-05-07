import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { PrismaService } from "src/prisma/prisma.service";
import { FeedStrategy } from "./enums/feed-strategy.enum";

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private readonly FEED_CACHE_VERSION = "v1";
  private readonly FEED_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days
  private readonly RECENT = 600;

  constructor(
    private readonly prisma: PrismaService,
    @Inject("REDIS") private redis: Redis,
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
      categories: { select: { id: true, name: true } },
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
      where: { authorId: { in: friendIds }, status: "PUBLISHED" },
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

  private async getVectorRecommendations(userId: string, page = 1) {
    // 1. Get the user's vector as a string format for pgvector processing
    const userResult = await this.prisma.$queryRaw<
      [{ interestVector: string }]
    >`
      SELECT "interestVector"::text FROM "User" WHERE id = ${userId}::text
    `;

    const vectorStr = userResult[0]?.interestVector;

    // If user has no vector yet, fallback to category-based recommendations
    if (!vectorStr) {
      this.logger.log(
        `[AI Recommendations] No interest vector for user ${userId}, falling back to category matching`,
      );
      return this.getCategoryBasedRecommendations(userId, page);
    }

    // 2. Query mathematical similarity with pagination
    // Fetch 50 items per page for diverse pagination across all pages
    const pageSize = 50;
    const offset = (page - 1) * pageSize;
    const startTime = Date.now();
    const recommendations = await this.prisma.$queryRaw<
      { id: string; distance: number }[]
    >`
      SELECT id, "contentVector" <=> ${vectorStr}::vector AS distance
      FROM "Post"
      WHERE "createdAt" > NOW() - INTERVAL '2 days'
      AND "authorId" != ${userId}::text
      AND status = 'PUBLISHED'
      AND "contentVector" IS NOT NULL
      ORDER BY distance ASC
      OFFSET ${offset}
      LIMIT ${pageSize};
    `;

    const queryTime = Date.now() - startTime;

    const postIds = recommendations.map((r) => r.id);

    // If no vector-based results, fallback to category matching
    if (postIds.length === 0) {
      this.logger.log(
        `[AI Recommendations] No vector-based posts found for user ${userId} page ${page}, falling back to category matching`,
      );
      return this.getCategoryBasedRecommendations(userId, page);
    }

    // Create a map for quick confidence lookup
    // pgvector cosine distance ranges from 0 to 2, so we convert to similarity
    // and clamp to [0, 1]: similarity = 1 - distance, clamped to 0-1
    const confidenceMap = new Map(
      recommendations.map((r) => [
        r.id,
        Math.max(0, Math.min(1, 1 - r.distance)),
      ]),
    );

    const posts = await this.hydratePosts(postIds);
    console.log(
      `[AI Recommendations] Retrieved ${posts.length} posts for user ${userId} (query: ${queryTime}ms)`,
    );

    // Re-order to match pgvector similarity order
    const postById = new Map(posts.map((post) => [post.id, post] as const));
    const sortedPosts = postIds
      .map((id) => postById.get(id))
      .filter((post): post is (typeof posts)[number] => post !== undefined)
      .map((post) => ({
        ...post,
        _source: "AI_VECTOR",
        _confidence: confidenceMap.get(post.id) || 0,
      }));

    return sortedPosts;
  }

  /**
   * Category-based recommendations for users without contentVector or when vector matching returns no results.
   * Matches post categories with user's selected categories from onboarding.
   */
  private async getCategoryBasedRecommendations(userId: string, page = 1) {
    // 1. Get user's selected categories
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { selectedCategories: true },
    });

    if (!user?.selectedCategories || user.selectedCategories.length === 0) {
      this.logger.log(
        `[Category Recommendations] User ${userId} has no selected categories`,
      );
      return [];
    }

    // 2. Find recent posts that match user's selected categories with pagination
    const pageSize = 50;
    const skip = (page - 1) * pageSize;
    const startTime = Date.now();
    const matchingPosts = await this.prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        authorId: { not: userId },
        createdAt: { gte: new Date(Date.now() - this.RECENT * 24 * 60 * 60 * 1000) },
        categories: {
          some: {
            name: { in: user.selectedCategories },
          },
        },
      },
      include: this.getPostIncludeStructure(),
      skip,
      take: pageSize,
    });

    const queryTime = Date.now() - startTime;

    if (matchingPosts.length === 0) {
      this.logger.log(
        `[Category Recommendations] No posts found matching categories for user ${userId}`,
      );
      return [];
    }

    console.log(
      `[Category Recommendations] Retrieved ${matchingPosts.length} posts for user ${userId} (query: ${queryTime}ms)`,
    );

    // 3. Calculate confidence based on category overlap
    return matchingPosts.map((post) => {
      // Count how many of the user's selected categories overlap with post categories
      const postCategoryNames = post.categories.map((c) => c.name);
      const categoryMatches = user.selectedCategories.filter((cat) =>
        postCategoryNames.includes(cat),
      ).length;

      // Confidence = (matching category count) / (max selected categories)
      // Normalized to 0-1 range
      const confidence =
        categoryMatches / Math.max(user.selectedCategories.length, 1);

      return {
        ...post,
        _source: "CATEGORY_MATCH",
        _confidence: confidence,
      };
    });
  }

  private async getCommunityTrending(userId: string, page = 1) {
    // Fetch user's community cluster assignment
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { communityId: true },
    });

    if (!user?.communityId) return [];

    // Find the most liked recent posts within their Louvain cluster with pagination
    const pageSize = 25;
    const skip = (page - 1) * pageSize;
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
      skip,
      take: pageSize,
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
    // If a post is in multiple sources, keep the higher priority tag
    const uniqueMap = new Map();
    const sourcePriority = {
      FRIEND: 3,
      AI_VECTOR: 2,
      CATEGORY_MATCH: 1.5,
      COMMUNITY: 1,
    };

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
      if (source === "CATEGORY_MATCH") score += 12;
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

      // AI Confidence Boost (for vector and category-based recommendations)
      if (
        (source === "AI_VECTOR" || source === "CATEGORY_MATCH") &&
        confidence > 0
      ) {
        score += confidence * 5; // Boost by up to +5 pts based on similarity/overlap
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
      this.getVectorRecommendations(userId, page),
    ]);

    // Prioritize AI: 60% AI, 40% friends
    const topAi = aiRecommendedPosts.slice(0, 12);
    const topFriends = friendPosts.slice(0, 8);

    const allCandidates = [...topAi, ...topFriends];
    const rankedFeed = this.scoreAndSort(allCandidates);

    this.logger.log(
      `[A/B Test] AI-first feed: ${topAi.length} AI + ${topFriends.length} friends = ${rankedFeed.length} total`,
    );

    // Paginate: return requested page (20 items per page)
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    return rankedFeed.slice(start, start + pageSize);
  }

  /**
   * COMMUNITY_FIRST Strategy: Prioritizes community-trending posts.
   * Tests if group/community discovery increases engagement.
   */
  async generateCommunityFirstFeed(userId: string, page = 1): Promise<any[]> {
    const [friendPosts, aiRecommendedPosts, communityPosts] = await Promise.all(
      [
        this.getRedisFeed(userId, page),
        this.getVectorRecommendations(userId, page),
        this.getCommunityTrending(userId, page),
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

    // Paginate: return requested page (20 items per page)
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    return rankedFeed.slice(start, start + pageSize);
  }

  // MIXER FEED
  async generateMixedFeed(userId: string, page = 1) {
    // 1. Fetch Candidates (Simultaneous execution for performance)
    const [friendPosts, aiRecommendedPosts, communityPosts] = await Promise.all(
      [
        this.getRedisFeed(userId, page),
        this.getVectorRecommendations(userId, page),
        this.getCommunityTrending(userId, page),
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

    // 4. Pagination (Return requested page, 20 items per page)
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    return rankedFeed.slice(start, start + pageSize);
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
