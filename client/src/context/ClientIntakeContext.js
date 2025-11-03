import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { fetchCurrentClient } from '../services/clientService';
import ClientIntakeStepper from '../components/ui/forms/ClientIntakeStepper';
import BusinessIntakeStepper from '../components/ui/forms/BusinessIntakeStepper';
import '../styling/ClientIntakeOverlay.css';

const noop = () => {};

export const ClientIntakeContext = createContext({
  openClientIntake: noop,
  openBusinessIntake: noop,
  closeClientIntake: noop,
  hasSubmitted: false,
  isOverlayOpen: false,
  isCheckingStatus: false,
  clientSubmission: null,
  refreshClientStatus: noop,
});

export function ClientIntakeProvider({ children }) {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [mode, setMode] = useState('closed'); // closed | loading | auth | stepper | already-submitted | status-error
  const [clientSubmission, setClientSubmission] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [activeIntakeType, setActiveIntakeType] = useState('client'); // client | business

  const isOverlayOpen = mode !== 'closed';
  const hasSubmitted = Boolean(clientSubmission);

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

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOverlayOpen]);

  useEffect(() => {
    if (mode !== 'loading' || isCheckingStatus) {
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
  }, [clientSubmission, isCheckingStatus, mode, statusError]);

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
    setMode('stepper');
  }, []);

  const handleSubmissionSuccess = useCallback((submission) => {
    setClientSubmission(submission || { status: 'pending' });
    setHasCheckedStatus(true);
  }, []);

  const handleRetryStatus = useCallback(() => {
    setMode('loading');
    loadClientStatus().catch(() => {});
  }, [loadClientStatus]);

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
        return 'Submission already completed';
      case 'loading':
        return 'Checking submission status';
      case 'status-error':
        return 'Submission status unavailable';
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
      isOverlayOpen,
      isCheckingStatus,
      clientSubmission,
      statusError,
      refreshClientStatus: loadClientStatus,
    }),
    [
      clientSubmission,
      closeClientIntake,
      hasSubmitted,
      isCheckingStatus,
      isOverlayOpen,
      openBusinessIntake,
      loadClientStatus,
      openClientIntake,
      statusError,
    ]
  );

  const renderOverlayContent = () => {
    if (mode === 'auth') {
      return (
        <div className="home-auth">
          <h2 className="home-auth__title">
            Ready to join the Breakwaters network?
          </h2>
          <p className="home-auth__subtitle">
            Create an account or sign in to submit your profile and start matching with new opportunities.
          </p>
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
          <p className="home-status__message">Checking your submission status...</p>
        </div>
      );
    }

    if (mode === 'status-error') {
      return (
        <div className="home-status home-status--error">
          <h2 className="home-status__title">We could not confirm your submission</h2>
          <p className="home-status__message">
            {statusError || 'Something went wrong while checking your intake status. Please try again.'}
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
          <h2 className="home-status__title">Your intake is already submitted</h2>
          <p className="home-status__message">
            Thanks for sending your details. Our team is reviewing your information.
            If you need to make updates, please contact support and we&apos;ll help you out.
          </p>
          <div className="home-status__actions">
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
          </div>
        </div>
      );
    }

    if (mode === 'stepper') {
      if (activeIntakeType === 'business') {
        return <BusinessIntakeStepper />;
      }

      return <ClientIntakeStepper onSuccess={handleSubmissionSuccess} />;
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
        <div className="home-overlay" role="dialog" aria-modal="true" aria-label={overlayAriaLabel}>
          <div className="home-overlay__backdrop" onClick={closeClientIntake} aria-hidden="true" />
          <div className={contentClassName} role="document">
            <button
              type="button"
              className="home-overlay__close"
              aria-label="Close overlay"
              onClick={closeClientIntake}
            >
              &times;
            </button>
            {renderOverlayContent()}
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
