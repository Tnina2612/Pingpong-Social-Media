import { io, Socket } from "socket.io-client";
import { create } from "zustand";
interface SocketStore {
  socket: Socket | null;
  connect: (token: string) => void;
  diconnect: () => void;
}

const socket = io("http://localhost:3000", { autoConnect: false });
export const useSocketStore = create<SocketStore>((set) => ({
  socket,
  connect: (token: string) => {
    socket.auth = { token };
    socket.connect();
  },
  diconnect: () => {
    set((state) => {
      state.socket?.disconnect();
      return { socket: null };
    });
  },
}));
