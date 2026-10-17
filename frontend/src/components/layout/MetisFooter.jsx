import React from 'react';

export const MetisFooter = () => {
  return (
    <footer className="metis-footer no-print">
      <div className="d-flex align-items-center gap-2">
        <span>&copy; {new Date().getFullYear()} Oromia Water and Energy Bureau (OWEB).</span>
        <span className="text-muted d-none d-md-inline">&bull; Sovereign Infrastructure &amp; Capital Governance</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="metis-badge metis-badge-success d-none d-sm-inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-success d-inline-block" />
          <span>PostgreSQL Active</span>
        </span>
        <span className="text-muted">Metis Admin &bull; PB-PMS v2.0.0</span>
      </div>
    </footer>
  );
};
export default MetisFooter;
