import type { PostData } from "@/components/homepage";
import { apiClient } from "@/lib";
import { useQuery } from "@tanstack/react-query";

export const useGetAllPosts = () => {
  return useQuery({
    queryKey: ["getallposts"],
    queryFn: async () => {
      const res = await apiClient.get("posts");
      return res.data as PostData[];
    },
  });
};

export const useGetPostById = (postId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getpostbyid", postId],
    queryFn: async () => {
      const res = await apiClient.get(`posts/${postId}`);
      return res.data as PostData;
    },
    enabled,
  });
};
