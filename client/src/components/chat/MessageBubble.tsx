import type { FC } from "react";
import type { MessageBubbleProps } from "../../types/chat";
import { Avatar } from "./Avatar";
import { Reply } from "lucide-react";

export const MessageBubble: FC<MessageBubbleProps> = ({
  messageId,
  author,
  time,
  content,
  isAI = false,
  replyTo,
  attachments,
  onReply,
}) => (
  <div
    className={`flex gap-3 px-4 py-2 transition-colors group
      ${
        isAI
          ? "bg-indigo-500/8 border-l-2 border-indigo-500"
          : "border-l-2 border-transparent hover:bg-white/2"
      }`}
  >
    <Avatar
      alt={author.username}
      src={author.avatar || ""}
      size="md"
      status={isAI ? "online" : undefined}
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-0.5">
        <span
          className={`font-bold text-[15px] ${isAI ? "text-indigo-400" : "text-white"}`}
        >
          {author.username}
        </span>
        {isAI && (
          <span className="bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-px rounded tracking-widest">
            AI ASSISTANT
          </span>
        )}
        <span className="text-gray-500 text-[11px]">{time}</span>
      </div>

      {/* Reply to message quote */}
      {replyTo?.content && (
        <div className="mb-2 bg-gray-700/30 border-l-2 border-gray-500 pl-2 py-1 rounded">
          <p className="text-xs text-gray-400 mb-0.5">
            Replying to{" "}
            <span className="text-blue-300 font-semibold">
              {replyTo.username}
            </span>
          </p>
          <p className="text-xs text-gray-300 line-clamp-2">
            {replyTo.content}
          </p>
        </div>
      )}

      <p className="text-[#dcddde] text-sm leading-relaxed">{content}</p>
      {attachments && attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div key={attachment.id}>
              {attachment.type === "VIDEO" ? (
                <video
                  src={attachment.url}
                  controls
                  className="w-xl aspect-video object-cover"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <img
                  src={attachment.url}
                  alt="message image"
                  className="w-xl aspect-video object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => onReply?.({ id: messageId, content, sender: author })} // Gữi message data
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-400"
        title="Reply to this message"
      >
        <Reply size={16} />
      </button>
    </div>
  </div>
);
