import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In - Gratex"
        description="Sign in page for Gratex application"
      />
      <SignInForm />
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
    </>
  );
}
