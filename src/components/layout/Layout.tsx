import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThemeCustomizerDrawer } from './ThemeCustomizerDrawer';
import { useTheme } from '../../context/ThemeContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isPos = location.pathname.startsWith('/pos');
  const { isSidebarCollapsed, toggleSidebarCollapse } = useTheme();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className={`app-shell ${isPos ? 'pos-fullscreen-mode' : ''}`}>
      {!isPos && (
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

      <div className={`main-wrapper ${isPos ? 'pos-fullwidth' : isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
          onToggleCollapseSidebar={toggleSidebarCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className={`main-content ${isPos ? 'pos-main-content' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* DreamsPOS Theme Customizer Slide-out Drawer */}
      <ThemeCustomizerDrawer />
    </div>
  );
};
