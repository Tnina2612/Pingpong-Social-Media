import { Mic, Settings } from "lucide-react";

import { Avatar } from "./Avatar";

import { ChatChannel } from "./ChatChannel";
import { AudioChannel } from "./AudioChannel";
import { useGetServerById } from "@/services/chat";
import { useAuthUser } from "@/hooks";

interface Props {
  serverId: string;
}
export const Sidebar = ({ serverId }: Props) => {
  const { data: server } = useGetServerById(serverId, !!serverId);
  const user = useAuthUser.getState().user;
  return (
    <div className="w-56 bg-[#2f3136] flex flex-col border-r border-[#202225] shrink-0">
      {/* Server Header */}
      <div className="px-4 py-3.5 border-b border-[#202225] flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
        <span className="font-bold text-white text-sm">
          {server?.name || "Choi flo ngu"}
        </span>
        <span className="text-gray-400">⌄</span>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-2">
        <ChatChannel serverId={serverId} />
        <AudioChannel serverId={serverId} />
      </div>

      {/* User Footer */}
      <div className="px-3 py-2 bg-[#292b2f] flex items-center gap-2 border-t border-[#202225]">
        <Avatar
          alt="Sarah Jenkins"
          src={user?.avatar || ""}
          size="sm"
          status="online"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">
            {user?.username}
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
};
