import { useEffect, useMemo, useState } from 'react';
import { CandidateCard } from './CandidateCard';
import { AssignmentCard } from './AssignmentCard';
import { useDashboardData } from './DashboardContext';
import { getClientStatusLabel } from '../../../constants/clientStatuses';

function getCandidateIdentifier(candidate) {
  return candidate?.id ?? candidate?._id ?? candidate?.clientId ?? candidate?.email ?? candidate?.fullName;
}

const DEFAULT_LIMIT = 7;

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
      const rawStatus = typeof candidate?.status === 'string' ? candidate.status : null;
      const statusLabel = getClientStatusLabel(rawStatus);

      return {
        key: getCandidateIdentifier(candidate),
        name: candidate?.fullName ?? candidate?.full_name ?? 'Unknown Candidate',
        role: candidate?.preferredRole ?? candidate?.preferred_role ?? 'Role not specified',
        status: statusLabel,
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

      const rawAssignmentStatus =
        associatedClient && typeof associatedClient.status === 'string'
          ? associatedClient.status
          : typeof assignment?.status === 'string'
          ? assignment.status
          : null;
      const statusLabel = getClientStatusLabel(rawAssignmentStatus);

      return {
        key,
        name: assignment?.clientName ?? assignment?.candidateName ?? 'Candidate',
        company: assignment?.companyName ?? assignment?.company ?? 'Company',
        status: statusLabel,
      };
    });
  }, [assignments, candidates]);

  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showAllAssignments, setShowAllAssignments] = useState(false);

  const candidateCount = candidateCards.length;
  const assignmentCount = assignmentItems.length;

  useEffect(() => {
    if (candidateCount <= DEFAULT_LIMIT) {
      setShowAllCandidates(false);
    }
  }, [candidateCount]);

  useEffect(() => {
    if (assignmentCount <= DEFAULT_LIMIT) {
      setShowAllAssignments(false);
    }
  }, [assignmentCount]);

  const visibleCandidateCards = showAllCandidates
    ? candidateCards
    : candidateCards.slice(0, DEFAULT_LIMIT);
  const visibleAssignmentItems = showAllAssignments
    ? assignmentItems
    : assignmentItems.slice(0, DEFAULT_LIMIT);

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
              visibleCandidateCards.map((candidate) => (
                <CandidateCard
                  key={candidate.key}
                  name={candidate.name}
                  role={candidate.role}
                  status={candidate.status}
                  to={candidate.to}
                />
              ))}
          </div>
          {!isLoadingCandidates &&
            !candidateError &&
            candidateCount > DEFAULT_LIMIT && (
              <div className="dashboard__pagination">
                <div className="dashboard__pagination-info">
                  {showAllCandidates
                    ? `Showing all ${candidateCount}`
                    : `Showing ${Math.min(DEFAULT_LIMIT, candidateCount)} of ${candidateCount}`}
                </div>
                <div className="dashboard__pagination-controls">
                  <button
                    type="button"
                    className="dashboard__pagination-button"
                    onClick={() => setShowAllCandidates((prev) => !prev)}
                  >
                    {showAllCandidates ? 'View less' : 'View all'}
                  </button>
                </div>
              </div>
            )}
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
              visibleAssignmentItems.map((assignment) => (
                <div key={assignment.key} className="dashboard__assignment-item">
                  <AssignmentCard name={assignment.name} company={assignment.company} />
                  <div className="candidate-card__status dashboard__assignment-status">
                    <span>{assignment.status}</span>
                  </div>
                </div>
              ))}
          </div>
          {!isLoadingAssignments &&
            !assignmentError &&
            assignmentCount > DEFAULT_LIMIT && (
              <div className="dashboard__pagination">
                <div className="dashboard__pagination-info">
                  {showAllAssignments
                    ? `Showing all ${assignmentCount}`
                    : `Showing ${Math.min(DEFAULT_LIMIT, assignmentCount)} of ${assignmentCount}`}
                </div>
                <div className="dashboard__pagination-controls">
                  <button
                    type="button"
                    className="dashboard__pagination-button"
                    onClick={() => setShowAllAssignments((prev) => !prev)}
                  >
                    {showAllAssignments ? 'View less' : 'View all'}
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

export default DashboardHome;

