import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchSharedClient } from '../../../services/shareService';
import '../../../styling/dashboard.css';
import '../../../styling/SharedClientDetails.css';

const STATUS_VARIANTS = {
  pending: { label: 'Pending', className: 'client-details__secondary-btn--pending' },
  assigned: { label: 'Assigned', className: 'client-details__secondary-btn--assigned' },
  'interview pending': {
    label: 'Interview Pending',
    className: 'client-details__secondary-btn--interview-pending',
  },
  'in progress': { label: 'In Progress', className: 'client-details__secondary-btn--in-progress' },
  interviewed: { label: 'Interviewed', className: 'client-details__secondary-btn--interviewed' },
  suggested: { label: 'Suggested', className: 'client-details__secondary-btn--suggested' },
  rejected: { label: 'Rejected', className: 'client-details__secondary-btn--rejected' },
};

const normaliseStatus = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim();

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

const splitSkills = (value) => {
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

const FieldRow = ({ label, value, fallback = 'Not provided', href }) => {
  const content = formatText(value);

  return (
    <div className="shared-client__field-row">
      <span className="shared-client__field-label">{label}</span>
      <span className="shared-client__field-value">
        {content ? (
          href ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            content
          )
        ) : (
          <span className="shared-client__field-placeholder">{fallback}</span>
        )}
      </span>
    </div>
  );
};

export function SharedClientDetails() {
  const { clientId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [state, setState] = useState({
    loading: true,
    error: '',
    data: null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!clientId) {
        if (isMounted) {
          setState({ loading: false, error: 'Missing client identifier.', data: null });
        }
        return;
      }

      if (!token) {
        if (isMounted) {
          setState({
            loading: false,
            error: 'This secure link is missing a token. Please use the link from your email.',
            data: null,
          });
        }
        return;
      }

      setState((previous) => ({ ...previous, loading: true, error: '' }));

      try {
        const result = await fetchSharedClient(clientId, token);
        if (isMounted) {
          setState({ loading: false, error: '', data: result });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            loading: false,
            error: error?.message || 'Failed to load client details.',
            data: null,
          });
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [clientId, token]);

  const statusVariant = useMemo(() => {
    const status = state.data?.client?.status;
    if (!status) {
      return STATUS_VARIANTS.pending;
    }

    const normalised = normaliseStatus(status);
    return STATUS_VARIANTS[normalised] || {
      label: status,
      className: STATUS_VARIANTS.pending.className,
    };
  }, [state.data?.client?.status]);

  const skillList = useMemo(() => splitSkills(state.data?.client?.skills), [state.data?.client?.skills]);

  const linkExpiry = useMemo(() => formatDateTime(state.data?.tokenExpiresAt), [state.data?.tokenExpiresAt]);

  const cv = state.data?.cv;
  const assignment = state.data?.assignment;
  const client = state.data?.client;

  const statusBadgeClassName = useMemo(() => {
    const modifier = statusVariant?.className || STATUS_VARIANTS.pending.className;
    return `shared-client__status-badge ${modifier}`;
  }, [statusVariant]);

  const linkedinHref = useMemo(() => {
    const raw = formatText(client?.linkedinUrl);
    if (!raw) {
      return '';
    }
    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }
    return `https://${raw}`;
  }, [client?.linkedinUrl]);

  const phoneHref = useMemo(() => {
    const raw = formatText(client?.phoneNumber);
    if (!raw) {
      return '';
    }
    return `tel:${raw.replace(/\s+/g, '')}`;
  }, [client?.phoneNumber]);

  return (
    <div className="dashboard shared-client">
      <div className="dashboard__background-image" />
      <div className="dashboard__overlay" />
      <div className="dashboard__content">
        <div className="dashboard__layout">
          <div className="dashboard__container">
            <section className="dashboard__panel shared-client__panel">
              <div className="dashboard__panel-body shared-client__panel-body">
                {state.loading && (
                  <div className="shared-client__state">Loading candidate profile...</div>
                )}

                {!state.loading && state.error && (
                  <div className="shared-client__state shared-client__state--error">
                    {state.error}
                  </div>
                )}

                {!state.loading && !state.error && client && (
                  <>
                    <header className="shared-client__header">
                      <div>
                        <h1 className="shared-client__title">{client.fullName || 'Candidate profile'}</h1>
                        {client.preferredRole && (
                          <p className="shared-client__subtitle">
                            Preferred role: <strong>{client.preferredRole}</strong>
                          </p>
                        )}
                      </div>

                      <span className={statusBadgeClassName}>{statusVariant?.label}</span>
                    </header>

                    <div className="shared-client__meta">
                      {assignment?.assignedAt && (
                        <span>
                          Suggested on&nbsp;
                          <strong>{formatDateTime(assignment.assignedAt)}</strong>
                        </span>
                      )}
                      {linkExpiry && (
                        <span>
                          Link valid until&nbsp;
                          <strong>{linkExpiry}</strong>
                        </span>
                      )}
                    </div>

                    <section className="shared-client__section">
                      <h2 className="shared-client__section-title">Candidate Details</h2>
                      <div className="shared-client__info-grid">
                        <div className="shared-client__card">
                          <h3>Contact</h3>
                          <FieldRow
                            label="Email"
                            value={client.email}
                            href={client.email ? `mailto:${client.email}` : undefined}
                          />
                          <FieldRow
                            label="Phone"
                            value={client.phoneNumber}
                            href={phoneHref || undefined}
                          />
                          <FieldRow label="Location" value={client.location} />
                          <FieldRow label="LinkedIn" value={client.linkedinUrl} href={linkedinHref || undefined} />
                        </div>
                        <div className="shared-client__card">
                          <h3>Profile</h3>
                          <FieldRow label="Preferred Role" value={client.preferredRole} />
                          <FieldRow label="Education" value={client.education} />
                          <FieldRow label="Experience" value={client.experience} />
                        </div>
                      </div>
                    </section>

                    <section className="shared-client__section">
                      <h2 className="shared-client__section-title">Top Skills</h2>
                      {skillList.length > 0 ? (
                        <ul className="shared-client__skill-list">
                          {skillList.map((skill) => (
                            <li key={skill} className="shared-client__skill-chip">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="shared-client__field-placeholder">Skills not provided.</p>
                      )}
                    </section>

                    <section className="shared-client__section">
                      <div className="shared-client__section-header">
                        <h2 className="shared-client__section-title">Candidate CV</h2>
                        {cv?.exists ? (
                          <a
                            className="shared-client__cta"
                            href={cv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View CV
                          </a>
                        ) : (
                          <span className="shared-client__field-placeholder">CV not available.</span>
                        )}
                      </div>

                      {cv?.exists && (
                        <div className="shared-client__cv-preview">
                          <iframe
                            title="Candidate CV preview"
                            src={`${cv.url}#toolbar=0`}
                            frameBorder="0"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedClientDetails;
