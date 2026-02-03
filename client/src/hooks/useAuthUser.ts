import type { User } from "@/types";
import { create } from "zustand";
type AuthUser = {
  authUser: User | null;
  access_token: string | null;
};
export const useAuthUser = create<AuthUser>(() => ({
  authUser: null,
  access_token: null,
}));
