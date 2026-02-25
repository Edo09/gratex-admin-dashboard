import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function ExternalCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL params (any token format)
        const token = searchParams.get("token");
        const userEncoded = searchParams.get("user");

        if (!token) {
          console.error("No token provided");
          navigate("/signin", { replace: true });
          return;
        }

        // Store token (works with JWT, bearer tokens, or any token format)
        localStorage.setItem("authToken", token);

        // Decode and store user if provided
        if (userEncoded) {
          try {
            const userJson = atob(userEncoded); // Decode base64
            const user = JSON.parse(userJson);
            localStorage.setItem("authUser", JSON.stringify(user));
          } catch {
            // Could not decode user data
          }
        }

        // Update auth context
        setToken(token);
        setUser(userEncoded ? JSON.parse(atob(userEncoded)) : null);
        // Redirect will be handled in a separate useEffect when isAuthenticated updates

      } catch (error) {
        console.error("❌ Callback processing error:", error);
        navigate("/signin", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, setUser]);

  // Redirect after authentication state updates
  useEffect(() => {
    console.log("Auth state updated. isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
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
