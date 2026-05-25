import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authStorage } from "@/shared/api/storage";

export default function ExternalCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken, isAuthenticated } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userEncoded = searchParams.get("user");

    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    authStorage.setToken(token);

    let parsedUser: { id: number; email: string; username: string; name: string } | null = null;
    if (userEncoded) {
      try {
        parsedUser = JSON.parse(atob(userEncoded));
      } catch {
        parsedUser = null;
      }
      if (parsedUser) authStorage.setUserJson(JSON.stringify(parsedUser));
    }

    setToken(token);
    setUser(parsedUser);
  }, [searchParams, navigate, setToken, setUser]);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Logging you in...</p>
      </div>
    </div>
  );
}
