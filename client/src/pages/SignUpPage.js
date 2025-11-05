import SignupPage from "../components/ui/auth/RegisterForm";
import PageMeta from "../components/seo/PageMeta";

export default function Index() {
  return (
    <>
      <PageMeta
        title="Create Your Breakwaters Recruitment Account"
        description="Join Breakwaters Recruitment to submit your CV, track hiring progress, and receive curated job matches tailored to your expertise."
        canonical="https://breakwatersrecruitment.co.za/signup"
      />
      <SignupPage />
    </>
  );
}
