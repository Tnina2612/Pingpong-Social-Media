import { io, Socket } from "socket.io-client";
import { create } from "zustand";

interface SocketStore {
  socket: Socket | null;
  connect: (token: string) => void;
  disconnect: () => void;
}

const SOCKET_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ??
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

export const useSocketStore = create<SocketStore>((_set, get) => {
  const socket = io(SOCKET_BASE_URL, { autoConnect: false });
  return {
    socket,
    connect: (token: string) => {
      const currentSocket = get().socket;
      if (!currentSocket) {
        return;
      }
      currentSocket.auth = { token };
      currentSocket.connect();
    },
    disconnect: () => {
      const currentSocket = get().socket;
      currentSocket?.disconnect();
    },
  };
});
