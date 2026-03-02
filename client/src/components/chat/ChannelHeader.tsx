import type { FC } from "react";
import { Hash, Search, Bell, Edit3 } from "lucide-react";
import type { ChannelHeaderProps } from "../../types/chat";

export const ChannelHeader: FC<ChannelHeaderProps> = ({
  channel,
  description,
}) => (
  <div className="h-12 border-b border-[#202225] flex items-center px-4 gap-2 shrink-0">
    <Hash size={18} className="text-gray-400" />
    <div className="flex items-baseline gap-2">
      <span className="font-bold text-white text-sm">{channel}</span>
      <span className="text-gray-400 text-xs hidden sm:block">
        {description}
      </span>
    </div>
    <div className="flex-1" />
    <div className="flex items-center gap-1 bg-[#202225] rounded px-2 py-1">
      <Search size={13} className="text-gray-500" />
      <input
        placeholder="Search"
        className="bg-transparent border-none outline-none text-gray-400 text-xs w-28 placeholder-gray-600"
      />
    </div>
    <button className="text-gray-400 hover:text-white transition-colors">
      <Bell size={18} />
    </button>
    <button className="text-gray-400 hover:text-white transition-colors">
      <Edit3 size={17} />
    </button>
  </div>
);
