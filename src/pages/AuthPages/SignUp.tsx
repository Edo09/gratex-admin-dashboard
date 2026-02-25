import PageMeta from "../../components/common/PageMeta";
import SignUpForm from "../../components/auth/SignUpForm";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Gratex Admin Dashboard - SignUp"
        description="This is the SignUp page of Gratex Admin Dashboard"
      />
      <SignUpForm />
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
    </>
  );
}
