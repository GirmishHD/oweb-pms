import React, { useState } from 'react';
import MetisHeader from './MetisHeader';
import MetisSidebar from './MetisSidebar';
import MetisFooter from './MetisFooter';

export const MetisLayout = ({
  user,
  originalUser,
  simulatedRole,
  activeModule,
  onSelectModule,
  navGroups,
  navBadges,
  unreadCount,
  onToggleNotifications,
  showNotifications,
  notificationRef,
  NotificationPanelComponent,
  onOpenProfile,
  onLogout,
  onSwitchPersona,
  onExitRoleSimulation,
  onOpenSearch,
  onAuditDeadlines,
  accessibleProjectsCount,
  onOpenExternalPortal,
  activeModuleTitle,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('metis_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('metis_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="metis-admin-layout">
      {/* Role Simulation Alert Banner */}
      {simulatedRole && (
        <div className="bg-warning text-dark px-4 py-2 d-flex align-items-center justify-content-between font-weight-bold shadow-sm no-print" style={{ fontSize: '0.8125rem' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark text-white">SIMULATION</span>
            <span>Viewing OWBPMIS as <strong>{simulatedRole}</strong>. Action scoping active.</span>
          </div>
          <button
            onClick={onExitRoleSimulation}
            className="btn btn-sm btn-dark text-white py-0 px-2"
          >
            Exit Simulation &bull; Restore Admin
          </button>
        </div>
      )}

      {/* Top Header */}
      <MetisHeader
        user={user}
        originalUser={originalUser}
        simulatedRole={simulatedRole}
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenSearch={onOpenSearch}
        unreadCount={unreadCount}
        onToggleNotifications={onToggleNotifications}
        showNotifications={showNotifications}
        notificationRef={notificationRef}
        NotificationPanelComponent={NotificationPanelComponent}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
        onSwitchPersona={onSwitchPersona}
        onExitRoleSimulation={onExitRoleSimulation}
        onAuditDeadlines={onAuditDeadlines}
        accessibleProjectsCount={accessibleProjectsCount}
        onOpenExternalPortal={onOpenExternalPortal}
        activeModuleTitle={activeModuleTitle}
      />

      {/* Admin Body Wrapper */}
      <div className="metis-admin-wrapper">
        {/* Collapsible Sidebar */}
        <MetisSidebar
          activeModule={activeModule}
          onSelectModule={onSelectModule}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          navGroups={navGroups}
          navBadges={navBadges}
          user={user}
        />

        {/* Main Content Workspace with Water-Sector Ambiance */}
        <main className="metis-main relative" id="main-content">
          {/* Subtle Water Pattern & Hydrological Flow Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0 overflow-hidden" aria-hidden="true">
            {/* Top right subtle hydro glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sky-200/40 blur-3xl" />
            {/* Bottom left water reservoir hue */}
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-cyan-100/50 blur-3xl" />
            {/* Subtle topographic hydrological contours */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.035] text-[#087EAD]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="water-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="24" cy="24" r="1.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#water-grid-pattern)" />
            </svg>
          </div>

          <div className="metis-content-container relative z-10">
            {children}
          </div>
          <MetisFooter />
        </main>
      </div>
    </div>
  );
};
export default MetisLayout;
