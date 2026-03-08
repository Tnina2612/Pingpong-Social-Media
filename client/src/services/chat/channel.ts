import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ChannelType, CreateChannelProps, ResponseMessage } from "@/types";

export const useGetAllChannel = () => {
  return useQuery({
    queryKey: ["getallchannels"],
    queryFn: async () => {
      const res = await apiClient.get("Channels");
      return res.data as ChannelType[];
    },
  });
};

export const useGetChannelById = (channelId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getchannelbyid", channelId],
    queryFn: async () => {
      const res = await apiClient.get(`channels/${channelId}`);
      return res.data as ChannelType;
    },
    enabled,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateChannelProps) => {
      const res = await apiClient.post("Channels", data);
      return res.data as ChannelType;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["getallchannels"],
      });
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
