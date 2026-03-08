import type { Attachment } from "./attachment";
import type { User } from "./user";

export interface CreateMessageProps {
  channelId: string;
  content?: string;
  replyToId?: string;
  attachments?: Attachment[];
}

export interface MessageType {
  id: string;
  createdAt: string;
  deleted: boolean;
  content?: string;
  attachments: Attachment[];
  replyTo?: {
    id: string;
    content?: string;
  };
  sender: User;
  reactions: {
    icon: string;
    count: number;
    users: User[];
  };
}
