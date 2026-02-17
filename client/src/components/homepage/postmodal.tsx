import { X } from "lucide-react";
import { useState } from "react";
import type { PostData } from "./post";
import { CommentItem } from "./comment";
import {
  useGetCommentById,
  useCreateComment,
} from "@/services/homepage/comment";

interface Props {
  post: PostData;
  onClose: () => void;
}

export const PostModal = ({ post, onClose }: Props) => {
  const [commentContent, setCommentContent] = useState("");
  const [parentId, setParentId] = useState<string | undefined>();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );

  // 🔥 Root comments only
  const { data: comments = [], isLoading } = useGetCommentById(post.id, true);

  const { mutate: createComment, isPending } = useCreateComment();

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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="w-[90%] max-w-6xl h-[85vh] bg-[#0e1a2f] rounded-2xl overflow-hidden flex shadow-2xl border border-blue-900/30">
        {/* LEFT - MEDIA */}
        <div className="w-1/2 bg-black/40 flex items-center justify-center">
          {post.mediaUrls?.length ? (
            <img
              src={post.mediaUrls[0]}
              alt="post"
              className="h-full w-full object-cover"
            />
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
                className="w-8 h-8 rounded-full"
              />
              <span className="font-semibold text-sm text-blue-100">
                {post.author.username}
              </span>
            </div>

            <X
              size={20}
              className="cursor-pointer text-blue-300"
              onClick={onClose}
            />
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
                <CommentItem
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
