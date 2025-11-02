import { useCallback, useContext } from "react";
import "../styling/about.css";
import AppCardNav from "../components/ui/layout/AppCardNav";
import MissionSection from "../components/sections/MissionSection";
import Footer from "../components/ui/layout/Footer";
import { AuthContext } from "../context/AuthContext";
import { useClientIntake } from "../context/ClientIntakeContext";

const INITIAL_MISSION_LINES = ["What we do", "and why we do it."];
const UPDATED_MISSION_LINES = ["It's simple.", "We want to get you hired."];
const UPDATED_MISSION_SUBTEXT =
  "We connect people to opportunity. By streamlining the job application and recruitment process, we help candidates get noticed and companies find the right fit quickly, simply, and meaningfully.";
const TEAM_INTRO_LINES = ["Meet the crew."];
const TEAM_INTRO_SUBTEXT = ["We're here to help you succeed."];

const MISSION_ENTRIES = [
  { id: "mission-intro", lines: INITIAL_MISSION_LINES },
  {
    id: "mission-update",
    lines: UPDATED_MISSION_LINES,
    subtext: UPDATED_MISSION_SUBTEXT,
  },
  {
    id: "team-intro",
    lines: TEAM_INTRO_LINES,
    subtext: TEAM_INTRO_SUBTEXT,
  },
];

const ABOUT_INTRO_HEADING = "Breakwaters: charting the course to meaningful work.";
const ABOUT_INTRO_SUBTEXT =
  "We are a talent collective that clears the path between skilled professionals and the organisations that need them. Our team combines human insight with smart tools to help candidates get noticed faster and help companies hire with confidence.";

export default function AboutUsPage() {
  const { user } = useContext(AuthContext);
  const { openClientIntake, hasSubmitted } = useClientIntake();

  const handleNavCtaClick = useCallback(() => {
    openClientIntake();
  }, [openClientIntake]);

  const navCtaLabel = user
    ? hasSubmitted
      ? "Submission Sent"
      : "Get Started"
    : "Sign Up / Sign In";

  return (
    <main className="about-page">
      <header className="about-page__header">
        <AppCardNav ctaLabel={navCtaLabel} onGetStarted={handleNavCtaClick} />
      </header>

      <section className="about-page__intro">
        <h1>{ABOUT_INTRO_HEADING}</h1>
        <p>{ABOUT_INTRO_SUBTEXT}</p>
      </section>

      <MissionSection id="about-mission" entries={MISSION_ENTRIES} />

      <Footer />
    </main>
  );
}
