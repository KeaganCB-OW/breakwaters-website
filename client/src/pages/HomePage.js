import { useCallback, useEffect, useRef, useState } from "react";
import "../styling/home.css";
import AppCardNav from "../components/ui/layout/AppCardNav";
import heroWave from "../assets/svgs/Hero-wave.svg";

const HERO_TITLE = "We Break Barriers\nfor your success.";
const INITIAL_MISSION_LINES = ["What we do", "and why we do it."];
const UPDATED_MISSION_LINES = ["Its simple.", "We want to get you hired."];
const UPDATED_MISSION_SUBTEXT =
  "We connect people to opportunity. By streamlining the job application and recruitment process, we help candidates get noticed and companies find the right fit quickly, simply, and meaningfully.";
const WAVE_TRIGGER_DELAY_MS = 1000;
const OBSERVER_THRESHOLDS = Array.from({ length: 101 }, (_, index) => index / 100);

export default function HomePage() {
  const heroSectionRef = useRef(null);
  const missionSectionRef = useRef(null);
  const touchStartYRef = useRef(null);
  const waveDelayTimeoutRef = useRef(null);
  const [isMissionVisible, setMissionVisible] = useState(false);
  const [isMissionReady, setMissionReady] = useState(false);
  const [missionLines, setMissionLines] = useState(INITIAL_MISSION_LINES);
  const [wavePhase, setWavePhase] = useState("idle"); // idle | covering | revealing | done
  const [canTriggerWave, setCanTriggerWave] = useState(false);
  const [isUpdatedTextVisible, setUpdatedTextVisible] = useState(false);
  const [isSubtextVisible, setSubtextVisible] = useState(false);

  const clearWaveDelayTimeout = useCallback(() => {
    if (waveDelayTimeoutRef.current != null) {
      window.clearTimeout(waveDelayTimeoutRef.current);
      waveDelayTimeoutRef.current = null;
    }
  }, []);

  const resetMissionExperience = useCallback(() => {
    clearWaveDelayTimeout();
    setMissionLines([...INITIAL_MISSION_LINES]);
    setWavePhase("idle");
    setUpdatedTextVisible(false);
    setSubtextVisible(false);
    setCanTriggerWave(false);
    setMissionVisible(false);
    setMissionReady(false);
    touchStartYRef.current = null;
  }, [clearWaveDelayTimeout]);

  useEffect(() => {
    const sectionEl = missionSectionRef.current;
    if (!sectionEl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const { isIntersecting, boundingClientRect } = entry;
        const fillsViewport =
          isIntersecting &&
          boundingClientRect.top <= 1 &&
          boundingClientRect.bottom >= window.innerHeight * 0.6;

        setMissionReady(fillsViewport);
        setMissionVisible(wavePhase !== "idle" ? isIntersecting : fillsViewport);

        if (!fillsViewport) {
          setCanTriggerWave(false);
          clearWaveDelayTimeout();
        }

        if (!isIntersecting) {
          if (wavePhase !== "idle" || isUpdatedTextVisible || isSubtextVisible) {
            resetMissionExperience();
          } else {
            setMissionVisible(false);
            setMissionReady(false);
          }
        }
      },
      { threshold: OBSERVER_THRESHOLDS }
    );

    observer.observe(sectionEl);

    return () => {
      observer.disconnect();
    };
  }, [clearWaveDelayTimeout, isSubtextVisible, isUpdatedTextVisible, resetMissionExperience, wavePhase]);

  useEffect(() => {
    const heroEl = heroSectionRef.current;
    if (!heroEl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        if (wavePhase !== "idle" || isUpdatedTextVisible || isSubtextVisible) {
          resetMissionExperience();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(heroEl);

    return () => {
      observer.disconnect();
    };
  }, [isSubtextVisible, isUpdatedTextVisible, resetMissionExperience, wavePhase]);

  useEffect(() => {
    if (!isMissionReady || wavePhase !== "idle") {
      clearWaveDelayTimeout();
      return undefined;
    }

    setCanTriggerWave(false);
    clearWaveDelayTimeout();

    waveDelayTimeoutRef.current = window.setTimeout(() => {
      setCanTriggerWave(true);
      waveDelayTimeoutRef.current = null;
    }, WAVE_TRIGGER_DELAY_MS);

    return () => {
      clearWaveDelayTimeout();
    };
  }, [clearWaveDelayTimeout, isMissionReady, wavePhase]);

  useEffect(() => {
    if (!isMissionReady || wavePhase !== "idle") {
      return undefined;
    }

    const triggerWave = () => {
      if (!canTriggerWave) {
        return false;
      }

      clearWaveDelayTimeout();
      setWavePhase("covering");
      setCanTriggerWave(false);
      touchStartYRef.current = null;
      return true;
    };

    const handleWheel = (event) => {
      if (event.deltaY <= 0) return;
      const waveStarted = triggerWave();
      if (waveStarted || !canTriggerWave) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event) => {
      if (touchStartYRef.current == null) return;
      const deltaY = touchStartYRef.current - event.touches[0]?.clientY;
      if (deltaY <= 0) return;
      const waveStarted = triggerWave();
      if (waveStarted || !canTriggerWave) {
        event.preventDefault();
      }
      if (waveStarted) {
        touchStartYRef.current = null;
      }
    };

    const handleKeyDown = (event) => {
      const interactiveTags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (interactiveTags.includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        const waveStarted = triggerWave();
        if (waveStarted || !canTriggerWave) {
          event.preventDefault();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      touchStartYRef.current = null;
    };
  }, [canTriggerWave, clearWaveDelayTimeout, isMissionReady, wavePhase]);

  useEffect(() => {
    const shouldLockScroll = wavePhase === "covering" || wavePhase === "revealing";
    if (!shouldLockScroll) return undefined;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [wavePhase]);

  const handleWaveAnimationEnd = () => {
    if (wavePhase === "covering") {
      setMissionLines([...UPDATED_MISSION_LINES]);
      setUpdatedTextVisible(true);
      setWavePhase("revealing");
      return;
    }

    if (wavePhase === "revealing") {
      setWavePhase("done");
      setSubtextVisible(true);
    }
  };

  return (
    <main className="home-page">
      <section className="hero-section" ref={heroSectionRef}>
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
        <div
          className={`mission-wave ${
            wavePhase === "idle" || wavePhase === "done" ? "" : `mission-wave--${wavePhase}`
          }`}
          onAnimationEnd={handleWaveAnimationEnd}
          aria-hidden="true"
        />

        <div className={`mission-content ${isUpdatedTextVisible ? "mission-content--updated" : ""}`}>
          <h2
            className={`mission-title ${
              isMissionVisible ? "mission-title--visible" : ""
            } ${isUpdatedTextVisible ? "mission-title--updated" : ""}`}
            data-text={missionLines.join("\n")}
          >
            {missionLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>

          <p
            className={`mission-subtext ${
              isSubtextVisible ? "mission-subtext--visible" : ""
            }`}
          >
            {UPDATED_MISSION_SUBTEXT}
          </p>
        </div>
      </section>
    </main>
  );
}
