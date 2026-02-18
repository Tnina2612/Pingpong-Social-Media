import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib";
import type { PostType } from "@/types";

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
