import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppWrapper } from "@/shared/components/layout/PageMeta";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { AuthProvider } from "@/features/auth/context/AuthContext";

const queryClient = new QueryClient();

/** Top-level application providers (Helmet, React Query, theme, auth). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppWrapper>{children}</AppWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
