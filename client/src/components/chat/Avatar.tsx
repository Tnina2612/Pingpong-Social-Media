import type { FC } from "react";
import type { AvatarProps } from "../../types/chat";
import { statusClass } from "../../types/chat";

export const Avatar: FC<AvatarProps> = ({ alt, src, size = "md", status }) => {
  const sizeClass = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-9 h-9 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];

  const dotSize = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  }[size];

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClass} rounded-full bg-linear-to-br from-indigo-500 to-indigo-400 flex items-center justify-center font-bold text-white overflow-hidden`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          alt?.[0]?.toUpperCase()
        )}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSize} ${statusClass[status]} rounded-full border-2 border-[#1e2124]`}
        />
      )}
    </div>
  );
};
