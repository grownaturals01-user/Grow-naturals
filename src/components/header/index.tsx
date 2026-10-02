import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { all_routes } from "../../routes/all_routes";
import {
  arabicFlag,
  avator1,
  commandSvg,
  englishFlag,
  logoSvg,
  logoSmallPng,
  logoWhitePng,
  store_01,
  store_02,
  usFlag,
} from "../../utils/imagepath";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import { usePosSync } from "../../context/PosSyncContext";
import { api } from "../../services/api";

interface SearchResultItem {
  id: string;
  name: string;
  type: "product" | "customer" | "invoice";
  sub: string;
  link: string;
}

const Header: React.FC = () => {
  const route: any = all_routes;
  const location = useLocation();
  const navigate = useNavigate();

  const { businessId, businesses, activeBusiness, switchBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const { syncStatus, queuedCount, isOnline } = usePosSync();

  const [toggle, setToggle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flagImage, _setFlagImage] = useState(usFlag);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications state from backend
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string; link: string; icon: string; isRead?: boolean }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redux theme state
  interface RootState {
    themeSetting: {
      expandMenus: { expandMenus: boolean };
      dataLayout: string;
    };
  }

  const { expandMenus } = useSelector(
    (state: RootState) => state.themeSetting.expandMenus
  );
  const dataLayout = useSelector(
    (state: RootState) => state.themeSetting.dataLayout
  );

  // Fetch live notifications and alerts from backend
  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get("/reports/dashboard", { business_id: businessId });
      const notifs: any[] = [];

      // 1. Low stock alerts
      if (res?.low_stock_items && res.low_stock_items.length > 0) {
        res.low_stock_items.slice(0, 3).forEach((item: any) => {
          notifs.push({
            id: `low-${item.id}`,
            title: "Low Stock Alert",
            desc: `${item.name} is running low (${item.stock_quantity} remaining)`,
            time: "Realtime",
            link: route.lowstock || "/low-stocks",
            icon: "ti ti-alert-triangle text-danger",
          });
        });
      }

      // 2. Recent invoice activity
      if (res?.recent_invoices && res.recent_invoices.length > 0) {
        res.recent_invoices.slice(0, 2).forEach((inv: any) => {
          notifs.push({
            id: `inv-${inv.id}`,
            title: "New Sale Invoice",
            desc: `${inv.invoice_number} - ${inv.customer_name || 'Customer'} (₹${Number(inv.total_amount).toLocaleString('en-IN')})`,
            time: "Today",
            link: route.saleslist || "/sales-list",
            icon: "ti ti-file-invoice text-success",
          });
        });
      }

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.warn("Could not load header notifications:", err);
    }
  }, [businessId, route.lowstock, route.saleslist]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Global search handler (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = searchQuery.toLowerCase().trim();
        const results: SearchResultItem[] = [];

        // Search products
        const productsRes = await api.get("/products", { search: query, business_id: businessId }).catch(() => []);
        if (Array.isArray(productsRes)) {
          productsRes.slice(0, 4).forEach((p: any) => {
            results.push({
              id: `prod-${p.id}`,
              name: p.name,
              type: "product",
              sub: `₹${Number(p.selling_price || 0).toLocaleString('en-IN')} | Stock: ${p.stock_quantity || 0}`,
              link: route.productlist || "/product-list",
            });
          });
        }

        // Search customers
        const customersRes = await api.get("/customers", { search: query, business_id: businessId }).catch(() => []);
        if (Array.isArray(customersRes)) {
          customersRes.slice(0, 3).forEach((c: any) => {
            results.push({
              id: `cust-${c.id}`,
              name: c.name,
              type: "customer",
              sub: `Phone: ${c.phone || 'N/A'}`,
              link: route.customers || "/customers",
            });
          });
        }

        setSearchResults(results);
      } catch (err) {
        console.warn("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, businessId, route.productlist, route.customers]);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fullscreen toggle logic
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlesidebar = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    document.body.classList.remove("expand-menu");
    const isMini = document.body.classList.toggle("mini-sidebar");
    setToggle(isMini);
  };

  const sidebarOverlay = () => {
    document?.querySelector(".main-wrapper")?.classList?.toggle("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.toggle("opened");
    document?.querySelector("html")?.classList?.toggle("menu-opened");
  };

  useEffect(() => {
    document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
    document.querySelector(".sidebar-overlay")?.classList.remove("opened");
    document.querySelector("html")?.classList.remove("menu-opened");
  }, [location.pathname]);

  useEffect(() => {
    setToggle(document.body.classList.contains("mini-sidebar"));
  }, []);

  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    if (document.body.classList.contains("layout-hovered")) {
      document.body.classList.add("expand-menu");
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate(route.signin || "/signin");
  };

  const clearAllNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    setNotifications([]);
    setUnreadCount(0);
  };

  const activeStoreName = activeBusiness?.name || (businessId === 'all' ? 'All Businesses' : 'Grow Naturals');

  return (
    <div className="header">
      <div className="main-header">
        {/* Brand Logo */}
        <div
          className={`header-left ${toggle ? "mini" : "active"}`}
        >
          <Link to="/admin-dashboard" className="logo logo-normal">
            <img src={logoSvg} alt="Grow Naturals" className="brand-logo-img" />
            <div className="brand-text ms-2 d-flex flex-column text-start">
              <span className="brand-title">Grow Naturals</span>
              <span className="brand-subtitle">Nursery ERP</span>
            </div>
          </Link>
          <Link to="/admin-dashboard" className="logo logo-white">
            <img src={logoWhitePng} alt="Grow Naturals" className="brand-logo-img" />
            <div className="brand-text ms-2 d-flex flex-column text-start">
              <span className="brand-title text-white">Grow Naturals</span>
              <span className="brand-subtitle">Nursery ERP</span>
            </div>
          </Link>
          <Link to="/admin-dashboard" className="logo-small">
            <img src={logoSmallPng} alt="Grow Naturals" />
          </Link>
          <Link
            id="toggle_btn"
            to="#"
            style={{
              display: location.pathname.includes("pos") ? "none" : "",
            }}
            onClick={handlesidebar}
          >
            <i className="feather icon-chevrons-left feather-16" />
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <Link
          id="mobile_btn"
          className="mobile_btn"
          to="#"
          onClick={sidebarOverlay}
        >
          <span className="bar-icon">
            <span />
            <span />
            <span />
          </span>
        </Link>

        {/* Header Center / Right Menu */}
        <ul className="nav user-menu d-flex align-items-center w-100 justify-content-end">
          {/* Live Global Search */}
          <li className="nav-item nav-searchinputs flex-grow-1 mx-2" style={{ minWidth: "220px", maxWidth: "420px" }}>
            <div className="top-nav-search w-100">
              <div className="dropdown w-100">
                <div
                  className="searchinputs input-group w-100"
                  id="headerSearchWrapper"
                  data-bs-toggle="dropdown"
                  aria-expanded={showSearchDropdown}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="form-control"
                    placeholder="Search Products, Customers, Bills..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                  />
                  <div className="search-addon">
                    <span>
                      <i className="ti ti-search" />
                    </span>
                  </div>
                  <span className="input-group-text">
                    <kbd className="d-flex align-items-center">
                      <img src={commandSvg} alt="Cmd" className="me-1" />K
                    </kbd>
                  </span>
                </div>

                {showSearchDropdown && (
                  <div
                    className="dropdown-menu search-dropdown show w-100 p-2 shadow"
                    style={{ minWidth: "300px", maxHeight: "380px", overflowY: "auto" }}
                  >
                    {isSearching ? (
                      <div className="p-3 text-center text-muted fs-13">
                        <i className="ti ti-loader-2 ti-spin me-2" /> Searching...
                      </div>
                    ) : searchQuery && searchResults.length === 0 ? (
                      <div className="p-3 text-center text-muted fs-13">
                        No matches found for "{searchQuery}"
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <h6 className="dropdown-header text-uppercase fs-11 text-muted">
                          Search Results
                        </h6>
                        {searchResults.map((item) => (
                          <Link
                            key={item.id}
                            to={item.link}
                            className="dropdown-item d-flex align-items-center justify-content-between py-2 rounded"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <span className="avatar avatar-sm bg-light-primary text-primary me-2 d-flex align-items-center justify-content-center">
                                <i className={item.type === 'product' ? 'ti ti-package' : 'ti ti-user'} />
                              </span>
                              <div>
                                <h6 className="fs-13 fw-semibold mb-0">{item.name}</h6>
                                <span className="fs-11 text-muted">{item.sub}</span>
                              </div>
                            </div>
                            <span className="badge badge-soft-primary fs-10 text-uppercase">
                              {item.type}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="search-info mb-2">
                          <h6 className="fs-12 fw-bold text-muted mb-2">Quick Navigation</h6>
                          <div className="d-flex flex-wrap gap-1">
                            <Link to={route.productlist} className="btn btn-sm btn-light fs-12">
                              🪴 Products
                            </Link>
                            <Link to={route.saleslist} className="btn btn-sm btn-light fs-12">
                              🧾 Sales
                            </Link>
                            <Link to={route.customers} className="btn btn-sm btn-light fs-12">
                              👥 Customers
                            </Link>
                            <Link to={route.pos} className="btn btn-sm btn-light fs-12">
                              💻 POS
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>

          {/* Business / Store Selector Dropdown */}
          <li className="nav-item dropdown has-arrow main-drop select-store-dropdown">
            <Link
              to="#"
              className="dropdown-toggle nav-link select-store d-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <span className="user-info d-flex align-items-center">
                <span className="user-letter me-2">
                  <img
                    src={businessId === 'nikhlesh-nursery' ? store_02 : store_01}
                    alt="Store Logo"
                    className="img-fluid"
                    style={{ width: "24px", height: "24px", borderRadius: "4px" }}
                  />
                </span>
                <span className="user-detail text-start">
                  <span className="user-name fw-semibold fs-13">{activeStoreName}</span>
                </span>
              </span>
            </Link>
            <div className="dropdown-menu dropdown-menu-right shadow-sm p-2">
              <div className="dropdown-header text-muted fs-11 text-uppercase mb-1">
                Switch Business Entity
              </div>
              <button
                type="button"
                className={`dropdown-item d-flex align-items-center justify-content-between rounded py-2 mb-1 ${
                  businessId === 'all' ? 'active' : ''
                }`}
                onClick={() => switchBusiness('all')}
              >
                <div className="d-flex align-items-center">
                  <i className="ti ti-building-store me-2 fs-16" />
                  <span>All Businesses</span>
                </div>
                {businessId === 'all' && <i className="ti ti-check text-success fs-14" />}
              </button>

              {businesses.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`dropdown-item d-flex align-items-center justify-content-between rounded py-2 mb-1 ${
                    businessId === b.id ? 'active' : ''
                  }`}
                  onClick={() => switchBusiness(b.id)}
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={b.id === 'nikhlesh-nursery' ? store_02 : store_01}
                      alt={b.name}
                      className="img-fluid me-2"
                      style={{ width: "20px", height: "20px", borderRadius: "3px" }}
                    />
                    <div className="text-start">
                      <div className="fw-semibold fs-13">{b.name}</div>
                      {b.gstin && <div className="fs-10 text-muted">GSTIN: {b.gstin}</div>}
                    </div>
                  </div>
                  {businessId === b.id && <i className="ti ti-check text-success fs-14" />}
                </button>
              ))}

              <div className="dropdown-divider my-1" />
              <Link to={route.generalsettings || "/general-settings"} className="dropdown-item fs-12 text-primary py-2">
                <i className="ti ti-settings me-1" /> Manage Businesses
              </Link>
            </div>
          </li>

          {/* Quick "Add New" Dropdown */}
          <li className="nav-item dropdown link-nav">
            <Link
              to="#"
              className="btn btn-primary btn-md d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-circle-plus me-1" />
              Add New
            </Link>
            <div className="dropdown-menu dropdown-xl dropdown-menu-center p-3">
              <div className="row g-2">
                <div className="col-md-3 col-6">
                  <Link to={route.addproduct} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-primary mb-1 d-block">
                      <i className="ti ti-square-plus" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Product</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.categorylist} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-info mb-1 d-block">
                      <i className="ti ti-brand-codepen" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Category</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.pos} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-success mb-1 d-block">
                      <i className="ti ti-shopping-cart" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">New Bill</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.expenselist} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-orange mb-1 d-block">
                      <i className="ti ti-file-text" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Expense</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.quotationlist} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-secondary mb-1 d-block">
                      <i className="ti ti-device-floppy" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Quotation</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.customers} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-purple mb-1 d-block">
                      <i className="ti ti-users" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Customer</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.suppliers} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-teal mb-1 d-block">
                      <i className="ti ti-user-check" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Supplier</p>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to={route.stocktransfer} className="link-item text-center p-2 border rounded d-block">
                    <span className="link-icon fs-20 text-danger mb-1 d-block">
                      <i className="ti ti-truck" />
                    </span>
                    <p className="mb-0 fs-12 fw-medium">Transfer</p>
                  </Link>
                </div>
              </div>
            </div>
          </li>

          {/* POS Direct Button */}
          <li className="nav-item pos-nav">
            <Link
              to={route.pos}
              className="btn btn-dark btn-md d-inline-flex align-items-center"
            >
              <i className="ti ti-device-laptop me-1" />
              POS
            </Link>
          </li>

          {/* Network & POS Background Sync Status */}
          <li className="nav-item nav-item-box" title={isOnline ? `Online - ${syncStatus === 'syncing' ? 'Syncing data' : 'All synced'}` : 'Offline Mode'}>
            <div className="d-flex align-items-center px-2 py-1">
              {syncStatus === 'syncing' ? (
                <span className="badge badge-soft-warning d-flex align-items-center">
                  <i className="ti ti-refresh ti-spin me-1" /> Syncing
                </span>
              ) : !isOnline || syncStatus === 'offline' ? (
                <span className="badge badge-soft-danger d-flex align-items-center">
                  <i className="ti ti-cloud-off me-1" /> Offline {queuedCount > 0 ? `(${queuedCount})` : ''}
                </span>
              ) : (
                <span className="badge badge-soft-success d-flex align-items-center">
                  <i className="ti ti-cloud-check me-1" /> Online
                </span>
              )}
            </div>
          </li>

          {/* Language Flag */}
          <li className="nav-item dropdown has-arrow flag-nav nav-item-box">
            <Link
              className="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              to="#"
              role="button"
            >
              <img src={flagImage} alt="Language" height={16} />
            </Link>
            <div className="dropdown-menu dropdown-menu-right">
              <Link to="#" className="dropdown-item active">
                <img src={englishFlag} alt="English" height={16} className="me-2" />
                English (IN)
              </Link>
              <Link to="#" className="dropdown-item">
                <img src={arabicFlag} alt="Arabic" height={16} className="me-2" />
                Arabic
              </Link>
            </div>
          </li>

          {/* Fullscreen Toggle */}
          <li className="nav-item nav-item-box">
            <Link
              to="#"
              id="btnFullscreen"
              onClick={toggleFullscreen}
              className={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              title="Toggle Fullscreen"
            >
              <i className="ti ti-maximize" />
            </Link>
          </li>

          {/* Live Notifications from Backend */}
          <li className="nav-item dropdown nav-item-box">
            <Link
              to="#"
              className="dropdown-toggle nav-link position-relative"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-bell" />
              {unreadCount > 0 && (
                <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle fs-10">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="dropdown-menu notifications shadow-lg p-0" style={{ width: "320px" }}>
              <div className="topnav-dropdown-header d-flex align-items-center justify-content-between p-3 border-bottom">
                <h6 className="notification-title mb-0 fw-bold fs-14">
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                </h6>
                {notifications.length > 0 && (
                  <Link to="#" className="clear-noti fs-12 text-primary" onClick={clearAllNotifications}>
                    Mark all as read
                  </Link>
                )}
              </div>
              <div className="noti-content" style={{ maxHeight: "280px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted fs-13">
                    <i className="ti ti-bell-off fs-24 d-block mb-1 text-gray-4" />
                    No new notifications
                  </div>
                ) : (
                  <ul className="notification-list list-unstyled mb-0">
                    {notifications.map((n) => (
                      <li key={n.id} className="notification-message p-3 border-bottom">
                        <Link to={n.link} className="d-flex text-decoration-none">
                          <span className="avatar avatar-sm bg-light flex-shrink-0 me-2 d-flex align-items-center justify-content-center">
                            <i className={`${n.icon} fs-16`} />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details mb-1 fs-12 text-gray-9">
                              <span className="noti-title fw-bold">{n.title}: </span>
                              {n.desc}
                            </p>
                            <p className="noti-time mb-0 fs-11 text-muted">{n.time}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="topnav-dropdown-footer p-2 text-center border-top">
                <Link to={route.lowstock || "/low-stocks"} className="btn btn-sm btn-light w-100 fs-12">
                  View Inventory Alerts
                </Link>
              </div>
            </div>
          </li>

          {/* Settings Icon */}
          <li className="nav-item nav-item-box">
            <Link to={route.generalsettings || "/general-settings"} title="Settings">
              <i className="feather icon-settings" />
            </Link>
          </li>

          {/* User Profile & Auth Dropdown */}
          <li className="nav-item dropdown has-arrow main-drop profile-nav">
            <Link
              to="#"
              className="nav-link userset d-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <span className="user-info p-0 d-flex align-items-center">
                <span className="user-letter">
                  <img src={avator1} alt="User Avatar" className="img-fluid" />
                </span>
              </span>
            </Link>
            <div className="dropdown-menu menu-drop-user shadow-sm p-2">
              <div className="profileset d-flex align-items-center p-2 mb-2 bg-light rounded">
                <span className="user-img me-2">
                  <img src={avator1} alt="Avatar" />
                </span>
                <div>
                  <h6 className="fw-bold fs-13 mb-0">{user?.name || "Admin"}</h6>
                  <span className="badge badge-soft-success fs-10 text-capitalize">
                    {user?.role || "Super Admin"}
                  </span>
                  <div className="fs-11 text-muted mt-1">{user?.email || "admin@grownaturals.in"}</div>
                </div>
              </div>
              <Link className="dropdown-item py-2 rounded" to={route.profile || "/profile"}>
                <i className="ti ti-user-circle me-2 fs-16 text-muted" />
                My Profile
              </Link>
              <Link className="dropdown-item py-2 rounded" to={route.salesreport || "/sales-report"}>
                <i className="ti ti-file-text me-2 fs-16 text-muted" />
                Reports & Analytics
              </Link>
              <Link className="dropdown-item py-2 rounded" to={route.generalsettings || "/general-settings"}>
                <i className="ti ti-settings-2 me-2 fs-16 text-muted" />
                Store Settings
              </Link>
              <div className="dropdown-divider my-2" />
              <button
                type="button"
                className="dropdown-item logout text-danger py-2 rounded d-flex align-items-center w-100"
                onClick={handleLogout}
              >
                <i className="ti ti-logout me-2 fs-16" />
                Logout
              </button>
            </div>
          </li>
        </ul>

        {/* Mobile User Menu */}
        <div className="dropdown mobile-user-menu">
          <Link
            to="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa fa-ellipsis-v" />
          </Link>
          <div className="dropdown-menu dropdown-menu-right p-2">
            <Link className="dropdown-item py-2" to={route.profile || "/profile"}>
              My Profile
            </Link>
            <Link className="dropdown-item py-2" to={route.generalsettings || "/general-settings"}>
              Settings
            </Link>
            <button
              type="button"
              className="dropdown-item text-danger py-2 w-100"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
