import AppCardNav from '../layout/AppCardNav';
import { StatsCard } from './StatsCard';
import { CandidateCard } from './CandidateCard';
import { AssignmentCard } from './AssignmentCard';
import { DashboardAvatar } from './DashboardAvatar';
import '../../../styling/dashboard.css';

export function Dashboard() {
  const candidates = [
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' },
    { name: 'Samantha Lee', role: 'Product Manager', status: 'In Progress' }
  ];

  const assignments = [
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' },
    { name: 'Samantha Lee', company: 'Company Name' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__background-image" />
      <div className="dashboard__overlay" />
      <div className="dashboard__content">
        <AppCardNav rightContent={<DashboardAvatar size="sm" />} />
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
                  <StatsCard title="Candidates" value="15" subtitle="5 new this week" />
                  <StatsCard title="Companies" value="7" subtitle="1 new this week" />
                  <StatsCard title="" value="4" subtitle="Assignments" className="stats-card--wide" />
                </div>

                <div className="dashboard__main-grid">
                  <section className="dashboard__candidate-panel">
                    <div className="dashboard__section">
                      <h2 className="dashboard__section-title">Candidate Overview</h2>
                      <div className="dashboard__divider" />
                      <div className="dashboard__candidate-list">
                        {candidates.map((candidate, index) => (
                          <CandidateCard
                            key={`${candidate.name}-${index}`}
                            name={candidate.name}
                            role={candidate.role}
                            status={candidate.status}
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
                        {assignments.map((assignment, index) => (
                          <AssignmentCard
                            key={`${assignment.name}-${index}`}
                            name={assignment.name}
                            company={assignment.company}
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
