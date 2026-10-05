import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInventoryModules } from '../../context/InventoryModulesContext';
import gnFullLogo from '../../assets/grownaturals-full-logo.jpeg';
import gnLogo from '../../assets/grownaturalslogo.jpeg';
import {
  LayoutDashboard,
  ShoppingCart,
  FileSpreadsheet,
  Truck,
  Package,
  FolderTree,
  Trees,
  Box,
  FlaskConical,
  Flower2,
  FolderKanban,
  Users2,
  Building2,
  ShoppingBag,
  Receipt,
  RotateCcw,
  ReceiptText,
  UserCog,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Leaf,
  TrendingDown,
  Warehouse,
  ArrowLeftRight,
  Sun,
  Sprout,
  Plus,
  PlusCircle,
  FilePlus2,
  X
} from 'lucide-react';
import { renderModuleIcon } from '../common/CategoryIcons';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const Cactus: React.FC<{ className?: string; size?: number }> = ({ className = 'nav-icon', size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20" />
    <path d="M7 11V8a2 2 0 0 1 4 0v13" />
    <path d="M17 14v-3a2 2 0 0 0-4 0v10" />
    <path d="M5 22h14" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const { canAccess, user } = useAuth();
  const { modules } = useInventoryModules();
  const location = useLocation();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink
          to="/"
          className="sidebar-brand"
          onClick={(e) => {
            handleLinkClick();
            if (collapsed) {
              e.preventDefault();
              onToggleCollapse();
            }
          }}
          title={collapsed ? 'Click to expand sidebar' : 'GrowNaturals'}
        >
          <div className="brand-icon" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img 
              src={collapsed ? gnLogo : gnFullLogo} 
              alt="Grow Naturals Logo" 
              className="brand-logo-img" 
              style={{ maxHeight: '42px', width: 'auto', maxWidth: collapsed ? '36px' : '170px', objectFit: 'contain', boxShadow: 'none', border: 'none', borderRadius: '4px' }} 
            />
          </div>
        </NavLink>

        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Mobile Close Button (visible on mobile only) */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onCloseMobile}
          aria-label="Close Sidebar"
          title="Close Sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {/* Section: MAIN */}
        <div className="nav-section section-sell">
          {!collapsed && (
            <div className="nav-section-title">
              <span className="nav-section-dot" />
              <span>Main</span>
            </div>
          )}
          <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Dashboard">
            <LayoutDashboard className="nav-icon" />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="POS">
            <ShoppingCart className="nav-icon" />
            <span className="nav-label">POS</span>
          </NavLink>
        </div>

        {/* Section: SALES */}
        <div className="nav-section section-sell">
          {!collapsed && (
            <div className="nav-section-title">
              <span className="nav-section-dot" />
              <span>Sales</span>
            </div>
          )}
          <NavLink
            to="/create-sales-invoice"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
            title="Create Sales Invoice"
          >
            <FilePlus2 className="nav-icon" />
            <span className="nav-label">Create Sales Invoice</span>
          </NavLink>
        </div>

        {/* Section: INVENTORY */}
        <div className="nav-section section-inv">
          {!collapsed && (
            <div className="nav-section-title">
              <span className="nav-section-dot" />
              <span>Inventory</span>
            </div>
          )}
          <NavLink to="/product-list" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Product List">
            <Package className="nav-icon" />
            <span className="nav-label">Product List</span>
          </NavLink>
          <NavLink to="/add-product" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Add Product">
            <PlusCircle className="nav-icon" />
            <span className="nav-label">Add Product</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};
  