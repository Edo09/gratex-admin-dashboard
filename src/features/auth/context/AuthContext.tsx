import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { authApi, type AuthUser } from "../api/auth";
import { authStorage } from "@/shared/api/storage";
import { setUnauthorizedHandler } from "@/shared/api/client";
import { extractErrorMessage } from "@/shared/api/errors";

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  successMessage: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, username: string, phoneNumber: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedToken = authStorage.getToken();
      const savedUserJson = authStorage.getUserJson();
      if (savedToken && savedUserJson) {
        setTokenState(savedToken);
        setUser(JSON.parse(savedUserJson));
      }
    } catch {
      authStorage.clearAll();
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    authStorage.setToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // proceed with local logout even if remote call fails
    } finally {
      setUser(null);
      setTokenState(null);
      setError(null);
      authStorage.clearAll();
    }
  }, []);

  // Register a 401 handler so apiClient can trigger refresh / logout.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      const refresh = authStorage.getRefreshToken();
      if (refresh) {
        try {
          await authApi.refreshToken(refresh);
          return;
        } catch {
          // fall through to logout
        }
      }
      await logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authApi.login(emailOrUsername, password);
        if (!response.success && !response.status) {
          throw new Error(response.message || response.error || "Login failed");
        }
        const { token: newToken, user: userData } = response.data!;
        setToken(newToken);
        setUser(userData);
        authStorage.setUserJson(JSON.stringify(userData));
      } catch (err) {
        setError(extractErrorMessage(err) ?? "An error occurred during login");
      } finally {
        setIsLoading(false);
      }
    },
    [setToken],
  );

  const register = useCallback(
    async (email: string, password: string, name: string, username: string, phoneNumber: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authApi.register(email, password, name, username, phoneNumber);
        if (!response.success) {
          throw new Error(response.message || response.error || "Registration failed");
        }
        setSuccessMessage("Usuario registrado");
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err) {
        const message = extractErrorMessage(err) ?? "An error occurred during registration";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);
  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  const isAuthenticated = token !== null && user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isInitializing,
        error,
        successMessage,
        login,
        logout,
        register,
        setUser,
        setToken,
        clearError,
        clearSuccessMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
