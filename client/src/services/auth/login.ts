import { useAuthUser } from "@/hooks/useAuthUser";
import { apiClient } from "@/lib";
import type { User } from "@/types";
import type { ResponseMessage } from "@/types/response";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  email: string;
  password: string;
}
interface LoginResponse {
  id: string;
  username: string;
  avatar?: string | null;
  access_token: string;
}
export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: LoginProps) => {
      const res = await apiClient.post("/homepage", data);
      return res.data;
    },
    onSuccess: async (res: LoginResponse) => {
      const { access_token, ...userData } = res;
      useAuthUser.setState({
        access_token,
        authUser: userData as User,
      });
      toast.success("Login successfully");
      navigate("/home");
    },
    onError: async (err: AxiosError) => {
      const data = err.response?.data as ResponseMessage;
      toast.success(data.message);
    },
  });
};
