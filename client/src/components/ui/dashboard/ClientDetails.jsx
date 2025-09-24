import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';import { FaArrowLeftLong } from 'react-icons/fa6';
import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { DashboardAvatar } from './DashboardAvatar';
import { fetchClients } from '../../../services/clientService';
import { fetchAssignments } from '../../../services/assignmentService';
import { fetchCompanyStats } from '../../../services/companyService';
import '../../../styling/ClientDetails.css';

const STATUS_VARIANTS = {
  pending: { label: 'Pending', className: 'client-details__secondary-btn--pending' },
  assigned: { label: 'Assigned', className: 'client-details__secondary-btn--assigned' },
  'interview pending': { label: 'Interview Pending', className: 'client-details__secondary-btn--interview-pending' },
  'in progress': { label: 'In Progress', className: 'client-details__secondary-btn--in-progress' },
  interviewed: { label: 'Interviewed', className: 'client-details__secondary-btn--interviewed' }
};

export function ClientDetails() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);

  const [companyStats, setCompanyStats] = useState({ total: 0, newThisWeek: 0, unverified: 0 });
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCandidates = async () => {
      try {
        const data = await fetchClients();
        if (isMounted) {
          setCandidates(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setCandidates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCandidates(false);
        }
      }
    };

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCompanyStats = async () => {
      try {
        const data = await fetchCompanyStats();
        if (isMounted) {
          const total = Number(data?.total ?? 0);
          const newThisWeek = Number(data?.newThisWeek ?? 0);
          const unverified = Number(data?.unverified ?? 0);

          setCompanyStats({
            total: Number.isNaN(total) ? 0 : total,
            newThisWeek: Number.isNaN(newThisWeek) ? 0 : newThisWeek,
            unverified: Number.isNaN(unverified) ? 0 : unverified
          });
          setCompanyError(null);
        }
      } catch (error) {
        if (isMounted) {
          setCompanyError(error.message || 'Failed to load company stats');
          setCompanyStats({ total: 0, newThisWeek: 0, unverified: 0 });
        }
      } finally {
        if (isMounted) {
          setIsLoadingCompanies(false);
        }
      }
    };

    loadCompanyStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAssignments = async () => {
      try {
        const data = await fetchAssignments();
        if (isMounted) {
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setAssignments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAssignments(false);
        }
      }
    };

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  const startOfWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diffToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const candidatesAddedThisWeek = useMemo(() => {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return 0;
    }

    return candidates.filter((candidate) => {
      if (!candidate.createdAt) {
        return false;
      }

      const createdAtDate = new Date(candidate.createdAt);
      if (Number.isNaN(createdAtDate.getTime())) {
        return false;
      }

      return createdAtDate >= startOfWeek;
    }).length;
  }, [candidates, startOfWeek]);

  const assignmentsAddedThisWeek = useMemo(() => {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return 0;
    }

    return assignments.filter((assignment) => {
      if (!assignment.assignedAt) {
        return false;
      }

      const assignedAtDate = new Date(assignment.assignedAt);
      if (Number.isNaN(assignedAtDate.getTime())) {
        return false;
      }

      return assignedAtDate >= startOfWeek;
    }).length;
  }, [assignments, startOfWeek]);

  const candidateCountDisplay = isLoadingCandidates ? 'N/A' : String(candidates.length);
  const candidateWeekSubtitle = isLoadingCandidates ? 'Loading...' : `${candidatesAddedThisWeek} new this week`;

  let companyCountDisplay = 'N/A';
  let companySubtitle = 'Loading...';

  if (companyError) {
    companyCountDisplay = 'Error';
    companySubtitle = companyError;
  } else if (!isLoadingCompanies) {
    companyCountDisplay = String(companyStats.total);
    companySubtitle = `${companyStats.newThisWeek} new this week | ${companyStats.unverified} unverified`;
  }

  const assignmentCountDisplay = isLoadingAssignments ? 'N/A' : String(assignments.length);
  const assignmentWeekSubtitle = isLoadingAssignments ? 'Loading...' : `${assignmentsAddedThisWeek} new this week`;

  const selectedCandidate = useMemo(() => {
    if (!clientId || !Array.isArray(candidates)) {
      return null;
    }

    return (
      candidates.find((candidate) => {
        const candidateIdentifier = candidate.id ?? candidate._id ?? candidate.clientId;
        return candidateIdentifier != null && String(candidateIdentifier) === clientId;
      }) || null
    );
  }, [candidates, clientId]);

  const clientLabel = useMemo(() => {
    if (!clientId) {
      return null;
    }

    if (selectedCandidate?.fullName) {
      return selectedCandidate.fullName;
    }

    return `Client ${clientId}`;
  }, [clientId, selectedCandidate]);

  const candidateRole = useMemo(() => {
    if (!selectedCandidate) {
      return null;
    }

    return (
      selectedCandidate.preferredRole ||
      selectedCandidate.role ||
      selectedCandidate.currentRole ||
      null
    );
  }, [selectedCandidate]);

  const selectedCandidateStatus = selectedCandidate?.status;

  const { label: statusLabel, className: statusClassName } = useMemo(() => {
    const pendingStatus = STATUS_VARIANTS.pending;

    if (isLoadingCandidates) {
      return {
        label: 'Loading...',
        className: pendingStatus.className
      };
    }

    const rawStatus = typeof selectedCandidateStatus === 'string' ? selectedCandidateStatus.trim() : '';

    if (!rawStatus) {
      return pendingStatus;
    }

    const normalizedStatus = rawStatus.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const matchedStatus = STATUS_VARIANTS[normalizedStatus];

    if (matchedStatus) {
      return matchedStatus;
    }

    return {
      label: rawStatus,
      className: pendingStatus.className
    };
  }, [isLoadingCandidates, selectedCandidateStatus]);

  const secondaryButtonClassName = `client-details__secondary-btn ${statusClassName}`;

  const fallbackText = 'Not provided';

  const normaliseValue = (value) => {
    if (value == null) {
      return '';
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => normaliseValue(item))
        .filter(Boolean)
        .join(', ');
    }

    if (typeof value === 'object') {
      return Object.values(value || {})
        .map((item) => normaliseValue(item))
        .filter(Boolean)
        .join(', ');
    }

    return String(value).trim();
  };

  const formatUrl = (value) => {
    const normalised = normaliseValue(value);
    if (!normalised) {
      return '';
    }

    if (/^https?:\/\//i.test(normalised)) {
      return normalised;
    }

    return `https://${normalised}`;
  };

  const extractCandidateValue = useCallback(
    (...keys) => {
      if (!selectedCandidate) {
        return '';
      }

      for (const key of keys) {
        if (key in selectedCandidate) {
          const candidateValue = normaliseValue(selectedCandidate[key]);
          if (candidateValue) {
            return candidateValue;
          }
        }
      }

      return '';
    },
    [selectedCandidate]
  );

  const leftColumnFields = useMemo(() => {
    const createField = (id, label, rawValue) => {
      const normalised = normaliseValue(rawValue);
      return {
        id,
        label,
        value: normalised || fallbackText,
        raw: normalised,
        type: 'text'
      };
    };

    return [
      createField('client-phone-number', 'Phone Number', extractCandidateValue('phoneNumber', 'phone_number', 'phone', 'contactNumber')),
      createField('client-email', 'Email', extractCandidateValue('email', 'emailAddress')),
      createField('client-location', 'Location', extractCandidateValue('location', 'city', 'region', 'country')),
      createField('client-desired-role', 'Desired Role', candidateRole || extractCandidateValue('desiredRole', 'preferredRole')),
      createField('client-skills', 'Skills', extractCandidateValue('skills', 'skillset', 'skillSet'))
    ];
  }, [candidateRole, extractCandidateValue]);

  const rightColumnFields = useMemo(() => {
    const createField = (id, label, rawValue, extra = {}) => {
      const normalised = normaliseValue(rawValue);
      return {
        id,
        label,
        value: normalised || fallbackText,
        raw: normalised,
        type: extra.type ?? 'text',
        ...extra
      };
    };

    const linkedInRaw = extractCandidateValue('linkedin', 'linkedinUrl', 'linkedin_url', 'linkedIn');
    const linkedInHref = formatUrl(linkedInRaw);

    return [
      createField('client-education', 'Education', extractCandidateValue('education', 'educations', 'highestEducation')),
      createField('client-experience', 'Experience', extractCandidateValue('experience', 'experiences', 'workExperience')),
      createField('client-linkedin', 'LinkedIn', linkedInRaw, {
        type: linkedInHref ? 'link' : 'text',
        href: linkedInHref
      })
    ];
  }, [extractCandidateValue]);

  const textareaRefs = useRef({});

  useEffect(() => {
    const adjustableFields = [...leftColumnFields, ...rightColumnFields].filter(
      (field) => field.type !== 'link' || !field.href
    );

    adjustableFields.forEach((field) => {
      const textarea = textareaRefs.current[field.id];
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, [leftColumnFields, rightColumnFields]);

  const renderFieldControl = (field) => {
    const isLink = field.type === 'link' && field.href;

    if (isLink) {
      delete textareaRefs.current[field.id];
      return (
        <a
          id={field.id}
          className="client-details__textarea client-details__textarea--link"
          href={field.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {field.value}
        </a>
      );
    }

    return (
      <textarea
        id={field.id}
        className="client-details__textarea"
        ref={(node) => {
          textareaRefs.current[field.id] = node;
        }}
        value={field.value}
        readOnly
        aria-readonly="true"
        tabIndex={-1}
        spellCheck={false}
      />
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard__background-image" />
      <div className="dashboard__overlay" />
      <div className="dashboard__content">
        <AppCardNav rightContent={<DashboardAvatar size="md" className="card-nav-avatar" />} />
        <div className="dashboard__layout">
          <div className="dashboard__container">
            <section className="dashboard__panel">
              <div className="dashboard__panel-body">
                <div className="dashboard__welcome">
                  <div className="client-details__title">
                    <button
                      type="button"
                      className="client-details__back-button"
                      onClick={() => navigate(-1)}
                      aria-label="Go back"
                    >
                      <FaArrowLeftLong />
                    </button>
                    <h1 className="dashboard__headline">Client Details</h1>
                  </div>
                  <div className="client-details__actions">
                    <button type="button" className="dashboard__cta">
                      Manage
                    </button>
                    <button type="button" className={secondaryButtonClassName}>
                      {statusLabel}
                    </button>
                  </div>
                </div>

                <div className="dashboard__stats-grid">
                  <StatsCard title="Candidates" value={candidateCountDisplay} subtitle={candidateWeekSubtitle} />
                  <StatsCard title="Companies" value={companyCountDisplay} subtitle={companySubtitle} />
                  <StatsCard
                    title="Assignments"
                    value={assignmentCountDisplay}
                    subtitle={assignmentWeekSubtitle}
                    className="stats-card--wide"
                  />
                </div>

                <div className="dashboard__main-grid">
                  <section className="dashboard__candidate-panel">
                    <div className="dashboard__section">
                      <div className="dashboard__section-heading">
                        <h2 className="dashboard__section-title">{clientLabel ?? 'Client Overview'}</h2>
                        <span className="dashboard__client-role">{candidateRole ?? 'Role not specified'}</span>
                      </div>
                      <div className="dashboard__divider" />
                      <div className="client-details__columns">
                        <div className="client-details__column">
                          {leftColumnFields.map((field) => (
                            <div className="client-details__field" key={field.id}>
                              <label className="client-details__label" htmlFor={field.id}>
                                {field.label}
                              </label>
                              {renderFieldControl(field)}
                            </div>
                          ))}
                        </div>
                        <div className="client-details__column">
                          {rightColumnFields.map((field) => (
                            <div className="client-details__field" key={field.id}>
                              <label className="client-details__label" htmlFor={field.id}>
                                {field.label}
                              </label>
                              {renderFieldControl(field)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="dashboard__assignments-panel">
                    <div className="dashboard__section">
                      <h2 className="dashboard__section-title">Related Opportunities</h2>
                      <div className="dashboard__divider" />
                      <p className="dashboard__status-text">
                        Suggested roles and companies will be displayed in this area.
                      </p>
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

export default ClientDetails;

