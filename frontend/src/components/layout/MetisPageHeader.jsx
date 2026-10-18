import React from 'react';

export const MetisPageHeader = ({
  title,
  subtitle,
  breadcrumb = [],
  actions = null,
  onRefresh = null,
}) => {
  return (
    <div className="metis-page-header mb-5 pb-2 border-b border-[#DCE7ED]">
      <div className="metis-page-title-group">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb">
          <ol className="metis-breadcrumb mb-1.5 flex items-center gap-1.5 text-xs text-[#607585]">
            <li className="metis-breadcrumb-item font-semibold text-[#087EAD]">
              <a href="#/dashboard" className="text-decoration-none hover:underline flex items-center gap-1">
                <span>💧</span>
                <span>OWEB PB-PMS</span>
              </a>
            </li>
            <li className="metis-breadcrumb-separator text-[#A6EBF0]">&bull;</li>
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <li className={`metis-breadcrumb-item ${idx === breadcrumb.length - 1 ? 'active font-bold text-[#0B3D5C]' : 'font-medium'}`}>
                  {crumb}
                </li>
                {idx < breadcrumb.length - 1 && (
                  <li className="metis-breadcrumb-separator text-[#A6EBF0]">&bull;</li>
                )}
              </React.Fragment>
            ))}
          </ol>
        </nav>

        {/* Page Title & Context Subtitle */}
        <h1 className="text-2xl font-black text-[#0B3D5C] tracking-tight font-display">{title}</h1>
        {subtitle && <p className="text-xs text-[#607585] mt-0.5 font-medium">{subtitle}</p>}
      </div>

      {/* Header Actions */}
      <div className="metis-header-actions">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="metis-btn metis-btn-outline"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="d-none d-sm-inline">Refresh</span>
          </button>
        )}
        {actions}
      </div>
    </div>
  );
};
export default MetisPageHeader;
