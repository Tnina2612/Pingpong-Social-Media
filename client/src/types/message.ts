import type { Attachment } from "./attachment";
import type { User } from "./user";

export interface CreateMessageData {
  channelId: string;
  content?: string;
  replyToId?: string;
  attachmentIds?: string[];
}

export type Message = {
  id: string;
  content?: string;
  attachments?: Attachment[];
  replyto?: {
    id: string;
    content: string;
  };
  sender: User;
};
