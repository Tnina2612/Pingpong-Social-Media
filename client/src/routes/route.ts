import { createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "../errors/error-page";

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
    path: "homepage",
    lazy: async () => {
      const { HomePage } = await import("../app/private/homepage");
      return { Component: HomePage };
    },
    ErrorBoundary: ErrorPage,
  },
]);
