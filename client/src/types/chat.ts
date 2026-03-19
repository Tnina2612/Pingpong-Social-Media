import type { ReactNode } from "react";
import type { UploadType } from "./upload";
import type { User } from "./user";

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
  onClick?: () => void;
}

export interface ChannelGroupProps {
  title: string;
  children: ReactNode;
}

export interface MessageBubbleProps {
  author: User;
  time: string;
  content: string;
  isAI?: boolean;
  replyTo?: {
    id: string;
    content: string;
  };
  attachments?: UploadType[];
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
