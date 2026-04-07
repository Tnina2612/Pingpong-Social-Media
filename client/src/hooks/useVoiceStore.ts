import type { User } from "@/types";

import { create } from "zustand";

type VoiceState = {
  currentChannelId: string | null;
  participantsByChannel: Record<string, User[]>;
  activeSpeaker: Record<string, string[]>;

  setActiveSpeaker: (channelId: string, userIds: string[]) => void;
  setChannel: (channelId: string | null) => void;
  setParticipants: (channelId: string, users: User[]) => void;
  setAllParticipants: (data: Record<string, User[]>) => void;
  addUser: (channelId: string, user: User) => void;
  removeUser: (channelId: string, userId: string) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  currentChannelId: null,
  participantsByChannel: {},
  activeSpeaker: {},
  setChannel: (channelId) => set({ currentChannelId: channelId }),

  setActiveSpeaker: (channelId, userIds) =>
    set((state) => {
      const current = state.activeSpeaker[channelId] || [];

      if (JSON.stringify(current) === JSON.stringify(userIds)) {
        return state;
      }

      return {
        activeSpeaker: {
          ...state.activeSpeaker,
          [channelId]: userIds,
        },
      };
    }),

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
  setAllParticipants: (data) =>
    set((state) => {
      if (
        JSON.stringify(state.participantsByChannel) === JSON.stringify(data)
      ) {
        return state;
      }

      return {
        participantsByChannel: data,
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
