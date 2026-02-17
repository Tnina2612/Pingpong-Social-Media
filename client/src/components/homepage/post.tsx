import { useState } from "react";
import { formatDate } from "@/utils";
import {
    MoreHorizontal,
    Send,
    ThumbsUp,
    MessageSquare,
    Share2,
} from "lucide-react";
import { useGetPostById } from "@/services/homepage/post";
import { PostModal } from "./postmodal";

export interface PostData {
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

interface PostProps {
  post: PostData;
}

export const Post = ({ post }: PostProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: fullPost } = useGetPostById(post.id, isModalOpen);

  const authorName = post.author?.username || "Unknown User";
  const authorAvatar =
    post.author?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;

  const handleCommentClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="w-full max-w-md bg-linear-to-b from-gray-900 to-gray-950 rounded-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="text-white font-semibold text-sm">{authorName}</h3>
              <p className="text-gray-400 text-xs">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Send
                className={`w-5 h-5 ${post.isLiked ? "text-blue-400" : "text-gray-400"}`}
              />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
            <button className="text-gray-400 hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-white text-sm">{post.content}</p>
        </div>

        {/* Image */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="relative">
            <img
              src={post.mediaUrls[0]}
              alt="Post media"
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {/* Stats */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>👍 {post.stats.likeCount}</span>
            <span>
              {post.stats.commentCount} comments ·{" "}
              {Math.floor(post.stats.likeCount / 3)} shares
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around border-t border-gray-800 pt-3">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ThumbsUp
                className={`w-4 h-4 ${post.isLiked ? "text-blue-400" : ""}`}
              />
              <span className="text-sm">{post.isLiked ? "Liked" : "Like"}</span>
            </button>
            <button
              onClick={handleCommentClick}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Comment</span>
            </button>
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && fullPost && (
        <PostModal post={fullPost} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};