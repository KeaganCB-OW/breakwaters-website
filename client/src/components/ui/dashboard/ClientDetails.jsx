import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { BsFillPencilFill, BsFillTrashFill } from 'react-icons/bs';
import AppCardNav from '../layout/AppCardNav';
import { DashboardAvatar } from './DashboardAvatar';
import {
  fetchClientById,
  updateClient,
  deleteClient as deleteClientService,
  updateClientStatus,
} from '../../../services/clientService';
import { fetchAssignments, suggestAssignment } from '../../../services/assignmentService';
import { AuthContext } from '../../../context/AuthContext';
import { fetchCompanies } from '../../../services/companyService';
import { fetchLatestClientCv } from '../../../services/cvService';
import {
  CLIENT_STATUS_OPTIONS,
  CLIENT_STATUS_VARIANTS,
  getClientStatusLabel,
  normaliseClientStatus,
} from '../../../constants/clientStatuses';
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
const formatAssignmentStatusLabel = (status) => {
  if (!status) {
    return 'Suggested';
  }

  const trimmed = String(status).trim();
  if (!trimmed) {
    return 'Suggested';
  }

  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const FIELD_DEFINITIONS = {
  left: [
    {
      id: 'client-phone-number',
      label: 'Phone Number',
      editableKey: 'phoneNumber',
      candidateKeys: ['phoneNumber', 'phone_number', 'phone', 'contactNumber'],
    },
    {
      id: 'client-email',
      label: 'Email',
      editableKey: 'email',
      candidateKeys: ['email', 'emailAddress'],
    },
    {
      id: 'client-location',
      label: 'Location',
      editableKey: 'location',
      candidateKeys: ['location', 'city', 'region', 'country'],
    },
    {
      id: 'client-desired-role',
      label: 'Desired Role',
      editableKey: 'preferredRole',
      candidateKeys: ['preferredRole', 'desiredRole', 'desired_role', 'role', 'currentRole'],
    },
    {
      id: 'client-skills',
      label: 'Skills',
      editableKey: 'skills',
      candidateKeys: ['skills', 'skillset', 'skillSet'],
    },
  ],
  right: [
    {
      id: 'client-education',
      label: 'Education',
      editableKey: 'education',
      candidateKeys: ['education', 'educations', 'highestEducation'],
    },
    {
      id: 'client-experience',
      label: 'Experience',
      editableKey: 'experience',
      candidateKeys: ['experience', 'experiences', 'workExperience'],
    },
    {
      id: 'client-linkedin',
      label: 'LinkedIn',
      editableKey: 'linkedinUrl',
      candidateKeys: ['linkedinUrl', 'linkedin_url', 'linkedin', 'linkedIn'],
      type: 'link',
    },
  ],
};

const formatFileSizeDisplay = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const formatUploadedAtDisplay = (value) => {
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

export function ClientDetails() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { token, logout } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);

  const [assignments, setAssignments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanyList, setIsLoadingCompanyList] = useState(true);
  const [companyListError, setCompanyListError] = useState(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [suggestionStatusByCompany, setSuggestionStatusByCompany] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isLoadingCv, setIsLoadingCv] = useState(false);
  const [cvDetails, setCvDetails] = useState(null);
  const [cvErrorMessage, setCvErrorMessage] = useState(null);

  const [isManaging, setIsManaging] = useState(false);
  const [editableValues, setEditableValues] = useState({});
  const [initialEditableValues, setInitialEditableValues] = useState({});
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const statusButtonRef = useRef(null);
  const statusMenuRef = useRef(null);
  const statusOptionRefs = useRef(new Map());
  const statusDropdownId = useMemo(
    () => `client-status-dropdown-${clientId || 'unknown'}`,
    [clientId],
  );

  const handleAvatarClick = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

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

  const selectedCandidateStatus = selectedCandidate?.status;
  const selectedStatusNormalized = normaliseClientStatus(selectedCandidateStatus);

  useEffect(() => {
    let isMounted = true;

    if (!token || !clientId) {
      setCandidates([]);
      setIsLoadingCandidates(false);
      return () => {
        isMounted = false;
      };
    }

    const loadCandidate = async () => {
      setIsLoadingCandidates(true);
      try {
        const data = await fetchClientById(clientId, token);
        if (isMounted) {
          setCandidates(data ? [data] : []);
        }
      } catch (error) {
        if (isMounted) {
          setCandidates([]);
          setStatusFeedback({
            type: 'error',
            message: error?.message || 'Failed to load client details.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingCandidates(false);
        }
      }
    };

    loadCandidate();

    return () => {
      isMounted = false;
    };
  }, [clientId, token]);

  useEffect(() => {
    if (!isStatusMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target) &&
        statusButtonRef.current &&
        !statusButtonRef.current.contains(event.target)
      ) {
        setIsStatusMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsStatusMenuOpen(false);
        statusButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStatusMenuOpen]);

  useEffect(() => {
    if (!isStatusMenuOpen) {
      return;
    }

    const activeNode =
      statusOptionRefs.current.get(selectedStatusNormalized) ||
      Array.from(statusOptionRefs.current.values())[0];

    if (activeNode && typeof activeNode.focus === 'function') {
      activeNode.focus();
    }
  }, [isStatusMenuOpen, selectedStatusNormalized]);

  useEffect(() => {
    if (!statusFeedback) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setStatusFeedback(null);
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [statusFeedback]);

  useEffect(() => {
    setIsStatusMenuOpen(false);
    setStatusFeedback(null);
  }, [clientId]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setAssignments([]);
      return () => {
        isMounted = false;
      };
    }

    const loadAssignments = async () => {
      try {
        const data = await fetchAssignments(token);
        if (isMounted) {
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setAssignments([]);
        }
      } finally {
        if (isMounted) {
        }
      }
    };

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setCompanies([]);
      setCompanyListError(null);
      setIsLoadingCompanyList(false);
      return () => {
        isMounted = false;
      };
    }

    const loadCompanies = async () => {
      setIsLoadingCompanyList(true);
      try {
        const data = await fetchCompanies(token);
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
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    if (!token || !clientId) {
      setCvDetails(null);
      setCvErrorMessage(null);
      setIsLoadingCv(false);
      return () => {
        isMounted = false;
      };
    }

    const loadCv = async () => {
      setIsLoadingCv(true);
      setCvErrorMessage(null);
      try {
        const response = await fetchLatestClientCv(clientId, token);
        if (!isMounted) {
          return;
        }

        if (response?.exists) {
          if (response.viewUrl) {
            setCvDetails(response);
            setCvErrorMessage(null);
          } else {
            setCvDetails(null);
            setCvErrorMessage('We couldn\u2019t generate a link to view this CV.');
          }
        } else {
          setCvDetails(null);
          setCvErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setCvDetails(null);
          setCvErrorMessage(
            error?.message || 'Failed to load CV for this client.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCv(false);
        }
      }
    };

    loadCv();

    return () => {
      isMounted = false;
    };
  }, [clientId, token]);

  useEffect(() => {
    setSuggestionStatusByCompany({});
    setShowAllCompanies(false);
  }, [clientId]);

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

  const hasCv = useMemo(
    () => Boolean(cvDetails?.exists && cvDetails.viewUrl),
    [cvDetails]
  );

  const cvViewUrl = useMemo(() => {
    if (!cvDetails?.exists || !cvDetails.viewUrl) {
      return '';
    }

    return cvDetails.viewUrl;
  }, [cvDetails]);

  const cvMetadata = useMemo(() => {
    if (!cvDetails?.exists) {
      return '';
    }

    const parts = [];
    const uploaded = formatUploadedAtDisplay(cvDetails.uploadedAt);
    if (uploaded) {
      parts.push(`Uploaded ${uploaded}`);
    }

    const sizeLabel = formatFileSizeDisplay(cvDetails.fileSize);
    if (sizeLabel) {
      parts.push(sizeLabel);
    }

    return parts.join(' • ');
  }, [cvDetails]);

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

  const assignmentByCompanyId = useMemo(() => {
    const map = {};

    assignmentsForSelectedClient.forEach((assignment) => {
      const rawCompanyId =
        assignment?.companyId ??
        assignment?.company_id ??
        assignment?.companyID ??
        assignment?.companyid;

      if (rawCompanyId != null) {
        map[String(rawCompanyId)] = assignment;
      }
    });

    return map;
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

  const candidateSectionClassName = useMemo(() => {
    return ['dashboard__section', 'client-details__section', isManaging ? 'client-details__section--managing' : null]
      .filter(Boolean)
      .join(' ');
  }, [isManaging]);

  const deleteModalDescription = useMemo(() => {
    if (clientLabel) {
      return `You are about to delete ${clientLabel}. This action cannot be undone.`;
    }

    return 'You are about to delete this client. This action cannot be undone.';
  }, [clientLabel]);

  const toggleShowAllCompanies = useCallback(() => {
    setShowAllCompanies((previous) => !previous);
  }, []);
  const openDeleteModal = useCallback(() => {
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (isDeletingClient) {
      return;
    }

    setDeleteError(null);
    setIsDeleteModalOpen(false);
  }, [isDeletingClient]);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientId) {
      setDeleteError('Invalid client identifier.');
      return;
    }

    if (!token) {
      setDeleteError('Please log in to delete this client.');
      return;
    }

    setIsDeletingClient(true);
    setDeleteError(null);

    try {
      await deleteClientService(clientId, token);

      setAssignments((previousAssignments) =>
        Array.isArray(previousAssignments)
          ? previousAssignments.filter((assignment) => {
              const assignmentClientId =
                assignment?.clientId ??
                assignment?.client_id ??
                assignment?.clientID ??
                assignment?.clientid;

              return assignmentClientId == null || String(assignmentClientId) !== String(clientId);
            })
          : previousAssignments
      );

      setCandidates((previousCandidates) =>
        Array.isArray(previousCandidates)
          ? previousCandidates.filter((candidate) => {
              const candidateIdentifier = candidate?.id ?? candidate?._id ?? candidate?.clientId;
              return candidateIdentifier == null || String(candidateIdentifier) !== String(clientId);
            })
          : previousCandidates
      );

      setIsDeleteModalOpen(false);
      setIsManaging(false);
      navigate('/dashboard');
    } catch (error) {
      const message =
        error?.details?.message || error?.message || 'Failed to delete client.';
      setDeleteError(message);
    } finally {
      setIsDeletingClient(false);
    }
  }, [clientId, deleteClientService, navigate, setAssignments, setCandidates, token]);


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

      const normalizedCompanyKey = Number.isFinite(numericCompanyId) ? String(numericCompanyId) : null;
      if (normalizedCompanyKey && assignmentByCompanyId[normalizedCompanyKey]) {
        setSuggestionStatusByCompany((previous) => ({
          ...previous,
          [stateKey]: {
            loading: false,
            error: 'Client already has an assignment with this company.',
          },
        }));
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

      if (!token) {
        setSuggestionStatusByCompany((previous) => ({
          ...previous,
          [stateKey]: {
            loading: false,
            error: 'Please log in to suggest this client.',
          },
        }));
        return;
      }

      setSuggestionStatusByCompany((previous) => ({
        ...previous,
        [stateKey]: { loading: true, error: null },
      }));

      try {
        const response = await suggestAssignment(numericClientId, numericCompanyId, token);

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
    [assignmentByCompanyId, clientId, setAssignments, setCandidates, setSuggestionStatusByCompany, suggestAssignment, token]
  );

  const { label: statusLabel, className: statusClassName } = useMemo(() => {
    const pendingStatus = CLIENT_STATUS_VARIANTS.pending;

    if (isLoadingCandidates) {
      return {
        label: 'Loading...',
        className: pendingStatus.className,
      };
    }

    if (!selectedStatusNormalized) {
      return pendingStatus;
    }

    const matchedStatus = CLIENT_STATUS_VARIANTS[selectedStatusNormalized];

    if (matchedStatus) {
      return matchedStatus;
    }

    const rawStatus = typeof selectedCandidateStatus === 'string' ? selectedCandidateStatus.trim() : '';

    if (rawStatus) {
      return {
        label: rawStatus,
        className: pendingStatus.className,
      };
    }

    return pendingStatus;
  }, [isLoadingCandidates, selectedCandidateStatus, selectedStatusNormalized]);

  const secondaryButtonClassName = `client-details__secondary-btn ${statusClassName}`;
  const statusButtonLabel = isUpdatingStatus ? 'Updating...' : statusLabel;

  const handleStatusToggle = useCallback(() => {
    if (isUpdatingStatus || !selectedCandidate) {
      return;
    }

    setIsStatusMenuOpen((previous) => !previous);
  }, [isUpdatingStatus, selectedCandidate]);

  const handleStatusSelect = useCallback(
    async (nextStatusValue) => {
      if (!selectedCandidate || !clientId) {
        setStatusFeedback({
          type: 'error',
          message: 'A client must be selected before updating the status.',
        });
        return;
      }

      if (!token) {
        setStatusFeedback({
          type: 'error',
          message: 'Please sign in to update the client status.',
        });
        return;
      }

      const normalizedNext = normaliseClientStatus(nextStatusValue);

      if (!normalizedNext) {
        setStatusFeedback({
          type: 'error',
          message: 'Select a valid status option.',
        });
        return;
      }

      const normalizedCurrent = normaliseClientStatus(selectedCandidate.status);
      const option = CLIENT_STATUS_OPTIONS.find(
        (candidateStatus) => candidateStatus.normalizedValue === normalizedNext,
      );
      const nextLabel = option?.label ?? getClientStatusLabel(nextStatusValue);

      if (normalizedCurrent === normalizedNext) {
        setIsStatusMenuOpen(false);
        setStatusFeedback({
          type: 'info',
          message: `Status is already ${nextLabel}.`,
        });
        return;
      }

      setIsUpdatingStatus(true);

      try {
        const response = await updateClientStatus(clientId, nextStatusValue, token);
        const updatedClient = response?.client;
        const updatedStatus = updatedClient?.status ?? nextStatusValue;
        const updatedLabel = getClientStatusLabel(updatedStatus);

        setCandidates((previousCandidates) => {
          if (!Array.isArray(previousCandidates) || previousCandidates.length === 0) {
            if (updatedClient) {
              return [updatedClient];
            }

            return selectedCandidate ? [{ ...selectedCandidate, status: updatedStatus }] : [];
          }

          let found = false;
          const nextCandidates = previousCandidates.map((candidate) => {
            const candidateIdentifier = candidate.id ?? candidate._id ?? candidate.clientId;

            if (candidateIdentifier != null && String(candidateIdentifier) === String(clientId)) {
              found = true;

              if (updatedClient) {
                return { ...candidate, ...updatedClient };
              }

              return { ...candidate, status: updatedStatus };
            }

            return candidate;
          });

          if (!found && updatedClient) {
            nextCandidates.push(updatedClient);
          }

          return nextCandidates;
        });

        setStatusFeedback({
          type: 'success',
          message: `Status updated to ${updatedLabel}.`,
        });
      } catch (error) {
        const message =
          error?.details?.message || error?.message || 'Failed to update status.';
        setStatusFeedback({ type: 'error', message });
      } finally {
        setIsUpdatingStatus(false);
        setIsStatusMenuOpen(false);
      }
    },
    [clientId, selectedCandidate, setCandidates, token],
  );

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

  const fallbackText = 'Not provided';

  const getCandidateFieldValue = useCallback((candidate, definition) => {
    if (!candidate || !definition?.candidateKeys) {
      return '';
    }

    for (const key of definition.candidateKeys) {
      const candidateValue = candidate?.[key];
      if (candidateValue != null && candidateValue !== undefined) {
        const normalisedValue = normaliseValue(candidateValue);
        if (normalisedValue) {
          return normalisedValue;
        }
      }
    }

    return '';
  }, []);

  const buildEditableSnapshot = useCallback(
    (candidate) => {
      const snapshot = {};

      [...FIELD_DEFINITIONS.left, ...FIELD_DEFINITIONS.right].forEach((definition) => {
        if (!definition.editableKey) {
          return;
        }

        snapshot[definition.editableKey] = getCandidateFieldValue(candidate, definition);
      });

      return snapshot;
    },
    [getCandidateFieldValue]
  );

  const leftColumnFields = useMemo(() => {
    return FIELD_DEFINITIONS.left.map((definition) => {
      const rawValue = getCandidateFieldValue(selectedCandidate, definition);
      const editableKey = definition.editableKey;
      const editableValue = editableKey ? editableValues[editableKey] ?? '' : '';
      const baselineValue = editableKey ? initialEditableValues[editableKey] ?? '' : '';
      const displayValue = isManaging && editableKey ? editableValue : rawValue || fallbackText;
      const href = !isManaging && definition.type === 'link' ? formatUrl(rawValue) : '';
      const isDirty = isManaging && editableKey ? editableValue !== baselineValue : false;

      return {
        ...definition,
        displayValue,
        editableValue,
        rawValue,
        href,
        isLink: Boolean(href),
        isEditable: Boolean(editableKey),
        isDirty,
      };
    });
  }, [editableValues, formatUrl, getCandidateFieldValue, initialEditableValues, isManaging, selectedCandidate]);

  const rightColumnFields = useMemo(() => {
    return FIELD_DEFINITIONS.right.map((definition) => {
      const rawValue = getCandidateFieldValue(selectedCandidate, definition);
      const editableKey = definition.editableKey;
      const editableValue = editableKey ? editableValues[editableKey] ?? '' : '';
      const baselineValue = editableKey ? initialEditableValues[editableKey] ?? '' : '';
      const displayValue = isManaging && editableKey ? editableValue : rawValue || fallbackText;
      const href = !isManaging && definition.type === 'link' ? formatUrl(rawValue) : '';
      const isDirty = isManaging && editableKey ? editableValue !== baselineValue : false;

      return {
        ...definition,
        displayValue,
        editableValue,
        rawValue,
        href,
        isLink: Boolean(href),
        isEditable: Boolean(editableKey),
        isDirty,
      };
    });
  }, [editableValues, formatUrl, getCandidateFieldValue, initialEditableValues, isManaging, selectedCandidate]);

  const handleFieldChange = useCallback(
    (key, value) => {
      if (!key) {
        return;
      }

      setEditableValues((previous) => ({
        ...previous,
        [key]: value,
      }));
      setSubmitError(null);
    },
    [setEditableValues, setSubmitError]
  );

  const hasPendingChanges = useMemo(() => {
    if (!isManaging) {
      return false;
    }

    return Object.keys(initialEditableValues).some(
      (key) => (editableValues[key] ?? '') !== (initialEditableValues[key] ?? '')
    );
  }, [editableValues, initialEditableValues, isManaging]);

  const handleManageToggle = useCallback(() => {
    if (!selectedCandidate) {
      return;
    }

    if (!isManaging) {
      const snapshot = buildEditableSnapshot(selectedCandidate);
      setEditableValues(snapshot);
      setInitialEditableValues(snapshot);
      setSubmitError(null);
      setActiveFieldId(null);
      setIsManaging(true);
    } else {
      setIsManaging(false);
      setEditableValues({});
      setInitialEditableValues({});
      setActiveFieldId(null);
      setSubmitError(null);
    }
  }, [buildEditableSnapshot, isManaging, selectedCandidate, setActiveFieldId, setEditableValues, setInitialEditableValues, setIsManaging, setSubmitError]);

  const handleSubmitClientDetails = useCallback(async () => {
    if (!isManaging || !selectedCandidate) {
      return;
    }

    const changedKeys = Object.keys(initialEditableValues).filter(
      (key) => (editableValues[key] ?? '') !== (initialEditableValues[key] ?? '')
    );

    if (changedKeys.length === 0) {
      setSubmitError('No changes to submit.');
      return;
    }

    const payload = {};
    changedKeys.forEach((key) => {
      const value = editableValues[key];
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });

    try {
    if (!token) {
      setSubmitError('Please log in to submit changes.');
      return;
    }

      setIsSubmittingClient(true);
      setSubmitError(null);
      const updatedClient = await updateClient(clientId, payload, token);
      setCandidates((previousCandidates) =>
        Array.isArray(previousCandidates)
          ? previousCandidates.map((candidateItem) => {
              const candidateIdentifier =
                candidateItem.id ?? candidateItem._id ?? candidateItem.clientId;

              if (candidateIdentifier != null && String(candidateIdentifier) === String(clientId)) {
                return { ...candidateItem, ...updatedClient };
              }

              return candidateItem;
            })
          : previousCandidates
      );
      const updatedSnapshot = buildEditableSnapshot(updatedClient);
      setInitialEditableValues(updatedSnapshot);
      setEditableValues(updatedSnapshot);
      setActiveFieldId(null);
    } catch (error) {
      const message =
        error?.details?.message || error?.message || 'Failed to update client details';
      setSubmitError(message);
    } finally {
      setIsSubmittingClient(false);
    }
  }, [
    buildEditableSnapshot,
    clientId,
    editableValues,
    initialEditableValues,
    isManaging,
    selectedCandidate,
    setActiveFieldId,
    setCandidates,
    setEditableValues,
    setInitialEditableValues,
    setIsSubmittingClient,
    setSubmitError,
    updateClient,
    token,
  ]);

  const textareaRefs = useRef({});

  useEffect(() => {
    const adjustableFields = [...leftColumnFields, ...rightColumnFields].filter(
      (field) => !field.isLink
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
    if (field.isLink) {
      delete textareaRefs.current[field.id];
      return (
        <a
          id={field.id}
          className="client-details__textarea client-details__textarea--link"
          href={field.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {field.displayValue}
        </a>
      );
    }

    const isEditable = isManaging && field.isEditable;
    const textareaClassName = [
      'client-details__textarea',
      isEditable ? 'client-details__textarea--editable' : 'client-details__textarea--readonly',
      field.isDirty ? 'client-details__textarea--editing' : null,
      isEditable && activeFieldId === field.id ? 'client-details__textarea--active' : null,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <textarea
        id={field.id}
        className={textareaClassName}
        ref={(node) => {
          if (node) {
            textareaRefs.current[field.id] = node;
          } else {
            delete textareaRefs.current[field.id];
          }
        }}
        value={isEditable ? field.editableValue : field.displayValue}
        onChange={
          isEditable
            ? (event) => handleFieldChange(field.editableKey, event.target.value)
            : undefined
        }
        readOnly={!isEditable}
        aria-readonly={isEditable ? undefined : true}
        tabIndex={isEditable ? 0 : -1}
        spellCheck={field.editableKey === 'linkedinUrl' ? false : true}
        onFocus={
          isEditable
            ? () => {
                setActiveFieldId(field.id);
              }
            : undefined
        }
        onBlur={
          isEditable
            ? () => {
                setActiveFieldId((current) => (current === field.id ? null : current));
              }
            : undefined
        }
      />
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard__background-image" />
      <div className="dashboard__overlay" />
      <div className="dashboard__content">
        <AppCardNav
          rightContent={(
            <DashboardAvatar
              size="md"
              className="card-nav-avatar"
              onClick={handleAvatarClick}
              aria-label="Sign out"
              title="Sign out"
            />
          )}
        />
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
                    <button
                      type="button"
                      className={[
                        'dashboard__cta',
                        'client-details__manage-button',
                        isManaging ? 'client-details__manage-button--active' : null,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={handleManageToggle}
                      disabled={isSubmittingClient || !selectedCandidate}
                    >
                      {isManaging ? 'Unmanage' : 'Manage'}
                    </button>
                    <div className="client-details__status-control">
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={handleStatusToggle}
                        disabled={isUpdatingStatus || !selectedCandidate}
                        aria-haspopup="listbox"
                        aria-expanded={isStatusMenuOpen}
                        aria-controls={statusDropdownId}
                        aria-label={`Change status, current: ${statusLabel}`}
                        ref={statusButtonRef}
                      >
                        {statusButtonLabel}
                      </button>
                      {isStatusMenuOpen && (
                        <div
                          id={statusDropdownId}
                          className="client-details__status-dropdown"
                          role="listbox"
                          aria-label="Select a new status"
                          ref={statusMenuRef}
                        >
                          {CLIENT_STATUS_OPTIONS.map((option) => {
                            const isSelected = option.normalizedValue === selectedStatusNormalized;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className="client-details__status-option"
                                onClick={() => handleStatusSelect(option.value)}
                                disabled={isUpdatingStatus}
                                ref={(node) => {
                                  const normalized = option.normalizedValue;
                                  if (!normalized) {
                                    return;
                                  }

                                  if (node) {
                                    statusOptionRefs.current.set(normalized, node);
                                  } else {
                                    statusOptionRefs.current.delete(normalized);
                                  }
                                }}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {statusFeedback && (
                  <p
                    className={`dashboard__status-text${
                      statusFeedback.type === 'error' ? ' dashboard__status-text--error' : ''
                    }`}
                    role={statusFeedback.type === 'error' ? 'alert' : 'status'}
                  >
                    {statusFeedback.message}
                  </p>
                )}

                <div className="dashboard__main-grid">
                  <section className="dashboard__candidate-panel">
                    <div className={candidateSectionClassName}>
                      <div className="dashboard__section-heading">
                        <div className="client-details__section-title-row">
                          <h2 className="dashboard__section-title">{clientLabel ?? 'Client Overview'}</h2>
                          {isManaging && (
                            <button
                              type="button"
                              className="client-details__delete-button"
                              onClick={openDeleteModal}
                              aria-label="Delete client"
                              disabled={isDeletingClient || !selectedCandidate}
                            >
                              <BsFillTrashFill />
                            </button>
                          )}
                        </div>
                        <span className="dashboard__client-role">{candidateRole ?? 'Role not specified'}</span>
                      </div>
                      <div className="dashboard__divider" />
                      <div className="client-details__columns">
                        <div className="client-details__column">
                          {leftColumnFields.map((field) => (
                            <div className="client-details__field" key={field.id}>
                              <label className="client-details__label" htmlFor={field.id}>
                                <span>{field.label}</span>
                                {isManaging && field.isEditable && (
                                  <BsFillPencilFill className="client-details__label-icon" aria-hidden="true" />
                                )}
                              </label>
                              {renderFieldControl(field)}
                            </div>
                          ))}
                        </div>
                        <div className="client-details__column">
                          {rightColumnFields.map((field) => (
                            <div className="client-details__field" key={field.id}>
                              <label className="client-details__label" htmlFor={field.id}>
                                <span>{field.label}</span>
                                {isManaging && field.isEditable && (
                                  <BsFillPencilFill className="client-details__label-icon" aria-hidden="true" />
                                )}
                              </label>
                              {renderFieldControl(field)}
                            </div>
                          ))}
                          <div className="client-details__field">
                            <label className="client-details__label" htmlFor="client-details-cv">
                              <span>CV</span>
                            </label>
                            <div
                              id="client-details-cv"
                              className="client-details__textarea client-details__textarea--readonly client-details__textarea--cv"
                            >
                              {isLoadingCv ? (
                                <p className="client-details__cv-meta">Loading CV...</p>
                              ) : cvErrorMessage ? (
                                <p className="client-details__cv-error" role="alert">{cvErrorMessage}</p>
                              ) : hasCv && cvViewUrl ? (
                                <>
                                  <div className="client-details__cv-actions">
                                    <a
                                      className="client-details__cv-button"
                                      href={cvViewUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View CV
                                    </a>
                                    {cvMetadata ? (
                                      <p className="client-details__cv-meta">{cvMetadata}</p>
                                    ) : null}
                                  </div>
                                  <div
                                    className="client-details__cv-preview"
                                    role="region"
                                    aria-label="CV preview"
                                  >
                                    <iframe
                                      src={cvViewUrl}
                                      title="Client CV preview"
                                      className="client-details__cv-frame"
                                      loading="lazy"
                                    />
                                  </div>
                                </>
                              ) : (
                                <p className="client-details__cv-meta client-details__cv-meta--muted">
                                  No CV uploaded yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isManaging && (
                        <div className="client-details__footer client-details__footer--inline">
                          {submitError && (
                            <p className="client-details__submit-error" role="alert">
                              {submitError}
                            </p>
                          )}
                          <button
                            type="button"
                            className="client-details__submit-button"
                            onClick={handleSubmitClientDetails}
                            disabled={isSubmittingClient || !hasPendingChanges}
                          >
                            {isSubmittingClient ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      )}
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
                          relatedCompanies.length === 0 && (
                            <p className="dashboard__status-text">
                              {showAllCompanies
                                ? 'No companies available at the moment.'
                                : candidateDesiredRoleNormalized
                                  ? 'No related opportunities found. Try See All to browse every company.'
                                  : 'Client desired role not specified. Use See All to review every company.'}
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
                            const existingAssignment = normalizedCompanyId
                              ? assignmentByCompanyId[normalizedCompanyId]
                              : undefined;
                            const assignmentStatusRaw =
                              typeof existingAssignment?.status === 'string'
                                ? existingAssignment.status
                                : '';
                            const assignmentStatusNormalized = normaliseClientStatus(
                              assignmentStatusRaw,
                            );
                            const suggestionState = suggestionStatusByCompany[companyKey] || {};
                            const isLoading = Boolean(suggestionState.loading);
                            const companyErrorMessage = suggestionState.error;
                            const hasValidCompanyId = normalizedCompanyId != null;
                            const hasExistingAssignment = Boolean(existingAssignment);
                            const statusVariant = hasExistingAssignment
                              ? CLIENT_STATUS_VARIANTS[assignmentStatusNormalized]
                              : null;
                            const statusVariantClassName = statusVariant?.className;
                            const relatedStatusClassName = statusVariantClassName
                              ? statusVariantClassName.replace(
                                  'client-details__secondary-btn',
                                  'related-opportunities__suggest-btn'
                                )
                              : null;
                            const isDisabled = hasExistingAssignment || isLoading || !hasValidCompanyId;
                            const buttonText = hasExistingAssignment
                              ? formatAssignmentStatusLabel(assignmentStatusRaw)
                              : isLoading
                                ? 'Suggesting...'
                                : 'Suggest';
                            const buttonClassName = [
                              'candidate-card__status',
                              'dashboard__assignment-status',
                              'related-opportunities__suggest-btn',
                              relatedStatusClassName,
                              hasExistingAssignment && !relatedStatusClassName
                                ? 'related-opportunities__suggest-btn--locked'
                                : null,
                              !hasExistingAssignment && isDisabled
                                ? 'related-opportunities__suggest-btn--disabled'
                                : null,
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
      {isDeleteModalOpen && (
        <div className="client-details__modal-backdrop" role="presentation">
          <div
            className="client-details__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-delete-modal-title"
            aria-describedby="client-delete-modal-description"
          >
            <h2 id="client-delete-modal-title" className="client-details__modal-title">
              Delete Client
            </h2>
            <p id="client-delete-modal-description" className="client-details__modal-text">
              {deleteModalDescription}
            </p>
            {deleteError && (
              <p className="client-details__modal-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="client-details__modal-actions">
              <button
                type="button"
                className="client-details__modal-button client-details__modal-button--secondary"
                onClick={closeDeleteModal}
                disabled={isDeletingClient}
              >
                Cancel
              </button>
              <button
                type="button"
                className="client-details__modal-button client-details__modal-button--danger"
                onClick={handleConfirmDelete}
                disabled={isDeletingClient}
              >
                {isDeletingClient ? 'Deleting...' : 'Delete client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetails;
