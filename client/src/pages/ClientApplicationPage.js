import { useCallback, useContext, useEffect, useMemo } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import AppCardNav from '../components/ui/layout/AppCardNav';
import PageMeta from '../components/seo/PageMeta';
import { CLIENT_STATUS_VARIANTS, getClientStatusLabel, normaliseClientStatus } from '../constants/clientStatuses';
import { AuthContext } from '../context/AuthContext';
import { useClientIntake } from '../context/ClientIntakeContext';
import '../styling/dashboard.css';
import '../styling/ClientDetails.css';
import '../styling/ClientApplicationPage.css';

const STATUS_GUIDANCE = {
  pending: 'We are reviewing your information and matching it with upcoming opportunities.',
  'in progress': 'A recruitment officer is actively pairing you with the right assignments.',
  suggested: 'We have shared your profile with a partner company and will relay their feedback.',
  'interview pending': 'We are coordinating the interview logistics and will confirm the details shortly.',
  interviewed: 'Thanks for interviewing! We are waiting on feedback from the company.',
  assigned: 'You have been matched with an assignment. Expect logistical next steps soon.',
  rejected: 'This opportunity did not move forward, but we will keep searching for better fits.',
  default: 'Our recruitment team will keep you informed about every next step.',
};

const splitList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(/[,/|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatText = (value) => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value).trim();
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const dateInstance = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(dateInstance.getTime())) {
    return '';
  }

  return dateInstance.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const mailtoHref = (value) => {
  const trimmed = formatText(value);
  return trimmed ? `mailto:${trimmed}` : '';
};

const telHref = (value) => {
  const trimmed = formatText(value);
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : '';
};

const linkedinHref = (value) => {
  const trimmed = formatText(value);
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const StatusBadge = ({ status }) => {
  const normalized = normaliseClientStatus(status);
  const variant = CLIENT_STATUS_VARIANTS[normalized] || CLIENT_STATUS_VARIANTS.pending;
  const className = ['client-details__secondary-btn', variant.className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={className}>
      {getClientStatusLabel(status)}
    </span>
  );
};

export default function ClientApplicationPage() {
  const { clientId } = useParams();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const {
    clientSubmission,
    refreshClientStatus,
    isCheckingStatus,
    statusError,
    hasSubmitted,
    openClientIntake,
  } = useClientIntake();

  useEffect(() => {
    if (user) {
      refreshClientStatus().catch(() => {});
    }
  }, [refreshClientStatus, user]);

  const routeClientId = clientId ? String(clientId) : '';
  const submissionClientId = clientSubmission?.id != null ? String(clientSubmission.id) : '';
  const idsMatch = routeClientId && submissionClientId ? routeClientId === submissionClientId : Boolean(clientSubmission);

  const submittedAt = useMemo(() => formatDate(clientSubmission?.createdAt), [clientSubmission]);
  const skills = useMemo(() => splitList(clientSubmission?.skills), [clientSubmission]);
  const statusMessage = useMemo(() => {
    const normalized = normaliseClientStatus(clientSubmission?.status);
    return STATUS_GUIDANCE[normalized] || STATUS_GUIDANCE.default;
  }, [clientSubmission]);

  const handleRetry = useCallback(() => {
    refreshClientStatus().catch(() => {});
  }, [refreshClientStatus]);

  const handleOpenIntake = useCallback(() => {
    openClientIntake();
  }, [openClientIntake]);

  if (!user) {
    return (
      <>
        <PageMeta
          title="View Your Application | Breakwaters Recruitment"
          description="Check the latest status of your Breakwaters application and review the details our recruitment team has on file."
        />
        <Navigate to="/login" replace state={{ from: location }} />
      </>
    );
  }

  if (isCheckingStatus && !clientSubmission) {
    return (
      <main className="client-application-page">
        <PageMeta
          title="View Your Application | Breakwaters Recruitment"
          description="Check the latest status of your Breakwaters application and review the details our recruitment team has on file."
        />
        <div className="client-application-page__content">
          <AppCardNav />
          <section className="client-application-card">
            <div className="client-application__state client-application__state--loading">
              Checking your application details...
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (statusError && !clientSubmission) {
    return (
      <main className="client-application-page">
        <PageMeta
          title="View Your Application | Breakwaters Recruitment"
          description="Check the latest status of your Breakwaters application and review the details our recruitment team has on file."
        />
        <div className="client-application-page__content">
          <AppCardNav />
          <section className="client-application-card">
            <div className="client-application__state client-application__state--error">
              <p>{statusError}</p>
              <button type="button" className="client-application__primary-btn" onClick={handleRetry}>
                Try again
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!clientSubmission || !hasSubmitted) {
    return (
      <main className="client-application-page">
        <PageMeta
          title="View Your Application | Breakwaters Recruitment"
          description="Check the latest status of your Breakwaters application and review the details our recruitment team has on file."
        />
        <div className="client-application-page__content">
          <AppCardNav />
          <section className="client-application-card">
            <div className="client-application__state">
              <h1>No submission on file yet</h1>
              <p>Submit your details to view your application progress any time.</p>
              <button type="button" className="client-application__primary-btn" onClick={handleOpenIntake}>
                Start application
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!idsMatch) {
    return (
      <main className="client-application-page">
        <PageMeta
          title="View Your Application | Breakwaters Recruitment"
          description="Check the latest status of your Breakwaters application and review the details our recruitment team has on file."
        />
        <div className="client-application-page__content">
          <AppCardNav />
          <section className="client-application-card">
            <div className="client-application__state client-application__state--error">
              <h1>This link doesn&rsquo;t match your application</h1>
              <p>Please sign in with the account used for this application or contact support.</p>
              <div className="client-application__state-actions">
                <button type="button" className="client-application__primary-btn" onClick={handleRetry}>
                  Refresh status
                </button>
                <a className="client-application__secondary-btn" href="mailto:support@breakwaters.com">
                  Contact support
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const leftFields = [
    {
      label: 'Full name',
      value: formatText(clientSubmission.fullName),
    },
    {
      label: 'Email',
      value: formatText(clientSubmission.email),
      href: mailtoHref(clientSubmission.email),
    },
    {
      label: 'Phone',
      value: formatText(clientSubmission.phoneNumber),
      href: telHref(clientSubmission.phoneNumber),
    },
    {
      label: 'Location',
      value: formatText(clientSubmission.location),
    },
  ];

  const rightFields = [
    {
      label: 'Preferred role',
      value: formatText(clientSubmission.preferredRole),
    },
    {
      label: 'Education',
      value: formatText(clientSubmission.education),
    },
    {
      label: 'Experience',
      value: formatText(clientSubmission.experience),
    },
    {
      label: 'LinkedIn',
      value: formatText(clientSubmission.linkedinUrl),
      href: linkedinHref(clientSubmission.linkedinUrl),
    },
  ];

  return (
    <main className="client-application-page">
      <PageMeta
        title="View Your Application | Breakwaters Recruitment"
        description="Check the latest status of your Breakwaters application and review the details our recruitment team has on file."
      />
      <div className="client-application-page__content">
        <AppCardNav />
        <section className="client-application-card">
          <header className="client-application__header">
            <div>
              <p className="client-application__eyebrow">Application overview</p>
              <h1>{clientSubmission.fullName || 'Your profile'}</h1>
              {clientSubmission.preferredRole && (
                <p className="client-application__subtitle">
                  Preferred role: <strong>{clientSubmission.preferredRole}</strong>
                </p>
              )}
            </div>
            <div className="client-application__status">
              <StatusBadge status={clientSubmission.status} />
              <span className="client-application__status-meta">
                Last updated {submittedAt || 'recently'}
              </span>
            </div>
          </header>

          <p className="client-application__status-note">{statusMessage}</p>

          <div className="client-application__meta">
            <div>
              <span className="client-application__meta-label">Application ID</span>
              <p className="client-application__meta-value">#{submissionClientId}</p>
            </div>
            {submittedAt && (
              <div>
                <span className="client-application__meta-label">Submitted</span>
                <p className="client-application__meta-value">{submittedAt}</p>
              </div>
            )}
            <div>
              <span className="client-application__meta-label">Need to update?</span>
              <p className="client-application__meta-value">Email support@breakwaters.com</p>
            </div>
          </div>

          <div className="client-application__grid">
            <div className="client-application__column">
              {leftFields.map((field) => (
                <div key={field.label} className="client-application__field">
                  <span className="client-application__field-label">{field.label}</span>
                  {field.value ? (
                    field.href ? (
                      <a
                        className="client-application__field-link"
                        href={field.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {field.value}
                      </a>
                    ) : (
                      <p className="client-application__field-value">{field.value}</p>
                    )
                  ) : (
                    <p className="client-application__field-placeholder">Not provided</p>
                  )}
                </div>
              ))}
            </div>
            <div className="client-application__column">
              {rightFields.map((field) => (
                <div key={field.label} className="client-application__field">
                  <span className="client-application__field-label">{field.label}</span>
                  {field.value ? (
                    field.href ? (
                      <a
                        className="client-application__field-link"
                        href={field.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {field.value}
                      </a>
                    ) : (
                      <p className="client-application__field-value">{field.value}</p>
                    )
                  ) : (
                    <p className="client-application__field-placeholder">Not provided</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <section className="client-application__skills">
            <div className="client-application__section-heading">
              <h2>Skills & strengths</h2>
              <button type="button" className="client-application__secondary-btn" onClick={handleRetry}>
                Refresh status
              </button>
            </div>
            {skills.length > 0 ? (
              <ul className="client-application__skill-list">
                {skills.map((skill) => (
                  <li key={skill} className="client-application__skill-chip">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="client-application__field-placeholder">No skills listed.</p>
            )}
          </section>

          <div className="client-application__actions">
            <a className="client-application__secondary-btn" href="mailto:support@breakwaters.com">
              Contact support
            </a>
            <button type="button" className="client-application__primary-btn" onClick={handleOpenIntake}>
              Update my details
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

