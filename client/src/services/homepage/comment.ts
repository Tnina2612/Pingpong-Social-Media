import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { CommentType, ResponseMessage } from "@/types";

interface CreateCommentProps {
  postId: string;
  parentId?: string;
  content: string;
  mediaUrls?: string[];
}

export const useGetCommentsByPost = (postId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getcommentsbypost", postId],
    queryFn: async () => {
      const res = await apiClient.get(`comments/post/${postId}`);
      return res.data as CommentType[];
    },
    enabled,
  });
};

export const useGetReplies = (commentId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getreplies", commentId],
    queryFn: async () => {
      const res = await apiClient.get(`comments/${commentId}/replies`);
      return res.data as CommentType[];
    },
    enabled,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCommentProps) => {
      const res = await apiClient.post("comments", data);
      return res.data as CommentType;
    },
    onSuccess: async (_res, variables) => {
      if (variables.parentId) {
        // reply: invalidate replies from parent
        await queryClient.invalidateQueries({
          queryKey: ["getreplies", variables.parentId],
        });
      } else {
        // root comment: invalidate comments from post
        await queryClient.invalidateQueries({
          queryKey: ["getcommentsbypost", variables.postId],
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
