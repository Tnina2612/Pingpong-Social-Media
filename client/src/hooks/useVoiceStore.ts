import type { User } from "@/types";
import { create } from "zustand";

type VoiceState = {
  currentChannelId: string | null;
  participantsByChannel: Record<string, User[]>;
  setChannel: (channelId: string | null) => void;
  setParticipants: (channelId: string, users: User[]) => void;
  addUser: (channelId: string, user: User) => void;
  removeUser: (channelId: string, userId: string) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  currentChannelId: null,
  participantsByChannel: {},

  setChannel: (channelId) => set({ currentChannelId: channelId }),
  setParticipants: (channelId, users) =>
    set((state) => {
      const current = state.participantsByChannel[channelId];

      // 🔥 tránh re-render vô nghĩa
      if (JSON.stringify(current) === JSON.stringify(users)) {
        return state;
      }

      return {
        participantsByChannel: {
          ...state.participantsByChannel,
          [channelId]: users,
        },
      };
    }),

  addUser: (channelId, user) =>
    set((state) => ({
      participantsByChannel: {
        ...state.participantsByChannel,
        [channelId]: [...(state.participantsByChannel[channelId] || []), user],
      },
    })),

  removeUser: (channelId, userId) =>
    set((state) => ({
      participantsByChannel: {
        ...state.participantsByChannel,
        [channelId]: (state.participantsByChannel[channelId] || []).filter(
          (u) => u.id !== userId,
        ),
      },
    })),
}));
