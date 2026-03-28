import { Injectable } from "@nestjs/common";
import * as mediasoup from "mediasoup";

@Injectable()
export class MediasoupService {
  worker: mediasoup.types.Worker;
  router: mediasoup.types.Router;

  rooms = new Map<
    string,
    {
      users: Set<string>;
      producers: Map<string, any>;
    }
  >();
  transports = new Map<string, any[]>(); // socketId -> transports[]
  consumers = new Map<string, any[]>(); // socketId -> consumers[]
  async init() {
    this.worker = await mediasoup.createWorker();

    this.router = await this.worker.createRouter({
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
      ],
    });
  }

  async createTransport() {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [{ ip: "127.0.0.1" }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    return transport;
  }
}
