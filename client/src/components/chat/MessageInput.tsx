import { useCreateMessage } from "@/services/chat";
import { useUploadMedia } from "@/services/homepage/upload";
import type { Message } from "@/types/message";
import type { UploadType } from "@/types/upload";
import { Gift, Image, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  channelId: string;
}

export const MessageInput = ({ channelId }: Props) => {
  const { mutate: uploadMedia, isPending: uploadMediaPending } =
    useUploadMedia();
  const { mutate: createMessage, isPending: createMessagePending } =
    useCreateMessage();
  const [attachments, setAttachments] = useState<UploadType[]>([]);
  const [content, setContent] = useState("");
  const [replyMsg, setReplyMsg] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      Array.from(selectedFiles).forEach((file) => {
        const formData = new FormData();
        formData.append("file", file);
        uploadMedia(formData, {
          onSuccess: (data) => {
            setAttachments((prev) => [...prev, data]);
          },
        });
      });
    }
  };

  const handleAddAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleAddImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.accept = "image/*";
      imageInputRef.current.click();
    }
  };

  const handleCreateMessage = () => {
    if (!content.trim() && !attachments.length) return;
    const attachmentIds = attachments.map((a) => a.id);
    createMessage(
      {
        channelId,
        content,
        attachmentIds,
        replyToId: replyMsg?.id,
      },
      {
        onSuccess: () => {
          setContent("");
          setAttachments([]);
          setReplyMsg(null);
        },
      },
    );
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="px-4 pb-4">
      {/* Reply to message preview */}
      {replyMsg && (
        <div className="mb-2 bg-gray-700/50 rounded p-2 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-400">
              Replying to{" "}
              <span className="text-blue-400 font-semibold">
                {replyMsg.sender.username}
              </span>
            </p>
            <p className="text-sm text-gray-300 line-clamp-1">
              {replyMsg.content}
            </p>
          </div>
          <button
            onClick={() => setReplyMsg(null)}
            className="text-gray-400 hover:text-gray-200 transition-colors ml-2 shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative bg-gray-700 rounded p-2 max-w-xs group"
            >
              {attachment.type?.startsWith("IMAGE") ? (
                <img
                  src={attachment.url}
                  alt="preview"
                  className="max-w-40 max-h-40 rounded"
                />
              ) : (
                <div className="text-xs text-gray-300 p-2">
                  📎 {attachment.type || "File"}
                </div>
              )}
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#40444b] rounded-lg flex items-center px-3.5 py-2.5 gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={uploadMediaPending}
        />
        <input
          ref={imageInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploadMediaPending}
        />

        <button
          onClick={handleAddAttachment}
          disabled={uploadMediaPending}
          className="text-gray-400 hover:text-gray-200 transition-colors shrink-0 disabled:opacity-50"
          title="Add attachment"
        >
          <Plus size={20} />
        </button>

        <input
          placeholder="Message #project-alpha"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCreateMessage();
            }
          }}
          disabled={createMessagePending}
          className="flex-1 bg-transparent border-none outline-none text-[#dcddde] placeholder-gray-500 text-sm disabled:opacity-50"
        />

        <button
          disabled={uploadMediaPending}
          className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          title="Send gift"
        >
          <Gift size={18} />
        </button>

        <button
          onClick={handleAddImage}
          disabled={uploadMediaPending}
          className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          title="Add image"
        >
          <Image size={18} />
        </button>
      </div>

      <p className="text-center mt-1.5 text-gray-600 text-xs">
        Type <strong className="text-gray-500">@Sparky</strong> to ask the AI
        assistant for help.
      </p>
    </div>
  );
};
