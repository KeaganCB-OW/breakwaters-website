export function StatsCard({ title, value, subtitle, className = '', onClick, isActive = false }) {
  const cardClassName = [
    'stats-card',
    className,
    onClick ? 'stats-card--interactive' : '',
    isActive ? 'stats-card--active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const Element = onClick ? 'button' : 'div';

  return (
    <Element className={cardClassName} type={onClick ? 'button' : undefined} onClick={onClick}>
      {title ? <h3 className="stats-card__title">{title}</h3> : null}
      <div className="stats-card__value">{value}</div>
      {subtitle ? <p className="stats-card__subtitle">{subtitle}</p> : null}
    </Element>
  );
}

export default StatsCard;
