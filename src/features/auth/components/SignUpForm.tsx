import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { Label } from "@/shared/components/ui/Label";
import { InputField } from "@/shared/components/ui/InputField";
import Button from "@/shared/components/ui/Button";
import { extractErrorMessage } from "@/shared/api/errors";
import { useAuth } from "../hooks/useAuth";

interface SignUpFormData {
  fname: string;
  lname: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

const INITIAL: SignUpFormData = {
  fname: "",
  lname: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
};

export function SignUpForm() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, successMessage, clearSuccessMessage } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>(INITIAL);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (
      !formData.fname ||
      !formData.lname ||
      !formData.username ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password
    ) {
      setLocalError("All fields are required");
      return;
    }

    try {
      const fullName = `${formData.fname} ${formData.lname}`;
      await register(formData.email, formData.password, fullName, formData.username, formData.phoneNumber);
      setTimeout(() => {
        clearSuccessMessage();
        navigate("/signin", { replace: true });
      }, 2000);
    } catch (err) {
      setLocalError(extractErrorMessage(err) ?? "Registration failed");
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-2xl dark:bg-gray-800 p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crear Cuenta</h1>
            <p className="text-gray-600 dark:text-gray-400">Regístrate para comenzar</p>
          </div>

          {displayError && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30">
              {displayError}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900/30">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SignUpField label="Nombre" name="fname" value={formData.fname} onChange={handleInputChange} disabled={isLoading} />
              <SignUpField label="Apellido" name="lname" value={formData.lname} onChange={handleInputChange} disabled={isLoading} />
            </div>

            <SignUpField label="Usuario" name="username" value={formData.username} onChange={handleInputChange} disabled={isLoading} />
            <SignUpField label="Correo electrónico" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={isLoading} />
            <SignUpField label="Teléfono" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} disabled={isLoading} />

            <div>
              <Label className="text-gray-700 dark:text-gray-200">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <InputField
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Registrando...
                </span>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/signin" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SignUpFieldProps {
  label: string;
  name: keyof SignUpFormData;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

function SignUpField({ label, name, type = "text", value, onChange, disabled }: SignUpFieldProps) {
  return (
    <div>
      <Label className="text-gray-700 dark:text-gray-200">
        {label} <span className="text-red-500">*</span>
      </Label>
      <InputField
        type={type}
        id={name}
        name={name}
        placeholder={`Ingresa tu ${label.toLowerCase()}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
      />
    </div>
  );
}
