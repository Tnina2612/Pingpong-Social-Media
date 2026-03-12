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

  /**
   * Resolve serverId from the WS payload directly, or by looking up
   * the parent entity when only channelId or messageId is available.
   */
  private async resolveServerId(data: any): Promise<string | null> {
    if (data?.serverId) return data.serverId;

    if (data?.channelId) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: data.channelId },
        select: { serverId: true },
      });
      return channel?.serverId ?? null;
    }

    if (data?.messageId) {
      const message = await this.prisma.message.findUnique({
        where: { id: data.messageId },
        select: { channel: { select: { serverId: true } } },
      });
      return message?.channel?.serverId ?? null;
    }

    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      ServerPermission[]
    >(REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    const userId = client.data?.userId;
    const serverId = await this.resolveServerId(data);

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
