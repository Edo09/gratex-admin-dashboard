import { PageMeta } from "@/shared/components/layout/PageMeta";
import { FloatingThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { SignInForm } from "../components/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta title="Sign In - Gratex" description="Sign in page for Gratex application" />
      <SignInForm />
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <FloatingThemeToggle />
      </div>
    </>
  );
}
