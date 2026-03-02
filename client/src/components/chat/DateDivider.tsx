import type { FC } from "react";
import type { DateDividerProps } from "../../types/chat";

export const DateDivider: FC<DateDividerProps> = ({ date }) => (
  <div className="flex items-center px-4 py-4 gap-3">
    <div className="flex-1 h-px bg-[#3f4147]" />
    <span className="text-gray-500 text-xs font-semibold whitespace-nowrap">
      {date}
    </span>
    <div className="flex-1 h-px bg-[#3f4147]" />
  </div>
);
