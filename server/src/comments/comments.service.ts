import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCommentDto } from "./dto";
import { CommentResponseDto } from "./response";

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  private mapToDto(comments: any[]): CommentResponseDto[] {
    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      mediaUrls: c.mediaUrls,
      createdAt: c.createdAt,
      parentId: c.parentId,
      author: {
        id: c.author.id,
        username: c.author.username,
        avatar: c.author.avatar,
      },
      isLiked: c.likes.length > 0,
      stats: {
        likeCount: c._count.likes,
        replyCount: c._count.replies,
      },
    }));
  }

  async findByPost(
    postId: string,
    userId: string,
    page = 1,
  ): Promise<CommentResponseDto[]> {
    const take = 10;
    const skip = (page - 1) * take;

    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null }, // Only root comments
      take,
      skip,
      orderBy: { createdAt: "desc" }, // Newest first
      include: {
        author: true,
        likes: {
          where: { userId }, // Check if CURRENT user liked it
          select: { userId: true },
        },
        _count: {
          select: { likes: true, replies: true },
        },
      },
    });

    return this.mapToDto(comments);
  }

  async findReplies(
    commentId: string,
    userId: string,
  ): Promise<CommentResponseDto[]> {
    const replies = await this.prisma.comment.findMany({
      where: { parentId: commentId },
      orderBy: { createdAt: "asc" }, // Oldest first (chronological conversation)
      include: {
        author: true,
        likes: {
          where: { userId },
          select: { userId: true },
        },
        _count: {
          select: { likes: true, replies: true },
        },
      },
    });

    return this.mapToDto(replies);
  }

  async create(userId: string, dto: CreateCommentDto) {
    // If it's a reply, ensure parent exists
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new Error("Parent comment not found");
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        mediaUrls: dto.mediaUrls,
        postId: dto.postId,
        parentId: dto.parentId,
        authorId: userId,
      },
    });
  }
}
