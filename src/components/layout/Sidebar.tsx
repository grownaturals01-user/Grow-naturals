import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInventoryModules } from '../../context/InventoryModulesContext';
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
  Sun,
  Sprout,
  Plus,
  PlusCircle
} from 'lucide-react';

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
  const { canAccess } = useAuth();
  const { modules } = useInventoryModules();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand" onClick={handleLinkClick}>
          <div className="brand-icon">
            <img src={gnLogo} alt="Grow Naturals Logo" className="brand-logo-img" />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-title">GrowNaturals</span>
              <span className="brand-subtitle">Powered by Together tech</span>
            </div>
          )}
        </NavLink>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {/* Section: SELL (Amber accent) */}
        {(canAccess('dashboard') || canAccess('pos') || canAccess('invoices') || canAccess('quotations') || canAccess('delivery_challans')) && (
          <div className="nav-section section-sell">
            {!collapsed && (
              <div className="nav-section-title">
                <span className="nav-section-dot" />
                <span>Sell</span>
              </div>
            )}
            {canAccess('dashboard') && (
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Dashboard">
                <LayoutDashboard className="nav-icon" />
                {!collapsed && <span>Dashboard</span>}
              </NavLink>
            )}
            {canAccess('pos') && (
              <NavLink to="/pos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="POS Counter">
                <ShoppingCart className="nav-icon" />
                {!collapsed && <span>POS Counter</span>}
              </NavLink>
            )}
            {canAccess('invoices') && (
              <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Past Invoices">
                <ReceiptText className="nav-icon" />
                {!collapsed && <span>Past Invoices</span>}
              </NavLink>
            )}
            <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Customers">
              <Users2 className="nav-icon" />
              {!collapsed && <span>Customers</span>}
            </NavLink>
            {canAccess('quotations') && (
              <NavLink to="/quotations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Quotations">
                <FileSpreadsheet className="nav-icon" />
                {!collapsed && <span>Quotations</span>}
              </NavLink>
            )}
            {canAccess('delivery_challans') && (
              <NavLink to="/delivery-challans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Delivery Challans">
                <Truck className="nav-icon" />
                {!collapsed && <span>Delivery Challans</span>}
              </NavLink>
            )}
            {canAccess('dashboard') && (
              <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Analytics & Reports">
                <ReceiptText className="nav-icon" />
                {!collapsed && <span>Reports & Analytics</span>}
              </NavLink>
            )}
          </div>
        )}

        {/* Section: INVENTORY (Emerald accent) */}
        {canAccess('inventory') && (
          <div className="nav-section section-inv">
            {!collapsed && (
              <div className="nav-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="nav-section-dot" />
                  <span>Inventory</span>
                </div>
                <NavLink
                  to="/inventory/new"
                  onClick={handleLinkClick}
                  title="Add New Inventory Module"
                  style={{
                    fontSize: '0.7rem',
                    color: '#34d399',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontWeight: 700,
                    textTransform: 'none',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                  }}
                >
                  <Plus size={11} /> Add
                </NavLink>
              </div>
            )}
            <NavLink to="/products" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="All Products">
              <Package className="nav-icon" />
              {!collapsed && <span>All Products</span>}
            </NavLink>
            <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Categories">
              <FolderTree className="nav-icon" />
              {!collapsed && <span>Categories</span>}
            </NavLink>
            <NavLink to="/inventory/plants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Plant Inventory">
              <Trees className="nav-icon" />
              {!collapsed && <span>Plant Inventory</span>}
            </NavLink>
            <NavLink to="/inventory/cactus" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Cactus Inventory">
              <Cactus className="nav-icon" />
              {!collapsed && <span>Cactus Inventory</span>}
            </NavLink>
            <NavLink to="/inventory/pots" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Pots & Planters">
              <Box className="nav-icon" />
              {!collapsed && <span>Pots Inventory</span>}
            </NavLink>
            <NavLink to="/inventory/fertilizers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Fertilizers & Chemicals">
              <FlaskConical className="nav-icon" />
              {!collapsed && <span>Fertilizers & Care</span>}
            </NavLink>
            <NavLink to="/inventory/flowers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Flowers & Arrangements">
              <Flower2 className="nav-icon" />
              {!collapsed && <span>Flowers & Decor</span>}
            </NavLink>

            {/* Dynamic Custom Inventory Modules */}
            {(modules || []).map((m) => (
              <NavLink
                key={m.id}
                to={`/inventory/custom/${m.slug}`}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
                title={`${m.name} Inventory`}
              >
                <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>
                  {m.icon || '📦'}
                </span>
                {!collapsed && <span>{m.name} Inventory</span>}
              </NavLink>
            ))}

            {/* Add New Inventory Module Button */}
            <NavLink
              to="/inventory/new"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Add New Inventory Module"
              style={{
                color: '#34d399',
                fontWeight: 700,
                marginTop: '4px',
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px dashed rgba(52, 211, 153, 0.4)',
                borderRadius: '8px',
              }}
            >
              <PlusCircle className="nav-icon" style={{ color: '#34d399' }} />
              {!collapsed && <span>+ Add Inventory</span>}
            </NavLink>
          </div>
        )}

        {/* Section: PROJECTS (Purple accent) */}
        {canAccess('projects') && (
          <div className="nav-section section-proj">
            {!collapsed && (
              <div className="nav-section-title">
                <span className="nav-section-dot" />
                <span>Projects</span>
              </div>
            )}
            <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Project List">
              <FolderKanban className="nav-icon" />
              {!collapsed && <span>Project List</span>}
            </NavLink>
            <NavLink to="/supervisors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Site Supervisors">
              <Users2 className="nav-icon" />
              {!collapsed && <span>Supervisors Directory</span>}
            </NavLink>
          </div>
        )}

        {/* Section: PURCHASES (Teal accent) */}
        {(canAccess('purchases') || canAccess('expenses')) && (
          <div className="nav-section section-purch">
            {!collapsed && (
              <div className="nav-section-title">
                <span className="nav-section-dot" />
                <span>Purchases</span>
              </div>
            )}
            {canAccess('purchases') && (
              <NavLink to="/suppliers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Suppliers Directory">
                <Building2 className="nav-icon" />
                {!collapsed && <span>Suppliers</span>}
              </NavLink>
            )}
            {canAccess('purchases') && (
              <NavLink to="/purchases" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Purchase Orders">
                <ShoppingBag className="nav-icon" />
                {!collapsed && <span>Purchase Orders</span>}
              </NavLink>
            )}
            {canAccess('expenses') && (
              <NavLink to="/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Expenses">
                <Receipt className="nav-icon" />
                {!collapsed && <span>Expenses</span>}
              </NavLink>
            )}
          </div>
        )}

        {/* Section: SALES OPS (Rose accent) */}
        {canAccess('refunds') && (
          <div className="nav-section section-ops">
            {!collapsed && (
              <div className="nav-section-title">
                <span className="nav-section-dot" />
                <span>Sales Ops</span>
              </div>
            )}
            <NavLink to="/refunds" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Refunds">
              <RotateCcw className="nav-icon" />
              {!collapsed && <span>Refunds</span>}
            </NavLink>
          </div>
        )}

        {/* Section: ADMIN (Slate accent) */}
        {(canAccess('staff') || canAccess('settings')) && (
          <div className="nav-section section-admin">
            {!collapsed && (
              <div className="nav-section-title">
                <span className="nav-section-dot" />
                <span>Admin</span>
              </div>
            )}
            {canAccess('staff') && (
              <NavLink to="/staff" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Staff & Roles">
                <UserCog className="nav-icon" />
                {!collapsed && <span>Staff & Roles</span>}
              </NavLink>
            )}
            {canAccess('settings') && (
              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick} title="Shop Settings">
                <Settings className="nav-icon" />
                {!collapsed && <span>Shop Preferences</span>}
              </NavLink>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
};
  