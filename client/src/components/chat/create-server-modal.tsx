import { useCreateServer } from "@/services/chat";
import { useUploadMedia } from "@/services/homepage/upload";
import { type UploadType } from "@/types/upload";
import { useEffect, useRef, useState } from "react";
interface Props {
  onClose: () => void;
}
export const CreateServerModal = ({ onClose }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { mutate: createServer, isPending: isCreateServerPending } =
    useCreateServer();

  const { mutate: uploadMedia, isPending: isUploadMediaPending } =
    useUploadMedia();

  const [name, setName] = useState("");
  const [attachment, setAttachment] = useState<UploadType>();
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    uploadMedia(formData, {
      onSuccess: (data: UploadType) => {
        setAttachment(data);
      },
    });
  };

  const handleCreateServer = () => {
    if (!name.trim()) return;

    createServer({
      name,
      iconAttachmentId: attachment?.id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
      <div ref={modalRef} className="bg-[#2f3136] p-6 rounded-lg w-100 z-40">
        <h2 className="text-white text-lg font-bold mb-4">Create Server</h2>

        {/* icon upload */}
        <div className="flex flex-col items-center mb-4">
          <label className="w-20 h-20 rounded-full bg-[#36393f] flex items-center justify-center cursor-pointer overflow-hidden">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm">Upload</span>
            )}

            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* server name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Server name"
          className="w-full bg-[#202225] text-white px-3 py-2 rounded mb-4"
        />

        {/* button */}
        <button
          onClick={handleCreateServer}
          disabled={isCreateServerPending || isUploadMediaPending}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded"
        >
          Create
        </button>
      </div>
    </div>
  );
};
