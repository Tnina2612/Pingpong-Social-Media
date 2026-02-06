import { createBrowserRouter, redirect } from "react-router-dom";
import { useAuthUser } from "@/hooks";
import { ErrorPage } from "../errors/error-page";

const authLoader = () => {
  const { accessToken } = useAuthUser.getState();
  if (!accessToken) {
    return redirect("/login");
  }
  return null;
};

export const appRouter = createBrowserRouter([
  {
    path: "",
    lazy: async () => {
      const { default: App } = await import("../App");
      return { Component: App };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    path: "login",
    lazy: async () => {
      const { Login } = await import("../app");
      return { Component: Login };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    path: "signup",
    lazy: async () => {
      const { SignUp } = await import("../app");
      return { Component: SignUp };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    path: "verify-otp",
    lazy: async () => {
      const { VerifyOtp } = await import("../app");
      return { Component: VerifyOtp };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    path: "reset-password",
    lazy: async () => {
      const { ResetPassword } = await import("../app");
      return { Component: ResetPassword };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    loader: authLoader,
    children: [
      {
        path: "homepage",
        lazy: async () => {
          const { HomePage } = await import("../app");
          return { Component: HomePage };
        },
        ErrorBoundary: ErrorPage,
      },
    ],
  },
]);
