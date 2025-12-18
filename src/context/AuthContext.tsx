"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { authApi } from "../services/api";
import type { ApiResponse } from "../services/api";

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, username: string, phoneNumber: string) => Promise<void>;
  setToken: (token: string) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem("authToken");
        const savedUser = localStorage.getItem("authUser");

        if (savedToken && savedUser) {
          setTokenState(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem("authToken", newToken);
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.login(emailOrUsername, password) as ApiResponse<{
          token: string;
          user: User;
        }>;

        if (!response.success) {
          throw new Error(
            response.message || response.error || "Login failed"
          );
        }

        const { token: newToken, user: userData } = response.data!;

        setToken(newToken);
        setUser(userData);
        localStorage.setItem("authUser", JSON.stringify(userData));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred during login";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setToken]
  );

  const register = useCallback(
    async (email: string, password: string, name: string, username: string, phoneNumber: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.register(email, password, name, username, phoneNumber) as ApiResponse<{
          token: string;
          user: User;
        }>;

        if (!response.success) {
          throw new Error(
            response.message || response.error || "Registration failed"
          );
        }

        // Set success message and clear it after 5 seconds
        setSuccessMessage("Usuario registrado");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An error occurred during registration";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      // Call backend to sign out session
      await authApi.logout();
      console.log("✅ Logout successful");
    } catch (err) {
      console.error("❌ Logout error:", err);
      // Continue with logout even if API call fails
    } finally {
      // Clear local auth state
      setUser(null);
      setTokenState(null);
      setError(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const isAuthenticated = token !== null && user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        successMessage,
        login,
        logout,
        register,
        setToken,
        clearError,
        clearSuccessMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
