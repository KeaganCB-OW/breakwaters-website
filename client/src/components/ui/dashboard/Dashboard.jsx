import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { DashboardAvatar } from './DashboardAvatar';
import { fetchClients } from '../../../services/clientService';
import { fetchAssignments } from '../../../services/assignmentService';
import { fetchCompanies, fetchCompanyStats } from '../../../services/companyService';
import { AuthContext } from '../../../context/AuthContext';
import '../../../styling/dashboard.css';
import { DashboardDataContext } from './DashboardContext';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, token, user } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [candidateError, setCandidateError] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState(null);

  const [companyStats, setCompanyStats] = useState({ total: 0, newThisWeek: 0, unverified: 0 });
  const [isLoadingCompanyStats, setIsLoadingCompanyStats] = useState(true);
  const [companyStatsError, setCompanyStatsError] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [assignmentError, setAssignmentError] = useState(null);

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (user.role !== 'recruitment_officer') {
      navigate('/', { replace: true });
    }
  }, [navigate, user]);

  const reloadCandidates = useCallback(async () => {
    if (!token) {
      if (isMountedRef.current) {
        setCandidates([]);
        setCandidateError(null);
        setIsLoadingCandidates(false);
      }
      return [];
    }

    if (isMountedRef.current) {
      setIsLoadingCandidates(true);
    }

    try {
      const data = await fetchClients(token);
      const normalized = Array.isArray(data) ? data : [];
      if (isMountedRef.current) {
        setCandidates(normalized);
        setCandidateError(null);
      }
      return normalized;
    } catch (error) {
      if (isMountedRef.current) {
        setCandidateError(error.message || 'Failed to load candidates');
        setCandidates([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCandidates(false);
      }
    }
  }, [token]);

  const reloadCompanies = useCallback(async () => {
    if (!token) {
      if (isMountedRef.current) {
        setCompanies([]);
        setCompanyError(null);
        setIsLoadingCompanies(false);
      }
      return [];
    }

    if (isMountedRef.current) {
      setIsLoadingCompanies(true);
    }

    try {
      const data = await fetchCompanies(token);
      const normalized = Array.isArray(data) ? data : [];
      if (isMountedRef.current) {
        setCompanies(normalized);
        setCompanyError(null);
      }
      return normalized;
    } catch (error) {
      if (isMountedRef.current) {
        setCompanyError(error.message || 'Failed to load companies');
        setCompanies([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCompanies(false);
      }
    }
  }, [token]);

  const reloadCompanyStats = useCallback(async () => {
    if (!token) {
      if (isMountedRef.current) {
        setCompanyStats({ total: 0, newThisWeek: 0, unverified: 0 });
        setCompanyStatsError(null);
        setIsLoadingCompanyStats(false);
      }
      return null;
    }

    if (isMountedRef.current) {
      setIsLoadingCompanyStats(true);
    }

    try {
      const data = await fetchCompanyStats(token);
      const total = Number(data?.total ?? 0);
      const newThisWeek = Number(data?.newThisWeek ?? 0);
      const unverified = Number(data?.unverified ?? 0);

      const nextStats = {
        total: Number.isNaN(total) ? 0 : total,
        newThisWeek: Number.isNaN(newThisWeek) ? 0 : newThisWeek,
        unverified: Number.isNaN(unverified) ? 0 : unverified,
      };

      if (isMountedRef.current) {
        setCompanyStats(nextStats);
        setCompanyStatsError(null);
      }
      return nextStats;
    } catch (error) {
      if (isMountedRef.current) {
        setCompanyStats({ total: 0, newThisWeek: 0, unverified: 0 });
        setCompanyStatsError(error.message || 'Failed to load company stats');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCompanyStats(false);
      }
    }
  }, [token]);

  const reloadAssignments = useCallback(async () => {
    if (!token) {
      if (isMountedRef.current) {
        setAssignments([]);
        setAssignmentError(null);
        setIsLoadingAssignments(false);
      }
      return [];
    }

    if (isMountedRef.current) {
      setIsLoadingAssignments(true);
    }

    try {
      const data = await fetchAssignments(token);
      const normalized = Array.isArray(data) ? data : [];
      if (isMountedRef.current) {
        setAssignments(normalized);
        setAssignmentError(null);
      }
      return normalized;
    } catch (error) {
      if (isMountedRef.current) {
        setAssignmentError(error.message || 'Failed to load assignments');
        setAssignments([]);
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoadingAssignments(false);
      }
    }
  }, [token]);

  useEffect(() => {
    reloadCandidates();
  }, [reloadCandidates]);

  useEffect(() => {
    reloadCompanies();
  }, [reloadCompanies]);

  useEffect(() => {
    reloadCompanyStats();
  }, [reloadCompanyStats]);

  useEffect(() => {
    reloadAssignments();
  }, [reloadAssignments]);

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

  if (companyStatsError) {
    companyCountDisplay = 'Error';
    companySubtitle = companyStatsError;
  } else if (!isLoadingCompanyStats) {
    companyCountDisplay = String(companyStats.total);
    companySubtitle = `${companyStats.newThisWeek} new this week | ${companyStats.unverified} unverified`;
  }

  const assignmentCountDisplay = isLoadingAssignments ? 'N/A' : String(assignments.length);
  const assignmentWeekSubtitle = isLoadingAssignments ? 'Loading...' : `${assignmentsAddedThisWeek} new this week`;

  const handleAvatarClick = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const activeCard = useMemo(() => {
    if (location.pathname.startsWith('/rod/candidates')) {
      return 'candidates';
    }

    if (location.pathname.startsWith('/rod/companies')) {
      return 'companies';
    }

    if (location.pathname.startsWith('/rod/assignments')) {
      return 'assignments';
    }

    return null;
  }, [location.pathname]);

  const handleCardNavigation = useCallback(
    (target) => {
      if (!target) {
        navigate('/rod');
        return;
      }

      if (activeCard === target) {
        navigate('/rod');
        return;
      }

      navigate(`/rod/${target}`);
    },
    [activeCard, navigate],
  );

  const dashboardContextValue = useMemo(
    () => ({
      token,
      user,
      logout,
      candidates: {
        data: candidates,
        isLoading: isLoadingCandidates,
        error: candidateError,
        reload: reloadCandidates,
      },
      companies: {
        data: companies,
        isLoading: isLoadingCompanies,
        error: companyError,
        reload: reloadCompanies,
      },
      assignments: {
        data: assignments,
        isLoading: isLoadingAssignments,
        error: assignmentError,
        reload: reloadAssignments,
      },
      companyStats: {
        data: companyStats,
        isLoading: isLoadingCompanyStats,
        error: companyStatsError,
        reload: reloadCompanyStats,
      },
    }),
    [
      assignments,
      assignmentError,
      candidateError,
      candidates,
      companies,
      companyError,
      companyStats,
      companyStatsError,
      isLoadingAssignments,
      isLoadingCandidates,
      isLoadingCompanies,
      isLoadingCompanyStats,
      logout,
      reloadAssignments,
      reloadCandidates,
      reloadCompanies,
      reloadCompanyStats,
      token,
      user,
    ],
  );

  return (
    <DashboardDataContext.Provider value={dashboardContextValue}>
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
                    <StatsCard
                      title="Candidates"
                      value={candidateCountDisplay}
                      subtitle={candidateWeekSubtitle}
                      onClick={() => handleCardNavigation('candidates')}
                      isActive={activeCard === 'candidates'}
                    />
                    <StatsCard
                      title="Companies"
                      value={companyCountDisplay}
                      subtitle={companySubtitle}
                      onClick={() => handleCardNavigation('companies')}
                      isActive={activeCard === 'companies'}
                    />
                    <StatsCard
                      title="Assignments"
                      value={assignmentCountDisplay}
                      subtitle={assignmentWeekSubtitle}
                      className="stats-card--wide"
                      onClick={() => handleCardNavigation('assignments')}
                      isActive={activeCard === 'assignments'}
                    />
                  </div>

                  <Outlet />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardDataContext.Provider>
  );
}

export default Dashboard;
