import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThemeCustomizerDrawer } from './ThemeCustomizerDrawer';
import { useTheme } from '../../context/ThemeContext';

export const isFullscreenPageRoute = (pathname: string): boolean => {
  return (
    pathname.startsWith('/pos') ||
    pathname.startsWith('/invoices') ||
    pathname.startsWith('/sales') ||
    pathname.startsWith('/sell') ||
    pathname.startsWith('/quotations') ||
    pathname.startsWith('/delivery-challans')
  );
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const isFullscreenMode = isFullscreenPageRoute(location.pathname);
  const isPos = location.pathname.startsWith('/pos');
  const { isSidebarCollapsed, toggleSidebarCollapse } = useTheme();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className={`app-shell ${isFullscreenMode ? (isPos ? 'pos-fullscreen-mode pos-fixed-layout' : 'pos-fullscreen-mode') : ''}`}>
      {!isFullscreenMode && (
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

      <div className={`main-wrapper ${isFullscreenMode ? (isPos ? 'pos-fullwidth pos-fixed-wrapper' : 'pos-fullwidth') : isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
          onToggleCollapseSidebar={toggleSidebarCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className={`main-content ${isFullscreenMode ? (isPos ? 'pos-main-content' : 'pos-fullwidth-content') : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* DreamsPOS Theme Customizer Slide-out Drawer */}
      <ThemeCustomizerDrawer />
    </div>
  );
};
