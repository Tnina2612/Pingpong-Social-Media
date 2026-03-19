import { create } from "zustand";
import type { Channel } from "@/types";

interface ChatStore {
  currChannel: Channel | null;
  setCurrChannel: (channel: Channel | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currChannel: null,
  setCurrChannel: (channel) => set({ currChannel: channel }),
}));
