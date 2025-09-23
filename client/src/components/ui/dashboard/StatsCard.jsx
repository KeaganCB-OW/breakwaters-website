export function StatsCard({ title, value, subtitle, className = '' }) {
  const cardClassName = ['stats-card', className].filter(Boolean).join(' ');

  return (
    <div className={cardClassName}>
      {title ? <h3 className="stats-card__title">{title}</h3> : null}
      <div className="stats-card__value">{value}</div>
      {subtitle ? <p className="stats-card__subtitle">{subtitle}</p> : null}
    </div>
  );
}

export default StatsCard;
