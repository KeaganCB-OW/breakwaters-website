import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';import { FaArrowLeftLong } from 'react-icons/fa6';
import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { DashboardAvatar } from './DashboardAvatar';
import { fetchClients } from '../../../services/clientService';
import { fetchAssignments, suggestAssignment } from '../../../services/assignmentService';
import { fetchCompanies, fetchCompanyStats } from '../../../services/companyService';
import '../../../styling/ClientDetails.css';

const normaliseRoleName = (value) => {
  if (value == null) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitAvailableRoles = (value) => {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((role) => String(role).split(/[,/|;]/))
      .map((role) => role.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[,/|;]/)
    .map((role) => role.trim())
    .filter(Boolean);
};

const levenshteinDistance = (a, b) => {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  let previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const currentRow = [i];

    for (let j = 1; j <= b.length; j += 1) {
      const insertCost = currentRow[j - 1] + 1;
      const deleteCost = previousRow[j] + 1;
      const replaceCost = previousRow[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      currentRow[j] = Math.min(insertCost, deleteCost, replaceCost);
    }

    previousRow = currentRow;
  }

  return previousRow[b.length];
};

const rolesMatch = (role, desiredRole) => {
  const normalizedRole = normaliseRoleName(role);
  const normalizedDesired = normaliseRoleName(desiredRole);

  if (!normalizedRole || !normalizedDesired) {
    return false;
  }

  if (normalizedRole === normalizedDesired) {
    return true;
  }

  if (normalizedRole.includes(normalizedDesired) || normalizedDesired.includes(normalizedRole)) {
    return true;
  }

  const roleWords = normalizedRole.split(' ');
  const desiredWords = normalizedDesired.split(' ');

  if (roleWords.some((word) => desiredWords.includes(word))) {
    return true;
  }

  const distance = levenshteinDistance(normalizedRole, normalizedDesired);
  const tolerance = Math.max(1, Math.floor(Math.max(normalizedRole.length, normalizedDesired.length) * 0.25));

  return distance <= tolerance;
};


const STATUS_VARIANTS = {
  pending: { label: 'Pending', className: 'client-details__secondary-btn--pending' },
  assigned: { label: 'Assigned', className: 'client-details__secondary-btn--assigned' },
  'interview pending': { label: 'Interview Pending', className: 'client-details__secondary-btn--interview-pending' },
  'in progress': { label: 'In Progress', className: 'client-details__secondary-btn--in-progress' },
  interviewed: { label: 'Interviewed', className: 'client-details__secondary-btn--interviewed' },
  suggested: { label: 'Suggested', className: 'client-details__secondary-btn--suggested' },
  rejected: { label: 'Rejected', className: 'client-details__secondary-btn--rejected' }
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
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanyList, setIsLoadingCompanyList] = useState(true);
  const [companyListError, setCompanyListError] = useState(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [suggestionStatusByCompany, setSuggestionStatusByCompany] = useState({});


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

  useEffect(() => {
    let isMounted = true;

    const loadCompanies = async () => {
      try {
        const data = await fetchCompanies();
        if (isMounted) {
          setCompanies(Array.isArray(data) ? data : []);
          setCompanyListError(null);
        }
      } catch (error) {
        if (isMounted) {
          setCompanyListError(error?.message || 'Failed to load companies');
          setCompanies([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCompanyList(false);
        }
      }
    };

    loadCompanies();

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
      selectedCandidate.desiredRole ||
      selectedCandidate.desired_role ||
      selectedCandidate.preferredRole ||
      selectedCandidate.role ||
      selectedCandidate.currentRole ||
      null
    );
  }, [selectedCandidate]);

  const candidateDesiredRoleNormalized = useMemo(() => {
    if (candidateRole) {
      return normaliseRoleName(candidateRole);
    }

    if (selectedCandidate?.desiredRole) {
      return normaliseRoleName(selectedCandidate.desiredRole);
    }

    if (selectedCandidate?.desired_role) {
      return normaliseRoleName(selectedCandidate.desired_role);
    }

    return '';
  }, [candidateRole, selectedCandidate]);

  const assignmentsForSelectedClient = useMemo(() => {
    if (!clientId || !Array.isArray(assignments)) {
      return [];
    }

    return assignments.filter((assignment) => {
      const assignmentClientId =
        assignment?.clientId ??
        assignment?.client_id ??
        assignment?.clientID ??
        assignment?.clientid;

      if (assignmentClientId == null) {
        return false;
      }

      return String(assignmentClientId) === String(clientId);
    });
  }, [assignments, clientId]);

  const assignedCompanyIds = useMemo(() => {
    if (!assignmentsForSelectedClient.length) {
      return new Set();
    }

    const ids = new Set();

    assignmentsForSelectedClient.forEach((assignment) => {
      const rawCompanyId =
        assignment?.companyId ??
        assignment?.company_id ??
        assignment?.companyID ??
        assignment?.companyid;

      if (rawCompanyId != null) {
        ids.add(String(rawCompanyId));
      }
    });

    return ids;
  }, [assignmentsForSelectedClient]);

  const relatedCompanies = useMemo(() => {
    if (!Array.isArray(companies) || companies.length === 0) {
      return [];
    }

    if (showAllCompanies) {
      return companies;
    }

    if (!candidateDesiredRoleNormalized) {
      return [];
    }

    return companies.filter((company) => {
      const companyRoles = splitAvailableRoles(company?.availableRoles);

      if (companyRoles.length === 0) {
        return false;
      }

      return companyRoles.some((role) => rolesMatch(role, candidateDesiredRoleNormalized));
    });
  }, [companies, showAllCompanies, candidateDesiredRoleNormalized]);

  const toggleShowAllCompanies = useCallback(() => {
    setShowAllCompanies((previous) => !previous);
  }, []);

  const handleSuggest = useCallback(
    async (companyIdValue, companyKey) => {
      const numericClientId = Number(clientId);
      const numericCompanyId = Number(companyIdValue);
      const stateKey =
        companyKey ??
        (Number.isFinite(numericCompanyId) ? String(numericCompanyId) : String(companyIdValue ?? ''));

      if (!stateKey) {
        return;
      }

      if (!Number.isFinite(numericClientId) || numericClientId <= 0) {
        setSuggestionStatusByCompany((previous) => ({
          ...previous,
          [stateKey]: { loading: false, error: 'Invalid client identifier.' },
        }));
        return;
      }

      if (!Number.isFinite(numericCompanyId) || numericCompanyId <= 0) {
        setSuggestionStatusByCompany((previous) => ({
          ...previous,
          [stateKey]: { loading: false, error: 'Invalid company identifier.' },
        }));
        return;
      }

      setSuggestionStatusByCompany((previous) => ({
        ...previous,
        [stateKey]: { loading: true, error: null },
      }));

      try {
        const response = await suggestAssignment(numericClientId, numericCompanyId);

        if (response?.assignment) {
          setAssignments((previousAssignments) => {
            if (!Array.isArray(previousAssignments)) {
              return [response.assignment];
            }

            const exists = previousAssignments.some((assignment) => assignment.id === response.assignment.id);

            if (exists) {
              return previousAssignments.map((assignment) =>
                assignment.id === response.assignment.id ? response.assignment : assignment
              );
            }

            return [...previousAssignments, response.assignment];
          });
        }

        if (response?.clientStatus) {
          setCandidates((previousCandidates) =>
            Array.isArray(previousCandidates)
              ? previousCandidates.map((candidate) => {
                  const candidateIdentifier = candidate.id ?? candidate._id ?? candidate.clientId;
                  if (candidateIdentifier != null && String(candidateIdentifier) === String(clientId)) {
                    return { ...candidate, status: response.clientStatus };
                  }

                  return candidate;
                })
              : previousCandidates
          );
        }

        setSuggestionStatusByCompany((previous) => ({
          ...previous,
          [stateKey]: { loading: false, error: null },
        }));
      } catch (error) {
        const message =
          error?.details?.message ||
          error?.message ||
          'Failed to suggest assignment';

        setSuggestionStatusByCompany((previous) => ({
          ...previous,
          [stateKey]: { loading: false, error: message },
        }));
      }
    },
    [clientId, setAssignments, setCandidates, setSuggestionStatusByCompany, suggestAssignment]
  );

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
                      <div className="dashboard__section-heading">
                        <h2 className="dashboard__section-title">Related Opportunities</h2>
                        <button
                          type="button"
                          className="related-opportunities__toggle"
                          onClick={toggleShowAllCompanies}
                          disabled={isLoadingCompanyList || !Array.isArray(companies) || companies.length === 0}
                        >
                          {showAllCompanies ? 'See Less' : 'See All'}
                        </button>
                      </div>
                      <div className="dashboard__divider" />
                      <div className="dashboard__assignment-list related-opportunities__list">
                        {isLoadingCompanyList && (
                          <p className="dashboard__status-text">Loading opportunities...</p>
                        )}
                        {companyListError && (
                          <p className="dashboard__status-text dashboard__status-text--error">
                            {companyListError}
                          </p>
                        )}
                        {!isLoadingCompanyList &&
                          !companyListError &&
                          relatedCompanies.map((company, index) => {
                            const companyIdValue =
                              company?.id ??
                              company?.companyId ??
                              company?.companyID ??
                              company?.company_id ??
                              company?.companyid;
                            const normalizedCompanyId =
                              companyIdValue != null ? String(companyIdValue) : null;
                            const companyKey =
                              normalizedCompanyId ?? `${company.companyName ?? 'company'}-${index}`;
                            const isSuggested = normalizedCompanyId ? assignedCompanyIds.has(normalizedCompanyId) : false;
                            const suggestionState = suggestionStatusByCompany[companyKey] || {};
                            const isLoading = Boolean(suggestionState.loading);
                            const companyErrorMessage = suggestionState.error;
                            const hasValidCompanyId = normalizedCompanyId != null;
                            const isDisabled = isSuggested || isLoading || !hasValidCompanyId;
                            const buttonText = isSuggested ? 'Suggested' : isLoading ? 'Suggesting...' : 'Suggest';
                            const buttonClassName = [
                              'candidate-card__status',
                              'dashboard__assignment-status',
                              'related-opportunities__suggest-btn',
                              isSuggested ? 'related-opportunities__suggest-btn--suggested' : null,
                              !isSuggested && isDisabled ? 'related-opportunities__suggest-btn--disabled' : null,
                            ].filter(Boolean).join(' ');
                            const rolesList = splitAvailableRoles(company?.availableRoles);
                            const hasRoles = rolesList.length > 0;
                            const locationText = company?.location ? String(company.location) : 'Location not specified';
                            const rolesText = hasRoles ? rolesList.join(', ') : 'Not specified';
                            const rolesClassName = [
                              'related-opportunities__roles',
                              hasRoles ? null : 'related-opportunities__roles--muted',
                            ].filter(Boolean).join(' ');

                            return (
                              <div key={companyKey} className="dashboard__assignment-item related-opportunities__item">
                                <div className="assignment-card">
                                  <h3 className="assignment-card__name">{company?.companyName ?? 'Unnamed Company'}</h3>
                                  <p className="assignment-card__company">{locationText}</p>
                                  <p className={rolesClassName}>
                                    Roles: {rolesText}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className={buttonClassName}
                                  onClick={() => handleSuggest(companyIdValue, companyKey)}
                                  disabled={isDisabled}
                                >
                                  {buttonText}
                                </button>
                                {companyErrorMessage && (
                                  <p className="related-opportunities__error" role="alert">
                                    {companyErrorMessage}
                                  </p>
                                )}
                              </div>
                            );
                          })}
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

export default ClientDetails;

