import { createBrowserRouter, redirect } from "react-router-dom";
import { useAuthUser } from "@/hooks";
import { ErrorPage } from "../errors/error-page";

const requireAuthLoader = () => {
  const { accessToken } = useAuthUser.getState();

  return accessToken ? null : redirect("/login");
};

const requireOnboardingState = (
  shouldBeCompleted: boolean,
  redirectTo: string,
) => {
  const authRedirect = requireAuthLoader();
  if (authRedirect) return authRedirect;

  const { user } = useAuthUser.getState();

  if (user?.hasCompletedOnboarding === shouldBeCompleted) {
    return redirect(redirectTo);
  }

  return null;
};

const onboardingLoader = () => requireOnboardingState(true, "/homepage");

const homepageLoader = () => requireOnboardingState(false, "/onboarding");

const emailLoader = (path: string) => {
  const { temporaryEmail } = useAuthUser.getState();
  if (!temporaryEmail) {
    return redirect(path);
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
    path: "reset-password",
    lazy: async () => {
      const { ResetPassword } = await import("../app/public/reset-password");
      return { Component: ResetPassword };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    loader: homepageLoader,
    path: "homepage",
    lazy: async () => {
      const { HomeLayout } = await import("../app/private/homelayout");
      return { Component: HomeLayout };
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { HomePage } = await import("../app/private/homepage");
          return { Component: HomePage };
        },
        ErrorBoundary: ErrorPage,
      },
      {
        path: "message",
        lazy: async () => {
          const { ChatMessage } = await import("../app/private/chat-message");
          return { Component: ChatMessage };
        },
        ErrorBoundary: ErrorPage,
      },
    ],
    ErrorBoundary: ErrorPage,
  },
  {
    loader: onboardingLoader,
    path: "onboarding",
    lazy: async () => {
      const { OnboardingPage } = await import("../app/private/onboarding-page");
      return { Component: OnboardingPage };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    loader: () => emailLoader("/signup"),
    path: "verify-otp",
    lazy: async () => {
      const { VerifyOtp } = await import("../app/private/verify-otp");
      return { Component: VerifyOtp };
    },
    ErrorBoundary: ErrorPage,
  },
  {
    loader: () => emailLoader("/reset-password"),
    path: "reset-password-otp",
    lazy: async () => {
      const { ResetPasswordOTP } = await import(
        "../app/private/reset-password-otp"
      );
      return { Component: ResetPasswordOTP };
    },
    ErrorBoundary: ErrorPage,
  },
]);
