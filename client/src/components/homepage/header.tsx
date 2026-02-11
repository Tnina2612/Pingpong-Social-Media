import { NavLink } from "react-router-dom";
import { House, MessageCircle, UsersRound } from "lucide-react";
import Avatar from "@/assets/avatar.png";
interface ItemProps {
  id: number;
  icon: React.ElementType;
  path: string;
}

const navItems: ItemProps[] = [
  { id: 1, icon: House, path: "" },
  { id: 2, icon: MessageCircle, path: "message" },
  { id: 3, icon: UsersRound, path: "friends" },
];
export const HomePageHeader = () => {
  return (
    <header className="fixed top-0 z-50 w-full bg-gray-800 border-b border-gray-700">
      <div className="h-14 px-4 flex items-center justify-between relative">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <span className="text-blue-500 font-bold text-lg">SocialHybrid</span>
          <input
            placeholder="Search"
            className="bg-gray-700 text-sm px-3 py-1.5 rounded-full outline-none text-white"
          />
        </div>

        {/* CENTER */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          {navItems.map(({ id, icon: Icon, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `p-2 rounded-md transition ${
                  isActive
                    ? "text-blue-500 bg-gray-700"
                    : "text-gray-400 hover:text-white"
                }`
              }
            >
              <Icon size={22} />
            </NavLink>
          ))}
        </nav>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-4">
          <button className="w-9 h-9 rounded-full bg-gray-700" />
          <img src={Avatar} className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </header>
  );
};
