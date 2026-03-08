import { Gamepad2, Plus, Users } from "lucide-react";
import type { FC } from "react";
import {
  AISummaryCard,
  ChannelHeader,
  DateDivider,
  DetailsSidebar,
  MessageBubble,
  MessageInput,
  Sidebar,
} from "../../components/chat";

// ─── Main ChatMessage Component ───────────────────────────────────────────────

export const ChatMessage: FC = () => {
  return (
    <div className="flex mt-14 h-screen bg-[#36393f] overflow-hidden">
      {/* Server icon rail */}
      <div className="w-12 bg-[#202225] flex flex-col items-center py-2 gap-1.5 shrink-0">
        {[
          { icon: <span className="text-lg">🏠</span>, active: false },
          { icon: <Gamepad2 size={18} />, active: false },
          { icon: <Users size={18} />, active: true },
          { icon: <Plus size={18} />, active: false },
        ].map(({ icon, active }, i) => (
          <div
            key={i}
            className={`w-9 h-9 flex items-center justify-center cursor-pointer transition-all text-gray-300 hover:text-white
              ${
                active
                  ? "bg-indigo-500 rounded-xl text-white"
                  : "bg-[#36393f] rounded-full hover:rounded-xl hover:bg-indigo-500"
              }`}
          >
            {icon}
          </div>
        ))}
      </div>

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
          <AISummaryCard />

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
