import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { Settings, User } from 'react-feather';
import { all_routes } from '../../routes/all_routes';
import {
  logo,
  logoWhite,
  logoSmall,
  store_01,
  store_02,
  store_03,
  store_04,
  avator1,
} from '../../utils/imagepath';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import PosModals from '../../core/modals/pos-modal/posModalstjsx';

const storeLogos = [store_01, store_02, store_03, store_04];

const PosHeader: React.FC = () => {
  const navigate = useNavigate();
  const { businessId, businesses, activeBusiness, switchBusiness } = useBusiness();
  const { user, logout } = useAuth();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Fullscreen toggle
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
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Print Last Receipt
  const handlePrintLastReceipt = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await api.get<any[]>("/invoices", { business_id: businessId, limit: 1 });
      if (Array.isArray(res) && res.length > 0) {
        const lastInv = res[0];
        window.open(`/invoice-details?id=${lastInv.id}`, '_blank');
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  // Reload / Refresh POS
  const handleReload = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.reload();
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate(all_routes.signin);
  };

  const activeStoreName = activeBusiness?.name || (businessId === 'all' ? 'All Businesses' : 'Grow Naturals');
  const activeStoreLogo = businessId === 'nikhlesh-nursery' ? store_02 : store_01;

  return (
    <>
      {/* Header */}
      <div className="header pos-header">
        {/* Logo */}
        <div className="header-left active">
          <Link to="/dashboard" className="logo logo-normal">
            <img src={logo} alt="Logo" style={{ maxHeight: '42px' }} />
          </Link>
          <Link to="/dashboard" className="logo logo-white">
            <img src={logoWhite} alt="Logo" style={{ maxHeight: '42px' }} />
          </Link>
          <Link to="/dashboard" className="logo-small">
            <img src={logoSmall} alt="Logo" style={{ maxHeight: '42px' }} />
          </Link>
        </div>
        {/* /Logo */}
        <Link id="mobile_btn" className="mobile_btn d-none" to="#sidebar">
          <span className="bar-icon">
            <span />
            <span />
            <span />
          </span>
        </Link>
        {/* Header Menu */}
        <ul className="nav user-menu">
          {/* Time */}
          <li className="nav-item time-nav">
            <span className="bg-teal text-white d-inline-flex align-items-center">
              <i className="ti ti-clock me-2" />
              {currentTime}
            </span>
          </li>
          {/* Dashboard Exit */}
          <li className="nav-item pos-nav">
            <Link
              to="/dashboard"
              className="btn btn-purple btn-md d-inline-flex align-items-center"
            >
              <i className="ti ti-layout-dashboard me-1" />
              Dashboard
            </Link>
          </li>
          {/* Select Store */}
          <li className="nav-item dropdown has-arrow main-drop select-store-dropdown">
            <Link
              to="#"
              className="dropdown-toggle nav-link select-store"
              data-bs-toggle="dropdown"
            >
              <span className="user-info">
                <span className="user-letter">
                  <img
                    src={activeStoreLogo}
                    alt="Store Logo"
                    className="img-fluid"
                  />
                </span>
                <span className="user-detail">
                  <span className="user-name">{activeStoreName}</span>
                </span>
              </span>
            </Link>
            <div className="dropdown-menu dropdown-menu-right">
              <button
                type="button"
                className={`dropdown-item border-0 w-100 text-start ${businessId === 'all' ? 'active' : ''}`}
                onClick={() => switchBusiness('all')}
              >
                <img src={store_01} alt="Store Logo" className="img-fluid me-2" />
                All Businesses
              </button>
              {businesses.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  className={`dropdown-item border-0 w-100 text-start ${businessId === b.id ? 'active' : ''}`}
                  onClick={() => switchBusiness(b.id)}
                >
                  <img
                    src={storeLogos[idx % storeLogos.length]}
                    alt="Store Logo"
                    className="img-fluid me-2"
                  />
                  {b.name}
                </button>
              ))}
            </div>
          </li>
          {/* /Select Store */}
          {/* Calculator */}
          <li className="nav-item nav-item-box">
            <Tooltip title="Calculator" placement="bottom">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#calculator"
                className="bg-orange border-orange text-white"
              >
                <i className="ti ti-calculator" />
              </Link>
            </Tooltip>
          </li>
          {/* Fullscreen */}
          <li className="nav-item nav-item-box">
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Maximize"} placement="bottom">
              <Link
                to="#"
                id="btnFullscreen"
                onClick={toggleFullscreen}
                className={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              >
                <i className="ti ti-maximize" />
              </Link>
            </Tooltip>
          </li>
          {/* Cash Register */}
          <li
            className="nav-item nav-item-box"
          >
            <Tooltip title="Cash Register" placement="bottom">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#cash-register"
              >
                <i className="ti ti-cash" />
              </Link>
            </Tooltip>
          </li>
          {/* Print Last Receipt */}
          <li
            className="nav-item nav-item-box"
          >
            <Tooltip title="Print Last Receipt" placement="bottom">
              <Link to="#" onClick={handlePrintLastReceipt}>
                <i className="ti ti-printer" />
              </Link>
            </Tooltip>
          </li>
          {/* Reset / Reload POS */}
          <li className="nav-item nav-item-box">
            <Tooltip title="Reload POS" placement="bottom">
              <Link to="#" onClick={handleReload}>
                <i className="ti ti-reload" />
              </Link>
            </Tooltip>
          </li>
          {/* Today's Sale */}
          <li
            className="nav-item nav-item-box"
          >
            <Tooltip title="Today's Sale" placement="bottom">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#today-sale"
              >
                <i className="ti ti-chart-pie" />
              </Link>
            </Tooltip>
          </li>
          {/* POS Settings */}
          <li
            className="nav-item nav-item-box"
          >
            <Tooltip title="POS Settings" placement="bottom">
              <Link to={all_routes.possettings || "/pos-settings"}>
                <i className="ti ti-settings" />
              </Link>
            </Tooltip>
          </li>
          {/* Profile Menu */}
          <li className="nav-item dropdown has-arrow main-drop profile-nav">
            <Link
              to="#"
              className="nav-link userset"
              data-bs-toggle="dropdown"
            >
              <span className="user-info p-0">
                <span className="user-letter">
                  <img
                    src={avator1}
                    alt="Img"
                    className="img-fluid"
                  />
                </span>
              </span>
            </Link>
            <div className="dropdown-menu menu-drop-user">
              <div className="profilename">
                <div className="profileset">
                  <span className="user-img">
                    <img src={avator1} alt="Img" />
                    <span className="status online" />
                  </span>
                  <div className="profilesets">
                    <h6>{user?.name || "Admin"}</h6>
                    <h5>{user?.role || "Super Admin"}</h5>
                  </div>
                </div>
                <hr className="m-0" />
                <Link className="dropdown-item" to={all_routes.profile}>
                  <User className="me-2" />
                  My Profile
                </Link>
                <Link
                  className="dropdown-item"
                  to={all_routes.generalsettings}
                >
                  <Settings className="me-2" />
                  Settings
                </Link>
                <hr className="m-0" />
                <button
                  type="button"
                  className="dropdown-item logout pb-0 border-0 bg-transparent text-start w-100"
                  onClick={handleLogout}
                >
                  <i className="ti ti-logout me-2" />
                  Logout
                </button>
              </div>
            </div>
          </li>
        </ul>
        {/* /Header Menu */}
        {/* Mobile Menu */}
        <div className="dropdown mobile-user-menu">
          <Link
            to="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa fa-ellipsis-v" />
          </Link>
          <div className="dropdown-menu dropdown-menu-right">
            <Link className="dropdown-item" to={all_routes.profile}>
              My Profile
            </Link>
            <Link className="dropdown-item" to={all_routes.generalsettings}>
              Settings
            </Link>
            <button
              type="button"
              className="dropdown-item border-0 bg-transparent text-start w-100"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        {/* /Mobile Menu */}
      </div>
      {/* Header */}

      {/* POS Modals (Calculator, Cash Register, Today Sale, Profit, etc.) */}
      <PosModals />
    </>
  );
};

export default PosHeader;
