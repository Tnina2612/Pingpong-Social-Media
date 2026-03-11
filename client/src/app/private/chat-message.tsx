import { useState, type FC } from "react";
import {
  ChannelHeader,
  DateDivider,
  DetailsSidebar,
  MessageBubble,
  MessageInput,
  Sidebar,
} from "../../components/chat";
import { useGetAllServer } from "@/services/chat";
import { CreateServerModal } from "@/components/chat/create-server-modal";

// ─── Main ChatMessage Component ───────────────────────────────────────────────

export const ChatMessage: FC = () => {
  const { data: allServers } =
    useGetAllServer();
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [isOpenCreateServer, setIsOpenCreateServer] = useState(false);
  return (
    <div className="flex mt-14 h-screen bg-[#36393f] overflow-hidden">
      {/* Server icon rail */}
      <div className="w-12 bg-[#202225] flex flex-col items-center py-2 gap-1.5 shrink-0">
        {allServers?.map((server) => {
          const isActive = activeServer === server.id;

          return (
            <div key={server.id} className="relative group flex items-center">
              {/* Tooltip */}
              <div
                className="
              absolute left-14
              whitespace-nowrap
              bg-black text-white text-xs
              px-2 py-1 rounded
              opacity-0 group-hover:opacity-100
              transition pointer-events-none
            "
              >
                {server.name}
              </div>

              {/* Server icon */}
              <div
                onClick={() => setActiveServer(server.id)}
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
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader
          channel="project-alpha"
          description="Design discussion for the new dashboard"
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pt-2">
          <DateDivider date="Today, October 24" />

          <MessageBubble
            author="Alex"
            time="7:02 PM"
            content="Hey team, are we still deciding on dinner for the team meetup tonight? I'm leaning towards Italian but open to suggestions."
          />

          <MessageBubble
            author="Sarah Jenkins"
            time="7:05 PM"
            content={`Sushi sounds good too! There's a new place downtown called "Sakura" that has great reviews.`}
          />

          <MessageBubble
            author="Sparky"
            time="7:06 PM"
            isAI
            content="Summary of the dinner discussion:"
          />
          {/* <AISummaryCard /> */}

          <MessageBubble
            author="Mike Ross"
            time="7:08 PM"
            content="I'm down for Sushi. Also, I can cover the bill first if everyone can just Pay me back later via the app."
          />
        </div>

        <MessageInput />
      </div>

      <DetailsSidebar />
    </div>
  );
};

export default ChatMessage;
