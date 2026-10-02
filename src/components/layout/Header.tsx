import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BusinessDropdown } from './BusinessDropdown';
import { CalculatorModal } from '../common/CalculatorModal';
import { isFullscreenPageRoute } from './Layout';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  PlusCircle,
  Monitor,
  FilePlus2,
  FileSpreadsheet,
  Receipt,
  PackagePlus,
  ShoppingCart,
  LayoutDashboard,
  Calculator,
  Maximize,
  Minimize,
  Palette,
  ChevronsLeft,
  ChevronsRight,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onToggleCollapseSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onToggleCollapseSidebar,
  isSidebarCollapsed: isSidebarCollapsedProp,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, openCustomizer, isSidebarCollapsed: isSidebarCollapsedContext, toggleSidebarCollapse } = useTheme();
  const location = useLocation();
  const isFullscreenMode = isFullscreenPageRoute(location.pathname);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const isSidebarCollapsed = isSidebarCollapsedProp !== undefined ? isSidebarCollapsedProp : isSidebarCollapsedContext;
  const handleToggleCollapse = onToggleCollapseSidebar || toggleSidebarCollapse;

  // Track fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => console.warn(err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.warn(err));
      }
    }
  };

  // Close add menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-left">
          {isFullscreenMode ? (
            <Link to="/dashboard" className="pos-exit-dash-btn" title="Return to Dashboard">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              {/* Mobile hamburger menu */}
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={onToggleMobileSidebar}
                aria-label="Toggle Menu"
              >
                <Menu size={22} />
              </button>

              {/* Desktop sidebar expand / collapse button */}
              <button
                type="button"
                id="toggle_btn"
                className="desktop-sidebar-toggle-btn"
                onClick={handleToggleCollapse}
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label="Toggle Sidebar"
              >
                {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
              </button>
            </>
          )}

          {/* Store Selection Dropdown (Defaults to 'All Businesses') */}
          <BusinessDropdown />
        </div>

        <div className="header-right">
          {isFullscreenMode ? (
            <>
              {/* Fullscreen Mode Calculator Button */}
              <button
                type="button"
                className="header-icon-btn pos-action-icon-btn"
                onClick={() => setShowCalc(true)}
                title="Open Calculator"
                aria-label="Calculator"
              >
                <Calculator size={17} />
              </button>

              {/* Fullscreen Mode Maximize / Fullscreen Toggle Button */}
              <button
                type="button"
                className="header-icon-btn pos-action-icon-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Window'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </button>
            </>
          ) : (
            <>
              {/* + Add New Button with Quick Actions Dropdown */}
              <div className="dash-add-new-wrap" ref={addMenuRef}>
                <button
                  type="button"
                  className="dash-header-btn-add"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                >
                  <PlusCircle size={15} />
                  <span>Add New</span>
                </button>

                {showAddMenu && (
                  <div className="dash-add-menu-dropdown">
                    <Link
                      to="/invoices/create"
                      className="dash-add-menu-item"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <FilePlus2 size={15} color="#16a34a" />
                      <span>New Sales Invoice</span>
                    </Link>
                    <Link
                      to="/pos"
                      className="dash-add-menu-item"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <ShoppingCart size={15} color="#ff9f43" />
                      <span>Open POS Counter</span>
                    </Link>
                    <Link
                      to="/quotations/new"
                      className="dash-add-menu-item"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <FileSpreadsheet size={15} color="#2563eb" />
                      <span>Create Quotation</span>
                    </Link>
                    <Link
                      to="/products/new"
                      className="dash-add-menu-item"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <PackagePlus size={15} color="#9333ea" />
                      <span>Add New Product</span>
                    </Link>
                    <Link
                      to="/expenses/new"
                      className="dash-add-menu-item"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <Receipt size={15} color="#ef4444" />
                      <span>Record Expense</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* POS Page Button (Dark Navy / Slate) */}
              <Link to="/pos" className="dash-header-btn-pos" title="Open POS Billing Counter">
                <Monitor size={15} />
                <span>POS</span>
              </Link>
            </>
          )}

          {/* Theme Customizer Palette Trigger */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={openCustomizer}
            title="Theme Customizer"
            aria-label="Theme Customizer"
          >
            <Palette size={17} />
          </button>

          {/* Light / Dark Mode Switcher */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          {/* User Profile */}
          {user && (
            <div className="user-profile-badge" onClick={logout} title="Click to Log Out">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role-tag">{user.role}</span>
              </div>
              <LogOut size={15} color="var(--color-text-dim)" />
            </div>
          )}
        </div>
      </header>

      {/* Calculator Modal */}
      {showCalc && <CalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />}
    </>
  );
};
