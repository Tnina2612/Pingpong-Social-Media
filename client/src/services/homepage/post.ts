import { apiClient } from "@/lib";
import { useQuery } from "@tanstack/react-query";

export const useGetAllPosts = () => {
  return useQuery({
    queryKey: ["getallposts"],
    queryFn: async () => {
      const res = await apiClient.get("posts");
      return res.data;
    },
  });
};
