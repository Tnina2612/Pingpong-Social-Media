import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePostDto } from "./dto";
import { PostResponseDto } from "./response";

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  private mapToDto(post: any): PostResponseDto {
    return {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
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

  /**
   * Extracts the Cloudinary public_id from a full secure_url.
   * Handles URLs with or without version numbers and nested folders.
   */
  private extractPublicIdFromUrl(url: string): string | null {
    if (!url || !url.includes("cloudinary.com")) {
      return null; // Not a valid Cloudinary URL
    }

    try {
      // Regex explanation:
      // \/upload\/  : Matches the literal string "/upload/"
      // (?:v\d+\/)? : Non-capturing group for the optional version number (e.g., v1612345/)
      // ([^\.]+)    : Capturing group 1: Matches everything up to the first period (.)
      const regex = /\/upload\/(?:v\d+\/)?([^.]+)/;
      const match = url.match(regex);

      if (match?.[1]) {
        // match[1] will contain the folder path and the filename (the exact public_id)
        // e.g., "social-network-uploads/my-image"
        return match[1];
      }

      return null;
    } catch (error) {
      console.error("Error parsing Cloudinary URL:", error);
      return null;
    }
  }

  async findAll(currentUserId: string): Promise<PostResponseDto[]> {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    return posts.map((post) => this.mapToDto(post));
  }

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...dto,
        authorId: userId,
      },
    });
  }

  async findById(
    postId: string,
    currentUserId: string,
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
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
    });

    if (!post) throw new NotFoundException("Post not found");
    if (post.authorId !== userId)
      throw new ForbiddenException("Not authorized");

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      for (const url of post.mediaUrls) {
        const publicId = this.extractPublicIdFromUrl(url);
        if (publicId) {
          await this.cloudinary.deleteFile(publicId);
        }
      }
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: "Post and associated media deleted" };
  }
}
