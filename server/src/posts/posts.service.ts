import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import Redis from "ioredis";
import { FeedService } from "src/feed/feed.service";
import { PrismaService } from "src/prisma/prisma.service";
import { UploadService } from "src/upload/upload.service";
import { serializeRqData } from "utils";
import { CreatePostDto } from "./dto";
import { PostResponseDto } from "./response";

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private feedService: FeedService,
    @Inject("REDIS") private redis: Redis,
  ) {}

  private mapToDto(post: any): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      attachments: post.attachments,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        username: post.author.username,
        avatar: post.author.avatar,
      },
      isLiked: post.likes.length > 0,
      stats: {
        likeCount: post._count.likes,
        commentCount: post._count.comments,
      },
    };
  }

  // Pushes a job to the Redis Queue formatted for Python's 'rq' library.
  private async enqueueMlJob(postId: string, content: string) {
    const queueName = "rq:queue:post_processing"; // rq's default prefix
    const jobId = `ml-job-${postId}`;

    // rq expects a specific JSON structure representing the Python function call
    const jobData = {
      created_at: new Date().toISOString(),
      id: jobId,
      origin: "post_processing",
      description: `process_new_post('${postId}', ...)`,
      enqueued_at: new Date().toISOString(),
      started_at: "",
      ended_at: "",
      result_ttl: 500,
      failure_ttl: 31536000,
      status: "queued",
      // The exact name of the Python function in worker.py
      data: serializeRqData("worker.process_new_post", [postId, content]),
    };

    const pipeline = this.redis.pipeline();
    // Add job data to a Redis Hash
    pipeline.hset(`rq:job:${jobId}`, jobData);
    // Push the Job ID to the end of the List queue
    pipeline.rpush(queueName, jobId);

    await pipeline.exec();
  }

  async findAll(currentUserId: string, page = 1): Promise<PostResponseDto[]> {
    const take = 20;
    const skip = (page - 1) * take;

    const posts = await this.prisma.post.findMany({
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        attachments: true,
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return posts.map((post) => this.mapToDto(post));
  }

  async create(userId: string, dto: CreatePostDto) {
    // Format attachments for Prisma
    const post = await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          content: dto.content,
          authorId: userId,
        },
      });

      if (dto.attachmentIds?.length) {
        const attachments = await tx.attachment.findMany({
          where: {
            id: { in: dto.attachmentIds },
            status: "TEMP",
          },
        });

        if (attachments.length !== dto.attachmentIds.length) {
          throw new BadRequestException("Invalid attachment IDs");
        }

        await tx.attachment.updateMany({
          where: {
            id: { in: dto.attachmentIds },
          },
          data: {
            postId: post.id,
            status: "USED",
          },
        });
      }

      return post;
    });

    // Push job to the Python ML Service
    if (post.content) {
      await this.enqueueMlJob(post.id, post.content);
    }

    // Do NOT await this so the HTTP response to the user is instant
    this.feedService
      .pushPostToFriends(userId, post.id, post.createdAt.getTime())
      .catch((err) => console.error("Failed to push feed:", err));

    return { message: "Create post successfully" };
  }

  async getFeed(currentUserId: string, page = 1): Promise<PostResponseDto[]> {
    const POSTS_PER_PAGE = 20;
    const start = (page - 1) * POSTS_PER_PAGE;
    const stop = start + POSTS_PER_PAGE - 1;
    const feedKey = `feed:${currentUserId}`;

    // Try to read from Redis
    // ZREVRANGE fetches highest scores (newest timestamps) first
    let postIds = await this.redis.zrevrange(feedKey, start, stop);

    // Cache Miss (Pull Model)
    if (postIds.length === 0 && page === 1) {
      console.log(
        `Cache miss for user ${currentUserId}, building feed via Pull...`,
      );
      await this.feedService.buildFeedOnTheFly(currentUserId);

      // Try reading from Redis one more time
      postIds = await this.redis.zrevrange(feedKey, start, stop);
    }

    if (postIds.length === 0) return [];

    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        attachments: true,
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    // Re-order the SQL results to match the exact chronological order dictated by Redis
    // Build a Map from posts by id to keep the operation O(n)
    const postById = new Map(posts.map((post) => [post.id, post] as const));
    const sortedPosts = postIds
      .map((id) => postById.get(id))
      .filter((post): post is (typeof posts)[number] => post !== undefined);

    return sortedPosts.map((post) => this.mapToDto(post));
  }

  async findById(
    postId: string,
    currentUserId: string,
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        attachments: true,
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!post) throw new NotFoundException("Post not found");

    return this.mapToDto(post);
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { attachments: true },
    });

    if (!post) throw new NotFoundException("Post not found");
    if (post.authorId !== userId)
      throw new ForbiddenException("Not authorized");

    if (post.attachments && post.attachments.length > 0) {
      for (const attachment of post.attachments) {
        // Map database Enum to Cloudinary resource_type
        let resourceType: "image" | "video" | "raw" = "image";
        if (attachment.type === "FILE") resourceType = "raw";
        if (attachment.type === "VIDEO" || attachment.type === "AUDIO")
          resourceType = "video";

        // Delete using the exact publicId
        await Promise.all(
          post.attachments.map((att) => {
            return this.uploadService.deleteAttachment({
              publicId: att.publicId,
              attachmentType: att.type,
            });
          }),
        );
      }
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    // Invalidate cache for all users who might have this post in their feed
    await this.feedService.invalidateFriendsCache(userId);
    console.log(`[Post] Deleted post ${postId} and invalidated feed cache`);

    return { message: "Post and associated media deleted successfully" };
  }
}
