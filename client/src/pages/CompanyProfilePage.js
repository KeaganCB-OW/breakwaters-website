import { useCallback, useContext, useEffect, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useClientIntake } from '../context/ClientIntakeContext';

const formatListValue = (value) => {
  if (!value) {
    return '—';
  }

  if (Array.isArray(value) && value.length > 0) {
    return value.join(', ');
  }

  return String(value);
};

export default function CompanyProfilePage() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    companyProfile,
    isCheckingBusinessStatus,
    companyStatusError,
    refreshCompanyStatus,
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

  const handleRegister = useCallback(() => {
    navigate('/register-business');
  }, [navigate]);

  const detailItems = useMemo(() => {
    if (!companyProfile) {
      return [];
    }

    return [
      { label: 'Company name', value: companyProfile.company_name },
      { label: 'Industry', value: companyProfile.industry },
      { label: 'Company email', value: companyProfile.email },
      { label: 'Phone number', value: companyProfile.phone_number },
      { label: 'Workforce size', value: companyProfile.workforce_size },
      { label: 'Location', value: companyProfile.location },
      { label: 'Roles hiring', value: companyProfile.available_roles },
      { label: 'Specifications', value: companyProfile.specifications },
      { label: 'Status', value: companyProfile.status },
    ];
  }, [companyProfile]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasCheckedBusinessStatus || isCheckingBusinessStatus) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--loading">
          <div className="home-status__spinner" aria-hidden="true" />
          <p className="home-status__message">Loading your company profile...</p>
        </section>
      </main>
    );
  }

  if (companyStatusError) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--error">
          <h1 className="home-status__title">We couldn&rsquo;t load your company profile</h1>
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
              onClick={handleRegister}
            >
              Register a business
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!companyProfile) {
    return (
      <main className="client-intake-page">
        <section className="home-status home-status--info">
          <h1 className="home-status__title">No business on file yet</h1>
          <p className="home-status__message">
            Register your company to connect with Breakwaters candidates.
          </p>
          <div className="home-status__actions">
            <button
              type="button"
              className="home-status__button home-status__button--primary"
              onClick={handleRegister}
            >
              Register your business
            </button>
            <button
              type="button"
              className="home-status__button"
              onClick={() => navigate('/')}
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
      <section className="home-status home-status--info">
        <h1 className="home-status__title">Your company profile</h1>
        <p className="home-status__message">
          These are the details Breakwaters uses when partnering with you on open roles.
        </p>
        <dl className="business-intake__summary">
          {detailItems.map(({ label, value }) => (
            <div className="business-intake__summary-item" key={label}>
              <dt>{label}</dt>
              <dd>{formatListValue(value)}</dd>
            </div>
          ))}
        </dl>
        <div className="home-status__actions">
          <button
            type="button"
            className="home-status__button home-status__button--primary"
            onClick={() => navigate('/')}
          >
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}
