import type { Channel } from "@/types";
import { create } from "zustand";

interface ChatStore {
  currChannel: Channel | null;
  setCurrChannel: (channel: Channel | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currChannel: null,
  setCurrChannel: (channel) => set({ currChannel: channel }),
}));
