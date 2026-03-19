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

const socket = io(SOCKET_BASE_URL, { autoConnect: false });
export const useSocketStore = create<SocketStore>((set) => ({
  socket,
  connect: (token: string) => {
    socket.auth = { token };
    socket.connect();
  },
  disconnect: () => {
    set((state) => {
      state.socket?.disconnect();
      return { socket: null };
    });
  },
}));
