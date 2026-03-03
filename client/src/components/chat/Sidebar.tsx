import { Gamepad2, Mic, Settings, Volume2 } from "lucide-react";
import type { FC } from "react";
import { Avatar } from "./Avatar";
import { ChannelGroup } from "./ChannelGroup";
import { ChannelItem } from "./ChannelItem";

export const Sidebar: FC = () => (
  <div className="w-56 bg-[#2f3136] flex flex-col border-r border-[#202225] shrink-0">
    {/* Server Header */}
    <div className="px-4 py-3.5 border-b border-[#202225] flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
      <span className="font-bold text-white text-sm">Dev Community</span>
      <span className="text-gray-400">⌄</span>
    </div>

    {/* Channels */}
    <div className="flex-1 overflow-y-auto p-2">
      <ChannelGroup title="Gaming">
        <ChannelItem name="general-gaming" icon={<Gamepad2 size={14} />} />
        <ChannelItem name="Voice Lobby" icon={<Volume2 size={14} />} />
      </ChannelGroup>
      <ChannelGroup title="Work Projects">
        <ChannelItem name="project-alpha" active />
        <ChannelItem name="design-assets" />
        <ChannelItem name="admin-only" locked />
      </ChannelGroup>
      <ChannelGroup title="Close Friends">
        <ChannelItem name="weekend-plans" />
      </ChannelGroup>
    </div>

    {/* User Footer */}
    <div className="px-3 py-2 bg-[#292b2f] flex items-center gap-2 border-t border-[#202225]">
      <Avatar alt="Sarah Jenkins" size="sm" status="online" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">
          Sarah Jenkins
        </p>
        <p className="text-gray-400 text-[10px]">#8392</p>
      </div>
      <button className="text-gray-400 hover:text-white transition-colors">
        <Mic size={15} />
      </button>
      <button className="text-gray-400 hover:text-white transition-colors">
        <Settings size={15} />
      </button>
    </div>
  </div>
);
