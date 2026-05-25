import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { FullPageSpinner } from "@/shared/components/ui/Spinner";

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
}
