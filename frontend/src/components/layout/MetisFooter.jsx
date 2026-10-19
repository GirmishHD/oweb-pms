import React from 'react';

export const MetisFooter = () => {
  return (
    <footer className="metis-footer no-print">
      <div className="d-flex align-items-center gap-2">
        <span>&copy; {new Date().getFullYear()} Oromia Water Bureau (OWEB).</span>
        <span className="text-muted d-none d-md-inline">&bull; Sustainable Water Services for Every Community</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="metis-badge metis-badge-success d-none d-sm-inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-success d-inline-block" />
          <span>PostgreSQL Active</span>
        </span>
        <span className="text-muted">Metis Admin &bull; OWBPMIS v2.0.0</span>
      </div>
    </footer>
  );
};
export default MetisFooter;
