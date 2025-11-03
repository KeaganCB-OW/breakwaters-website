import { useMemo } from 'react';
import { CandidateCard } from './CandidateCard';
import { AssignmentCard } from './AssignmentCard';
import { useDashboardData } from './DashboardContext';

function getCandidateIdentifier(candidate) {
  return candidate?.id ?? candidate?._id ?? candidate?.clientId ?? candidate?.email ?? candidate?.fullName;
}

export function DashboardHome() {
  const {
    candidates: { data: candidates, isLoading: isLoadingCandidates, error: candidateError },
    assignments: { data: assignments, isLoading: isLoadingAssignments, error: assignmentError },
  } = useDashboardData();

  const candidateCards = useMemo(() => {
    if (!Array.isArray(candidates)) {
      return [];
    }

    return candidates.map((candidate) => {
      const candidateId = candidate?.id ?? candidate?._id ?? candidate?.clientId;
      const candidateDetailsPath = candidateId ? `/client-details/${candidateId}` : undefined;

      return {
        key: getCandidateIdentifier(candidate),
        name: candidate?.fullName ?? candidate?.full_name ?? 'Unknown Candidate',
        role: candidate?.preferredRole ?? candidate?.preferred_role ?? 'Role not specified',
        status:
          candidate?.status && typeof candidate.status === 'string'
            ? candidate.status
            : 'pending',
        to: candidateDetailsPath,
      };
    });
  }, [candidates]);

  const assignmentItems = useMemo(() => {
    if (!Array.isArray(assignments)) {
      return [];
    }

    return assignments.map((assignment, index) => {
      const fallbackKey = [assignment?.clientName, assignment?.companyName]
        .filter(Boolean)
        .join(' - ');
      const key = assignment?.id ?? fallbackKey ?? `assignment-${index}`;

      const associatedClient = Array.isArray(candidates)
        ? candidates.find((candidate) => {
            const candidateName = candidate?.fullName ?? candidate?.full_name;
            return candidateName && candidateName === assignment?.clientName;
          })
        : undefined;

      const statusLabel =
        associatedClient && typeof associatedClient.status === 'string'
          ? associatedClient.status
          : typeof assignment?.status === 'string' && assignment.status.trim()
          ? assignment.status.trim()
          : 'Pending';

      return {
        key,
        name: assignment?.clientName ?? assignment?.candidateName ?? 'Candidate',
        company: assignment?.companyName ?? assignment?.company ?? 'Company',
        status: statusLabel,
      };
    });
  }, [assignments, candidates]);

  return (
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
              <p className="dashboard__status-text dashboard__status-text--error">{candidateError}</p>
            )}
            {!isLoadingCandidates && !candidateError && candidateCards.length === 0 && (
              <p className="dashboard__status-text">No candidates found.</p>
            )}
            {!isLoadingCandidates &&
              !candidateError &&
              candidateCards.map((candidate) => (
                <CandidateCard
                  key={candidate.key}
                  name={candidate.name}
                  role={candidate.role}
                  status={candidate.status}
                  to={candidate.to}
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
              <p className="dashboard__status-text dashboard__status-text--error">{assignmentError}</p>
            )}
            {!isLoadingAssignments && !assignmentError && assignmentItems.length === 0 && (
              <p className="dashboard__status-text">No assignments found.</p>
            )}
            {!isLoadingAssignments &&
              !assignmentError &&
              assignmentItems.map((assignment) => (
                <div key={assignment.key} className="dashboard__assignment-item">
                  <AssignmentCard name={assignment.name} company={assignment.company} />
                  <div className="candidate-card__status dashboard__assignment-status">
                    <span>{assignment.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardHome;

