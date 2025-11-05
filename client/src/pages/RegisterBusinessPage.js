import { useCallback, useContext, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import BusinessIntakeStepper from '../components/ui/forms/BusinessIntakeStepper';
import { AuthContext } from '../context/AuthContext';
import { useClientIntake } from '../context/ClientIntakeContext';
import PageMeta from '../components/seo/PageMeta';

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

  const meta = (
    <PageMeta
      title="Register Your Business | Breakwaters Recruitment"
      description="Create a Breakwaters Recruitment business account to request curated talent pipelines, review candidate matches, and accelerate hiring."
      canonical="https://breakwatersrecruitment.co.za/register-business"
    />
  );

  if (!user) {
    return (
      <>
        {meta}
        <Navigate to="/login" replace state={{ from: location }} />
      </>
    );
  }

  if (hasRegisteredBusiness) {
    return (
      <>
        {meta}
        <Navigate to="/business/profile" replace />
      </>
    );
  }

  if (!hasCheckedBusinessStatus || isCheckingBusinessStatus) {
    return (
      <main className="client-intake-page">
        {meta}
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
        {meta}
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
      {meta}
      <BusinessIntakeStepper onSubmitCompany={submitBusinessIntake} />
    </main>
  );
}
