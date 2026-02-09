import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

type AuthUser = {
  temporaryEmail: string | null;
  user: User | null;
  accessToken: string | null;
};

export const useAuthUser = create<AuthUser>()(
  persist<AuthUser>(
    () => ({
      temporaryEmail: null,
      user: null,
      accessToken: null,
    }),
    {
      name: "auth-storage", // localStorage key
    },
  ),
);
