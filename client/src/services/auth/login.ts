import { useAuthUser } from "@/hooks/useAuthUser";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types/response";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  email: string;
  password: string;
}
export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: LoginProps) => {
      const res = await apiClient.post("/homepage", data);
      return res.data;
    },
    onSuccess: async (res) => {
      useAuthUser.setState({ access_token: res.access_token });
      useAuthUser.setState({ authUser: res });
      toast.success("Login successfully");
      navigate("/home");
    },
    onError: async (err: AxiosError) => {
      const data = err.response?.data as ResponseMessage;
      toast.success(data.message);
    },
  });
};
