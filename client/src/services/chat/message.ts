import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib";
import type { CreateMessageData, Message } from "@/types/message";

export const useGetMessages = (channelId: string) => {
  return useInfiniteQuery<Message[]>({
    queryKey: ["getmessages", channelId],
    enabled: !!channelId,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get(`messages/${channelId}`, {
        params: pageParam ? { cursor: pageParam } : {},
      });

      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 20) return undefined;
      return lastPage[0]?.id;
    },
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMessageData) => {
      const res = await apiClient.post("messages", data);
      return res.data;
    },
    onSuccess: (_message, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["getmessages", variables.channelId],
      });
    },
  });
};
