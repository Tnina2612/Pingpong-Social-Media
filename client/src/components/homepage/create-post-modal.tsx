import {
  ArrowLeft,
  Globe,
  Image,
  Lock,
  type LucideIcon,
  Mic,
  MoreHorizontal,
  Settings,
  Smile,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useAuthUser } from "@/hooks";
import { useCreatePost } from "@/services/homepage";
import { useDeleteMedia, useUploadMedia } from "@/services/homepage/upload";

const iconMap: Record<string, LucideIcon> = {
  Public: Globe,
  Friends: Users,
  Specific: User,
  "Only me": Lock,
  Custom: Settings,
};

const audiences = [
  {
    name: "Public",
    description: "Anyone on or off Facebook",
  },
  {
    name: "Friends",
    description: "Your friends on Facebook",
  },
  {
    name: "Specific",
    description: "Only show to some friends",
  },
  {
    name: "Only me",
    description: "Only you can see your post",
  },
  {
    name: "Custom",
    description: "Include and exclude friends",
  },
];

interface Props {
  onClose: () => void;
}

export default function CreatePostModal({ onClose }: Props) {
  const [view, setView] = useState("post");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("Friends");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [publicIds, setPublicIds] = useState<string[]>([]);

  const { user } = useAuthUser();
  const { mutate: createPost, isPending: isCreatePostPending } =
    useCreatePost();
  const { mutate: uploadMedia, isPending: isUploadMediaPending } =
    useUploadMedia();
  const { mutate: deleteMedia } = useDeleteMedia();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      // Upload multiple files
      Array.from(selectedFiles).forEach((file) => {
        const formData = new FormData();
        formData.append("file", file);
        uploadMedia(formData, {
          onSuccess: (data) => {
            setMediaUrls((prev) => [...prev, data.url]);
            setPublicIds((prev) => [...prev, data.publicId]);
          },
        });
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setMediaUrls((prev) =>
      prev.filter((_url, index) => index !== indexToRemove),
    );
    const publicIdToDelete = publicIds.find(
      (_publicId, index) => index === indexToRemove,
    );
    if (publicIdToDelete) deleteMedia({ publicId: publicIdToDelete });
    setPublicIds((prev) =>
      prev.filter((publicId) => publicId !== publicIdToDelete),
    );
  };

  const handleCloseEditingPost = () => {
    setContent("");
    setAudience("Friends");
    setMediaUrls([]);
    onClose();
    const publicIdsCopy = [...publicIds];
    setPublicIds([]);
    publicIdsCopy.forEach((publicId) => {
      deleteMedia({ publicId });
    });
  };

  const handleCreatePost = () => {
    if (!content.trim()) return;

    createPost({
      content,
      mediaUrls,
    });

    setContent("");
    setAudience("Friends");
    setMediaUrls([]);
    setPublicIds([]);
    onClose();
  };

  return (
    <div className="h-full flex items-center justify-center fixed backdrop-brightness-40 z-60 inset-0 top-0">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-200 w-125 max-h-[90vh]">
        <div
          className={`flex transition-all duration-200 ${
            view === "audience" ? "-translate-x-full" : ""
          }`}
        >
          {/* ================= POST SECTION ================= */}
          <section className="w-125 shrink-0 overflow-y-auto max-h-[90vh] p-6 pt-4">
            <div className="relative flex w-full items-center justify-center border-b pb-4">
              <h2 className="text-xl font-semibold absolute left-1/2 -translate-x-1/2">
                Create Post
              </h2>
              <button
                type="button"
                onClick={handleCloseEditingPost}
                disabled={isCreatePostPending || isUploadMediaPending}
                aria-label="close"
                className="cursor-pointer ml-auto bg-gray-200 rounded-full p-2 hover:bg-gray-300"
              >
                <X size={20} className="text-gray-600" aria-hidden="true" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center mt-5">
              <img
                src="https://i.pravatar.cc/150?img=3"
                alt="avatar"
                className="w-12 h-12 rounded-full"
              />
              <div className="ml-3">
                <p className="font-medium">{user?.username}</p>
                <div
                  onClick={() => setView("audience")}
                  className="flex size-fit items-center gap-1 mt-1 px-2 py-1 text-sm bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300"
                >
                  {(() => {
                    const Icon = iconMap[audience];
                    return <Icon size={16} />;
                  })()}
                  <span>{audience}</span>
                </div>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full mt-6 resize-none outline-none text-lg min-h-29"
            />

            {/* Theme & Emoji */}
            <div className="flex justify-between items-center mt-4">
              <Image
                size={22}
                className="text-gray-500 cursor-pointer hover:text-gray-700"
              />
              <Smile
                size={22}
                className="text-yellow-500 cursor-pointer hover:text-yellow-600"
              />
            </div>

            {/* Uploaded Images Grid */}
            {mediaUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {mediaUrls.map((mediaUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={mediaUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="cursor-pointer absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 shadow-lg transition opacity-0 group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X size={16} className="text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Options */}
            <div className="flex justify-between items-center border rounded-lg p-3 pt-2 pb-2 mt-4 shadow-sm">
              <p className="text-gray-600 font-medium">Add to your post</p>
              <div className="flex gap-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Image className="w-8 h-8 p-1 rounded-full hover:bg-gray-100 text-green-500" />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.mp4,.mov"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <User className="w-8 h-8 p-1 rounded-full hover:bg-gray-100 cursor-pointer text-blue-500" />
                <Smile className="w-8 h-8 p-1 rounded-full hover:bg-gray-100 cursor-pointer text-yellow-500" />
                <Mic className="w-8 h-8 p-1 rounded-full hover:bg-gray-100 cursor-pointer text-red-500" />
                <MoreHorizontal className="w-8 h-8 p-1 rounded-full hover:bg-gray-100 cursor-pointer text-gray-600" />
              </div>
            </div>

            {/* Post Button */}
            <button
              onClick={handleCreatePost}
              disabled={
                !content.trim() || isCreatePostPending || isUploadMediaPending
              }
              className={`w-full mt-4 h-10 rounded-lg font-medium transition ${
                content.trim()
                  ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Post
            </button>
          </section>

          {/* ================= AUDIENCE SECTION ================= */}
          <section className="w-125 shrink-0 overflow-y-auto max-h-[90vh] p-6">
            <div className="relative border-b pb-4 text-center">
              <button
                onClick={() => setView("post")}
                className="absolute left-0 top-0 bg-gray-200 rounded-full p-2 hover:bg-gray-300"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold">Select Audience</h2>
            </div>

            <div className="mt-5">
              <p className="font-medium text-lg">Who can see your post?</p>
              <span className="text-sm text-gray-500">
                Your post will show up in News Feed and on your profile.
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {audiences.map((item) => (
                <li
                  key={item.name}
                  onClick={() => {
                    setAudience(item.name);
                    setView("post");
                  }}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition ${
                    audience === item.name ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full ${
                        audience === item.name ? "bg-blue-200" : "bg-gray-200"
                      }`}
                    >
                      {(() => {
                        const Icon = iconMap[item.name];
                        return <Icon size={22} />;
                      })()}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">{item.name}</p>
                      <span className="text-sm text-gray-500">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      audience === item.name
                        ? "border-blue-500"
                        : "border-gray-400"
                    }`}
                  >
                    {audience === item.name && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
