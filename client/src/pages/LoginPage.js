import LoginForm from "../components/ui/auth/LoginForm";
import PageMeta from "../components/seo/PageMeta";

export default function Index() {
  return (
    <>
      <PageMeta
        title="Sign In | Breakwaters Recruitment"
        description="Access your Breakwaters Recruitment account to manage applications, review candidate progress, and collaborate with your hiring team."
        canonical="https://breakwatersrecruitment.co.za/login"
      />
      <LoginForm />
    </>
  );
}
