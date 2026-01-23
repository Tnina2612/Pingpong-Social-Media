import { createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "../errors/error-page";
export const Routes = createBrowserRouter([
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
]);
