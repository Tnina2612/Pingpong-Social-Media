import type { Channel } from "@/types";
import { ChannelHeader } from "./ChannelHeader";

import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useGetMessages } from "@/services/chat";
import { useEffect, useRef } from "react";
import { useSocketStore } from "@/hooks/useSocketStore";

import { useQueryClient } from "@tanstack/react-query";
interface Props {
  channel?: Channel | null;
}
export const ChatWindow = ({ channel }: Props) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetMessages(channel?.id || "");
  const messages =
    data?.pages
      ?.slice()
      .reverse()
      .flatMap((page) => page) ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  const loadMore = async () => {
    const container = containerRef.current;
    if (!container) return;
    const prevHeight = container.scrollHeight;
    await fetchNextPage();

    requestAnimationFrame(() => {
      const newHeight = container.scrollHeight;
      container.scrollTop = newHeight - prevHeight;
    });
  };

  const isNearBottom = () => {
    const container = containerRef.current;
    if (!container) return false;
    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
        loadMore();
      }
    };
    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (firstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      firstLoad.current = false;
    }
  }, [messages.length]);

  useEffect(() => {
    firstLoad.current = true;
  }, [channel?.id]);

  useEffect(() => {
    if (!socket || !channel?.id) return;

    socket.emit("join-channel", { channelId: channel.id });

    return () => {
      socket.emit("leave-channel", { channelId: channel.id });
    };
  }, [socket, channel?.id]);

  useEffect(() => {
    if (!socket || !channel?.id) return;

    const handleNewMessage = (msg: any) => {
      const shouldScroll = isNearBottom();
      queryClient.setQueryData(["messages", channel.id], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) =>
            index === oldData.pages.length - 1 ? [...page, msg] : page,
          ),
        };
      });

      if (shouldScroll) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    };
    socket.on("send-message", handleNewMessage);
    return () => {
      socket.off("send-message", handleNewMessage);
    };
  }, [socket, channel?.id]);

  useEffect(() => {
    if (!socket || !channel?.id) return;

    const handleUpdate = (updatedMsg: any) => {
      queryClient.setQueryData(["messages", channel.id], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((msg: any) =>
              msg.id === updatedMsg.id ? updatedMsg : msg,
            ),
          ),
        };
      });
    };

    socket.on("update-message", handleUpdate);

    return () => {
      socket.off("update-message", handleUpdate);
    };
  }, [socket, channel?.id]);

  useEffect(() => {
    if (!socket || !channel?.id) return;

    const handleDelete = ({ id }: { id: string }) => {
      queryClient.setQueryData(["messages", channel.id], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((msg: any) =>
              msg.id === id ? { ...msg, deleted: true } : msg,
            ),
          ),
        };
      });
    };

    socket.on("delete-message", handleDelete);

    return () => {
      socket.off("delete-message", handleDelete);
    };
  }, [socket, channel?.id]);
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <ChannelHeader
        channel={channel?.name || "Not found channel"}
        description="Design discussion for the new dashboard"
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-2" ref={containerRef}>
        {/* <DateDivider date="Today, October 24" /> */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            author={msg.sender}
            content={msg.content || ""}
            time="4AM"
            replyto={msg.replyto}
            attachments={msg.attachments}
          />
        ))}

        {/* <AISummaryCard /> */}
        <div ref={bottomRef} />
      </div>

      <MessageInput channelId={channel?.id || ""} />
    </div>
  );
};
