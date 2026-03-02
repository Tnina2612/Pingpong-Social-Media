import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { getHighestRolePosition } from "utils";

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}
  async kickMember(serverId: string, targetUserId: string, currentMember: any) {
    return this.prisma.$transaction(async (tx) => {
      const targetMember = await tx.member.findUnique({
        where: {
          userId_serverId: {
            userId: targetUserId,
            serverId,
          },
        },
        include: {
          roles: true,
        },
      });

      if (!targetMember) {
        throw new NotFoundException("Target member not found");
      }

      if (currentMember.userId === targetUserId) {
        throw new ForbiddenException("You cannot kick yourself");
      }

      const currentHighest = getHighestRolePosition(currentMember);
      const targetHighest = getHighestRolePosition(targetMember);

      if (currentHighest <= targetHighest) {
        throw new ForbiddenException(
          "You cannot kick a member with equal or higher role",
        );
      }

      await tx.member.delete({
        where: {
          userId_serverId: {
            userId: targetUserId,
            serverId,
          },
        },
      });

      return { message: "Member kicked successfully" };
    });
  }
}
