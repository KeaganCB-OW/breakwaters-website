import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./TeamShowcase.module.css";

const DESKTOP_STAGGER = [0, 16, -16];
const MOBILE_STAGGER = [0, 8, -8];
const SLIDE_PADDING = 16;
const RESIZE_DEBOUNCE_MS = 150;

function combineClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export default function TeamShowcase({ members }) {
  const memberList = useMemo(() => {
    if (!Array.isArray(members)) {
      return [];
    }
    return members;
  }, [members]);

  const quoteRefs = useRef([]);
  const resizeTimeoutRef = useRef(null);

  const [quoteHeights, setQuoteHeights] = useState(() =>
    memberList.map(() => 0)
  );
  const [revealedStates, setRevealedStates] = useState(() =>
    memberList.map(() => false)
  );

  useEffect(() => {
    quoteRefs.current = quoteRefs.current.slice(0, memberList.length);
    setQuoteHeights(memberList.map(() => 0));
    setRevealedStates(memberList.map(() => false));
  }, [memberList]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && memberList.length !== 3) {
      // eslint-disable-next-line no-console
      console.warn(
        `TeamShowcase expected 3 members but received ${memberList.length}.`
      );
    }
  }, [memberList.length]);

  const measureQuoteHeights = useCallback(() => {
    setQuoteHeights((previous) => {
      const measured = memberList.map((_, index) => {
        const node = quoteRefs.current[index];
        if (node) {
          return node.getBoundingClientRect().height;
        }
        return 0;
      });

      if (
        previous.length === measured.length &&
        previous.every((value, index) => value === measured[index])
      ) {
        return previous;
      }

      return measured;
    });
  }, [memberList]);

  useEffect(() => {
    measureQuoteHeights();

    const handleResize = () => {
      if (resizeTimeoutRef.current != null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = window.setTimeout(() => {
        measureQuoteHeights();
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current != null) {
        window.clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [measureQuoteHeights]);

  const setQuoteRef = useCallback((index) => (node) => {
    quoteRefs.current[index] = node;
  }, []);

  const handleRevealChange = useCallback((index, isRevealed) => {
    setRevealedStates((previous) => {
      if (previous[index] === isRevealed) {
        return previous;
      }
      const next = previous.slice();
      next[index] = isRevealed;
      return next;
    });
  }, []);

  if (memberList.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      {memberList.map((member, index) => {
        const { id, name, role, photoUrl, quote } = member;
        const slideDistance = quoteHeights[index] > 0
          ? quoteHeights[index] + SLIDE_PADDING
          : 0;
        const isRevealed = revealedStates[index];

        return (
          <article
            key={id ?? index}
            className={styles.card}
            style={{
              "--stagger-offset-desktop": `${DESKTOP_STAGGER[index] ?? 0}px`,
              "--stagger-offset-mobile": `${MOBILE_STAGGER[index] ?? 0}px`,
            }}
          >
            <div className={styles.stage}>
              <div className={styles.quoteLayer} ref={setQuoteRef(index)}>
                <p>{quote}</p>
              </div>
              <button
                type="button"
                aria-label={name ? `Show quote for ${name}` : "Show team quote"}
                className={combineClassNames(
                  styles.imageWrap,
                  isRevealed && styles.revealed
                )}
                style={{
                  transform: isRevealed
                    ? `translateY(-${slideDistance}px)`
                    : "translateY(0px)",
                }}
                onMouseEnter={() => handleRevealChange(index, true)}
                onMouseLeave={() => handleRevealChange(index, false)}
                onFocus={() => handleRevealChange(index, true)}
                onBlur={() => handleRevealChange(index, false)}
              >
                <img
                  src={photoUrl}
                  alt={name ? `${name}, ${role}` : "Team member"}
                  className={styles.photo}
                  loading="lazy"
                />
              </button>
            </div>
            <div className={styles.meta}>
              {name ? <p className={styles.name}>{name}</p> : null}
              {role ? <p className={styles.role}>{role}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
