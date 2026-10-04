import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThemeCustomizerDrawer } from './ThemeCustomizerDrawer';
import { useTheme } from '../../context/ThemeContext';

export const isHideSidebarRoute = (pathname: string): boolean => {
  return (
    pathname.startsWith('/pos') ||
    pathname.startsWith('/invoices/create') ||
    pathname.startsWith('/invoices/new') ||
    pathname.startsWith('/sales/create') ||
    pathname.startsWith('/sales/new') ||
    (pathname.startsWith('/invoices/') && pathname.endsWith('/edit'))
  );
};

export const isFullscreenPageRoute = isHideSidebarRoute;

export const Layout: React.FC = () => {
  const location = useLocation();
  const isHideSidebar = isHideSidebarRoute(location.pathname);
  const isPos = location.pathname.startsWith('/pos');
  const { isSidebarCollapsed, toggleSidebarCollapse } = useTheme();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className={`app-shell ${isHideSidebar ? (isPos ? 'pos-fullscreen-mode pos-fixed-layout' : 'no-sidebar-mode') : ''} ${isSidebarCollapsed ? 'mini-sidebar' : ''}`}>
      {/* Top Header spans full page width matching DreamsPOS */}
      <Header
        onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
        onToggleCollapseSidebar={toggleSidebarCollapse}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {!isHideSidebar && (
        <>
          <Sidebar
            collapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
          {mobileOpen && (
            <div
              className="sidebar-overlay opened"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar overlay"
            />
          )}
        </>
      )}

      <div className={`main-wrapper ${isHideSidebar ? (isPos ? 'pos-fullwidth pos-fixed-wrapper' : 'pos-fullwidth') : isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <main className={`main-content ${isHideSidebar ? (isPos ? 'pos-main-content' : 'pos-fullwidth-content') : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* DreamsPOS Theme Customizer Slide-out Drawer */}
      <ThemeCustomizerDrawer />
    </div>
  );
};
