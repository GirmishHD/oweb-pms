import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../Logo';

export const MetisHeader = ({
  user,
  originalUser,
  simulatedRole,
  onToggleSidebar,
  isSidebarCollapsed,
  onOpenSearch,
  unreadCount = 0,
  onToggleNotifications,
  showNotifications,
  notificationRef,
  NotificationPanelComponent,
  onOpenProfile,
  onLogout,
  onSwitchPersona,
  onExitRoleSimulation,
  onAuditDeadlines,
  accessibleProjectsCount = 0,
  onOpenExternalPortal,
  activeModuleTitle = 'Dashboard'
}) => {
  const [theme, setTheme] = useState('light');
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const personaRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (personaRef.current && !personaRef.current.contains(e.target)) {
        setIsPersonaOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-bs-theme', nextTheme);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="metis-header no-print">
      {/* Left: Brand & Hamburger Toggle */}
      <div className="metis-header-left">
        <a href="#/dashboard" className="metis-brand">
          <div className="metis-brand-logo">
            <Logo className="w-5 h-5 text-white" />
          </div>
          <div className="metis-brand-text">
            <span className="metis-brand-title">OROMIA WATER BUREAU</span>
            <span className="metis-brand-subtitle">Program Management System (PB-PMS)</span>
          </div>
        </a>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="metis-hamburger-btn"
          aria-label="Toggle sidebar"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Integrated Metis Search Input */}
        <div className="metis-search-container" onClick={onOpenSearch}>
          <svg className="metis-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            readOnly
            placeholder="Search schemes, tenders, contracts... (Ctrl+K)"
            className="metis-search-input cursor-pointer"
          />
          <kbd className="metis-search-shortcut">Ctrl+K</kbd>
        </div>

        {/* Live Cluster SCADA Telemetry Pill */}
        <div className="d-none d-xl-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-semibold" style={{ backgroundColor: '#E7F6FB', border: '1px solid #BCE3F2', color: '#0B3D5C' }}>
          <span className="position-relative d-inline-flex" style={{ width: '8px', height: '8px' }}>
            <span className="position-absolute w-100 h-100 rounded-circle animate-ping" style={{ backgroundColor: '#20B8C4', opacity: 0.75 }}></span>
            <span className="position-relative rounded-circle w-100 h-100" style={{ backgroundColor: '#087EAD' }}></span>
          </span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em' }}>SCADA TELEMETRY: 6 CLUSTERS ONLINE</span>
        </div>
      </div>

      {/* Right: Actions, Notifications, Role Switcher & User Profile */}
      <div className="metis-header-right">
        {/* Public Portal Shortcut */}
        {onOpenExternalPortal && (
          <button
            type="button"
            onClick={onOpenExternalPortal}
            className="metis-btn metis-btn-outline metis-btn-sm d-none d-md-inline-flex"
            title="Open Public External Transparency Portal"
          >
            <span>🌐</span>
            <span className="d-none d-lg-inline">Public Portal</span>
          </button>
        )}

        {/* 30-Day Contract Deadline Audit */}
        {onAuditDeadlines && (
          <button
            type="button"
            onClick={onAuditDeadlines}
            className="metis-btn metis-btn-outline metis-btn-sm d-none d-xl-inline-flex"
            title="Audit 30-day performance bond expiries and completion milestones"
          >
            <svg className="w-3.5 h-3.5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Audit Deadlines</span>
          </button>
        )}

        {/* Theme Toggle Button (Metis Standard) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="metis-icon-btn"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="metis-icon-btn d-none d-lg-inline-flex"
          title="Toggle Fullscreen"
          aria-label="Toggle fullscreen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Notifications Dropdown */}
        <div ref={notificationRef} className="position-relative">
          <button
            type="button"
            onClick={onToggleNotifications}
            className="metis-icon-btn"
            title="Notifications"
            aria-label="View notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && <span className="metis-badge-dot" />}
          </button>
          {showNotifications && NotificationPanelComponent}
        </div>

        {/* User Institutional Role & Status Badge */}
        <div className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold" style={{ backgroundColor: '#E7F6FB', borderColor: '#BCE3F2', color: '#0B3D5C' }}>
          <span className="w-2 h-2 rounded-full d-inline-block" style={{ backgroundColor: '#0E9F6E' }}></span>
          <span className="fw-bold">{user?.role || 'Staff'}</span>
          {user?.assignedZone && (
            <span className="d-none d-md-inline text-muted" style={{ color: '#607585' }}>&bull; {user.assignedZone}</span>
          )}
        </div>

        {/* User Profile Dropdown (Metis Standard) */}
        <div ref={userMenuRef} className="position-relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="metis-user-profile-btn"
            aria-label="User menu"
          >
            <img
              src={user?.avatar || '/placeholder-avatar.svg'}
              alt={user?.username}
              className="metis-avatar"
            />
            <div className="metis-user-info">
              <span className="metis-user-name">{user?.fullName || user?.username}</span>
              <span className="metis-user-role">{user?.role}</span>
            </div>
            <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isUserMenuOpen && (
            <div className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border p-1 z-3" style={{ minWidth: '180px' }}>
              <div className="px-3 py-2 border-bottom">
                <p className="small fw-bold text-dark mb-0">{user?.fullName || user?.username}</p>
                <small className="text-muted">{user?.email || 'Logged In'}</small>
              </div>
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsUserMenuOpen(false);
                }}
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-dark rounded"
                style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsUserMenuOpen(false);
                }}
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-dark rounded"
                style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
              <div className="border-top my-1"></div>
              <button
                onClick={onLogout}
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger rounded"
                style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default MetisHeader;
