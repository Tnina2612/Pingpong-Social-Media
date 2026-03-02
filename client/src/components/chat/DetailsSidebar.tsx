import type { FC } from "react";
import { X } from "lucide-react";
import { QuickPay } from "./QuickPay";
import { OnlineUser } from "./OnlineUser";

export const DetailsSidebar: FC = () => (
  <div className="w-60 bg-[#2f3136] border-l border-[#202225] p-4 overflow-y-auto shrink-0">
    <div className="flex items-center justify-between mb-4">
      <span className="font-bold text-white text-sm">Details</span>
      <button className="text-gray-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>

    <QuickPay />

    <div className="mb-4">
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-2">
        Online — 4
      </p>
      <OnlineUser name="Alex" sub="Typing..." status="online" />
      <OnlineUser
        name="Mike Ross"
        sub="Playing League of Legends"
        status="online"
      />
      <OnlineUser name="Sparky (AI)" sub="Always listening" status="online" />
      <OnlineUser name="Sarah Jenkins" sub="Idle for 10m" status="idle" />
    </div>

    <div>
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-2">
        Shared Assets
      </p>
      <div className="flex gap-2">
        {(["mockup_v1..", "specs.pdf"] as const).map((name, i) => (
          <div
            key={name}
            className={`flex-1 bg-[#202225] rounded-md py-2 px-2 text-[11px] text-[#dcddde] text-center cursor-pointer
              border hover:bg-[#2a2d31] transition-colors
              ${i === 0 ? "border-indigo-500/40" : "border-yellow-500/40"}`}
          >
            {i === 0 ? "📘" : "📙"} {name}
          </div>
        ))}
      </div>
    </div>
  </div>
);
