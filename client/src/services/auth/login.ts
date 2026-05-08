import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSocketStore } from "@/hooks/useSocketStore";
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
    hasCompletedOnboarding?: boolean;
  };
  accessToken: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const connect = useSocketStore((s) => s.connect);
  return useMutation<LoginResponse, AxiosError, LoginProps>({
    mutationFn: async (data: LoginProps) => {
      const res = await apiClient.post("/auth/login", data);
      return res.data;
    },
    onSuccess: async (res) => {
      const { accessToken, user } = res;
      const userWithOnboardingState: User = {
        ...user,
        hasCompletedOnboarding: user.hasCompletedOnboarding ?? true,
      };

      useAuthUser.getState().setAuthUser(userWithOnboardingState, accessToken);
      toast.success("Login successfully");
      connect(accessToken);
      navigate(
        userWithOnboardingState.hasCompletedOnboarding
          ? "/homepage"
          : "/onboarding",
      );
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
