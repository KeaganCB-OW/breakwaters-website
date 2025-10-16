import { useCallback, useEffect, useRef, useState } from "react";
import "../../styling/mission-section.css";

const DEFAULT_OBSERVER_THRESHOLDS = Array.from({ length: 101 }, (_, index) => index / 100);
const VISIBILITY_TOLERANCE = 1;

const normalizeLines = (lines) => {
  if (Array.isArray(lines)) {
    return lines.filter((line) => line != null).map(String);
  }
  if (lines == null) {
    return [];
  }
  return [String(lines)];
};

export default function MissionSection({
  id,
  initialLines = [],
  updatedLines = [],
  subtext = "",
  waveTriggerDelay = 1000,
}) {
  const sectionRef = useRef(null);
  const touchStartYRef = useRef(null);
  const waveDelayTimeoutRef = useRef(null);
  const scrollDirectionRef = useRef("down");
  const lastScrollYRef = useRef(null);
  const latestInitialLinesRef = useRef(normalizeLines(initialLines));
  const latestUpdatedLinesRef = useRef(normalizeLines(updatedLines));

  const [isTitleVisible, setTitleVisible] = useState(false);
  const [isSubtextVisible, setSubtextVisible] = useState(false);
  const [isUpdatedTextVisible, setUpdatedTextVisible] = useState(false);
  const [wavePhase, setWavePhase] = useState("idle");
  const [missionLines, setMissionLines] = useState(() => [...latestInitialLinesRef.current]);
  const [canTriggerWave, setCanTriggerWave] = useState(false);
  const [isSectionActive, setSectionActive] = useState(false);
  const [isSectionReady, setSectionReady] = useState(false);

  useEffect(() => {
    latestInitialLinesRef.current = normalizeLines(initialLines);
    if (wavePhase === "idle") {
      setMissionLines([...latestInitialLinesRef.current]);
    }
  }, [initialLines, wavePhase]);

  useEffect(() => {
    latestUpdatedLinesRef.current = normalizeLines(updatedLines);
  }, [updatedLines]);

  const clearWaveDelayTimeout = useCallback(() => {
    if (waveDelayTimeoutRef.current != null) {
      window.clearTimeout(waveDelayTimeoutRef.current);
      waveDelayTimeoutRef.current = null;
    }
  }, []);

  const resetMissionExperience = useCallback(() => {
    clearWaveDelayTimeout();
    setMissionLines([...latestInitialLinesRef.current]);
    setWavePhase("idle");
    setUpdatedTextVisible(false);
    setSubtextVisible(false);
    setCanTriggerWave(false);
    setTitleVisible(false);
    setSectionReady(false);
    touchStartYRef.current = null;
  }, [clearWaveDelayTimeout]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (lastScrollYRef.current == null) {
        lastScrollYRef.current = currentY;
        return;
      }

      if (currentY === lastScrollYRef.current) {
        return;
      }

      scrollDirectionRef.current = currentY > lastScrollYRef.current ? "down" : "up";
      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.target !== sectionEl) {
          return;
        }

        const { isIntersecting, boundingClientRect, intersectionRect, rootBounds } = entry;
        const viewportHeight =
          rootBounds?.height ?? window.innerHeight ?? document.documentElement.clientHeight;
        const viewportTop = rootBounds?.top ?? 0;
        const viewportBottom = rootBounds?.bottom ?? viewportTop + viewportHeight;
        const sectionHeight = boundingClientRect.height;
        const visibleHeight = intersectionRect.height;

        const fitsViewport = sectionHeight <= viewportHeight + VISIBILITY_TOLERANCE;
        const fullyVisible =
          isIntersecting &&
          (fitsViewport
            ? boundingClientRect.top >= viewportTop - VISIBILITY_TOLERANCE &&
              boundingClientRect.bottom <= viewportBottom + VISIBILITY_TOLERANCE
            : visibleHeight >= viewportHeight - VISIBILITY_TOLERANCE &&
              Math.abs(boundingClientRect.top - viewportTop) <= VISIBILITY_TOLERANCE);

        setSectionActive(isIntersecting && visibleHeight > viewportHeight * 0.25);

        if (wavePhase === "idle") {
          setTitleVisible(fullyVisible);
          setSectionReady(fullyVisible);
        } else {
          setTitleVisible(isIntersecting);
          if (!isIntersecting) {
            setSectionReady(false);
          }
        }

        if (wavePhase === "idle" && !fullyVisible) {
          setCanTriggerWave(false);
          clearWaveDelayTimeout();
        }

        if (!isIntersecting && scrollDirectionRef.current === "up") {
          resetMissionExperience();
        }
      },
      { threshold: DEFAULT_OBSERVER_THRESHOLDS }
    );

    observer.observe(sectionEl);

    return () => {
      observer.disconnect();
    };
  }, [clearWaveDelayTimeout, resetMissionExperience, wavePhase]);

  useEffect(() => {
    if (!isSectionReady || wavePhase !== "idle") {
      clearWaveDelayTimeout();
      return undefined;
    }

    setCanTriggerWave(false);
    clearWaveDelayTimeout();

    waveDelayTimeoutRef.current = window.setTimeout(() => {
      setCanTriggerWave(true);
      waveDelayTimeoutRef.current = null;
    }, waveTriggerDelay);

    return () => {
      clearWaveDelayTimeout();
    };
  }, [clearWaveDelayTimeout, isSectionReady, wavePhase, waveTriggerDelay]);

  useEffect(() => {
    if (!isSectionReady || wavePhase !== "idle" || !isSectionActive) {
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
      const deltaY = touchStartYRef.current - (event.touches[0]?.clientY ?? touchStartYRef.current);
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
  }, [canTriggerWave, clearWaveDelayTimeout, isSectionActive, isSectionReady, wavePhase]);

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
      setMissionLines([...latestUpdatedLinesRef.current]);
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
    <section className="mission-section" ref={sectionRef} id={id}>
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
            isTitleVisible ? "mission-title--visible" : ""
          } ${isUpdatedTextVisible ? "mission-title--updated" : ""}`}
          data-text={missionLines.join("\n")}
        >
          {missionLines.map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </h2>

        <p className={`mission-subtext ${isSubtextVisible ? "mission-subtext--visible" : ""}`}>
          {subtext}
        </p>
      </div>
    </section>
  );
}
