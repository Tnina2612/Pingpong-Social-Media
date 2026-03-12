import { REQUIRE_PERMISSION_KEY } from "@libs/common/decorators";
import { ServerPermission } from "@libs/common/enums";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WsException } from "@nestjs/websockets";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WsServerPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      ServerPermission[]
    >(REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData(); // The payload sent by the frontend

    const userId = client.data?.userId;
    // The frontend MUST include the serverId in the event payload for this to work
    const serverId = data?.serverId;

    if (!userId || !serverId) {
      throw new WsException("Missing user or server context");
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: { userId, serverId },
      },
      include: { roles: true },
    });

    if (!member) {
      throw new WsException("You are not a member of this server");
    }

    let totalPermissions = 0;
    for (const role of member.roles) {
      totalPermissions |= role.permissions;
    }

    const isAdmin =
      (totalPermissions & ServerPermission.ADMINISTRATOR) ===
      ServerPermission.ADMINISTRATOR;
    if (isAdmin) return true;

    const hasAllRequired = requiredPermissions.every(
      (permission) => (totalPermissions & permission) === permission,
    );

    if (!hasAllRequired) {
      throw new WsException("Insufficient required permissions");
    }

    return true;
  }
}
