import type { UploadType } from "./upload";
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
  attachments?: UploadType[];
  replyTo?: {
    id: string;
    content: string;
  };
  sender: User;
};
