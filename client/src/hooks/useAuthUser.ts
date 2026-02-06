import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

type AuthUser = {
  user: User | null;
  accessToken: string | null;
};

export const useAuthUser = create<AuthUser>()(
  persist<AuthUser>(
    () => ({
      user: null,
      accessToken: null,
    }),
    {
      name: "auth-storage", // localStorage key
    },
  ),
);
