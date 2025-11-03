import { useCallback, useContext } from "react";
import "../styling/about.css";
import AppCardNav from "../components/ui/layout/AppCardNav";
import MissionSection from "../components/sections/MissionSection";
import TeamShowcase from "../components/about/TeamShowcase";
import { TEAM_SHOWCASE_MEMBERS } from "../components/sections/MissionSection";
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
  {
    id: "team-showcase",
    component: <TeamShowcase members={TEAM_SHOWCASE_MEMBERS} />,
  },
];

export default function AboutUsPage() {
  const { user } = useContext(AuthContext);
  const { openClientIntake, hasSubmitted } = useClientIntake();

  const handleNavCtaClick = useCallback(() => {
    openClientIntake();
  }, [openClientIntake]);

  const navCtaLabel = user
    ? hasSubmitted
      ? "Resume Sent"
      : "Get Started"
    : "Sign Up / Sign In";

  return (
    <main className="about-page">
        <AppCardNav ctaLabel={navCtaLabel} onGetStarted={handleNavCtaClick} />
 

      <MissionSection id="about-mission" entries={MISSION_ENTRIES} />

    </main>
  );
}
