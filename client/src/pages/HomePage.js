import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "../styling/home.css";
import AppCardNav from "../components/ui/layout/AppCardNav";
import heroWave from "../assets/svgs/Hero-wave.svg";
import { AuthContext } from "../context/AuthContext";
import { useClientIntake } from "../context/ClientIntakeContext";
import Footer from "../components/ui/layout/Footer";
import PageMeta from "../components/seo/PageMeta";

const HERO_TITLE = "We Break Barriers\nfor your success.";
const HOW_IT_WORKS_STEPS = [
  {
    step: "1. Submit",
    client: "Upload your CV and profile.",
    company: "Create a verified company account.",
  },
  {
    step: "2. Review",
    client: "Our recruitment officers assess your fit.",
    company: "Receive shortlisted candidates.",
  },
  {
    step: "3. Connect",
    client: "Get matched and notified via email.",
    company: "Review candidates and schedule interviews.",
  },
];


export default function HomePage() {
  const { user } = useContext(AuthContext);
  const { openClientIntake, openBusinessIntake, hasSubmitted } = useClientIntake();
  const howItWorksRef = useRef(null);
  const aboutBreakwatersRef = useRef(null);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  const handleNavCtaClick = useCallback(() => {
    openClientIntake();
  }, [openClientIntake]);

  const handleResumeClick = useCallback(
    (event) => {
      event.preventDefault();
      openClientIntake();
    },
    [openClientIntake]
  );

  const handleBusinessClick = useCallback(() => {
    openBusinessIntake();
  }, [openBusinessIntake]);

  const navCtaLabel = user
    ? user.role === 'recruitment_officer'
      ? "Dashboard"
      : hasSubmitted
        ? "Resume Sent"
        : "Get Started"
    : "Sign Up / Sign In";

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setHowItWorksVisible(true);
      setAboutVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === howItWorksRef.current) {
            setHowItWorksVisible(entry.isIntersecting);
          } else if (entry.target === aboutBreakwatersRef.current) {
            setAboutVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10%",
      }
    );

    const targets = [howItWorksRef.current, aboutBreakwatersRef.current].filter(Boolean);
    targets.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="home-page">
      <PageMeta
        title="Breakwaters Recruitment | Human-Led Talent Matching"
        description="Partner with Breakwaters Recruitment to match South African companies and talent through a guided intake, review, and placement process."
        canonical="https://breakwatersrecruitment.co.za/"
      />
      <section className="hero-section noise">
        <div className="hero-content">
          <AppCardNav
            ctaLabel={navCtaLabel}
            onGetStarted={handleNavCtaClick}
          />
          <h1 className="hero-title" data-text={HERO_TITLE}>
            <span>We Break Barriers</span>
            <span>for your success.</span>
          </h1>

          <p className="hero-subtext">
            Connecting companies with top talent and talent with top companies!
          </p>

          <div className="hero-cta-container">
            <button
              type="button"
              className="hero-cta"
              onClick={handleResumeClick}
            >
              Submit your resume
            </button>
            <button
              type="button"
              className="hero-cta hero-cta--white"
              onClick={handleBusinessClick}
            >
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

      <div className="home-gradient-flow noise">
        <section
          ref={howItWorksRef}
          className={`home-section how-it-works ${
            howItWorksVisible ? "home-section--visible" : ""
          }`}
        >
          <div className="home-section__inner">
            <h2 className="section-title">
              Human-led matches in three simple steps
            </h2>
            <p className="section-lead">
              From the first hello to the final interview, every connection is
              guided by experienced recruiters who know people matter most.
            </p>

            <div className="how-it-works__grid">
              {HOW_IT_WORKS_STEPS.map(({ step, client, company }) => (
                <article className="how-it-works__item" key={step}>
                  <header className="how-it-works__item-header">
                    <span className="how-it-works__badge">{step}</span>
                  </header>
                  <div className="how-it-works__roles">
                    <div className="how-it-works__role">
                      <h3>Client</h3>
                      <p>{client}</p>
                    </div>
                    <div className="how-it-works__role">
                      <h3>Company</h3>
                      <p>{company}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="home-section-divider" aria-hidden="true" />

        <section
          ref={aboutBreakwatersRef}
          className={`home-section about-breakwaters ${
            aboutVisible ? "home-section--visible" : ""
          }`}
        >
          <div className="home-section__inner">
            <h2 className="section-title">
              Recruitment with heart, precision, and trust
            </h2>
            <div className="about-breakwaters__content">
              <p>
                At Breakwaters, we believe in people before algorithms. Every CV
                is personally reviewed by our recruitment officers, ensuring
                every match benefits both sides.
              </p>
              <p>
                With secure data handling and verified partners, we&apos;re
                redefining recruitment for trust and transparency.
              </p>
            </div>

            <div className="career-journey-panel">
              <div className="career-journey-panel__copy">
                <h3>Take the first step in your career journey.</h3>
                <p>
                  Upload your CV, and let our recruitment team do the heavy
                  lifting. We connect you with verified companies that match
                  your goals and expertise.
                </p>
                <button
                  type="button"
                  className="panel-cta"
                  onClick={handleResumeClick}
                >
                  Submit Your CV
                </button>
              </div>
              <div className="career-journey-panel__accent" aria-hidden="true">
                <div className="career-journey-panel__texture" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
