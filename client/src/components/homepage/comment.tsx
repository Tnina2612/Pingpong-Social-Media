import { ChevronDown } from "lucide-react";
import { useGetReplies } from "@/services/homepage";
import type { CommentType } from "@/types";

interface CommentProps {
  comment: CommentType;
  depth?: number;
  expandedComments: Set<string>;
  toggleReplies: (id: string) => void;
  onReply?: (id: string) => void;
}

export const Comment = ({
  comment,
  depth = 0,
  expandedComments,
  toggleReplies,
  onReply,
}: CommentProps) => {
  const isExpanded = expandedComments.has(comment.id);

  const { data: replies = [], isLoading } = useGetReplies(
    comment.id,
    isExpanded,
  );

  const hasReplies = comment.stats.replyCount > 0;

  return (
    <div style={{ marginLeft: Math.min(depth, 2) * 20 }}>
      <div className="bg-blue-950/30 px-3 py-2 rounded-lg">
        <p className="text-sm text-blue-100">
          <span className="font-semibold text-blue-300">
            {comment.author.username}
          </span>{" "}
          {comment.content}
        </p>

        <div className="flex gap-2 mt-1">
          {onReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-blue-400"
            >
              Reply
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
              {isExpanded
                ? "Hide replies"
                : `View ${comment.stats.replyCount} replies`}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <div className="text-xs text-blue-300/50">Loading replies...</div>
          ) : (
            replies.map((reply) => (
              // Recursive layout
              <Comment
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                expandedComments={expandedComments}
                toggleReplies={toggleReplies}
                onReply={onReply}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
