import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCreateComment,
  useGetCommentsByPost,
} from "@/services/homepage/comment";
import type { PostType } from "@/types";
import { Comment } from "./comment";

interface Props {
  post: PostType;
  onClose: () => void;
}

export const PostModal = ({ post, onClose }: Props) => {
  const [commentContent, setCommentContent] = useState("");
  const [parentId, setParentId] = useState<string | undefined>();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch root comments only
  const { data: comments = [], isLoading } = useGetCommentsByPost(
    post.id,
    true,
  );

  const { mutate: createComment, isPending } = useCreateComment();

  const totalImages = post.mediaUrls?.length || 0;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (totalImages > 1) {
        if (e.key === "ArrowLeft") {
          setCurrentImageIndex((prev) =>
            prev === 0 ? totalImages - 1 : prev - 1,
          );
        } else if (e.key === "ArrowRight") {
          setCurrentImageIndex((prev) =>
            prev === totalImages - 1 ? 0 : prev + 1,
          );
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalImages, onClose]);

  const handleSubmitComment = () => {
    if (!commentContent.trim()) return;

    createComment({
      postId: post.id,
      parentId,
      content: commentContent,
    });

    setCommentContent("");
    setParentId(undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const toggleReplies = (id: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 h-full backdrop-brightness-40 z-50 flex items-center justify-center">
      <div className="w-[90%] max-w-6xl h-[85vh] bg-[#0e1a2f] rounded-2xl overflow-hidden flex shadow-2xl border border-blue-900/30">
        {/* LEFT - MEDIA */}
        <div className="w-1/2 bg-black/40 flex items-center justify-center relative">
          {post.mediaUrls?.length ? (
            <>
              <img
                src={post.mediaUrls[currentImageIndex]}
                alt={`post image ${currentImageIndex + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Navigation Buttons - Only show if more than 1 image */}
              {totalImages > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={handlePreviousImage}
                    className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/90 rounded-full flex items-center justify-center transition-all shadow-lg"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} className="text-white" />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNextImage}
                    className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/90 rounded-full flex items-center justify-center transition-all shadow-lg"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} className="text-white" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {totalImages}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-blue-300/50">No media</div>
          )}
        </div>

        {/* RIGHT - COMMENTS */}
        <div className="w-1/2 flex flex-col border-l border-blue-900/30 bg-[#0b1424]/60">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar || "/default-avatar.png"}
                alt={`${post.author.username}'s avatar`}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-semibold text-sm text-blue-100">
                {post.author.username}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="cursor-pointer text-blue-300 rounded-full p-1 hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Caption */}
          <div className="p-4 text-blue-100 text-sm border-b border-blue-900/30">
            <span className="font-semibold text-blue-300 mr-2">
              {post.author.username}
            </span>
            {post.content}
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="text-center text-blue-300/50">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-blue-300/50">
                No comments yet
              </div>
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  expandedComments={expandedComments}
                  toggleReplies={toggleReplies}
                  onReply={(id) => setParentId(id)}
                />
              ))
            )}
          </div>

          {/* Reply Info */}
          {parentId && (
            <div className="px-4 py-2 bg-blue-950/40 border-t border-blue-900/30 flex justify-between">
              <span className="text-xs text-blue-300">Replying...</span>
              <button
                onClick={() => setParentId(undefined)}
                className="text-xs text-blue-400"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Comment Input */}
          <div className="border-t border-blue-900/30 p-4">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Add a comment..."
              rows={2}
              className="w-full bg-blue-950/40 text-blue-100 outline-none rounded-lg p-2 resize-none"
            />

            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || isPending}
              className="mt-2 w-full bg-blue-600 text-white text-sm py-2 rounded-lg"
            >
              {isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
