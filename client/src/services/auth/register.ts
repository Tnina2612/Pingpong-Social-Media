import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types/response";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "@/hooks";

interface RegisterProps {
  username: string;
  email: string;
  password: string;
}
interface VerifyOtpProps {
  email: string;
  otp: string;
}

export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation<ResponseMessage, AxiosError, RegisterProps>({
    mutationFn: async (data: RegisterProps): Promise<ResponseMessage> => {
      const res = await apiClient.post("/auth/register", data);
      return res.data as ResponseMessage;
    },
    onSuccess: async (res: ResponseMessage, variables) => {
      toast.success(res.message);
      useAuthUser.setState({ temporaryEmail: variables.email });
      navigate("/verify-otp");
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};

export const useVerifyOtp = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (data: VerifyOtpProps) => {
      const res = await apiClient.post("/auth/verify-otp", data);
      return res.data as ResponseMessage;
    },
    onSuccess: async (res: ResponseMessage) => {
      toast.success(res.message);
      navigate("/login");
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
export const useResendOtp = () => {
  const email = useAuthUser.getState().temporaryEmail;
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/auth/resend-otp", { email: email });
      return res.data;
    },
    onSuccess: async (res) => {
      toast.success(res.message);
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
