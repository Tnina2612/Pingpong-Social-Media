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
      const { Login } = await import("../app/public/login");
      return { Component: Login };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    path: "signup",
    lazy: async () => {
      const { SignUp } = await import("../app/public/signup");
      return { Component: SignUp };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    loader: authLoader,
    children: [
      {
        path: "homepage",
        lazy: async () => {
          const { HomePage } = await import("../app/private/homepage");
          return { Component: HomePage };
        },
        ErrorBoundary: ErrorPage,
      },
    ],
  },
]);
