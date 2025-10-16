import "../styling/home.css";
import AppCardNav from "../components/ui/layout/AppCardNav";

const HERO_TITLE = "We Break Barriers\nfor your success.";

export default function HomePage() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <AppCardNav />
        <h1 className="hero-title" data-text={HERO_TITLE}>
          <span>We Break Barriers</span>
          <span>for your success.</span>
        </h1>

        <p className="hero-subtext">
          Submit your resume today and connect with top companies in search of the best talent.
        </p>

        <button type="button" className="hero-cta">
          Connect with us!
        </button>

        
      </div>
    </section>
  );
}
