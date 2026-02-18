import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types";

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
