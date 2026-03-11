import type { Attachment } from "./attachment";

export interface CreatePostProps {
  content: string;
  attachmentIds?: String[];
}

export interface PostType {
  id: string;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  author: {
    id?: string;
    username?: string;
    avatar?: string;
  };
  isLiked: boolean;
  stats: {
    likeCount: number;
    commentCount: number;
  };
}
