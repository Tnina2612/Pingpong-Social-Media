import { useVoiceStore } from "@/hooks/useVoiceStore";
import * as mediasoupClient from "mediasoup-client";
import type { Socket } from "socket.io-client";

// ===== GLOBAL STATE =====
let device: mediasoupClient.Device;
let sendTransport: mediasoupClient.types.Transport;
let recvTransport: mediasoupClient.types.Transport;

let producers: mediasoupClient.types.Producer[] = [];
let consumers: mediasoupClient.types.Consumer[] = [];

export const joinVoice = async (
  socket: Socket,
  channelId: string,
  serverId: string,
) => {
  const store = useVoiceStore.getState();
  if (store.currentChannelId === channelId) return;
  store.setChannel(channelId);
  // 1. join SFU
  const res = await socket.emitWithAck("join-sfu", { channelId, serverId });

  const { rtpCapabilities, producers: existingProducers } = res as {
    rtpCapabilities: mediasoupClient.types.RtpCapabilities;
    producers: string[];
  };

  // 2. create device
  device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities: rtpCapabilities });

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
};

// ===== CONSUME FUNCTION =====
const consume = async (socket: Socket, producerId: string) => {
  if (!recvTransport || !device) return;
  const currentChannelId = useVoiceStore.getState().currentChannelId;
  if (!currentChannelId) return;
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

  audio.onended = () => {
    audio.remove();
  };
  try {
    await audio.play();
  } catch (err) {
    console.warn("Autoplay blocked");
  }
};

export const leaveVoice = async (socket: Socket) => {
  console.log(" Leaving voice...");

  try {
    producers.forEach((producer) => {
      producer.track?.stop(); // tắt mic
      producer.close();
    });
    producers = [];

    consumers.forEach((consumer) => {
      consumer.close();
    });
    consumers = [];

    if (sendTransport) {
      sendTransport.close();
    }

    if (recvTransport) {
      recvTransport.close();
    }

    sendTransport = undefined as any;
    recvTransport = undefined as any;

    socket.emit("leave-sfu");

    useVoiceStore.getState().setChannel(null);

    console.log(" Left voice successfully");
  } catch (err) {
    console.error(" Error leaving voice:", err);
  }
};

let initialized = false;
export const initVoiceSocket = (socket: Socket | null) => {
  if (initialized || socket === null) return;
  initialized = true;

  socket.off("user-joined");
  socket.off("user-left");
  socket.off("new-producer");

  socket.on("user-joined", ({ channelId, user }) => {
    useVoiceStore.getState().addUser(channelId, user);
  });

  socket.on("user-left", ({ channelId, user }) => {
    useVoiceStore.getState().removeUser(channelId, user.id);
  });

  socket.on("new-producer", async ({ producerId, channelId }) => {
    if (channelId !== useVoiceStore.getState().currentChannelId) return;
    await consume(socket, producerId);
  });
  let timeout: any;

  socket.on("active-speaker", ({ channelId, speakers }) => {
    const store = useVoiceStore.getState();

    if (store.currentChannelId !== channelId) return;

    store.setActiveSpeaker(channelId,speakers);

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      store.setActiveSpeaker(channelId, []);
    }, 1000);
  });
};
