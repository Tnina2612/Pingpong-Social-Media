import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { CreateServerProps, ResponseMessage, ServerType } from "@/types";

export const useGetAllServer = () => {
  return useQuery({
    queryKey: ["getallservers"],
    queryFn: async () => {
      const res = await apiClient.get("servers");
      return res.data as ServerType[];
    },
  });
};

export const useGetServerById = (serverId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["getserverbyid", serverId],
    queryFn: async () => {
      const res = await apiClient.get(`servers/${serverId}`);
      return res.data as ServerType;
    },
    enabled,
  });
};

export const useCreateServer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServerProps) => {
      const res = await apiClient.post("servers", data);
      return res.data as ServerType;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["getallservers"],
      });
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
