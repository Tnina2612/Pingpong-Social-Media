import {
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { useLike } from "@/services/homepage/like";
import { useGetPostById } from "@/services/homepage/post";
import type { PostType } from "@/types";
import { formatDate } from "@/utils";
import { PostModal } from "./postmodal";

interface PostProps {
  post: PostType;
}

export const Post = ({ post }: PostProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLike, setIsLike] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.stats.likeCount);
  const { data: fullPost } = useGetPostById(post.id, isModalOpen);
  const { mutate: like, isPending } = useLike();
  const authorName = post.author?.username || "Unknown User";
  const authorAvatar =
    post.author?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;

  const handleCommentClick = () => {
    setIsModalOpen(true);
  };

  const handleLikeClick = () => {
    const nextLike = !isLike;
    setIsLike(nextLike);
    setLikeCount((count) => (nextLike ? count + 1 : count - 1));

    like(
      { targetId: post.id, type: "POST" },
      {
        onError: () => {
          setIsLike(isLike);
          setLikeCount((count) => (isLike ? count + 1 : count - 1));
        },
      },
    );
  };

  return (
    <>
      <div className="w-full bg-[#242526] rounded-lg overflow-hidden shadow-xl">
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
              <button
                className={`cursor-pointer text-gray-400 hover:text-white mt-1`}
              >
                <Send className={`w-5 h-5`} />
              </button>
            </div>
            <button
              className="cursor-pointer text-gray-400 hover:text-white ml-2"
              aria-label="Open post options menu"
            >
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
            <span>👍 {likeCount}</span>
            <span>
              {post.stats.commentCount}{" "}
              {post.stats.commentCount > 1 ? "comments" : "comment"} {" · "}
              {Math.floor(likeCount / 3)}{" "}
              {Math.floor(likeCount / 3) > 1 ? "shares" : "share"}{" "}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around border-t border-gray-800 pt-3">
            <button
              onClick={handleLikeClick}
              disabled={isPending}
              aria-disabled={isPending}
              className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsUp
                className={`w-4 h-4 ${isLike ? "text-blue-400" : ""}`}
              />
              <span className="text-sm">{isLike ? "Liked" : "Like"}</span>
            </button>
            <button
              onClick={handleCommentClick}
              className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Comment</span>
            </button>
            <button className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
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
