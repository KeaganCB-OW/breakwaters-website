import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { fetchCurrentClient } from '../services/clientService';
import { createCompany, fetchCurrentCompany } from '../services/companyService';
import ClientIntakeStepper from '../components/ui/forms/ClientIntakeStepper';
import BusinessIntakeStepper from '../components/ui/forms/BusinessIntakeStepper';
import '../styling/ClientIntakeOverlay.css';

const noop = () => {};

export const ClientIntakeContext = createContext({
  openClientIntake: noop,
  openBusinessIntake: noop,
  closeClientIntake: noop,
  hasSubmitted: false,
  hasRegisteredBusiness: false,
  isOverlayOpen: false,
  isCheckingStatus: false,
  isCheckingBusinessStatus: false,
  clientSubmission: null,
  companyProfile: null,
  refreshClientStatus: noop,
  refreshCompanyStatus: noop,
  companyStatusError: '',
  submitBusinessIntake: noop,
  hasCheckedBusinessStatus: false,
});

export function ClientIntakeProvider({ children }) {
  const navigate = useNavigate();
  const { user, token, setUser } = useContext(AuthContext);

  const [mode, setMode] = useState('closed'); // closed | loading | auth | stepper | already-submitted | status-error
  const [clientSubmission, setClientSubmission] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [companyProfile, setCompanyProfile] = useState(null);
  const [isCheckingCompanyStatus, setIsCheckingCompanyStatus] = useState(false);
  const [hasCheckedCompanyStatus, setHasCheckedCompanyStatus] = useState(false);
  const [companyStatusError, setCompanyStatusError] = useState('');
  const [activeIntakeType, setActiveIntakeType] = useState('client'); // client | business

  const overlayContentRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const dialogTitleId = useId();

  const isOverlayOpen = mode !== 'closed';
  const hasSubmitted = Boolean(clientSubmission);
  const hasRegisteredBusiness = Boolean(companyProfile);

  const closeClientIntake = useCallback(() => {
    setMode('closed');
    setActiveIntakeType('client');
  }, []);

  const loadClientStatus = useCallback(async () => {
    if (!token || !user) {
      setClientSubmission(null);
      setStatusError('');
      setHasCheckedStatus(false);
      return null;
    }

    setIsCheckingStatus(true);
    setStatusError('');

    try {
      const submission = await fetchCurrentClient(token);
      setClientSubmission(submission);
      return submission;
    } catch (error) {
      setClientSubmission(null);
      setStatusError(error?.message || 'Failed to check your submission status.');
      throw error;
    } finally {
      setHasCheckedStatus(true);
      setIsCheckingStatus(false);
    }
  }, [token, user]);

  const loadCompanyStatus = useCallback(async () => {
    if (!token || !user) {
      setCompanyProfile(null);
      setCompanyStatusError('');
      setHasCheckedCompanyStatus(false);
      return null;
    }

    setIsCheckingCompanyStatus(true);
    setCompanyStatusError('');

    try {
      const company = await fetchCurrentCompany(token);
      setCompanyProfile(company);
      return company;
    } catch (error) {
      setCompanyProfile(null);
      setCompanyStatusError(error?.message || 'Failed to check your company registration status.');
      throw error;
    } finally {
      setHasCheckedCompanyStatus(true);
      setIsCheckingCompanyStatus(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) {
      setClientSubmission(null);
      setStatusError('');
      setHasCheckedStatus(false);
      setIsCheckingStatus(false);
      setMode('closed');
      return;
    }

    let isMounted = true;

    setIsCheckingStatus(true);
    setStatusError('');
    fetchCurrentClient(token)
      .then((submission) => {
        if (!isMounted) {
          return;
        }
        setClientSubmission(submission);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        setClientSubmission(null);
        setStatusError(error?.message || 'Failed to check your submission status.');
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }
        setHasCheckedStatus(true);
        setIsCheckingStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) {
      setCompanyProfile(null);
      setCompanyStatusError('');
      setHasCheckedCompanyStatus(false);
      setIsCheckingCompanyStatus(false);
      return;
    }

    let isMounted = true;

    setIsCheckingCompanyStatus(true);
    setCompanyStatusError('');
    fetchCurrentCompany(token)
      .then((company) => {
        if (!isMounted) {
          return;
        }
        setCompanyProfile(company);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        setCompanyProfile(null);
        setCompanyStatusError(error?.message || 'Failed to check your company registration status.');
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }
        setHasCheckedCompanyStatus(true);
        setIsCheckingCompanyStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  useEffect(() => {
    if (!isOverlayOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeClientIntake();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeClientIntake, isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen || typeof document === 'undefined') {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'contain';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen || typeof document === 'undefined') {
      return undefined;
    }

    const overlayNode = overlayContentRef.current;
    if (!overlayNode) {
      return undefined;
    }

    const focusableSelector = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const isElementVisible = (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      if (element.offsetParent === null && element !== document.activeElement) {
        return false;
      }

      const style = window.getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none';
    };

    const getFocusableElements = () =>
      Array.from(overlayNode.querySelectorAll(focusableSelector)).filter((element) =>
        isElementVisible(element)
      );

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitialElement = () => {
      const focusableElements = getFocusableElements();
      const initialFocusTarget = closeButtonRef.current || focusableElements[0] || null;
      if (initialFocusTarget && typeof initialFocusTarget.focus === 'function') {
        initialFocusTarget.focus({ preventScroll: true });
      } else if (typeof overlayNode.focus === 'function') {
        overlayNode.focus({ preventScroll: true });
      }
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const [firstElement] = focusableElements;
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (!overlayNode.contains(activeElement) || activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus({ preventScroll: true });
        }
        return;
      }

      if (!overlayNode.contains(activeElement) || activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(focusInitialElement);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const previousElement = previouslyFocusedElementRef.current;
      if (previousElement && typeof previousElement.focus === 'function') {
        previousElement.focus({ preventScroll: true });
      }
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen || typeof document === 'undefined') {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (mode !== 'loading') {
      return;
    }

    if (activeIntakeType === 'business') {
      if (isCheckingCompanyStatus) {
        return;
      }

      if (companyStatusError) {
        setMode('status-error');
        return;
      }

      if (companyProfile) {
        setMode('already-submitted');
        return;
      }

      setMode('stepper');
      return;
    }

    if (isCheckingStatus) {
      return;
    }

    if (statusError) {
      setMode('status-error');
      return;
    }

    if (clientSubmission) {
      setMode('already-submitted');
      return;
    }

    setMode('stepper');
  }, [
    activeIntakeType,
    clientSubmission,
    companyProfile,
    companyStatusError,
    isCheckingCompanyStatus,
    isCheckingStatus,
    mode,
    statusError,
  ]);

  const openClientIntake = useCallback(() => {
    setActiveIntakeType('client');
    if (!user || !token) {
      setMode('auth');
      return;
    }

    if (!hasCheckedStatus || isCheckingStatus) {
      setMode('loading');
      return;
    }

    if (statusError) {
      setMode('status-error');
      return;
    }

    if (clientSubmission) {
      setMode('already-submitted');
      return;
    }

    setMode('stepper');
  }, [clientSubmission, hasCheckedStatus, isCheckingStatus, statusError, token, user]);

  const openBusinessIntake = useCallback(() => {
    setActiveIntakeType('business');

    if (!user || !token) {
      setMode('auth');
      return;
    }

    if (!hasCheckedCompanyStatus || isCheckingCompanyStatus) {
      setMode('loading');
      if (!hasCheckedCompanyStatus && !isCheckingCompanyStatus) {
        loadCompanyStatus().catch(() => {});
      }
      return;
    }

    if (companyStatusError) {
      setMode('status-error');
      return;
    }

    if (companyProfile) {
      setMode('already-submitted');
      return;
    }

    setMode('stepper');
  }, [
    companyProfile,
    companyStatusError,
    hasCheckedCompanyStatus,
    isCheckingCompanyStatus,
    loadCompanyStatus,
    token,
    user,
  ]);

  const handleClientSubmissionSuccess = useCallback((submission) => {
    setClientSubmission(submission || { status: 'pending' });
    setHasCheckedStatus(true);
  }, []);

  const submitBusinessIntake = useCallback(
    async (payload, authToken) => {
      try {
        const company = await createCompany(payload, authToken);
        setCompanyProfile(company);
        setCompanyStatusError('');
        setHasCheckedCompanyStatus(true);
        setUser((previousUser) => {
          if (!previousUser) {
            return previousUser;
          }

          if (previousUser.role === 'company_rep') {
            return previousUser;
          }

          return { ...previousUser, role: 'company_rep' };
        });
        return company;
      } catch (error) {
        if (error?.message && error.message.toLowerCase().includes('already registered')) {
          loadCompanyStatus().catch(() => {});
        }
        throw error;
      }
    },
    [loadCompanyStatus, setUser]
  );

  const handleRetryStatus = useCallback(() => {
    setMode('loading');
    const loader =
      activeIntakeType === 'business' ? loadCompanyStatus : loadClientStatus;
    loader().catch(() => {});
  }, [activeIntakeType, loadClientStatus, loadCompanyStatus]);

  const handleNavigate = useCallback(
    (path) => {
      closeClientIntake();
      navigate(path);
    },
    [closeClientIntake, navigate]
  );

  const handleContactSupport = useCallback(() => {
    closeClientIntake();
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:support@breakwaters.com';
    }
  }, [closeClientIntake]);

  const overlayAriaLabel = useMemo(() => {
    switch (mode) {
      case 'auth':
        return 'Authentication required';
      case 'already-submitted':
        return activeIntakeType === 'business'
          ? 'Business registration already completed'
          : 'Submission already completed';
      case 'loading':
        return activeIntakeType === 'business'
          ? 'Checking business registration status'
          : 'Checking submission status';
      case 'status-error':
        return activeIntakeType === 'business'
          ? 'Business registration status unavailable'
          : 'Submission status unavailable';
      case 'stepper':
        return activeIntakeType === 'business'
          ? 'Business intake form'
          : 'Client intake form';
      default:
        return 'Client intake';
    }
  }, [activeIntakeType, mode]);

  const contextValue = useMemo(
    () => ({
      openClientIntake,
      closeClientIntake,
      openBusinessIntake,
      hasSubmitted,
      hasRegisteredBusiness,
      isOverlayOpen,
      isCheckingStatus,
      isCheckingBusinessStatus,
      clientSubmission,
      companyProfile,
      statusError,
      companyStatusError,
      refreshClientStatus: loadClientStatus,
      refreshCompanyStatus: loadCompanyStatus,
      submitBusinessIntake,
      hasCheckedBusinessStatus: hasCheckedCompanyStatus,
    }),
    [
      clientSubmission,
      closeClientIntake,
      companyProfile,
      companyStatusError,
      hasRegisteredBusiness,
      hasSubmitted,
      hasCheckedCompanyStatus,
      isCheckingBusinessStatus,
      isCheckingStatus,
      isOverlayOpen,
      openBusinessIntake,
      loadClientStatus,
      loadCompanyStatus,
      openClientIntake,
      statusError,
      submitBusinessIntake,
    ]
  );

  const renderOverlayContent = () => {
    const isBusinessFlow = activeIntakeType === 'business';
    const currentStatusError = isBusinessFlow ? companyStatusError : statusError;
    const loadingMessage = isBusinessFlow
      ? 'Checking your company registration status...'
      : 'Checking your submission status...';
    const retryErrorMessage = isBusinessFlow
      ? 'Something went wrong while checking your company registration. Please try again.'
      : 'Something went wrong while checking your intake status. Please try again.';
    const authTitle = isBusinessFlow
      ? 'Sign in to register your business'
      : 'Ready to join the Breakwaters network?';
    const authSubtitle = isBusinessFlow
      ? 'Create an account or sign in to register your company. We\u2019ll bring you back to the business intake after you log in.'
      : 'Create an account or sign in to submit your profile and start matching with new opportunities.';
    const alreadySubmittedTitle = isBusinessFlow
      ? 'You\u2019ve already registered your business'
      : 'Your intake is already submitted';
    const alreadySubmittedMessage = isBusinessFlow
      ? 'Your company details are already on file. You can review your profile any time.'
      : 'Thanks for sending your details. Our team is reviewing your information. If you need to make updates, please contact support and we\u2019ll help you out.';

    if (mode === 'auth') {
      return (
        <div className="home-auth">
          <h2 className="home-auth__title">{authTitle}</h2>
          <p className="home-auth__subtitle">{authSubtitle}</p>
          <div className="home-auth__actions">
            <button
              type="button"
              className="home-auth__button home-auth__button--primary"
              onClick={() => handleNavigate('/signup')}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="home-auth__button home-auth__button--secondary"
              onClick={() => handleNavigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'loading') {
      return (
        <div className="home-status home-status--loading">
          <div className="home-status__spinner" aria-hidden="true" />
          <p className="home-status__message">{loadingMessage}</p>
        </div>
      );
    }

    if (mode === 'status-error') {
      return (
        <div className="home-status home-status--error">
          <h2 className="home-status__title">
            {isBusinessFlow
              ? 'We couldn\u2019t confirm your business registration'
              : 'We could not confirm your submission'}
          </h2>
          <p className="home-status__message">
            {currentStatusError || retryErrorMessage}
          </p>
          <div className="home-status__actions">
            <button
              type="button"
              className="home-status__button home-status__button--primary"
              onClick={handleRetryStatus}
            >
              Try again
            </button>
            <button
              type="button"
              className="home-status__button"
              onClick={closeClientIntake}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'already-submitted') {
      return (
        <div className="home-status home-status--info">
          <h2 className="home-status__title">{alreadySubmittedTitle}</h2>
          <p className="home-status__message">{alreadySubmittedMessage}</p>
          <div className="home-status__actions">
            {isBusinessFlow ? (
              <>
                <button
                  type="button"
                  className="home-status__button home-status__button--primary"
                  onClick={() => handleNavigate('/business/profile')}
                >
                  View company profile
                </button>
                <button
                  type="button"
                  className="home-status__button"
                  onClick={closeClientIntake}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="home-status__button home-status__button--primary"
                  onClick={handleContactSupport}
                >
                  Contact Support
                </button>
                <button
                  type="button"
                  className="home-status__button"
                  onClick={closeClientIntake}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (mode === 'stepper') {
      if (activeIntakeType === 'business') {
        return <BusinessIntakeStepper onSubmitCompany={submitBusinessIntake} />;
      }

      return (
        <ClientIntakeStepper
          onSuccess={handleClientSubmissionSuccess}
          onComplete={closeClientIntake}
        />
      );
    }

    return null;
  };

  const contentClassName =
    mode === 'stepper'
      ? 'home-overlay__content home-overlay__content--stepper'
      : 'home-overlay__content';

  return (
    <ClientIntakeContext.Provider value={contextValue}>
      {children}
      {isOverlayOpen && (
        <div
          className="home-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
        >
          <div className="home-overlay__backdrop" onClick={closeClientIntake} aria-hidden="true" />
          <div
            className={contentClassName}
            role="document"
            ref={overlayContentRef}
            tabIndex={-1}
          >
            <header className="home-overlay__header">
              <h2 id={dialogTitleId} className="home-overlay__title">
                {overlayAriaLabel}
              </h2>
              <button
                type="button"
                className="home-overlay__close"
                aria-label="Close overlay"
                onClick={closeClientIntake}
                ref={closeButtonRef}
              >
                &times;
              </button>
            </header>
            <div className="home-overlay__body">{renderOverlayContent()}</div>
          </div>
        </div>
      )}
    </ClientIntakeContext.Provider>
  );
}

ClientIntakeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useClientIntake = () => useContext(ClientIntakeContext);
