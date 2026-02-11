import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePostDto } from "./dto";
import { PostResponseDto } from "./response";

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

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

    return posts.map((post) => ({
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
    }));
  }

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...dto,
        authorId: userId,
      },
      include: {
        author: true,
      },
    });
  }
}
