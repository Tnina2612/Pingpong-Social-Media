import { Images, Smile, Video } from "lucide-react";
import { useState } from "react";
import { useAuthUser } from "@/hooks";
import CreatePostModal from "./create-post-modal";

export const CreatePost = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthUser();

  return (
    <>
      <div className="w-full mx-auto bg-[#242526] rounded-xl shadow p-4 pb-2">
        {/* Top Section */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <img
            src="https://i.pravatar.cc/150?img=32"
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />

          {/* Input */}
          <button
            onClick={() => setIsModalOpen(!isModalOpen)}
            className="cursor-pointer flex-1 bg-[#3a3b3d] hover:bg-[#3f3f40] transition rounded-full px-4 py-2 text-left text-gray-400"
          >
            What's on your mind, {user?.username}?
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-t-[#3a3b3d] my-4 mb-2"></div>

        {/* Bottom Actions */}
        <div className="flex justify-between">
          <PostButton
            icon={<Video size={20} className="text-green-500" />}
            text="Live video"
          />
          <PostButton
            icon={<Images size={20} className="text-blue-500" />}
            text="Photo/Video"
          />
          <PostButton
            icon={<Smile size={20} className="text-yellow-500" />}
            text="Feeling/Activity"
          />
        </div>
      </div>
      
      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

interface PostButtonProps {
  icon: React.ReactNode;
  text: string;
}

const PostButton = ({ icon, text }: PostButtonProps) => {
  return (
    <button className="cursor-pointer flex items-center justify-center gap-2 flex-1 py-2 rounded-lg hover:bg-[#3a3b3d] transition">
      {icon}
      <span className="text-sm font-medium text-gray-400">{text}</span>
    </button>
  );
};
