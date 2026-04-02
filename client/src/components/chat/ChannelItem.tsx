import { Hash, Lock } from "lucide-react";
import type { FC } from "react";
import type { ChannelItemProps } from "../../types/chat";
import { useVoiceStore } from "@/hooks/useVoiceStore";

export const ChannelItem: FC<ChannelItemProps> = ({
  name,
  icon,
  locked = false,
  active = false,
  onClick,
  channelId,
}) => {
  const users = useVoiceStore((s) => s.participantsByChannel[channelId]) || [];
  console.log(users);
  return (
    <div>
      {/* CHANNEL */}
      <div
        onClick={onClick}
        className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5"
      >
        {icon}
        <span>{name}</span>
      </div>

      {/* USERS */}
      <div className="ml-6 mt-1 space-y-1">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 text-xs text-gray-300"
          >
            <img
              src={user.avatar || "/default.png"}
              className="w-6 h-6 rounded-full"
            />
            <span>{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
