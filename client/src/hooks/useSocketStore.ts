import { io, Socket } from "socket.io-client";
import { create } from "zustand";

interface SocketStore {
  socket: Socket | null;
  connect: (token: string) => void;
  disconnect: () => void;
}

const SOCKET_BASE_URL = "http://localhost:3000";

export const useSocketStore = create<SocketStore>((set, get) => {
  return {
    socket: null,

    connect: (token: string) => {
      const existingSocket = get().socket;

      if (existingSocket?.connected) return;

      const newSocket = io(SOCKET_BASE_URL, {
        auth: { token },
        autoConnect: true,
      });

      set({ socket: newSocket });
    },

    disconnect: () => {
      const currentSocket = get().socket;
      currentSocket?.disconnect();
      set({ socket: null });
    },
  };
});
