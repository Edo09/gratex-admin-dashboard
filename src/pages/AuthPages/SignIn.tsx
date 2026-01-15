import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <SignInForm />
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
    </>
  );
}
