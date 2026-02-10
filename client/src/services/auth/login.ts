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
  return useMutation<LoginResponse, AxiosError, LoginProps>({
    mutationFn: async (data: LoginProps) => {
      const res = await apiClient.post("/auth/login", data);
      return res.data;
    },
    onSuccess: async (res) => {
      const { accessToken, user } = res;
      useAuthUser.getState().setAuthUser(user as User, accessToken);
      toast.success("Login successfully");
      navigate("/homepage");
    },
    onError: async (err, variables) => {
      const data = err.response?.data as ResponseMessage;
      if (
        err.response?.status === 403 &&
        data?.message === "Email is not activated"
      ) {
        useAuthUser.getState().setTemporaryEmail(variables.email);
        navigate("/verify-otp");
        return;
      }
      const errorMessage =
        data?.message || err.message || "Login failed. Please try again.";
      toast.error(errorMessage);
    },
  });
};
