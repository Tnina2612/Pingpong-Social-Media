import { MoreHorizontal, Search } from "lucide-react";

const contacts = [
  { name: "Meta AI", avatar: "https://i.pravatar.cc/150?img=1", online: true },
  {
    name: "Nguyen Van Le Bao",
    avatar: "https://i.pravatar.cc/150?img=2",
    online: false,
  },
  {
    name: "The Tsar",
    avatar: "https://i.pravatar.cc/150?img=3",
    online: false,
  },
  { name: "Tran BL", avatar: "https://i.pravatar.cc/150?img=4", online: false },
  {
    name: "Canh Tuan",
    avatar: "https://i.pravatar.cc/150?img=5",
    online: false,
  },
  {
    name: "Nguyen Ngoc Thach",
    avatar: "https://i.pravatar.cc/150?img=6",
    online: false,
  },
  { name: "To Tran", avatar: "https://i.pravatar.cc/150?img=7", online: false },
  {
    name: "Post People",
    avatar: "https://i.pravatar.cc/150?img=8",
    online: false,
  },
  {
    name: "Quang Thang",
    avatar: "https://i.pravatar.cc/150?img=9",
    online: false,
  },
];

export const RightSidebar = () => {
  return (
    <div className="fixed right-0 top-14 pt-4 h-[calc(100vh-6rem)] w-80 overflow-y-auto px-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-gray-400 font-semibold text-lg">
            Contact Person
          </h3>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition">
              <Search size={18} className="text-gray-400" />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition">
              <MoreHorizontal size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="space-y-1">
          {contacts.map((contact) => (
            <div
              key={contact.name}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition relative"
            >
              <div className="relative">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
                )}
              </div>
              <span className="text-white font-medium text-sm">
                {contact.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
