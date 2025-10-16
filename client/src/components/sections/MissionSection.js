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
  const [wavePhase, setWavePhaseState] = useState("idle");
  const wavePhaseRef = useRef("idle");
  const setWavePhase = useCallback((nextPhase) => {
    wavePhaseRef.current = nextPhase;
    setWavePhaseState(nextPhase);
  }, []);
  const [missionLines, setMissionLines] = useState(() => [...latestInitialLinesRef.current]);
  const [canTriggerWave, setCanTriggerWaveState] = useState(false);
  const canTriggerWaveRef = useRef(false);
  const setCanTriggerWave = useCallback((nextValue) => {
    canTriggerWaveRef.current = nextValue;
    setCanTriggerWaveState(nextValue);
  }, []);
  const isSectionActiveRef = useRef(false);
  const setSectionActive = useCallback((nextValue) => {
    isSectionActiveRef.current = nextValue;
  }, []);
  const [isSectionReady, setSectionReadyState] = useState(false);
  const isSectionReadyRef = useRef(false);
  const setSectionReady = useCallback((nextValue) => {
    isSectionReadyRef.current = nextValue;
    setSectionReadyState(nextValue);
  }, []);

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
  }, [clearWaveDelayTimeout, setCanTriggerWave, setSectionReady, setWavePhase]);

  const triggerWave = useCallback(() => {
    if (
      wavePhaseRef.current !== "idle" ||
      !isSectionActiveRef.current ||
      !isSectionReadyRef.current ||
      !canTriggerWaveRef.current
    ) {
      return false;
    }

    clearWaveDelayTimeout();
    setWavePhase("covering");
    setCanTriggerWave(false);
    touchStartYRef.current = null;
    return true;
  }, [clearWaveDelayTimeout, setCanTriggerWave, setWavePhase]);

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

        const {
          isIntersecting,
          boundingClientRect,
          intersectionRect,
          rootBounds,
          intersectionRatio: rawIntersectionRatio,
        } = entry;
        const viewportHeight =
          rootBounds?.height ?? window.innerHeight ?? document.documentElement.clientHeight;
        const viewportTop = rootBounds?.top ?? 0;
        const viewportBottom = viewportTop + viewportHeight;
        const sectionHeight = boundingClientRect.height;
        const visibleHeight = intersectionRect.height;
        const intersectionRatio =
          rawIntersectionRatio ??
          (sectionHeight > 0 ? Math.min(1, visibleHeight / sectionHeight) : 0);

        const sectionFullyFits = sectionHeight <= viewportHeight + VISIBILITY_TOLERANCE;
        const topAligned = boundingClientRect.top <= viewportTop + VISIBILITY_TOLERANCE;
        const bottomAligned = boundingClientRect.bottom <= viewportBottom + VISIBILITY_TOLERANCE;
        const viewportFilled = visibleHeight >= viewportHeight - VISIBILITY_TOLERANCE;
        const reachedSectionBottom = isIntersecting && bottomAligned;

        const readyToLock = isIntersecting
          ? sectionFullyFits
            ? reachedSectionBottom && topAligned
            : reachedSectionBottom && viewportFilled
          : false;

        const nextSectionActive =
          isIntersecting && (intersectionRatio >= 0.4 || visibleHeight >= viewportHeight * 0.6);
        if (nextSectionActive !== isSectionActiveRef.current) {
          setSectionActive(nextSectionActive);
        }

        const shouldRevealTitle = isIntersecting && (intersectionRatio >= 0.35 || readyToLock);

        if (wavePhase === "idle") {
          setTitleVisible(shouldRevealTitle);
          if (readyToLock) {
            if (!isSectionReadyRef.current) {
              setSectionReady(true);
            }
          } else if (
            isSectionReadyRef.current &&
            (!isIntersecting ||
              (scrollDirectionRef.current === "up" &&
                (boundingClientRect.top > viewportTop + VISIBILITY_TOLERANCE ||
                  intersectionRatio < 0.5)))
          ) {
            setSectionReady(false);
            setCanTriggerWave(false);
            clearWaveDelayTimeout();
          }
        } else {
          setTitleVisible(isIntersecting);
          if (!isIntersecting && isSectionReadyRef.current) {
            setSectionReady(false);
          }
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
  }, [clearWaveDelayTimeout, resetMissionExperience, setCanTriggerWave, setSectionActive, setSectionReady, wavePhase]);

  useEffect(() => {
    if (!isSectionReady || wavePhase !== "idle") {
      if (canTriggerWaveRef.current) {
        setCanTriggerWave(false);
      }
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
  }, [clearWaveDelayTimeout, isSectionReady, setCanTriggerWave, wavePhase, waveTriggerDelay]);

  useEffect(() => {
    if (!isSectionActiveRef.current) {
      return undefined;
    }

    if (!isSectionReady || wavePhase !== "idle" || !canTriggerWave || wavePhaseRef.current !== "idle") {
      return undefined;
    }

    const autoStartId = window.requestAnimationFrame(() => {
      triggerWave();
    });

    return () => {
      window.cancelAnimationFrame(autoStartId);
    };
  }, [canTriggerWave, isSectionReady, triggerWave, wavePhase]);

  useEffect(() => {
    const handleWheel = (event) => {
      const isScrollingDown = event.deltaY > 0;
      const phase = wavePhaseRef.current;
      const isLockingPhase = phase === "covering" || phase === "revealing";
      const isIdlePhase = phase === "idle";

      if (!isScrollingDown) {
        return;
      }

      if (isLockingPhase) {
        event.preventDefault();
        return;
      }

      if (!isIdlePhase) {
        return;
      }

      if (!isSectionActiveRef.current || !isSectionReadyRef.current) {
        return;
      }

      const waveStarted = triggerWave();
      if (waveStarted || !canTriggerWaveRef.current) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event) => {
      if (touchStartYRef.current == null) {
        return;
      }

      const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = touchStartYRef.current - currentY;
      const isScrollingDown = deltaY > 0;
      const phase = wavePhaseRef.current;
      const isLockingPhase = phase === "covering" || phase === "revealing";
      const isIdlePhase = phase === "idle";

      if (!isScrollingDown) {
        return;
      }

      if (isLockingPhase) {
        event.preventDefault();
        return;
      }

      if (!isIdlePhase) {
        return;
      }

      if (!isSectionActiveRef.current || !isSectionReadyRef.current) {
        return;
      }

      const waveStarted = triggerWave();
      if (waveStarted || !canTriggerWaveRef.current) {
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

      const isLockingPhase =
        wavePhaseRef.current === "covering" || wavePhaseRef.current === "revealing";
      const isIdlePhase = wavePhaseRef.current === "idle";

      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        if (isLockingPhase) {
          event.preventDefault();
          return;
        }

        if (!isIdlePhase) {
          return;
        }

        if (!isSectionActiveRef.current || !isSectionReadyRef.current) {
          return;
        }

        const waveStarted = triggerWave();
        if (waveStarted || !canTriggerWaveRef.current) {
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
  }, [triggerWave]);

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
      setCanTriggerWave(true);
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
