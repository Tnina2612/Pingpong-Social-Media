import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { Channel, CreateChannelProps, ResponseMessage } from "@/types";

export const useGetAllChannel = (serverId: string) => {
  return useQuery({
    queryKey: ["getallchannels", serverId],
    queryFn: async () => {
      const res = await apiClient.get(`channels/${serverId}`);
      return res.data as Channel[];
    },
  });
};

export const useGetChannelById = (channelId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getchannelbyid", channelId],
    queryFn: async () => {
      const res = await apiClient.get(`channels/${channelId}`);
      return res.data as Channel;
    },
    enabled,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateChannelProps) => {
      const res = await apiClient.post("channels", data);
      return res.data as Channel;
    },
    onSuccess: async (data, variable) => {
      await queryClient.invalidateQueries({
        queryKey: ["getallchannels", variable.serverId],
      });
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
