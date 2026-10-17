import React from 'react';

export const MetisCard = ({
  title,
  icon = null,
  actions = null,
  footer = null,
  className = '',
  bodyClassName = '',
  children,
}) => {
  return (
    <div className={`metis-card ${className}`}>
      {title && (
        <div className="metis-card-header">
          <h2 className="metis-card-title">
            {icon && <span className="text-primary">{icon}</span>}
            <span>{title}</span>
          </h2>
          {actions && <div className="metis-card-actions">{actions}</div>}
        </div>
      )}
      <div className={`metis-card-body ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="metis-card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};
export default MetisCard;
