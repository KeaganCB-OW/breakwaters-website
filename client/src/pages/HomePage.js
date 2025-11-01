import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styling/home.css";
import MissionSection from "../components/sections/MissionSection";
import AppCardNav from "../components/ui/layout/AppCardNav";
import heroWave from "../assets/svgs/Hero-wave.svg";
import { AuthContext } from "../context/AuthContext";
import ClientIntakeStepper from "../components/ui/forms/ClientIntakeStepper";

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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const openStepper = useCallback(() => {
    setShowAuthPrompt(false);
    setIsStepperOpen(true);
  }, []);

  const openAuthPrompt = useCallback(() => {
    setIsStepperOpen(false);
    setShowAuthPrompt(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsStepperOpen(false);
    setShowAuthPrompt(false);
  }, []);

  const handleNavCtaClick = useCallback(() => {
    if (user) {
      openStepper();
      return;
    }

    openAuthPrompt();
  }, [openAuthPrompt, openStepper, user]);

  const handleSignupClick = useCallback(() => {
    closeOverlay();
    navigate("/signup");
  }, [closeOverlay, navigate]);

  const handleSigninClick = useCallback(() => {
    closeOverlay();
    navigate("/login");
  }, [closeOverlay, navigate]);

  useEffect(() => {
    if (!user && isStepperOpen) {
      setIsStepperOpen(false);
    }
  }, [isStepperOpen, user]);

  useEffect(() => {
    if (user && showAuthPrompt) {
      setShowAuthPrompt(false);
    }
  }, [showAuthPrompt, user]);

  const isOverlayOpen = isStepperOpen || showAuthPrompt;

  useEffect(() => {
    if (!isOverlayOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeOverlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOverlay, isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen || typeof document === "undefined") {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOverlayOpen]);

  const overlayAriaLabel = showAuthPrompt
    ? "Authentication required"
    : "Client intake form";

  const navCtaLabel = user ? "Get Started" : "Sign Up / Sign In";

  return (
    <main className="home-page">
      {isOverlayOpen && (
        <div
          className="home-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={overlayAriaLabel}
        >
          <div
            className="home-overlay__backdrop"
            onClick={closeOverlay}
            aria-hidden="true"
          />
          <div
            className={`home-overlay__content ${
              isStepperOpen ? "home-overlay__content--stepper" : ""
            }`}
            role="document"
          >
            <button
              type="button"
              className="home-overlay__close"
              aria-label="Close overlay"
              onClick={closeOverlay}
            >
              &times;
            </button>
            {showAuthPrompt ? (
              <div className="home-auth">
                <h2 className="home-auth__title">
                  Ready to join the Breakwaters network?
                </h2>
                <p className="home-auth__subtitle">
                  Create an account or sign in to submit your profile and start
                  matching with new opportunities.
                </p>
                <div className="home-auth__actions">
                  <button
                    type="button"
                    className="home-auth__button home-auth__button--primary"
                    onClick={handleSignupClick}
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    className="home-auth__button home-auth__button--secondary"
                    onClick={handleSigninClick}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ) : (
              <ClientIntakeStepper />
            )}
          </div>
        </div>
      )}
      <section className="hero-section">
        <div className="hero-content">
          <AppCardNav
            rightContent={(
              <button
                type="button"
                className="card-nav-cta-button"
                onClick={handleNavCtaClick}
              >
                {navCtaLabel}
              </button>
            )}
          />
          <h1 className="hero-title" data-text={HERO_TITLE}>
            <span>We Break Barriers</span>
            <span>for your success.</span>
          </h1>

          <p className="hero-subtext">
            Connecting companies with top talent and talent with top companies!
          </p>

          <div className="hero-cta-container">
            <Link to="/become-client" className="hero-cta">
              Submit your resume
            </Link>
            <Link to="/signup" className="hero-cta hero-cta--white">
              Register your business
            </Link>
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
