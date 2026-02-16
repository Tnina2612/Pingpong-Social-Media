import { Injectable, NotFoundException } from "@nestjs/common";
import { TargetLikeType } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { ToggleLikeDto } from "./dto";

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(userId: string, dto: ToggleLikeDto) {
    const { targetId, type } = dto;
    const isPost = type === TargetLikeType.POST;

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

    try {
      // Try to create the "Like" first (Optimistic assumption: User wants to Like)
      await this.prisma.like.create({
        data: {
          userId,
          targetType: type,
          postId: isPost ? targetId : null,
          commentId: !isPost ? targetId : null,
        },
      });

      return { isLiked: true };
    } catch (error) {
      // Unique Constraint Violation
      if (error.code === "P2002") {
        try {
          await this.prisma.like.delete({
            // Prisma's compound unique key naming
            where: isPost
              ? { postId_userId: { postId: targetId, userId } }
              : { commentId_userId: { commentId: targetId, userId } },
          });
          return { isLiked: false };
        } catch (deleteError) {
          // Edge case: If a concurrent request deleted it between our create-fail
          // and this delete, it is effectively "unliked" already
          if (deleteError.code === "P2025") {
            return { isLiked: false };
          }
          throw deleteError;
        }
      }

      throw error;
    }
  }
}
