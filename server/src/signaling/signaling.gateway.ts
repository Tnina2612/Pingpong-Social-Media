import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MediasoupService } from "src/mediasoup/mediasoup.service";
import { PrismaService } from "src/prisma/prisma.service";

@WebSocketGateway({ cors: true })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly media: MediasoupService,
    private readonly prisma: PrismaService,
  ) {}

  @SubscribeMessage("join-sfu")
  async joinSfu(
    @ConnectedSocket() client: Socket,
    @MessageBody() { channelId },
  ) {
    this.leaveSfu(client);

    if (!this.media.rooms.has(channelId)) {
      this.media.rooms.set(channelId, {
        users: new Map(),
        producers: new Map(),
      });
    }
    const userId = client.data.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });

    client.data.user = user;
    const room = this.media.rooms.get(channelId);
    room?.users.set(client.id, user);

    client.join(channelId);
    const producers = Array.from(room?.producers.keys() || []);

    const participants = Array.from(room?.users.values() || []);
    client.emit("participants", {
      channelId,
      users: participants,
    });
    client.to(channelId).emit("user-joined", {
      channelId,
      user,
    });
    return {
      joined: true,
      rtpCapabilities: this.media.router.rtpCapabilities,
      producers,
    };
  }

  @SubscribeMessage("create-transport")
  async createTransport(@ConnectedSocket() client: Socket) {
    const transport = await this.media.createTransport();

    if (!this.media.transports.has(client.id)) {
      this.media.transports.set(client.id, []);
    }
    this.media.transports.get(client.id)?.push(transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage("connect-transport")
  async connectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, dtlsParameters },
  ) {
    const transports = this.media.transports.get(client.id);

    const transport = transports?.find((t) => t.id === transportId);
    if (!transport) throw new Error("Transport not found");
    await transport.connect({ dtlsParameters });

    return { connected: true };
  }

  @SubscribeMessage("produce")
  async produce(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, kind, rtpParameters, channelId },
  ) {
    const transports = this.media.transports.get(client.id);
    const transport = transports?.find((t) => t.id === transportId);

    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    const room = this.media.rooms.get(channelId);

    const user = client.data.user;
    room?.producers.set(producer.id, {
      socketId: client.id,
      producer,
      user,
    });

    client.to(channelId).emit("new-producer", {
      channelId,
      producerId: producer.id,

    });

    return { id: producer.id };
  }

  @SubscribeMessage("get-producers")
  getProducers(@MessageBody() { channelId }) {
    const room = this.media.rooms.get(channelId);
    if (!room) return [];
    return Array.from(room.producers.keys());
  }

  @SubscribeMessage("consume")
  async consume(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, producerId, rtpCapabilities },
  ) {
    const transports = this.media.transports.get(client.id);
    const transport = transports?.find((t) => t.id === transportId);

    if (
      !this.media.router.canConsume({
        producerId,
        rtpCapabilities,
      })
    ) {
      throw new Error("Cannot consume");
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });
    if (!this.media.consumers.has(client.id)) {
      this.media.consumers.set(client.id, []);
    }

    this.media.consumers.get(client.id)?.push(consumer);
    const room = Array.from(this.media.rooms.values()).find((r) =>
      r.producers.has(producerId),
    );
    const producerData = room?.producers.get(producerId);
    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      user: producerData?.user,
    };
  }

  handleDisconnect(client: Socket) {
    const transports = this.media.transports.get(client.id) || [];
    transports.forEach((t) => t.close());

    const consumers = this.media.consumers.get(client.id) || [];
    consumers.forEach((c) => c.close());
    this.media.rooms.forEach((room, roomId) => {
      room.producers.forEach((value, producerId) => {
        if (value.socketId === client.id) {
          value.producer.close();
          room.producers.delete(producerId);

          // notify others
          this.server.to(roomId).emit("producer-closed", {
            producerId,
          });
        }
      });
      const user = room.users.get(client.id);
      room.users.delete(client.id);
      this.server.to(roomId).emit("user-left", {
        channelId: roomId,
        user,
      });
    });

    this.media.transports.delete(client.id);
    this.media.consumers.delete(client.id);
  }

  @SubscribeMessage("leave-sfu")
  async leaveSfu(@ConnectedSocket() client: Socket) {
    this.media.rooms.forEach((room, roomId) => {
      if (!room.users.has(client.id)) return;

      const user = room.users.get(client.id);

      room.users.delete(client.id);
      room.producers.forEach((value, producerId) => {
        if (value.socketId === client.id) {
          value.producer.close();
          room.producers.delete(producerId);

          this.server.to(roomId).emit("producer-closed", {
            producerId,
          });
        }
      });

      //notify user
      this.server.to(roomId).emit("user-left", {
        channelId: roomId,
        user,
      });
      client.leave(roomId);
    });
  }
}
