import { apiClient } from "@/lib";
import type { Comment, ResponseMessage } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

export const useGetCommentById = (postId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await apiClient.get(`comments/post/${postId}`);
      return res.data as Comment[];
    },
    enabled,
  });
};

interface CreateCommentProps {
  postId: string;
  parentId?: string;
  content: string;
  mediaUrls?: string[];
}
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCommentProps) => {
      const res = await apiClient.post("comments", data);
      return res.data as Comment;
    },
    onSuccess: async (res, variables) => {
      if (variables.parentId) {
        // Nếu là reply → invalidate replies của parent
        await queryClient.invalidateQueries({
          queryKey: ["replies", variables.parentId],
        });
      } else {
        // Nếu là root comment
        await queryClient.invalidateQueries({
          queryKey: ["comments", variables.postId],
        });
      }
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};

export const useGetReplies = (commentId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["replies", commentId],
    queryFn: async () => {
      const res = await apiClient.get(`comments/${commentId}/replies`);
      return res.data as Comment[];
    },
    enabled,
  });
};
