import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types";

export const useLike = () => {
  return useMutation({
    mutationFn: async (targetId: string) => {
      const res = await apiClient.post("likes", { targetId });
      return res.data;
    },
    onSuccess: async (res) => {
      toast.success(res.message);
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
