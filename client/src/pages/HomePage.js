import "../styling/home.css";
import MissionSection from "../components/sections/MissionSection";
import AppCardNav from "../components/ui/layout/AppCardNav";
import heroWave from "../assets/svgs/Hero-wave.svg";

const HERO_TITLE = "We Break Barriers\nfor your success.";
const INITIAL_MISSION_LINES = ["What we do", "and why we do it."];
const UPDATED_MISSION_LINES = ["Its simple.", "We want to get you hired."];
const UPDATED_MISSION_SUBTEXT =
  "We connect people to opportunity. By streamlining the job application and recruitment process, we help candidates get noticed and companies find the right fit quickly, simply, and meaningfully.";
const TEAM_INTRO_LINES = ["Meet the crew."];
const TEAN_INTRO_SUBTEXT = ["We're here to help you succeed."]

/*function MissionCallToAction() {
  return (
    <div className="mission-call-to-action">
      <h3>Ready to take the next step?</h3>
      <p>
        Whether you&apos;re kickstarting your career or scaling your team, our crew is
        here to clear the path forward.
      </p>
      <div className="mission-call-to-action__actions">
        <button type="button" className="mission-call-to-action__button">
          Submit your resume
        </button>
        <button
          type="button"
          className="mission-call-to-action__button mission-call-to-action__button--alt"
        >
          Partner with Breakwaters
        </button>
      </div>
    </div>
  );
}*/

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
    subtext: TEAN_INTRO_SUBTEXT,
  },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <AppCardNav />
          <h1 className="hero-title" data-text={HERO_TITLE}>
            <span>We Break Barriers</span>
            <span>for your success.</span>
          </h1>

          <p className="hero-subtext">
            Connecting companies with top talent and talent with top companies!
          </p>

          <div className="hero-cta-container">
            <button type="button" className="hero-cta">
              Submit your resume
            </button>
            <button type="button" className="hero-cta hero-cta--white">
              Register your business
            </button>
          </div>
        </div>
        <div className="hero-wave-accent" aria-hidden="true" />
        <img
          src={heroWave}
          alt=""
          className="hero-wave"
          decoding="async"
          aria-hidden="true"
        />
      </section>

      <MissionSection id="mission" entries={MISSION_ENTRIES} />
    </main>
  );
}
