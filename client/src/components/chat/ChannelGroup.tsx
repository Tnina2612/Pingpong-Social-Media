import type { FC } from "react";
import type { ChannelGroupProps } from "../../types/chat";

export const ChannelGroup: FC<ChannelGroupProps> = ({ title, children }) => (
  <div className="mb-2">
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 py-2 flex items-center gap-1">
      <span>▾</span> {title}
    </p>
    {children}
  </div>
);
