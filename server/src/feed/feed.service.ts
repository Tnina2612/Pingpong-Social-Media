import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("REDIS") private redis: Redis,
  ) {}

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
      const feedKey = `feed:${friendId}`;

      // Add post to the sorted set
      pipeline.zadd(feedKey, timestamp, postId);

      // Optimization: Cap the feed at 500 posts to save memory
      pipeline.zremrangebyrank(feedKey, 0, -501);

      // Ensure the feed key expires after 7 days, matching the pull model
      pipeline.expire(feedKey, 60 * 60 * 24 * 7);
    }

    await pipeline.exec();
  }

  // PULL MODEL (Fallback)
  async buildFeedOnTheFly(userId: string) {
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
    const feedKey = `feed:${userId}`;
    const pipeline = this.redis.pipeline();

    for (const post of recentPosts) {
      pipeline.zadd(feedKey, post.createdAt.getTime(), post.id);
    }

    // Set an expiration so inactive users' feeds eventually clear out of RAM (e.g., 7 days)
    pipeline.expire(feedKey, 60 * 60 * 24 * 7);
    await pipeline.exec();
  }
}
