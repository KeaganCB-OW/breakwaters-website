import { useCallback, useContext, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import BusinessIntakeStepper from '../components/ui/forms/BusinessIntakeStepper';
import { AuthContext } from '../context/AuthContext';
import { useClientIntake } from '../context/ClientIntakeContext';

export default function RegisterBusinessPage() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    hasRegisteredBusiness,
    isCheckingBusinessStatus,
    companyStatusError,
    refreshCompanyStatus,
    submitBusinessIntake,
    hasCheckedBusinessStatus,
  } = useClientIntake();

  useEffect(() => {
    if (user && !hasCheckedBusinessStatus && !isCheckingBusinessStatus) {
      refreshCompanyStatus().catch(() => {});
    }
  }, [user, hasCheckedBusinessStatus, isCheckingBusinessStatus, refreshCompanyStatus]);

  const handleRetry = useCallback(() => {
    refreshCompanyStatus().catch(() => {});
  }, [refreshCompanyStatus]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (hasRegisteredBusiness) {
    return <Navigate to="/business/profile" replace />;
  }

  if (!hasCheckedBusinessStatus || isCheckingBusinessStatus) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--loading">
          <div className="home-status__spinner" aria-hidden="true" />
          <p className="home-status__message">Checking your company registration status...</p>
        </section>
      </main>
    );
  }

  if (companyStatusError) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--error">
          <h1 className="home-status__title">We couldn&rsquo;t load your company registration</h1>
          <p className="home-status__message">
            {companyStatusError}
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
              onClick={handleGoHome}
            >
              Go home
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="client-intake-page">
      <BusinessIntakeStepper onSubmitCompany={submitBusinessIntake} />
    </main>
  );
}
