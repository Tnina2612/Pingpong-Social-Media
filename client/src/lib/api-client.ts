import { useAuthUser } from "@/hooks";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
});

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

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          "http://localhost:3000/api/auth/refresh",
          {},
          { withCredentials: true },
        );

        const newAccessToken = res.data.accessToken;

        useAuthUser
          .getState()
          .setAuthUser(useAuthUser.getState().user!, newAccessToken);

        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
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
