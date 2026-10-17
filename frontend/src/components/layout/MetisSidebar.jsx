import React from 'react';
import { ICONS } from '../../constants';

export const MetisSidebar = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  navGroups,
  navBadges = {},
  user,
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="metis-sidebar-backdrop d-lg-none"
          aria-hidden="true"
        />
      )}

      <aside
        className={`metis-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''} no-print`}
        id="admin-sidebar"
      >
        <div className="metis-sidebar-nav">
          {navGroups.map((group, groupIdx) => {
            const visibleItems = group.items || [];
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="metis-nav-section">
                {!isCollapsed && (
                  <div className="metis-nav-section-title">
                    {group.title}
                  </div>
                )}
                <ul className="metis-nav-list">
                  {visibleItems.map((item) => {
                    const isActive = activeModule === item.id;
                    const badge = navBadges[item.id];

                    return (
                      <li key={item.id} className="metis-nav-item">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectModule(item.id);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`metis-nav-link ${isActive ? 'active' : ''}`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <span className="metis-nav-icon">
                            {item.icon}
                          </span>
                          {!isCollapsed && (
                            <span className="metis-nav-text">
                              {item.label}
                            </span>
                          )}
                          {!isCollapsed && badge && (
                            <span className={`metis-badge ${badge.color || 'metis-badge-primary'} ms-auto`}>
                              {badge.label}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Status Indicator */}
        <div className="metis-sidebar-footer">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-success d-inline-block flex-shrink-0" />
              {!isCollapsed && (
                <small className="text-muted text-truncate">
                  Connected: PostgreSQL (8001)
                </small>
              )}
            </div>
            {!isCollapsed && (
              <span className="badge bg-primary text-white" style={{ fontSize: '10px' }}>
                v2.0.0
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
export default MetisSidebar;
