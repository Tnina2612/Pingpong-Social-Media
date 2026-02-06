import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types/response";

interface RegisterProps {
  username: string;
  email: string;
  password: string;
}
export const useRegister = () => {
  return useMutation<ResponseMessage, AxiosError, RegisterProps>({
    mutationFn: async (data: RegisterProps): Promise<ResponseMessage> => {
      const res = await apiClient.post("/auth/register", data);
      return res.data as ResponseMessage;
    },
    onSuccess: async (res: ResponseMessage) => {
      toast.success(res.message);
    },
    onError: async (err: AxiosError) => {
      const data = err.response?.data as ResponseMessage;
      toast.error(data.message);
    },
  });
};
