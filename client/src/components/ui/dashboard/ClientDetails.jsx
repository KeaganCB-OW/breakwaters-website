import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { DashboardAvatar } from './DashboardAvatar';
import { fetchClients } from '../../../services/clientService';
import { fetchAssignments } from '../../../services/assignmentService';
import '../../../styling/dashboard.css';

export function ClientDetails() {
  const { clientId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);

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
  const candidateWeekSubtitle = isLoadingCandidates ? 'Loading...' : `${candidatesAddedThisWeek} this week`;

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
                  <h1 className="dashboard__headline">Client Details</h1>
                  <button type="button" className="dashboard__cta">
                    New Assignment
                  </button>
                </div>                <div className="dashboard__stats-grid">
                  <StatsCard title="Candidates" value={candidateCountDisplay} subtitle={candidateWeekSubtitle} />
                  <StatsCard title="Companies" value="7" subtitle="1 new this week" />
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
                      <p className="dashboard__status-text">
                        Detailed client information will appear here.
                      </p>
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
