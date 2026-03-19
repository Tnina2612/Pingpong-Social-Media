import { Hash, Lock } from "lucide-react";
import type { FC } from "react";
import type { ChannelItemProps } from "../../types/chat";

export const ChannelItem: FC<ChannelItemProps> = ({
  name,
  icon,
  locked = false,
  active = false,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-sm transition-colors
      ${active ? "bg-indigo-500/25 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
  >
    <span className="opacity-70 shrink-0">
      {locked ? <Lock size={14} /> : (icon ?? <Hash size={14} />)}
    </span>
    <span>{name}</span>
  </div>
);
