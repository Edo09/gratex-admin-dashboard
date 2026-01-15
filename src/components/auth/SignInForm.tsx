import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {  EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, successMessage, clearSuccessMessage } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!formData.emailOrUsername || !formData.password) {
      setLocalError("Email/Username and password are required");
      return;
    }

    try {
      console.log("🔐 Attempting login with:", formData.emailOrUsername);
      await login(formData.emailOrUsername, formData.password);
      console.log("✅ Login successful, redirecting...");
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      console.error("❌ Login error:", message);
      setLocalError(message);
    }
  };

  const displayError = localError || error;
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-2xl bg-white shadow-2xl dark:bg-gray-800 p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30">
              {displayError}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900/30 flex justify-between items-center">
              <span>{successMessage}</span>
              <button
                onClick={clearSuccessMessage}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <Label className="text-gray-700 dark:text-gray-200">
                Email or Username <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="emailOrUsername"
                placeholder="Enter your email or username"
                value={formData.emailOrUsername}
                onChange={handleInputChange}
                disabled={isLoading}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-700 dark:text-gray-200">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Link
                  to="/reset-password"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="mt-0 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeIcon className="size-5" />
                  ) : (
                    <EyeCloseIcon className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-sm font-normal text-gray-700 dark:text-gray-300">
                Keep me logged in
              </span>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-700 dark:text-gray-300">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
