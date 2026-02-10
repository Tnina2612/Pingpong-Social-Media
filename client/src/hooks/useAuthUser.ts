import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

type AuthUser = {
  temporaryEmail: string | null;
  temporaryPassword: string | null;
  user: User | null;
  accessToken: string | null;
  setTemporaryEmail: (email: string | null) => void;
  setTemporaryPassword: (password: string | null) => void;
  clearTemporaryCredentials: () => void;
  setAuthUser: (user: User, accessToken: string) => void;
  clearAuth: () => void;
};

export const useAuthUser = create<AuthUser>()(
  persist<AuthUser>(
    (set) => ({
      temporaryEmail: null,
      temporaryPassword: null,
      user: null,
      accessToken: null,
      setTemporaryEmail: (email) => set({ temporaryEmail: email }),
      setTemporaryPassword: (password) => set({ temporaryPassword: password }),
      clearTemporaryCredentials: () =>
        set({ temporaryEmail: null, temporaryPassword: null }),
      setAuthUser: (user, accessToken) =>
        set({
          user,
          accessToken,
          temporaryEmail: null,
          temporaryPassword: null,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          temporaryEmail: null,
          temporaryPassword: null,
        }),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) =>
        ({
          user: state.user,
          accessToken: state.accessToken,
        }) as AuthUser,
    },
  ),
);
