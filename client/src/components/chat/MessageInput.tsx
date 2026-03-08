import { Gift, Image, Plus, Smile } from "lucide-react";
import type { FC } from "react";

export const MessageInput: FC = () => (
  <div className="px-4 pb-4">
    <div className="bg-[#40444b] rounded-lg flex items-center px-3.5 py-2.5 gap-2.5">
      <button className="text-gray-400 hover:text-gray-200 transition-colors shrink-0">
        <Plus size={20} />
      </button>
      <input
        placeholder="Message #project-alpha"
        className="flex-1 bg-transparent border-none outline-none text-[#dcddde] placeholder-gray-500 text-sm"
      />
      <button className="text-gray-400 hover:text-gray-200 transition-colors">
        <Gift size={18} />
      </button>
      <button className="text-gray-400 hover:text-gray-200 transition-colors">
        <Image size={18} />
      </button>
      <button className="text-gray-400 hover:text-gray-200 transition-colors">
        <Smile size={18} />
      </button>
    </div>
    <p className="text-center mt-1.5 text-gray-600 text-xs">
      Type <strong className="text-gray-500">@Sparky</strong> to ask the AI
      assistant for help.
    </p>
  </div>
);
