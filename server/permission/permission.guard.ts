import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "src/prisma/prisma.service";
import { REQUIRE_PERMISSION_KEY } from "./require-permission.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    const serverId = request.params.serverId;

    if (!serverId) {
      throw new ForbiddenException("Server ID missing");
    }

    // 1️⃣ Find member
    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId: user.id,
          serverId,
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("You are not a member of this server");
    }

    // 2️⃣ Flatten permissions
    const permissions = member.roles.flatMap((role) =>
      role.permissions.map((p) => p.code),
    );

    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException("Insufficient permissions");
    }
    request.member = member;
    return true;
  }
}
