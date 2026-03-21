import { Plus, Volume2 } from "lucide-react";
import { useState } from "react";
import { useCreateChannel, useGetAllChannel } from "@/services/chat";
import type { CreateChannelProps } from "@/types";
import { ChannelGroup } from "./ChannelGroup";
import { ChannelItem } from "./ChannelItem";

export const AudioChannel = ({ serverId }: { serverId: string }) => {
  const { data: channels = [] } = useGetAllChannel(serverId);
  const { mutate: createChannel } = useCreateChannel();
  const [isCreating, setIsCreating] = useState(false);
  const [channelName, setChannelName] = useState("");

  const voiceChannels = channels.filter((ch) => ch.type === "VOICE");

  const handleCreate = () => {
    if (!channelName.trim()) return;

    const payload: CreateChannelProps = {
      name: channelName,
      type: "VOICE",
      serverId,
    };

    createChannel(payload, {
      onSuccess: () => {
        setChannelName("");
        setIsCreating(false);
      },
    });
  };

  return (
    <ChannelGroup title="VOICE CHANNELS">
      <div className="space-y-1">
        {voiceChannels.length > 0 ? (
          voiceChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              name={channel.name}
              icon={<Volume2 size={14} />}
            />
          ))
        ) : (
          <p className="text-gray-400 text-xs p-2">No voice channels</p>
        )}

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
          >
            <Plus size={14} />
            <span>Create Channel</span>
          </button>
        )}

        {isCreating && (
          <div className="px-2 py-2 bg-white/5 rounded space-y-2">
            <input
              type="text"
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setChannelName("");
                }
              }}
              autoFocus
              className="w-full px-2 py-1 bg-[#2f3136] border border-[#202225] rounded text-white text-xs focus:outline-none focus:border-white/20"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setChannelName("");
                }}
                className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ChannelGroup>
  );
};
