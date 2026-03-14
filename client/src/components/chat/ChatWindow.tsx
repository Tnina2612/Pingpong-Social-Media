import type { Channel } from "@/types";
import { ChannelHeader } from "./ChannelHeader";

import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useGetMessages } from "@/services/chat";
import { useEffect, useRef } from "react";
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
      bottomRef.current?.scrollIntoView();
      firstLoad.current = false;
    }
  }, [messages.length]);

  useEffect(() => {
    firstLoad.current = true;
  }, [channel?.id]);
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
          />
        ))}

        {/* <AISummaryCard /> */}
        <div ref={bottomRef} />
      </div>

      <MessageInput channelId={channel?.id || ""} />
    </div>
  );
};
