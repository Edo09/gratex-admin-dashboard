const AUTH_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_USER_KEY = "authUser";

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(AUTH_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(AUTH_TOKEN_KEY),

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),

  getUserJson: (): string | null => localStorage.getItem(AUTH_USER_KEY),
  setUserJson: (json: string) => localStorage.setItem(AUTH_USER_KEY, json),
  clearUserJson: () => localStorage.removeItem(AUTH_USER_KEY),

  clearAll: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },
};
