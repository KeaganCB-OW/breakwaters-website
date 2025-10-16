import "../styling/home.css";
import MissionSection from "../components/sections/MissionSection";
import AppCardNav from "../components/ui/layout/AppCardNav";
import heroWave from "../assets/svgs/Hero-wave.svg";

const HERO_TITLE = "We Break Barriers\nfor your success.";
const INITIAL_MISSION_LINES = ["What we do", "and why we do it."];
const UPDATED_MISSION_LINES = ["Its simple.", "We want to get you hired."];
const UPDATED_MISSION_SUBTEXT =
  "We connect people to opportunity. By streamlining the job application and recruitment process, we help candidates get noticed and companies find the right fit quickly, simply, and meaningfully.";

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

      <MissionSection
        id="mission"
        initialLines={INITIAL_MISSION_LINES}
        updatedLines={UPDATED_MISSION_LINES}
        subtext={UPDATED_MISSION_SUBTEXT}
      />
    </main>
  );
}
