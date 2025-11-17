import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AppCardNav from '../layout/AppCardNav';
import { fetchSharedClient } from '../../../services/shareService';
import '../../../styling/dashboard.css';
import '../../../styling/ClientDetails.css';
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
            error: 'This secure link is missing a token. Please use the link sent to your inbox.',
            data: null,
          });
        }
        return;
      }

      try {
        const result = await fetchSharedClient(clientId, token);

        if (isMounted) {
          setState({ loading: false, error: '', data: result });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            loading: false,
            error: error?.message || 'Failed to load candidate details.',
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

  const client = state.data?.client;
  const assignment = state.data?.assignment;
  const cv = state.data?.cv;
  const linkExpiry = useMemo(() => {
    if (!state.data?.tokenExpiresAt) {
      return '';
    }
    const expires = new Date(state.data.tokenExpiresAt);
    return Number.isNaN(expires.getTime()) ? '' : formatDateTime(expires);
  }, [state.data]);

  const phoneHref = useMemo(() => buildPhoneHref(client?.phoneNumber), [client?.phoneNumber]);
  const linkedinHref = useMemo(() => buildLinkedInHref(client?.linkedinUrl), [client?.linkedinUrl]);

  const contactFields = useMemo(
    () => [
      { label: 'Email', value: client?.email, href: buildMailto(client?.email) },
      { label: 'Phone', value: client?.phoneNumber, href: phoneHref },
      { label: 'Location', value: client?.location },
      { label: 'LinkedIn', value: client?.linkedinUrl, href: linkedinHref },
    ],
    [client, linkedinHref, phoneHref]
  );

  const profileFields = useMemo(
    () => [
      { label: 'Preferred Role', value: client?.preferredRole },
      { label: 'Education', value: client?.education },
      { label: 'Experience', value: client?.experience },
      { label: 'Application Status', value: client?.status },
    ],
    [client]
  );

  const skillList = useMemo(() => splitSkills(client?.skills), [client]);
  const statusVariant = useMemo(() => {
    const normalised = normaliseStatus(client?.status || assignment?.status);
    return STATUS_VARIANTS[normalised] || STATUS_VARIANTS.pending;
  }, [assignment?.status, client?.status]);

  const statusBadgeClassName = ['client-details__secondary-btn', statusVariant?.className]
    .filter(Boolean)
    .join(' ');

  const renderFields = (fields) =>
    fields.map((field) => {
      const value = formatText(field.value);
      const href = field.href && formatText(field.href);

      return (
        <div className="client-details__field" key={field.label}>
          <span className="client-details__label">{field.label}</span>
          {value ? (
            href ? (
              <a
                className="shared-client__link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {value}
              </a>
            ) : (
              <p className="shared-client__value">{value}</p>
            )
          ) : (
            <p className="shared-client__placeholder">Not provided</p>
          )}
        </div>
      );
    });

  const renderPanelContent = () => {
    if (state.loading) {
      return <div className="shared-client__state">Loading candidate profile...</div>;
    }

    if (state.error) {
      return (
        <div className="shared-client__state shared-client__state--error">
          {state.error}
        </div>
      );
    }

    if (!client) {
      return (
        <div className="shared-client__state shared-client__state--error">
          Candidate information is unavailable for this link.
        </div>
      );
    }

    return (
      <>
        <div className="client-details__title shared-client__title-row">
          <div>
            <h1 className="dashboard__headline">{client.fullName || 'Candidate profile'}</h1>
            {client.preferredRole && (
              <p className="shared-client__subtitle">
                Preferred role:&nbsp;
                <strong>{client.preferredRole}</strong>
              </p>
            )}
          </div>
          <span className={statusBadgeClassName}>{statusVariant?.label}</span>
        </div>

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

        <div className="dashboard__divider" />

        <div className="client-details__columns">
          <div className="client-details__column">{renderFields(contactFields)}</div>
          <div className="client-details__column">{renderFields(profileFields)}</div>
        </div>

        <section className="shared-client__section">
          <div className="shared-client__section-heading">
            <h2 className="dashboard__section-title">Skills & strengths</h2>
          </div>
          {skillList.length > 0 ? (
            <ul className="shared-client__skill-list">
              {skillList.map((skill) => (
                <li key={skill} className="shared-client__skill-chip">
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="shared-client__placeholder">Skills not provided.</p>
          )}
        </section>

        <section className="shared-client__section">
          <div className="shared-client__section-heading">
            <h2 className="dashboard__section-title">Candidate CV</h2>
            {cv?.exists ? (
              <a
                className="client-details__cv-button"
                href={cv.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open CV
              </a>
            ) : (
              <span className="shared-client__placeholder">CV not available.</span>
            )}
          </div>

          {cv?.exists && (
            <div className="client-details__cv-frame shared-client__cv-frame">
              <iframe
                title="Candidate CV preview"
                src={`${cv.url}#toolbar=0`}
                loading="lazy"
              />
            </div>
          )}
        </section>
      </>
    );
  };

  return (
    <div className="dashboard shared-client-dashboard">
      <div className="dashboard__background-image" />
      <div className="dashboard__overlay" />
      <div className="dashboard__content">
        <AppCardNav />
        <div className="dashboard__layout">
          <div className="dashboard__container">
            <section className="dashboard__panel">
              <div className="dashboard__panel-body shared-client__panel-body">
                {renderPanelContent()}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedClientDetails;

