import { PageMeta } from "@/shared/components/layout/PageMeta";
import { FloatingThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { SignUpForm } from "../components/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta title="Gratex Admin Dashboard - SignUp" description="This is the SignUp page of Gratex Admin Dashboard" />
      <SignUpForm />
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <FloatingThemeToggle />
      </div>
    </>
  );
}
