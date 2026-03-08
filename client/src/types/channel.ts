export const ChannelType = {
  TEXT: "TEXT",
  VOICE: "VOICE",
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export interface CreateChannelProps {
  serverId: string;
  name: string;
  type: ChannelType;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  serverId: string;
  messageCount: number;
}
