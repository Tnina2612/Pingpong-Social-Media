export interface PostType {
  id: string;
  content: string;
  mediaUrls?: string[];
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
