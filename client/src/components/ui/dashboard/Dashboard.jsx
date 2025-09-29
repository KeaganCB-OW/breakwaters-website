import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { CandidateCard } from './CandidateCard';
import { AssignmentCard } from './AssignmentCard';
import { DashboardAvatar } from './DashboardAvatar';
import { fetchClients } from '../../../services/clientService';
import { fetchAssignments } from '../../../services/assignmentService';
import { fetchCompanyStats } from '../../../services/companyService';
import { AuthContext } from '../../../context/AuthContext';
import '../../../styling/dashboard.css';

export function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [candidateError, setCandidateError] = useState(null);

  const [companyStats, setCompanyStats] = useState({ total: 0, newThisWeek: 0, unverified: 0 });
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [assignmentError, setAssignmentError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCandidates = async () => {
      try {
        const data = await fetchClients();
        if (isMounted) {
          setCandidates(Array.isArray(data) ? data : []);
          setCandidateError(null);
        }
      } catch (error) {
        if (isMounted) {
          setCandidateError(error.message || 'Failed to load candidates');
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
            unverified: Number.isNaN(unverified) ? 0 : unverified,
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
          setAssignmentError(null);
        }
      } catch (error) {
        if (isMounted) {
          setAssignmentError(error.message || 'Failed to load assignments');
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

  const handleAvatarClick = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

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
                  <h1 className="dashboard__headline">Welcome, Vanessa.</h1>
                  <button type="button" className="dashboard__cta">
                    New Assignment
                  </button>
                </div>

                <div className="dashboard__stats-grid">
                  <StatsCard title="Candidates" value={candidateCountDisplay} subtitle={candidateWeekSubtitle} />
                  <StatsCard title="Companies" value={companyCountDisplay} subtitle={companySubtitle} />
                  <StatsCard title="Assignments" value={assignmentCountDisplay} subtitle={assignmentWeekSubtitle} className="stats-card--wide" />
                </div>

                <div className="dashboard__main-grid">
                  <section className="dashboard__candidate-panel">
                    <div className="dashboard__section">
                      <h2 className="dashboard__section-title">Candidate Overview</h2>
                      <div className="dashboard__divider" />
                      <div className="dashboard__candidate-list">
                        {isLoadingCandidates && (
                          <p className="dashboard__status-text">Loading candidates...</p>
                        )}
                        {candidateError && (
                          <p className="dashboard__status-text dashboard__status-text--error">
                            {candidateError}
                          </p>
                        )}
                        {!isLoadingCandidates && !candidateError && candidates.length === 0 && (
                          <p className="dashboard__status-text">No candidates found.</p>
                        )}
                        {!isLoadingCandidates &&
                          !candidateError &&
                          candidates.map((candidate) => {
                            const candidateId = candidate.id ?? candidate._id ?? candidate.clientId;
                            const candidateKey = candidateId ?? candidate.email ?? candidate.fullName;
                            const candidateDetailsPath = candidateId ? `/client-details/${candidateId}` : undefined;

                            return (
                              <CandidateCard
                                key={candidateKey}
                                name={candidate.fullName}
                                role={candidate.preferredRole || 'Role not specified'}
                                status={candidate.status || 'pending'}
                                to={candidateDetailsPath}
                              />
                            );
                          })}
                      </div>
                    </div>
                  </section>

                  <section className="dashboard__assignments-panel">
                    <div className="dashboard__section">
                      <h2 className="dashboard__section-title">Recent Assignments</h2>
                      <div className="dashboard__divider" />
                      <div className="dashboard__assignment-list">
                        {isLoadingAssignments && (
                          <p className="dashboard__status-text">Loading assignments...</p>
                        )}
                        {assignmentError && (
                          <p className="dashboard__status-text dashboard__status-text--error">
                            {assignmentError}
                          </p>
                        )}
                        {!isLoadingAssignments && !assignmentError && assignments.length === 0 && (
                          <p className="dashboard__status-text">No assignments found.</p>
                        )}
                        {!isLoadingAssignments &&
                          !assignmentError &&
                          assignments.map((assignment, index) => {
                            const fallbackKey =
                              [assignment.clientName, assignment.companyName].filter(Boolean).join(' - ') ||
                              'assignment';
                            const assignmentKey = assignment.id ?? `${fallbackKey}-${index}`;
                            // Find the associated client/candidate for status
                            const associatedClient = candidates.find(
                              (c) => c.fullName === assignment.clientName
                            );
                            const statusLabel =
                              (associatedClient && associatedClient.status) ? associatedClient.status :
                              (typeof assignment.status === 'string' && assignment.status.trim()
                                ? assignment.status.trim()
                                : 'Pending');

                            return (
                              <div key={assignmentKey} className="dashboard__assignment-item">
                                <AssignmentCard
                                  name={assignment.clientName}
                                  company={assignment.companyName}
                                />
                                <div className="candidate-card__status dashboard__assignment-status">
                                  <span>{statusLabel}</span>
                                </div>
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

export default Dashboard;
