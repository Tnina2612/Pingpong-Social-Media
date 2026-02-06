import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/hooks/useAuthUser";
import { apiClient } from "@/lib";
import type { User } from "@/types";
import type { ResponseMessage } from "@/types/response";

interface LoginProps {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  accessToken: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: LoginProps): Promise<LoginResponse> => {
      const res = await apiClient.post("/auth/login", data);
      return res.data;
    },
    onSuccess: async (res: LoginResponse) => {
      const { accessToken, user } = res;
      useAuthUser.setState({
        user: user as User,
        accessToken,
      });
      toast.success("Login successfully");
      navigate("/homepage");
    },
    onError: async (err: AxiosError) => {
      const data = err.response?.data as ResponseMessage;
      toast.error(data.message);
    },
  });
};
