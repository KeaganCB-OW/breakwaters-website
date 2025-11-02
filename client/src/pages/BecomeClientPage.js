import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientIntakeStepper from '../components/ui/forms/ClientIntakeStepper';
import { AuthContext } from '../context/AuthContext';
import { useClientIntake } from '../context/ClientIntakeContext';

export default function BecomeClientPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const {
    hasSubmitted,
    isCheckingStatus,
    statusError,
    refreshClientStatus,
  } = useClientIntake();

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
    refreshClientStatus().catch(() => {});
  }, [refreshClientStatus]);

  const handleContactSupport = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:support@breakwaters.com';
    }
  }, []);

  if (!user) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--info">
          <h1 className="home-status__title">Let&rsquo;s get you signed in first</h1>
          <p className="home-status__message">
            Create an account or sign in to submit your profile. Once you&rsquo;re in, you can complete the intake form.
          </p>
          <div className="home-status__actions">
            <button
              type="button"
              className="home-status__button home-status__button--primary"
              onClick={() => handleNavigate('/signup')}
            >
              Sign Up
            </button>
            <button
              type="button"
              className="home-status__button"
              onClick={() => handleNavigate('/login')}
            >
              Sign In
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (isCheckingStatus) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--loading">
          <div className="home-status__spinner" aria-hidden="true" />
          <p className="home-status__message">Loading your submission status...</p>
        </section>
      </main>
    );
  }

  if (statusError) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--error">
          <h1 className="home-status__title">We couldn&rsquo;t load your submission</h1>
          <p className="home-status__message">
            {statusError}
          </p>
          <div className="home-status__actions">
            <button
              type="button"
              className="home-status__button home-status__button--primary"
              onClick={handleRetry}
            >
              Try again
            </button>
            <button
              type="button"
              className="home-status__button"
              onClick={() => handleNavigate('/')}
            >
              Go home
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (hasSubmitted) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--info">
          <h1 className="home-status__title">You&rsquo;re already in our queue</h1>
          <p className="home-status__message">
            Thanks for submitting your details. If anything changes or you need to update your information,
            contact our support crew and we&rsquo;ll take care of it.
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
              onClick={() => handleNavigate('/')}
            >
              Back to home
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="client-intake-page">
      <ClientIntakeStepper />
    </main>
  );
}
