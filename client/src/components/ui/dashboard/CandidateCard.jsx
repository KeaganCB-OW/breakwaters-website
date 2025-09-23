import { DashboardAvatar } from './DashboardAvatar';

export function CandidateCard({ name, role, status, className = '' }) {
  const cardClassName = ['candidate-card', className].filter(Boolean).join(' ');

  return (
    <div className={cardClassName}>
      <div className="candidate-card__person">
        <DashboardAvatar size="md" className="candidate-card__avatar" />
        <div>
          <h3 className="candidate-card__name">{name}</h3>
          <p className="candidate-card__role">{role}</p>
        </div>
      </div>
      <div className="candidate-card__status">
        <span>{status}</span>
      </div>
    </div>
  );
}

export default CandidateCard;
