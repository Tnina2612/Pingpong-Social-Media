import {
  Bookmark,
  ChevronDown,
  Clock,
  FilmIcon,
  Users,
} from "lucide-react";
import { useAuthUser } from "@/hooks";

const menuItems = [
  { icon: Users, label: "Friends", color: "text-blue-500" },
  { icon: Clock, label: "Memories", color: "text-blue-400" },
  { icon: Bookmark, label: "Saved", color: "text-purple-500" },
  { icon: Users, label: "Group", color: "text-cyan-500" },
  { icon: FilmIcon, label: "The film", color: "text-orange-500" },
];

export const LeftSidebar = () => {
  const { user } = useAuthUser();

  return (
    <div className="fixed left-0 top-14 pt-4 h-[calc(100vh-6rem)] w-80 overflow-y-auto px-2">
      <div className="space-y-1">
        {/* User Profile */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition">
          <img
            src="https://i.pravatar.cc/150?img=32"
            alt="User Avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="text-white font-medium">{user?.username}</span>
        </div>

        {/* Meta AI */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="text-white font-medium">Meta AI</span>
        </div>

        {/* Manus AI */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition">
          <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-white font-medium">Manus AI</span>
        </div>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition"
          >
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
              <item.icon size={20} className={item.color} />
            </div>
            <span className="text-white font-medium">{item.label}</span>
          </div>
        ))}

        {/* View More */}
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
            <ChevronDown size={20} className="text-gray-400" />
          </div>
          <span className="text-white font-medium">View more</span>
        </div>
      </div>
    </div>
  );
};
