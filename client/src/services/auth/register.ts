import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types/response";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
interface RegisterProps {
  username: string;
  email: string;
  password: string;
}
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterProps) => {
      const res = await apiClient.post("/register", data);
      return res.data;
    },
    onSuccess: async (res) => {
      toast.success(res.message);
    },
    onError: async (err: AxiosError) => {
      const data = err.response?.data as ResponseMessage;
      toast.error(data.message);
    },
  });
};
