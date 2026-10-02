import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBusiness } from '../../context/BusinessContext';
import { CalculatorModal } from '../common/CalculatorModal';
import { isFullscreenPageRoute } from './Layout';

import {
  Search,
  PlusCircle,
  Monitor,
  Maximize,
  Minimize,
  Palette,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  User,
  LogOut,
  FolderTree,
  PackagePlus,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  RotateCcw,
  UserCheck,
  Users,
  ShieldAlert,
  Truck,
  ArrowLeftRight,
  Settings2,
  FileText,
  Building2,
  ChevronDown,
  Check,
  Calculator,
  LayoutDashboard,
  Leaf,
  Sprout,
  Store,
  MoreVertical
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
  const { businessId, businesses, switchBusiness } = useBusiness();
  const location = useLocation();
  const navigate = useNavigate();
  const isFullscreenMode = isFullscreenPageRoute(location.pathname);
  const isPos = isFullscreenMode || location.pathname.startsWith('/pos');

  // Sidebar Collapse State
  const isSidebarCollapsed = isSidebarCollapsedProp !== undefined ? isSidebarCollapsedProp : isSidebarCollapsedContext;
  const handleToggleCollapse = onToggleCollapseSidebar || toggleSidebarCollapse;

  // Dropdown States
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showAddNewMenu, setShowAddNewMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for outside click handling
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLLIElement>(null);
  const profileRef = useRef<HTMLLIElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fullscreen Detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
      if (storeRef.current && !storeRef.current.contains(target)) {
        setShowStoreDropdown(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(target)) {
        setShowAddNewMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Real Businesses List from Business Context
  const allOption = { id: 'all', name: 'All Businesses', desc: 'Central Store View' };
  const baseStores = [
    allOption,
    { id: 'grow-naturals', name: 'Grow Naturals', desc: 'GST Taxable Store' },
    { id: 'nikhlesh-nursery', name: 'Nikhlesh Nursery', desc: '0% Tax Agricultural Sales' }
  ];

  const fullBusinessList = [
    allOption,
    ...(businesses && businesses.length > 0
      ? businesses.filter(b => b.id !== 'all')
      : baseStores.filter(b => b.id !== 'all'))
  ];

  const currentBusiness = fullBusinessList.find(b => b.id === businessId) || allOption;

  const getBusinessIcon = (id: string) => {
    if (id === 'all') return <Building2 size={14} color="#ffffff" />;
    if (id === 'grow-naturals') return <Leaf size={14} color="#ffffff" />;
    if (id === 'nikhlesh-nursery') return <Sprout size={14} color="#ffffff" />;
    return <Store size={14} color="#ffffff" />;
  };

  const getBusinessColor = (id: string) => {
    if (id === 'all') return '#111827';
    if (id === 'grow-naturals') return '#16a34a';
    if (id === 'nikhlesh-nursery') return '#ff9f43';
    return '#4f46e5';
  };

  const userInitials = (user?.name || 'GN')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <header className={`header ${isPos ? 'header-pos' : ''}`}>
        <div className="main-header">
          {/* Header Left: Sidebar Toggle + Real Store Switcher + Search */}
          <div className="header-left">
            {isPos ? (
              <Link to="/dashboard" className="pos-exit-dash-btn" title="Return to Dashboard">
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                {/* Desktop Sidebar Toggle Button */}
                <button
                  type="button"
                  id="toggle_btn"
                  onClick={handleToggleCollapse}
                  title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                  aria-label="Toggle Sidebar"
                >
                  {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                </button>

                {/* Mobile Menu Button */}
                <button
                  type="button"
                  id="mobile_btn"
                  className="mobile_btn"
                  onClick={onToggleMobileSidebar}
                  aria-label="Toggle Mobile Menu"
                >
                  <span className="bar-icon">
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              </>
            )}

            {/* Real Store Selector Dropdown (Clean Single Horizontal Line) */}
            <div className="select-store-dropdown" ref={storeRef}>
              <div
                className="store-selector-btn"
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                role="button"
                tabIndex={0}
                title="Switch Active Store"
              >
                <div
                  className="store-badge-icon"
                  style={{ backgroundColor: getBusinessColor(businessId) }}
                >
                  {getBusinessIcon(businessId)}
                </div>
                <span className="store-badge-name">{currentBusiness.name}</span>
                <ChevronDown size={14} className={`store-chevron ${showStoreDropdown ? 'open' : ''}`} />
              </div>

              {showStoreDropdown && (
                <div className="store-dropdown-menu">
                  {fullBusinessList.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`store-dropdown-item ${st.id === businessId ? 'active' : ''}`}
                      onClick={() => {
                        switchBusiness(st.id);
                        setShowStoreDropdown(false);
                      }}
                    >
                      <div
                        className="store-badge-icon"
                        style={{ backgroundColor: getBusinessColor(st.id) }}
                      >
                        {getBusinessIcon(st.id)}
                      </div>
                      <span>{st.name}</span>
                      {st.id === businessId && <Check size={14} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Global Search Bar with Real Navigation */}
            {!isPos && (
              <div className="top-nav-search" ref={searchWrapRef}>
                <div className="searchinputs">
                  <div className="search-addon">
                    <Search size={15} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search modules, invoices, products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchDropdown(true)}
                  />
                  <span className="search-kbd">
                    ⌘K
                  </span>
                </div>

                {showSearchDropdown && (
                  <div className="search-dropdown">
                    <div className="search-info">
                      <h6>
                        <Search size={13} />
                        Quick Navigation
                      </h6>
                      <ul className="search-tags">
                        <li>
                          <Link to="/invoices/create" onClick={() => setShowSearchDropdown(false)}>+ New Invoice</Link>
                        </li>
                        <li>
                          <Link to="/pos" onClick={() => setShowSearchDropdown(false)}>POS Counter</Link>
                        </li>
                        <li>
                          <Link to="/inventory" onClick={() => setShowSearchDropdown(false)}>Inventory</Link>
                        </li>
                        <li>
                          <Link to="/quotations" onClick={() => setShowSearchDropdown(false)}>Quotations</Link>
                        </li>
                        <li>
                          <Link to="/customers" onClick={() => setShowSearchDropdown(false)}>Customers</Link>
                        </li>
                        <li>
                          <Link to="/reports" onClick={() => setShowSearchDropdown(false)}>Sales Reports</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Right: + Add New Mega Menu + POS + Actions + Profile */}
          <ul className="user-menu">
            {/* + Add New Mega Menu Dropdown */}
            {!isPos && (
              <li className="link-nav" ref={addMenuRef}>
                <button
                  type="button"
                  className="btn-add-new"
                  onClick={() => setShowAddNewMenu(!showAddNewMenu)}
                >
                  <PlusCircle size={15} />
                  <span>Add New</span>
                </button>

                {showAddNewMenu && (
                  <div className="mega-add-menu">
                    <div className="mega-add-grid">
                      <Link to="/inventory" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <FolderTree size={18} />
                        </span>
                        <p>Category</p>
                      </Link>

                      <Link to="/products" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <PackagePlus size={18} />
                        </span>
                        <p>Product</p>
                      </Link>

                      <Link to="/purchases" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <ShoppingBag size={18} />
                        </span>
                        <p>Purchase</p>
                      </Link>

                      <Link to="/invoices/create" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <ShoppingCart size={18} />
                        </span>
                        <p>Sale</p>
                      </Link>

                      <Link to="/expenses" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <Receipt size={18} />
                        </span>
                        <p>Expense</p>
                      </Link>

                      <Link to="/quotations" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <FileSpreadsheet size={18} />
                        </span>
                        <p>Quotation</p>
                      </Link>

                      <Link to="/sales-returns" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <RotateCcw size={18} />
                        </span>
                        <p>Return</p>
                      </Link>

                      <Link to="/users" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <UserCheck size={18} />
                        </span>
                        <p>User</p>
                      </Link>

                      <Link to="/customers" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <Users size={18} />
                        </span>
                        <p>Customer</p>
                      </Link>

                      <Link to="/reports" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <ShieldAlert size={18} />
                        </span>
                        <p>Biller</p>
                      </Link>

                      <Link to="/suppliers" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <Truck size={18} />
                        </span>
                        <p>Supplier</p>
                      </Link>

                      <Link to="/projects" className="link-item" onClick={() => setShowAddNewMenu(false)}>
                        <span className="link-icon">
                          <ArrowLeftRight size={18} />
                        </span>
                        <p>Transfer</p>
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            )}

            {/* Direct POS Link Button */}
            {!isPos && (
              <li className="pos-nav">
                <Link to="/pos" className="btn-pos" title="Open POS Billing Counter">
                  <Monitor size={15} />
                  <span>POS</span>
                </Link>
              </li>
            )}

            {/* POS Mode Only: Calculator Button */}
            {isPos && (
              <li className="nav-item-box">
                <button
                  type="button"
                  className="nav-icon-link"
                  onClick={() => setShowCalc(true)}
                  title="Open Calculator"
                >
                  <Calculator size={17} />
                </button>
              </li>
            )}

            {/* Fullscreen Toggle */}
            <li className="nav-item-box">
              <button
                type="button"
                className="nav-icon-link"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </button>
            </li>

            {/* Theme Customizer Palette */}
            <li className="nav-item-box">
              <button
                type="button"
                className="nav-icon-link"
                onClick={openCustomizer}
                title="Theme Customizer"
                aria-label="Open Theme Customizer"
              >
                <Palette size={17} />
              </button>
            </li>

            {/* Light / Dark Mode Switcher */}
            <li className="nav-item-box">
              <button
                type="button"
                className="nav-icon-link"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
              </button>
            </li>

            {/* User Profile Badge & Dropdown */}
            <li className="profile-nav" ref={profileRef}>
              <div
                className="user-avatar-badge"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                role="button"
                tabIndex={0}
                title="User Account"
              >
                <span>{userInitials}</span>
                <span className="user-status-dot" />
              </div>

              {showProfileDropdown && (
                <div className="menu-drop-user">
                  <div className="profileset">
                    <div className="profileset-avatar">{userInitials}</div>
                    <div>
                      <h6 className="profileset-name">{user?.name || 'Administrator'}</h6>
                      <p className="profileset-role">{user?.role || 'Super Admin'}</p>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="user-dropdown-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/reports"
                    className="user-dropdown-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <FileText size={16} />
                    <span>Reports</span>
                  </Link>

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      openCustomizer();
                    }}
                  >
                    <Settings2 size={16} />
                    <span>Settings</span>
                  </button>

                  <hr />

                  <button
                    type="button"
                    className="user-dropdown-item logout"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </li>
          </ul>

          {/* Mobile 3-Dots Menu (Hidden on Desktop) */}
          <div className="mobile-user-menu" ref={mobileMenuRef}>
            <button
              type="button"
              className="nav-icon-link"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>

            {showMobileMenu && (
              <div className="menu-drop-user">
                <Link
                  to="/profile"
                  className="user-dropdown-item"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </Link>
                <button
                  type="button"
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowMobileMenu(false);
                    openCustomizer();
                  }}
                >
                  <Settings2 size={16} />
                  <span>Settings</span>
                </button>
                <hr />
                <button
                  type="button"
                  className="user-dropdown-item logout"
                  onClick={() => {
                    setShowMobileMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* POS Calculator Modal if active */}
      <CalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />
    </>
  );
};
