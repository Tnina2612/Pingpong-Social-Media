import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { apiClient } from "@/lib";
import type { ResponseMessage } from "@/types";
import type { OnboardInterestProps } from "@/types/interests";

type OnboardInterestsResponse = {
  status: "success";
  message: string;
};

export const useOnboardInterests = () => {
  return useMutation<
    OnboardInterestsResponse,
    AxiosError,
    OnboardInterestProps
  >({
    mutationFn: async (data: OnboardInterestProps) => {
      const res = await apiClient.post("users/onboarding/interests", data);
      return res.data;
    },
    onError: async (err: AxiosError) => {
      const errorMessage =
        (err.response?.data as ResponseMessage)?.message || err.message;
      toast.error(errorMessage);
    },
  });
};
