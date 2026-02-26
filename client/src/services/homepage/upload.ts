import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types";
import type { UploadType } from "@/types/upload";

interface DeleteMediaProps {
  publicId: string;
}

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post("upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data as UploadType;
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};

export const useDeleteMedia = () => {
  return useMutation({
    mutationFn: async (data: DeleteMediaProps) => {
      const res = await apiClient.delete("upload", { data });
      return res.data;
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
