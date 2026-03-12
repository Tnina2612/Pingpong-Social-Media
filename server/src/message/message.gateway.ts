import { RequirePermission } from "@libs/common/decorators";
import { ServerPermission } from "@libs/common/enums";
import { UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsServerPermissionGuard } from "src/auth/guards";
import { PrismaService } from "src/prisma/prisma.service";

@WebSocketGateway({ cors: { origin: process.env.CLIENT_URL } })
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify(token);
      client.data.userId = payload.sub;
      console.log(`User connected: ${payload.username} (${client.id})`);

      // Broadcast that user came online
      this.server.emit("userStatus", { userId: payload.sub, status: "ONLINE" });
    } catch (error) {
      client.disconnect();
      throw new WsException(`Connection failed: ${error.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.server.emit("userStatus", {
        userId: client.data.userId,
        status: "OFFLINE",
      });
    }
  }

  @UseGuards(WsServerPermissionGuard)
  @RequirePermission(ServerPermission.SEND_MESSAGES)
  @SubscribeMessage("join-channel")
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });

    if (!channel) {
      throw new WsException("Channel not found");
    }

    client.join(channelId);
  }

  @UseGuards(WsServerPermissionGuard)
  @RequirePermission(ServerPermission.SEND_MESSAGES)
  @SubscribeMessage("leave-channel")
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });

    if (!channel) {
      throw new WsException("Channel not found");
    }

    client.leave(channelId);
  }
}
