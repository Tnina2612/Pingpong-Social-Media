import type { Attachment } from "./attachment";
import type { User } from "./user";

export interface CreatePostProps {
  content: string;
  attachments: Attachment[];
}

export interface PostType {
  id: string;
  content: string;
  attachments: Attachment[];
  createdAt: string;
  author: User;
  isLiked: boolean;
  stats: {
    likeCount: number;
    commentCount: number;
  };
}
