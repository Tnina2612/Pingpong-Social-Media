import * as mediasoupClient from "mediasoup-client";
import type { Socket } from "socket.io-client";

// ===== GLOBAL STATE =====
let device: mediasoupClient.Device;
let sendTransport: mediasoupClient.types.Transport;
let recvTransport: mediasoupClient.types.Transport;

let producers: mediasoupClient.types.Producer[] = [];
let consumers: mediasoupClient.types.Consumer[] = [];

export const joinVoice = async (socket: Socket, channelId: string) => {
  // 1. join SFU
  const res = await socket.emitWithAck("join-sfu", { channelId });

  const { rtpCapabilities, producers: existingProducers } = res as {
    rtpCapabilities: mediasoupClient.types.RtpCapabilities;
    producers: string[];
  };

  // 2. create device
  device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities: rtpCapabilities });

  console.log("✅ Device loaded");

  // 3. create SEND transport
  const sendParams = (await socket.emitWithAck("create-transport")) as {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  };

  sendTransport = device.createSendTransport(sendParams);

  sendTransport.on("connect", ({ dtlsParameters }, callback) => {
    socket.emit("connect-transport", {
      transportId: sendTransport.id,
      dtlsParameters,
    });

    callback();
  });

  sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
    socket.emit(
      "produce",
      {
        transportId: sendTransport.id,
        kind,
        rtpParameters,
        channelId,
      },
      ({ id }: { id: string }) => {
        callback({ id });
      },
    );
  });

  // 4. get mic
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const track = stream.getAudioTracks()[0];

  const producer = await sendTransport.produce({ track });
  producers.push(producer);

  // 5. create RECV transport
  const recvParams = (await socket.emitWithAck("create-transport")) as {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  };

  recvTransport = device.createRecvTransport(recvParams);

  recvTransport.on("connect", ({ dtlsParameters }, callback) => {
    socket.emit("connect-transport", {
      transportId: recvTransport.id,
      dtlsParameters,
    });

    callback();
  });

  // 6. consume existing producers
  for (const producerId of existingProducers) {
    await consume(socket, producerId);
  }

  // 7. listen new producers
  socket.on("new-producer", async ({ producerId }: { producerId: string }) => {
    console.log("📡 NEW PRODUCER:", producerId);
    await consume(socket, producerId);
  });
};

// ===== CONSUME FUNCTION =====
const consume = async (socket: Socket, producerId: string) => {
  if (!recvTransport || !device) return;

  console.log("🎧 CONSUMING:", producerId);

  const data = (await socket.emitWithAck("consume", {
    producerId,
    transportId: recvTransport.id,
    rtpCapabilities: device.rtpCapabilities,
  })) as {
    id: string;
    producerId: string;
    kind: "audio" | "video";
    rtpParameters: mediasoupClient.types.RtpParameters;
  };

  const consumer = await recvTransport.consume({
    id: data.id,
    producerId: data.producerId,
    kind: data.kind,
    rtpParameters: data.rtpParameters,
  });

  consumers.push(consumer);

  const stream = new MediaStream();
  stream.addTrack(consumer.track);

  const audio = document.createElement("audio");
  audio.srcObject = stream;
  audio.autoplay = true;

  try {
    await audio.play();
  } catch (err) {
    console.warn("Autoplay blocked");
  }
};
