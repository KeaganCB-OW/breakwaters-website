export function AssignmentCard({ name, company, className = '' }) {
  const cardClassName = ['assignment-card', className].filter(Boolean).join(' ');

  return (
    <div className={cardClassName}>
      <h3 className="assignment-card__name">{name}</h3>
      <p className="assignment-card__company">{company}</p>
    </div>
  );
}

export default AssignmentCard;
