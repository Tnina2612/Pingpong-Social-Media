import type { FC } from "react";
import { CreditCard } from "lucide-react";
import { Avatar } from "./Avatar";

export const QuickPay: FC = () => (
  <div className="bg-[#202225] border border-[#3f4147] rounded-lg p-3.5 mb-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <CreditCard size={14} className="text-indigo-400" />
        <span className="font-bold text-white text-sm">QuickPay</span>
      </div>
      <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-px rounded tracking-widest">
        SECURE
      </span>
    </div>

    <div className="mb-2">
      <p className="text-gray-500 text-[11px] mb-1">Recipient</p>
      <div className="bg-[#2f3136] rounded-md px-2.5 py-2 flex items-center gap-2">
        <Avatar alt="Mike Ross" size="sm" status="online" />
        <span className="text-white text-xs font-semibold">@MikeRoss</span>
      </div>
    </div>

    <div className="mb-3">
      <p className="text-gray-500 text-[11px] mb-1">Amount</p>
      <div className="bg-[#2f3136] rounded-md px-3 py-2 flex items-center justify-between">
        <span className="text-white text-xl font-bold">200,000</span>
        <span className="text-gray-500 text-xs">VND</span>
      </div>
    </div>

    <div className="flex gap-2">
      <button className="flex-1 bg-[#d82d8b] hover:bg-[#c4277d] text-white text-xs font-bold py-2 rounded-md transition-colors">
        MoMo
      </button>
      <button className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold py-2 rounded-md transition-colors">
        VNPay
      </button>
    </div>
  </div>
);
