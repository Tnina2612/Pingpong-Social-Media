import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { LikeTargetType, ToggleLikeDto } from "./dto";

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(userId: string, dto: ToggleLikeDto) {
    const { targetId, type } = dto;
    const isPost = type === LikeTargetType.POST;

    // Ensure post or comment exists
    if (isPost) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
      if (!post) throw new NotFoundException("Post not found");
    } else {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
      });
      if (!comment) throw new NotFoundException("Comment not found");
    }

    // Prisma's compound unique key naming
    const existingLike = await this.prisma.like.findUnique({
      where: isPost
        ? { postId_userId: { postId: targetId, userId } }
        : { commentId_userId: { commentId: targetId, userId } },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { isLiked: false }; // Return new state to frontend
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          targetType: type,
          postId: isPost ? targetId : null,
          commentId: !isPost ? targetId : null,
        },
      });
      return { isLiked: true };
    }
  }
}
