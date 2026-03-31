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

  // Pushes an event to Redis Stream for the Python ML worker
  private async enqueueMlJob(postId: string, content: string, imageUrls: string[] | undefined) {
    const event = {
      type: "PROCESS_NEW_POST",
      data: JSON.stringify({
        postId,
        content,
        imageUrls,
      }),
    };

    // Push event to Redis Stream
    await this.redis.xadd(
      "ml-stream", // stream name
      "*", // auto ID
      "type",
      event.type,
      "data",
      event.data,
    );

    console.log(
      `[Redis Stream] PROCESS_NEW_POST event queued for post ${postId}`,
    );
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
      await this.enqueueMlJob(post.id, post.content, dto.attachmentIds);
    }

    // Do NOT await this so the HTTP response to the user is instant
    this.feedService
      .pushPostToFriends(userId, post.id, post.createdAt.getTime())
      .catch((err) => console.error("Failed to push feed:", err));

    return { message: "Create post successfully" };
  }

  async getFeed(currentUserId: string, page = 1): Promise<PostResponseDto[]> {
    return this.feedService.generateMixedFeed(currentUserId, page);
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
