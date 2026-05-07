import { type FC, useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CreateServerModal } from "@/components/chat/create-server-modal";
import { useChatStore } from "@/hooks/useChatStore";
import { useGetAllServer } from "@/services/chat";
import { DetailsSidebar, Sidebar } from "../../components/chat";

// Main ChatMessage Component

export const ChatMessage: FC = () => {
  const { data: allServers } = useGetAllServer();
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [isOpenCreateServer, setIsOpenCreateServer] = useState(false);
  const currChannel = useChatStore((state) => state.currChannel);
  const setCurrChannel = useChatStore((state) => state.setCurrChannel);

  // Reset channel when change server
  const handleSelectServer = (serverId: string) => {
    setActiveServer(serverId);
    setCurrChannel(null);
  };

  return (
    <div className="flex mt-14 h-screen bg-[#36393f] overflow-hidden">
      {/* Server icon rail */}
      <div className="w-12 bg-[#202225] flex flex-col items-center py-2 gap-1.5 shrink-0">
        {allServers?.map((server) => {
          const isActive = activeServer === server.id;

          return (
            <div key={server.id} className="relative group flex items-center">
              {/* Tooltip */}
              <div className="absolute left-14 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none ">
                {server.name}
              </div>

              {/* Server icon */}
              <div
                onClick={() => handleSelectServer(server.id)}
                className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all text-gray-300 hover:text-white
              ${
                isActive
                  ? "bg-indigo-500 rounded-xl text-white"
                  : "bg-[#36393f] rounded-full hover:rounded-xl hover:bg-indigo-500"
              }`}
              >
                {server.iconUrl ? (
                  <img
                    src={server.iconUrl}
                    alt={server.name}
                    className="w-full h-full object-cover rounded-inherit"
                  />
                ) : (
                  <span className="font-bold text-sm">
                    {server.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div
          onClick={() => setIsOpenCreateServer(true)}
          className="w-10 h-10 bg-[#36393f] rounded-full flex items-center justify-center text-green-400 cursor-pointer hover:bg-green-500 hover:text-white transition"
        >
          +
        </div>
      </div>
      {isOpenCreateServer && (
        <CreateServerModal onClose={() => setIsOpenCreateServer(false)} />
      )}
      <Sidebar serverId={activeServer || ""} />

      {/* Main content */}
      <ChatWindow channel={currChannel} />

      <DetailsSidebar />
    </div>
  );
};

export default ChatMessage;
