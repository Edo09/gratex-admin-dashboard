import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function ExternalCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();

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
        console.log("✅ Token stored:", token.substring(0, 20) + "...");

        // Decode and store user if provided
        if (userEncoded) {
          try {
            const userJson = atob(userEncoded); // Decode base64
            const user = JSON.parse(userJson);
            localStorage.setItem("authUser", JSON.stringify(user));
            console.log("✅ User data stored:", user.email);
          } catch (err) {
            console.warn("Could not decode user data:", err);
          }
        }

        // Update auth context
        setToken(token);

        // Redirect to dashboard
        console.log("✅ Redirecting to dashboard...");
        navigate("/", { replace: true });
      } catch (error) {
        console.error("❌ Callback processing error:", error);
        navigate("/signin", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Logging you in...</p>
      </div>
    </div>
  );
}
