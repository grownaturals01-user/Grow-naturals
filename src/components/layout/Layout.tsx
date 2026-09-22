import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (window.location.pathname.startsWith('/pos')) return true;
    return localStorage.getItem('gn_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Auto-collapse sidebar whenever visiting POS page to maximize register screen space
  useEffect(() => {
    if (location.pathname.startsWith('/pos')) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gn_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
