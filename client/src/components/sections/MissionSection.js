import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styling/mission-section.css";

export const TEAM_SHOWCASE_MEMBERS = [
  {
    id: "1",
    name: "Aisha Pillay",
    role: "Creative Director",
    photoUrl: "https://picsum.photos/seed/aisha/600/720",
    quote: "Design should whisper purpose before it shouts style.",
  },
  {
    id: "2",
    name: "Sipho Dlamini",
    role: "Lead Engineer",
    photoUrl: "https://picsum.photos/seed/sipho/600/720",
    quote: "Great systems are invisible until you need them.",
  },
  {
    id: "3",
    name: "Luca Venter",
    role: "UX Researcher",
    photoUrl: "https://picsum.photos/seed/luca/600/720",
    quote: "Empathy turns assumptions into insights.",
  },
];

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

const resolveSubtext = (subtext) => {
  if (subtext == null || subtext === false) {
    return { hasSubtext: false, value: null };
  }

  if (typeof subtext === "string" && subtext.trim().length === 0) {
    return { hasSubtext: false, value: null };
  }

  return { hasSubtext: true, value: subtext };
};

const createMissionEntry = (entry, index) => {
  if (entry == null) {
    return null;
  }

  if (typeof entry === "string" || Array.isArray(entry)) {
    const lines = normalizeLines(entry);
    return {
      key: `mission-entry-${index}`,
      lines,
      component: null,
      hasSubtext: false,
      subtext: null,
    };
  }

  const lines = normalizeLines(entry.lines ?? entry.title ?? []);
  const component = entry.component ?? null;
  const { hasSubtext, value: subtext } = resolveSubtext(entry.subtext);

  return {
    key: entry.id != null ? String(entry.id) : `mission-entry-${index}`,
    lines,
    component,
    hasSubtext,
    subtext,
  };
};

const buildMissionEntries = (entriesProp, initialLines, updatedLines, updatedSubtext) => {
  const normalizedEntries = [];

  if (Array.isArray(entriesProp) && entriesProp.length > 0) {
    entriesProp.forEach((entry, index) => {
      const missionEntry = createMissionEntry(entry, index);
      if (missionEntry) {
        normalizedEntries.push(missionEntry);
      }
    });
  }

  if (normalizedEntries.length === 0) {
    const initialEntryLines = normalizeLines(initialLines);
    const updatedEntryLines = normalizeLines(updatedLines);
    const { hasSubtext, value: subtextValue } = resolveSubtext(updatedSubtext);

    if (initialEntryLines.length > 0 || (!initialEntryLines.length && !updatedEntryLines.length)) {
      normalizedEntries.push({
        key: "mission-entry-initial",
        lines: initialEntryLines,
        component: null,
        hasSubtext: false,
        subtext: null,
      });
    }

    if (updatedEntryLines.length > 0 || hasSubtext) {
      normalizedEntries.push({
        key: "mission-entry-updated",
        lines: updatedEntryLines,
        component: null,
        hasSubtext,
        subtext: subtextValue,
      });
    }
  }

  if (normalizedEntries.length === 0) {
    normalizedEntries.push({
      key: "mission-entry-empty",
      lines: [],
      component: null,
      hasSubtext: false,
      subtext: null,
    });
  }

  return normalizedEntries;
};

const EMPTY_ENTRY = {
  key: "mission-entry-empty",
  lines: [],
  component: null,
  hasSubtext: false,
  subtext: null,
};

export default function MissionSection({
  id,
  entries: entriesProp,
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
  const pendingEntryIndexRef = useRef(null);

  const entries = useMemo(
    () => buildMissionEntries(entriesProp, initialLines, updatedLines, subtext),
    [entriesProp, initialLines, updatedLines, subtext]
  );
  const entriesRef = useRef(entries);

  const [isTitleVisible, setTitleVisible] = useState(false);
  const [isSubtextVisible, setSubtextVisible] = useState(() => {
    const entry = entriesRef.current[0] ?? EMPTY_ENTRY;
    return entry.hasSubtext;
  });
  const [wavePhase, setWavePhaseState] = useState("idle");
  const wavePhaseRef = useRef("idle");
  const setWavePhase = useCallback((nextPhase) => {
    wavePhaseRef.current = nextPhase;
    setWavePhaseState(nextPhase);
  }, []);
  const [activeEntryIndexState, setActiveEntryIndexState] = useState(0);
  const activeEntryIndexRef = useRef(0);
  const setActiveEntryIndex = useCallback((nextIndex) => {
    activeEntryIndexRef.current = nextIndex;
    setActiveEntryIndexState(nextIndex);
  }, []);
  const canTriggerWaveRef = useRef(false);
  const setCanTriggerWave = useCallback((nextValue) => {
    canTriggerWaveRef.current = nextValue;
  }, []);
  const isSectionActiveRef = useRef(false);
  const setSectionActive = useCallback((nextValue) => {
    isSectionActiveRef.current = nextValue;
  }, []);
  const [isSectionReadyState, setSectionReadyState] = useState(false);
  const isSectionReadyRef = useRef(false);
  const setSectionReady = useCallback((nextValue) => {
    isSectionReadyRef.current = nextValue;
    setSectionReadyState(nextValue);
  }, []);
  const isSectionReady = isSectionReadyState;

  useEffect(() => {
    entriesRef.current = entries;
    const maxIndex = Math.max(0, entries.length - 1);
    const safeIndex = Math.min(activeEntryIndexRef.current, maxIndex);

    if (safeIndex !== activeEntryIndexRef.current) {
      setActiveEntryIndex(safeIndex);
    }

    if (wavePhaseRef.current === "idle") {
      const entry = entriesRef.current[safeIndex] ?? EMPTY_ENTRY;
      setSubtextVisible(entry.hasSubtext);
    } else {
      setSubtextVisible(false);
    }
  }, [entries, setActiveEntryIndex]);

  useEffect(() => {
    return () => {
      if (waveDelayTimeoutRef.current != null) {
        window.clearTimeout(waveDelayTimeoutRef.current);
        waveDelayTimeoutRef.current = null;
      }
    };
  }, []);

  const clearWaveDelayTimeout = useCallback(() => {
    if (waveDelayTimeoutRef.current != null) {
      window.clearTimeout(waveDelayTimeoutRef.current);
      waveDelayTimeoutRef.current = null;
    }
  }, []);

  const resetMissionExperience = useCallback(() => {
    clearWaveDelayTimeout();
    pendingEntryIndexRef.current = null;
    setActiveEntryIndex(0);
    const entry = entriesRef.current[0] ?? EMPTY_ENTRY;
    setWavePhase("idle");
    setSubtextVisible(entry.hasSubtext);
    setCanTriggerWave(false);
    setTitleVisible(false);
    setSectionReady(false);
    touchStartYRef.current = null;
  }, [clearWaveDelayTimeout, setActiveEntryIndex, setCanTriggerWave, setSectionReady, setWavePhase]);

  const triggerWave = useCallback(
    (direction) => {
      if (
        wavePhaseRef.current !== "idle" ||
        !isSectionActiveRef.current ||
        !isSectionReadyRef.current ||
        !canTriggerWaveRef.current
      ) {
        return false;
      }

      const entriesList = entriesRef.current;
      if (entriesList.length <= 1) {
        return false;
      }

      const currentIndex = activeEntryIndexRef.current;
      const offset = direction === "backward" ? -1 : 1;
      const nextIndex = Math.min(
        Math.max(currentIndex + offset, 0),
        entriesList.length - 1
      );

      if (nextIndex === currentIndex) {
        return false;
      }

      pendingEntryIndexRef.current = nextIndex;
      clearWaveDelayTimeout();
      setSubtextVisible(false);
      setWavePhase("covering");
      setCanTriggerWave(false);
      touchStartYRef.current = null;
      return true;
    },
    [clearWaveDelayTimeout, setCanTriggerWave, setSubtextVisible, setWavePhase]
  );

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
  }, [
    clearWaveDelayTimeout,
    resetMissionExperience,
    setCanTriggerWave,
    setSectionActive,
    setSectionReady,
    wavePhase,
  ]);

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
    const handleWheel = (event) => {
      const isScrollingDown = event.deltaY > 0;
      const direction = isScrollingDown ? "forward" : "backward";
      const phase = wavePhaseRef.current;
      const isLockingPhase = phase === "covering" || phase === "revealing";
      const isIdlePhase = phase === "idle";

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

      const waveStarted = triggerWave(direction);
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
      const isScrollingUp = deltaY < 0;
      const phase = wavePhaseRef.current;
      const isLockingPhase = phase === "covering" || phase === "revealing";
      const isIdlePhase = phase === "idle";

      if (!isScrollingDown && !isScrollingUp) {
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

      const direction = isScrollingDown ? "forward" : "backward";
      const waveStarted = triggerWave(direction);
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

      const phase = wavePhaseRef.current;
      const isLockingPhase = phase === "covering" || phase === "revealing";
      const isIdlePhase = phase === "idle";

      if (isLockingPhase) {
        if (
          event.key === "ArrowDown" ||
          event.key === "PageDown" ||
          event.key === "End" ||
          event.key === " " ||
          event.key === "Spacebar" ||
          event.key === "ArrowUp" ||
          event.key === "PageUp" ||
          event.key === "Home"
        ) {
          event.preventDefault();
        }
        return;
      }

      if (!isIdlePhase) {
        return;
      }

      if (!isSectionActiveRef.current || !isSectionReadyRef.current) {
        return;
      }

      const forwardKeys = ["ArrowDown", "PageDown", "End", " ", "Spacebar"];
      const backwardKeys = ["ArrowUp", "PageUp", "Home"];

      let direction = null;
      if (forwardKeys.includes(event.key)) {
        direction = "forward";
      } else if (backwardKeys.includes(event.key)) {
        direction = "backward";
      }

      if (!direction) {
        return;
      }

      const waveStarted = triggerWave(direction);
      if (waveStarted || !canTriggerWaveRef.current) {
        event.preventDefault();
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
      const entriesList = entriesRef.current;
      const nextIndex = pendingEntryIndexRef.current;
      const resolvedIndex =
        typeof nextIndex === "number"
          ? Math.min(Math.max(nextIndex, 0), entriesList.length - 1)
          : activeEntryIndexRef.current;
      pendingEntryIndexRef.current = null;
      setActiveEntryIndex(resolvedIndex);
      setWavePhase("revealing");
      return;
    }

    if (wavePhase === "revealing") {
      const activeEntry = entriesRef.current[activeEntryIndexRef.current] ?? EMPTY_ENTRY;
      setSubtextVisible(activeEntry.hasSubtext);
      setWavePhase("idle");
    }
  };

  const activeEntryIndex = activeEntryIndexState;
  const activeEntry = entriesRef.current[activeEntryIndex] ?? EMPTY_ENTRY;
  const missionLines = activeEntry.lines ?? [];
  const missionLinesText = missionLines.join("\n");
  const hasComponent = activeEntry.component != null;
  const shouldRenderSubtext = activeEntry.hasSubtext;
  const hasAdvanced = activeEntryIndex > 0;

  return (
    <section className="mission-section" ref={sectionRef} id={id}>
      <div
        className={`mission-wave ${
          wavePhase === "idle" ? "" : `mission-wave--${wavePhase}`
        }`}
        onAnimationEnd={handleWaveAnimationEnd}
        aria-hidden="true"
      />

      <div
        className={`mission-content ${
          hasAdvanced ? "mission-content--updated" : ""
        } ${hasComponent ? "mission-content--component" : ""}`}
      >
        {hasComponent ? (
          <div
            className={`mission-component ${isTitleVisible ? "mission-component--visible" : ""}`}
          >
            {activeEntry.component}
          </div>
        ) : (
          <h2
            className={`mission-title ${
              isTitleVisible ? "mission-title--visible" : ""
            } ${hasAdvanced ? "mission-title--updated" : ""}`}
            data-text={missionLinesText}
          >
            {missionLines.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </h2>
        )}

        {shouldRenderSubtext ? (
          <p className={`mission-subtext ${isSubtextVisible ? "mission-subtext--visible" : ""}`}>
            {activeEntry.subtext}
          </p>
        ) : null}
      </div>
    </section>
  );
}
