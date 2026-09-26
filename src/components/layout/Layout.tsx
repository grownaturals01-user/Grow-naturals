import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isPos = location.pathname.startsWith('/pos');
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('gn_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gn_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className={`app-shell ${isPos ? 'pos-fullscreen-mode' : ''}`}>
      {!isPos && (
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      )}

      <div className={`main-wrapper ${isPos ? 'pos-fullwidth' : collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)} />
        <main className={`main-content ${isPos ? 'pos-main-content' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
