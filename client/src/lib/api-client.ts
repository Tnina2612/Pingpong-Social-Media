import axios from "axios";
import { useAuthUser } from "@/hooks";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
});

let isRefreshing = false;

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

let refreshSubscribers: RefreshSubscriber[] = [];

function subscribeTokenRefresh(
  resolve: (token: string) => void,
  reject: (error: any) => void,
) {
  refreshSubscribers.push({ resolve, reject });
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => {
    resolve(token);
  });
  refreshSubscribers = [];
}

function onRefreshFailed(error: any) {
  refreshSubscribers.forEach(({ reject }) => {
    reject(error);
  });
  refreshSubscribers = [];
}

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthUser.getState().accessToken;
    if (accessToken) {
      config.headers.setAuthorization(`Bearer ${accessToken}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            (error: any) => {
              reject(error);
            },
          );
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = res.data.accessToken;

        const authState = useAuthUser.getState();
        authState.setAuthUser(authState.user!, newAccessToken);

        onRefreshed(newAccessToken);
        originalRequest.headers.setAuthorization(`Bearer ${newAccessToken}`);

        return apiClient(originalRequest);
      } catch (err) {
        onRefreshFailed(err);
        useAuthUser.getState().clearAuth();
        window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
