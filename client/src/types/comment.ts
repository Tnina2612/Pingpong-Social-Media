import type { User } from "./user";

export interface CommentType {
  id: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  parentId?: string | null;
  author: Pick<User, "id" | "avatar" | "username">;
  isLiked: boolean;
  stats: {
    likeCount: number;
    replyCount: number;
  };
}
