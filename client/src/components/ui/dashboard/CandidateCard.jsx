import { Link } from 'react-router-dom';
import { DashboardAvatar } from './DashboardAvatar';

export function CandidateCard({ name, role, status, className = '', to }) {
  const cardClassName = ['candidate-card', className].filter(Boolean).join(' ');
  const Container = to ? Link : 'div';
  const containerProps = to ? { to } : {};

  return (
    <Container className={cardClassName} {...containerProps}>
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
    </Container>
  );
}

export default CandidateCard;
