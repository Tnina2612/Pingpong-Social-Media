import { create } from "zustand";
import type { User } from "@/types";

type AuthUser = {
  user: User | null;
  accessToken: string | null;
};

export const useAuthUser = create<AuthUser>(() => ({
  user: null,
  accessToken: null,
}));
