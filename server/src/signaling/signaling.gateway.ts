import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MediasoupService } from "src/mediasoup/mediasoup.service";

@WebSocketGateway({ cors: true })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly media: MediasoupService) {}

  @SubscribeMessage("join-sfu")
  joinSfu(@ConnectedSocket() client: Socket, @MessageBody() { channelId }) {
    if (!this.media.rooms.has(channelId)) {
      this.media.rooms.set(channelId, {
        users: new Set(),
        producers: new Map(),
      });
    }

    this.media.rooms.get(channelId)?.users.add(client.id);

    client.join(channelId);

    return { joined: true };
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
      dtlsParamaters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage("connect-transport")
  async connectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() { transportId, dtlsParameters },
  ) {
    const transports = this.media.transports.get(client.id);

    const transport = transports?.find((t) => t.id === transportId);

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

    room?.producers.set(producer.id, {
      socketId: client.id,
      producer,
    });

    client.to(channelId).emit("new-producer", {
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

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  handleDisconnect(client: Socket) {
    const transports = this.media.transports.get(client.id) || [];
    transports.forEach((t) => t.close());

    const consumers = this.media.consumers.get(client.id) || [];
    consumers.forEach((c) => c.close());
    this.media.rooms.forEach((room) => {
      room.producers.forEach((value, producerId) => {
        if (value.socketId === client.id) {
          value.producer.close();
          room.producers.delete(producerId);

          // notify others
          client.to([...room.users]).emit("producer-closed", {
            producerId,
          });
        }
      });

      room.users.delete(client.id);
    });

    this.media.transports.delete(client.id);
    this.media.consumers.delete(client.id);
  }
}
