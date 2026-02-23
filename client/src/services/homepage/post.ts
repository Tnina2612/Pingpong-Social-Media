import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { PostType, ResponseMessage } from "@/types";

interface CreatePostProps {
  content: string;
  mediaUrls?: string[];
}

export const useGetAllPosts = () => {
  return useQuery({
    queryKey: ["getallposts"],
    queryFn: async () => {
      const res = await apiClient.get("posts");
      return res.data as PostType[];
    },
  });
};

export const useGetPostById = (postId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getpostbyid", postId],
    queryFn: async () => {
      const res = await apiClient.get(`posts/${postId}`);
      return res.data as PostType;
    },
    enabled,
  });
};

export const useCreatePost = () => {
  return useMutation({
    mutationFn: async (data: CreatePostProps) => {
      const res = await apiClient.post("posts", data);
      return res.data as PostType;
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
