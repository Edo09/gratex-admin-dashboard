import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  name: string;
  role?: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

const TENANT_ID = Number(import.meta.env.VITE_TENANT_ID);

export const authApi = {
  login: (emailOrUsername: string, password: string) =>
    apiClient.post<LoginResponseData>(
      "/auth/login",
      { emailOrUsername, password, tenant_id: TENANT_ID },
      { skipAuth: true },
    ),

  register: (email: string, password: string, name: string, username: string, phoneNumber: string) =>
    apiClient.post<LoginResponseData>(
      "/auth/register",
      { email, password, name, username, phoneNumber },
      { skipAuth: true },
    ),

  exchangeToken: (tempToken: string) =>
    apiClient.post<LoginResponseData>("/auth/exchange-token", { tempToken }, { skipAuth: true }),

  refreshToken: (refreshToken: string): Promise<ApiResponse<LoginResponseData>> =>
    apiClient.post<LoginResponseData>("/auth/refresh", { refreshToken }, { skipAuth: true }),

  logout: () => apiClient.post<void>("/auth/signout", {}),
};
