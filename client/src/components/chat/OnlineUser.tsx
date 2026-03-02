import type { FC } from "react";
import type { OnlineUserProps } from "../../types/chat";
import { Avatar } from "./Avatar";

export const OnlineUser: FC<OnlineUserProps> = ({ name, sub, status }) => (
  <div className="flex items-center gap-2 py-1">
    <Avatar alt={name} size="sm" status={status} />
    <div className="min-w-0">
      <p className="text-[#dcddde] text-xs font-semibold truncate">{name}</p>
      <p className="text-gray-500 text-[10px] truncate">{sub}</p>
    </div>
  </div>
);
