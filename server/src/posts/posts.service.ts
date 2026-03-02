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
    const attachmentsData =
      dto.attachments?.map((att) => ({
        url: att.url,
        publicId: att.publicId,
        type: att.type,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
      })) || [];

    return this.prisma.post.create({
      data: {
        content: dto.content,
        authorId: userId,
        attachments: {
          create: attachmentsData,
        },
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
        await this.cloudinary.deleteFile(attachment.publicId, resourceType);
      }
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: "Post and associated media deleted successfully" };
  }
}
