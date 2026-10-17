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
            <span>Viewing OWEB PB-PMS as <strong>{simulatedRole}</strong>. Action scoping active.</span>
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

        {/* Main Content Workspace */}
        <main className="metis-main" id="main-content">
          <div className="metis-content-container">
            {children}
          </div>
          <MetisFooter />
        </main>
      </div>
    </div>
  );
};
export default MetisLayout;
