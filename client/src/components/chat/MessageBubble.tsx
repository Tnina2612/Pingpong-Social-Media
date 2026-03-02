import type { FC } from "react";
import type { MessageBubbleProps } from "../../types/chat";
import { Avatar } from "./Avatar";

export const MessageBubble: FC<MessageBubbleProps> = ({
  author,
  time,
  content,
  isAI = false,
}) => (
  <div
    className={`flex gap-3 px-4 py-2 transition-colors
      ${
        isAI
          ? "bg-indigo-500/8 border-l-2 border-indigo-500"
          : "border-l-2 border-transparent hover:bg-white/2"
      }`}
  >
    <Avatar alt={author} size="md" status={isAI ? "online" : undefined} />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-0.5">
        <span
          className={`font-bold text-[15px] ${isAI ? "text-indigo-400" : "text-white"}`}
        >
          {author}
        </span>
        {isAI && (
          <span className="bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-px rounded tracking-widest">
            AI ASSISTANT
          </span>
        )}
        <span className="text-gray-500 text-[11px]">{time}</span>
      </div>
      <p className="text-[#dcddde] text-sm leading-relaxed">{content}</p>
    </div>
  </div>
);
