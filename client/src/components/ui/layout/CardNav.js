import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import '../../../styling/CardNav.css';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  rightContent
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isCircleCollapsed, setIsCircleCollapsed] = useState(false);
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const navThresholdRef = useRef(0);
  const scrollFrameRef = useRef(null);

  const closeMenuInstant = useCallback(() => {
    const tl = tlRef.current;
    if (tl) {
      tl.pause(0);
      tl.seek(0);
    }

    if (navRef.current) {
      gsap.set(navRef.current, { height: 60 });
    }

    if (cardsRef.current.length) {
      gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    }

    setIsHamburgerOpen(false);
    setIsExpanded(false);
  }, []);

  const updateFloatingThreshold = useCallback(() => {
    if (!containerRef.current || isFloating) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const navHeight = navRef.current?.offsetHeight ?? containerRect.height ?? 0;

    navThresholdRef.current = containerRect.top + window.scrollY + navHeight + 40;
  }, [isFloating]);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    if (!isFloating) {
      updateFloatingThreshold();
    }

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, isFloating, items, updateFloatingThreshold]);

  useLayoutEffect(() => {
    updateFloatingThreshold();
    window.addEventListener('resize', updateFloatingThreshold);

    return () => {
      window.removeEventListener('resize', updateFloatingThreshold);
    };
  }, [updateFloatingThreshold]);

  useEffect(() => {
    if (!isFloating) {
      updateFloatingThreshold();
    }
  }, [isExpanded, isFloating, updateFloatingThreshold]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollFrameRef.current) return;

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        const shouldFloat = window.scrollY > navThresholdRef.current;

        if (shouldFloat && !isFloating) {
          setIsCircleCollapsed(true);
          closeMenuInstant();
          setIsFloating(true);
        } else if (!shouldFloat && isFloating) {
          setIsFloating(false);
          setIsCircleCollapsed(false);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [closeMenuInstant, isFloating]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    if (isFloating && isCircleCollapsed) return;

    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const handleFloatingToggle = () => {
    if (!isFloating) return;

    setIsCircleCollapsed(prev => {
      const next = !prev;
      if (next) {
        closeMenuInstant();
      }
      return next;
    });
  };

  const setCardRef = index => element => {
    if (element) cardsRef.current[index] = element;
  };

  const renderRightAction = () => {
    if (rightContent) {
      return rightContent;
    }

    return (
      <button
        type="button"
        className="card-nav-cta-button"
        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
      >
        Get Started
      </button>
    );
  };

  const containerClasses = ['card-nav-container', className];
  if (isFloating) {
    containerClasses.push('card-nav-container--floating');
    containerClasses.push(
      isCircleCollapsed ? 'card-nav-container--floating-collapsed' : 'card-nav-container--floating-expanded'
    );
  }

  const floatingToggleColor = menuColor || buttonBgColor || '#082658';
  const floatingToggleTextColor = buttonTextColor || '#ffffff';

  return (
    <div ref={containerRef} className={containerClasses.filter(Boolean).join(' ')}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <img src={logo} alt={logoAlt} className="logo" />
          </div>

          <div className="card-nav-action">
            {renderRightAction()}
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, linkIdx) => (
                  <a key={`${lnk.label}-${linkIdx}`} className="nav-card-link" href={lnk.href} aria-label={lnk.ariaLabel}>
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
      {isFloating && (
        <button
          type="button"
          className={`card-nav-floating-toggle ${
            isCircleCollapsed ? 'card-nav-floating-toggle--collapsed' : 'card-nav-floating-toggle--expanded'
          }`}
          onClick={handleFloatingToggle}
          aria-expanded={!isCircleCollapsed}
          aria-label={isCircleCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          style={{ backgroundColor: floatingToggleColor, color: floatingToggleTextColor }}
        >
          <span className="card-nav-floating-toggle-icon">
            <span />
            <span />
            <span />
          </span>
        </button>
      )}
    </div>
  );
};

export default CardNav;
