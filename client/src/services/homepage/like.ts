import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

interface LikeProps {
  targetId: string;
  type: "POST" | "COMMENT";
}
export const useLike = () => {
  return useMutation({
    mutationFn: async (data: LikeProps) => {
      const res = await apiClient.post("likes", data);
      return res.data;
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
