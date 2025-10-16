import { useEffect, useRef, useState } from "react";
import "../styling/home.css";
import AppCardNav from "../components/ui/layout/AppCardNav";
import heroWave from "../assets/svgs/Hero-wave.svg";

const HERO_TITLE = "We Break Barriers\nfor your success.";
const MISSION_TITLE = "What we do\nand why we do it.";

export default function HomePage() {
  const missionSectionRef = useRef(null);
  const [isMissionVisible, setMissionVisible] = useState(false);

  useEffect(() => {
    const sectionEl = missionSectionRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMissionVisible(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );

    observer.observe(sectionEl);

    return () => observer.disconnect();
  }, []);

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
            Submit your resume today and connect with top companies in search of the best talent.
          </p>

          <button type="button" className="hero-cta">
            Connect with us!
          </button>

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

      <section className="mission-section" ref={missionSectionRef}>
        <h2
          className={`mission-title ${isMissionVisible ? "mission-title--visible" : ""}`}
          data-text={MISSION_TITLE}
        >
          <span>What we do</span>
          <span>and why we do it.</span>
        </h2>
      </section>
    </main>
  );
}
