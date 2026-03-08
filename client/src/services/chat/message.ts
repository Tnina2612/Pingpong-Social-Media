import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { CreateMessageProps, MessageType, ResponseMessage } from "@/types";

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMessageProps) => {
      const res = await apiClient.post("posts", data);
      return res.data as MessageType;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["getallposts"],
      });
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
