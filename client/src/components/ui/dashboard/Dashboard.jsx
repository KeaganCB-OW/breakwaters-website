import { useEffect, useMemo, useState } from 'react';
import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { CandidateCard } from './CandidateCard';
import { AssignmentCard } from './AssignmentCard';
import { DashboardAvatar } from './DashboardAvatar';
import { fetchClients } from '../../../services/clientService';
import { fetchAssignments } from '../../../services/assignmentService';
import '../../../styling/dashboard.css';

export function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [candidateError, setCandidateError] = useState(null);

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
  const candidateWeekSubtitle = isLoadingCandidates ? 'Loading...' : `${candidatesAddedThisWeek} this week`;

  const assignmentCountDisplay = isLoadingAssignments ? 'N/A' : String(assignments.length);
  const assignmentWeekSubtitle = isLoadingAssignments ? 'Loading...' : `${assignmentsAddedThisWeek} new this week`;

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
                  <h1 className="dashboard__headline">Welcome, Vanessa</h1>
                  <button type="button" className="dashboard__cta">
                    New Assignment
                  </button>
                </div>

                <div className="dashboard__stats-grid">
                  <StatsCard title="Candidates" value={candidateCountDisplay} subtitle={candidateWeekSubtitle} />
                  <StatsCard title="Companies" value="7" subtitle="1 new this week" />
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
                          candidates.map((candidate) => (
                            <CandidateCard
                              key={candidate.id}
                              name={candidate.fullName}
                              role={candidate.preferredRole || 'Role not specified'}
                              status={candidate.status || 'pending'}
                            />
                          ))}
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
                          assignments.map((assignment) => (
                            <AssignmentCard
                              key={assignment.id}
                              name={assignment.clientName}
                              company={assignment.companyName}
                            />
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

export default Dashboard;
