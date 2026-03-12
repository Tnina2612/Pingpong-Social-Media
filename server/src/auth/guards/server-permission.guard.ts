import { REQUIRE_PERMISSION_KEY } from "@libs/common/decorators";
import { ServerPermission } from "@libs/common/enums";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ServerPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  /**
   * Resolve serverId from params/body directly, or by looking up
   * the parent entity when only channelId or messageId is available.
   */
  private async resolveServerId(request: any): Promise<string | null> {
    const { params, body } = request;

    // Direct serverId
    const serverId = params?.serverId || body?.serverId;
    if (serverId) return serverId;

    // Resolve from channelId
    const channelId = params?.channelId || body?.channelId;
    if (channelId) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        select: { serverId: true },
      });
      return channel?.serverId ?? null;
    }

    // Resolve from messageId
    const messageId = params?.messageId || body?.messageId;
    if (messageId) {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        select: { channel: { select: { serverId: true } } },
      });
      return message?.channel?.serverId ?? null;
    }

    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get the required permissions for this route
    const requiredPermissions = this.reflector.getAllAndOverride<
      ServerPermission[]
    >(REQUIRE_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const serverId = await this.resolveServerId(request);

    if (!user || !serverId) {
      throw new ForbiddenException("Missing user or server context");
    }

    // 2. Fetch the user's membership and their roles for THIS specific server
    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId: user.id,
          serverId,
        },
      },
      include: { roles: true },
    });

    if (!member) {
      throw new ForbiddenException("You are not a member of this server");
    }

    // 3. Calculate total permissions by combining all their roles
    let totalPermissions = 0;
    for (const role of member.roles) {
      totalPermissions |= role.permissions;
    }

    // 4. Check if they are an Administrator (Admins bypass all other checks)
    const isAdmin =
      (totalPermissions & ServerPermission.ADMINISTRATOR) ===
      ServerPermission.ADMINISTRATOR;
    if (isAdmin) return true;

    // 5. Check if they have ALL the required permissions
    const hasAllRequired = requiredPermissions.every(
      (permission) => (totalPermissions & permission) === permission,
    );

    if (!hasAllRequired) {
      throw new ForbiddenException("Insufficient required permissions");
    }

    request.member = member;
    return true;
  }
}
