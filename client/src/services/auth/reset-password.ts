import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/hooks";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types/response";

interface RequestResetProps {
  email: string;
}

interface ResetPasswordProps {
  email: string;
  newPassword: string;
  otp: string;
}

export const useRequestReset = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: RequestResetProps) => {
      const res = await apiClient.post("/auth/request-reset-password", data);
      return res.data;
    },
    onSuccess: async (res, variables) => {
      useAuthUser.getState().setTemporaryEmail(variables.email);
      toast.success(res.message);
      navigate("/reset-password-otp");
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: ResetPasswordProps) => {
      const res = await apiClient.post("/auth/reset-password", data);
      return res.data;
    },
    onSuccess: async (res) => {
      toast.success(res.message);
      useAuthUser.getState().clearTemporaryCredentials();
      navigate("/login");
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
