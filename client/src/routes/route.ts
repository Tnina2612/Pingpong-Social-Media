import { createBrowserRouter } from "react-router-dom";
import { ErrorPage } from "../errors";
export const Routes = createBrowserRouter([
  {
    path: "",
    lazy: async () => {
      const { default: App } = await import("../App");
      return { Component: App, ErrorBoundary: ErrorPage };
    },
  },
]);
