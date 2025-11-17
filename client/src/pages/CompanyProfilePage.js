import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AppCardNav from '../components/ui/layout/AppCardNav';
import { AuthContext } from '../context/AuthContext';
import { useClientIntake } from '../context/ClientIntakeContext';
import { fetchCompanyCandidates } from '../services/companyService';
import { CLIENT_STATUS_VARIANTS, getClientStatusLabel, normaliseClientStatus } from '../constants/clientStatuses';
import PageMeta from '../components/seo/PageMeta';
import '../styling/dashboard.css';
import '../styling/ClientDetails.css';
import '../styling/CompanyProfilePage.css';

const formatText = (value) => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value).trim();
};

const buildMailto = (value) => {
  const trimmed = formatText(value);
  return trimmed ? `mailto:${trimmed}` : '';
};

const buildPhoneHref = (value) => {
  const trimmed = formatText(value);
  if (!trimmed) {
    return '';
  }

  const normalised = trimmed.replace(/[^\d+]/g, '');
  return normalised ? `tel:${normalised}` : '';
};

const buildLinkedInHref = (value) => {
  const trimmed = formatText(value);
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const splitList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatText(item)).filter(Boolean);
  }

  return String(value)
    .split(/[,/|;]/)
    .map((item) => formatText(item))
    .filter(Boolean);
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function CompanyProfilePage() {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    companyProfile,
    isCheckingBusinessStatus,
    companyStatusError,
    refreshCompanyStatus,
    hasCheckedBusinessStatus,
  } = useClientIntake();

  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState('');

  useEffect(() => {
    if (user && !hasCheckedBusinessStatus && !isCheckingBusinessStatus) {
      refreshCompanyStatus().catch(() => {});
    }
  }, [user, hasCheckedBusinessStatus, isCheckingBusinessStatus, refreshCompanyStatus]);

  const loadSuggestions = useCallback(async () => {
    if (!token) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    setSuggestionsError('');

    try {
      const data = await fetchCompanyCandidates(token);
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (error) {
      setSuggestionsError(error?.message || 'Failed to load suggested clients.');
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [token]);

  useEffect(() => {
    if (companyProfile && token) {
      loadSuggestions().catch(() => {});
    }
  }, [companyProfile, loadSuggestions, token]);

  const handleRetry = useCallback(() => {
    refreshCompanyStatus().catch(() => {});
  }, [refreshCompanyStatus]);

  const handleRegister = useCallback(() => {
    navigate('/register-business');
  }, [navigate]);

  const handleRefreshSuggestions = useCallback(() => {
    loadSuggestions().catch(() => {});
  }, [loadSuggestions]);

  const meta = (
    <PageMeta
      title="Business Profile | Breakwaters Recruitment Partner Dashboard"
      description="Review the information Breakwaters Recruitment keeps on file for your company, including hiring needs, contact details, and suggested candidates."
      canonical="https://breakwatersrecruitment.co.za/business/profile"
    />
  );

  const suggestionCards = useMemo(
    () =>
      suggestions.map((suggestion) => {
        const statusValue = suggestion.clientStatus || suggestion.assignmentStatus;
        const normalised = normaliseClientStatus(statusValue);
        const variant = CLIENT_STATUS_VARIANTS[normalised] || CLIENT_STATUS_VARIANTS.pending;

        return {
          id: suggestion.assignmentId || suggestion.clientId,
          fullName: suggestion.fullName || `Client #${suggestion.clientId}`,
          preferredRole: formatText(suggestion.preferredRole),
          statusLabel: getClientStatusLabel(statusValue),
          statusClassName: ['client-details__secondary-btn', variant.className]
            .filter(Boolean)
            .join(' '),
          assignedAt: formatDateTime(suggestion.assignedAt),
          skillList: splitList(suggestion.skills),
          email: formatText(suggestion.email),
          phone: formatText(suggestion.phoneNumber),
          emailHref: buildMailto(suggestion.email),
          phoneHref: buildPhoneHref(suggestion.phoneNumber),
          location: formatText(suggestion.location),
        };
      }),
    [suggestions]
  );

  if (!user) {
    return (
      <>
        {meta}
        <Navigate to="/login" replace state={{ from: location }} />
      </>
    );
  }

  if (!hasCheckedBusinessStatus || isCheckingBusinessStatus) {
    return (
      <main className="client-intake-page">
        {meta}
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
        {meta}
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
        {meta}
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

  const companyFieldsLeft = [
    { label: 'Company name', value: companyProfile.company_name },
    { label: 'Industry', value: companyProfile.industry },
    { label: 'Company email', value: companyProfile.email, href: buildMailto(companyProfile.email) },
    { label: 'Phone number', value: companyProfile.phone_number, href: buildPhoneHref(companyProfile.phone_number) },
    { label: 'LinkedIn', value: companyProfile.linkedin_url, href: buildLinkedInHref(companyProfile.linkedin_url) },
  ];

  const companyFieldsRight = [
    { label: 'Workforce size', value: companyProfile.workforce_size },
    { label: 'Location', value: companyProfile.location },
    { label: 'Status', value: companyProfile.status },
  ];

  const renderField = (field) => {
    const value = formatText(field.value);
    const href = field.href && formatText(field.href);

    return (
      <div className="client-details__field" key={field.label}>
        <span className="client-details__label">{field.label}</span>
        {value ? (
          href ? (
            <a
              className="company-profile__link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {value}
            </a>
          ) : (
            <p className="company-profile__value">{value}</p>
          )
        ) : (
          <p className="company-profile__placeholder">Not provided</p>
        )}
      </div>
    );
  };

  const rolesList = splitList(companyProfile.available_roles);
  const companyStatusLabel = formatText(companyProfile.status) || 'Pending';

  return (
    <div className="dashboard company-profile-dashboard">
      {meta}
      <div className="dashboard__background-image" />
      <div className="dashboard__overlay" />
      <div className="dashboard__content">
        <AppCardNav />
        <div className="dashboard__layout">
          <div className="dashboard__container">
            <section className="dashboard__panel">
              <div className="dashboard__panel-body">
                <div className="dashboard__welcome company-profile__header">
                  <div className="client-details__title">
                    <h1 className="dashboard__headline">Your company profile</h1>
                  </div>
                  <span className="company-profile__status-tag">
                    Status:&nbsp;
                    <strong>{companyStatusLabel}</strong>
                  </span>
                </div>
                <p className="dashboard__status-text">
                  These are the details Breakwaters uses when partnering with you on open roles.
                </p>

                <div className="dashboard__main-grid company-profile__grid">
                  <section className="dashboard__candidate-panel company-profile__panel">
                    <div className="dashboard__section">
                      <div className="dashboard__section-heading">
                        <h2 className="dashboard__section-title">{companyProfile.company_name}</h2>
                      </div>
                      <div className="dashboard__divider" />
                      <div className="client-details__columns">
                        <div className="client-details__column">
                          {companyFieldsLeft.map(renderField)}
                        </div>
                        <div className="client-details__column">
                          {companyFieldsRight.map(renderField)}
                        </div>
                      </div>

                      <section className="company-profile__roles-section">
                        <h3>Roles hiring</h3>
                        {rolesList.length > 0 ? (
                          <ul className="company-profile__pills">
                            {rolesList.map((role) => (
                              <li key={role} className="company-profile__pill">
                                {role}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="company-profile__placeholder">No roles listed.</p>
                        )}
                      </section>

                      <section className="company-profile__specifications">
                        <h3>Specifications</h3>
                        {formatText(companyProfile.specifications) ? (
                          <p className="company-profile__value">{companyProfile.specifications}</p>
                        ) : (
                          <p className="company-profile__placeholder">No specifications provided.</p>
                        )}
                      </section>
                    </div>
                  </section>

                  <section className="dashboard__assignments-panel company-profile__suggestions">
                    <div className="dashboard__section">
                      <div className="company-profile__suggestions-header">
                        <h2 className="dashboard__section-title">Suggested clients</h2>
                        <button
                          type="button"
                          className="company-profile__refresh-btn"
                          onClick={handleRefreshSuggestions}
                          disabled={isLoadingSuggestions}
                        >
                          {isLoadingSuggestions ? 'Refreshing...' : 'Refresh'}
                        </button>
                      </div>

                      {suggestionsError && (
                        <p className="dashboard__status-text dashboard__status-text--error">
                          {suggestionsError}
                        </p>
                      )}

                      {!suggestionsError && suggestionCards.length === 0 && !isLoadingSuggestions && (
                        <p className="company-profile__placeholder">
                          No clients have been suggested to your company yet.
                        </p>
                      )}

                      <div className="company-profile__suggestions-list">
                        {suggestionCards.map((candidate) => (
                          <article className="company-profile__candidate-card" key={candidate.id}>
                            <header className="company-profile__candidate-header">
                              <div>
                                <h3>{candidate.fullName}</h3>
                                {candidate.preferredRole && (
                                  <p>Preferred role: {candidate.preferredRole}</p>
                                )}
                                {candidate.assignedAt && (
                                  <p className="company-profile__candidate-meta">
                                    Suggested on {candidate.assignedAt}
                                  </p>
                                )}
                              </div>
                              <span className={candidate.statusClassName}>{candidate.statusLabel}</span>
                            </header>

                            {candidate.skillList.length > 0 && (
                              <ul className="company-profile__pills company-profile__pills--compact">
                                {candidate.skillList.map((skill) => (
                                  <li key={skill} className="company-profile__pill">
                                    {skill}
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="company-profile__candidate-contact">
                              {candidate.email && (
                                <a
                                  className="company-profile__link"
                                  href={candidate.emailHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {candidate.email}
                                </a>
                              )}
                              {candidate.phone && (
                                <a className="company-profile__link" href={candidate.phoneHref}>
                                  {candidate.phone}
                                </a>
                              )}
                              {candidate.location && (
                                <p className="company-profile__value">{candidate.location}</p>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
