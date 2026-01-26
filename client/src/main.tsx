import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes/route";
import "./index.css";

const client = new QueryClient();
const router = appRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
