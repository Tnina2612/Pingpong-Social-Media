import type { ReactNode } from "react";

export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface AvatarProps {
  alt: string;
  size?: "sm" | "md" | "lg";
  src?: string;
  status?: UserStatus;
}

export interface ChannelItemProps {
  name: string;
  icon?: ReactNode;
  locked?: boolean;
  active?: boolean;
}

export interface ChannelGroupProps {
  title: string;
  children: ReactNode;
}

export interface MessageBubbleProps {
  author: string;
  time: string;
  content: string;
  isAI?: boolean;
}

export interface DateDividerProps {
  date: string;
}

export interface OnlineUserProps {
  name: string;
  sub: string;
  status: UserStatus;
}

export interface ChannelHeaderProps {
  channel: string;
  description: string;
}

export const statusClass: Record<UserStatus, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-400",
  dnd: "bg-red-500",
  offline: "bg-gray-500",
};
