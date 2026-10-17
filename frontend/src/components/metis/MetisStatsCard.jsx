import React from 'react';

export const MetisStatsCard = ({
  title,
  value,
  icon,
  variant = 'primary',
  trend = null,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  subtext = null,
  onClick = null,
}) => {
  return (
    <div
      className={`metis-stats-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`metis-stats-icon ${variant}`}>
        {icon}
      </div>
      <div className="metis-stats-body">
        <div className="metis-stats-label">{title}</div>
        <div className="metis-stats-value">{value}</div>
        {trend && (
          <div className={`metis-stats-trend ${trendType}`}>
            {trendType === 'up' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trendType === 'down' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{trend}</span>
          </div>
        )}
        {!trend && subtext && (
          <small className="text-muted d-block mt-1" style={{ fontSize: '0.6875rem' }}>
            {subtext}
          </small>
        )}
      </div>
    </div>
  );
};
export default MetisStatsCard;
