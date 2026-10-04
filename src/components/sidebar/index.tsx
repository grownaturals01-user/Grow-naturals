import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarData } from "../../core/json/siderbar_data";
// import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { all_routes } from "../../routes/all_routes";
import {
  customer15,
  logo,
  logoSmall,
  logoWhite,
  logoSmallWhite,
} from "../../utils/imagepath";
import { useAuth } from "../../context/AuthContext";

// Recursively check if any nested child is active
const hasActiveNestedChild = (menuItem: any, currentPath: string): boolean => {
  if (menuItem?.link === currentPath) {
    return true;
  }
  if (menuItem?.submenuItems) {
    return menuItem.submenuItems.some((child: any) =>
      hasActiveNestedChild(child, currentPath)
    );
  }
  return false;
};

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const route = all_routes;
  const Location = useLocation();
  const { user } = useAuth();
  // const { t } = useTranslation();

  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");
  // Track which active links have subdrop class manually toggled off (true = toggled off, false/undefined = show subdrop)
  const [activeLinksSubdropToggled, setActiveLinksSubdropToggled] = useState<
    Map<string, boolean>
  >(new Map());

  const isInvoiceCreatePage =
    Location.pathname.includes("create-sales-invoice") ||
    Location.pathname.includes("add-sales") ||
    Location.pathname.includes("create-sales") ||
    Location.pathname.includes("invoices/create") ||
    Location.pathname.includes("invoices/new") ||
    Location.pathname.includes("sales/create") ||
    Location.pathname.includes("sales/new");

  if (isInvoiceCreatePage) {
    return null;
  }

  const toggleSidebar = (title: string) => {
    setSubopen((prev) => (prev === title ? "" : title));
  };

  const toggleSubsidebar = (subitem: string) => {
    setSubsidebar((prev) => (prev === subitem ? "" : subitem));
  };

  // Toggle subdrop for active links
  const toggleActiveLinkSubdrop = (linkPath: string) => {
    setActiveLinksSubdropToggled((prev) => {
      const newMap = new Map(prev);
      const isToggledOff = newMap.get(linkPath);
      // Toggle: if it was toggled off (true), set to false (show subdrop), otherwise set to true (hide subdrop)
      newMap.set(linkPath, !isToggledOff);
      return newMap;
    });
  };

  const restoreActiveSubmenu = () => {
    SidebarData.forEach((mainLabel: any) => {
      mainLabel.submenuItems.forEach((title: any) => {
        const hasActiveChild = title.submenuItems?.some((item: any) => {
          if (item.link === Location.pathname) {
            return true;
          }
          if (hasActiveNestedChild(item, Location.pathname)) {
            if (item.submenu && item.submenuItems) {
              setSubsidebar(item.label);
            }
            return true;
          }
          return false;
        });
        if (hasActiveChild) {
          setSubopen(title.label);
        }
      });
    });
  };

  useEffect(() => {
    // Reset subdrop toggle state when route changes
    setActiveLinksSubdropToggled(new Map());
    restoreActiveSubmenu();
  }, [Location.pathname]);

  const [toggle, SetToggle] = useState(false);
  const handlesidebar = () => {
    const isNowMini = document.body.classList.toggle("mini-sidebar");
    SetToggle((current) => !current);
    if (isNowMini) {
      setSubopen("");
      setSubsidebar("");
    } else {
      restoreActiveSubmenu();
    }
  };

  const { expandMenus } = useSelector(
    (state: any) => state.themeSetting.expandMenus
  );
  const dataLayout = useSelector((state: any) => state.themeSetting.dataLayout);

  const expandMenu = () => {
    if (dataLayout === "layout-hovered" || document.body.classList.contains("layout-hovered")) {
      document.body.classList.remove("expand-menu");
      if (document.body.classList.contains("mini-sidebar")) {
        setSubopen("");
        setSubsidebar("");
      }
    }
  };
  const expandMenuOpen = () => {
    if (dataLayout === "layout-hovered" || document.body.classList.contains("layout-hovered")) {
      document.body.classList.add("expand-menu");
    }
  };

  const closeMobileSidebar = () => {
    document?.querySelectorAll(".main-wrapper")?.forEach((el) => el.classList.remove("slide-nav"));
    document?.body?.classList?.remove("slide-nav");
    document?.body?.classList?.remove("menu-opened");
    document?.querySelectorAll(".sidebar-overlay")?.forEach((el) => el.classList.remove("opened"));
    document?.documentElement?.classList?.remove("menu-opened");
  };

  return (
    <div>
      <div
        className={`sidebar ${toggle ? "" : "active"} ${expandMenus || dataLayout === "layout-hovered" ? "expand-menu" : ""
          }`}
        id="sidebar"
        onMouseLeave={expandMenu}
        onMouseOver={expandMenuOpen}
      >
        <>
          {/* Logo */}
          <div className="sidebar-logo active">
            <Link to={route.newdashboard} className="logo logo-normal">
              <img src={logo} alt="Grow Naturals" />
            </Link>
            <Link to={route.newdashboard} className="logo-small">
              <img src={logoSmall} alt="Grow Naturals" />
            </Link>
            <Link id="toggle_btn" to="#" onClick={handlesidebar}>
              <i className="feather icon-chevrons-left feather-16" />
            </Link>
            <button
              type="button"
              id="sidebar-close"
              className="sidebar-close-btn"
              onClick={closeMobileSidebar}
              title="Close Sidebar"
              aria-label="Close Sidebar"
            >
              <i className="feather icon-x feather-16" />
            </button>
          </div>
          {/* /Logo */}
        </>
        <div data-simplebar="">
          <div className="sidebar-inner ">
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                {SidebarData?.map((mainLabel: any, index: any) => (
                  <li className="submenu-open" key={index}>
                    <h6 className="submenu-hdr">{mainLabel?.label}</h6>
                    <ul>
                      {mainLabel?.submenuItems?.map((title: any, i: any) => {
                        // Build array of all nested links for active state checking
                        const link_array: string[] = [];
                        title?.submenuItems?.forEach((link: any) => {
                          link_array.push(link?.link);
                          if (link?.submenu && link?.submenuItems) {
                            link?.submenuItems?.forEach((item: any) => {
                              link_array.push(item?.link);
                            });
                          }
                        });
                        title.links = link_array;

                        const isTitleActive = title?.links?.includes(
                          Location.pathname
                        );
                        const isTitleOpen = subOpen === title?.label;
                        const hasNoSubmenu = !title?.submenu;
                        const isDirectActive =
                          hasNoSubmenu && Location.pathname === title?.link;

                        return (
                          <React.Fragment key={i}>
                            <li
                              className={`submenu ${isDirectActive
                                  ? "custom-active-hassubroute-false"
                                  : ""
                                }`}
                            >
                              <Link
                                to={title?.link || "#"}
                                onClick={(e) => {
                                  if (title?.submenu && !title?.link) {
                                    e.preventDefault();
                                  }
                                  toggleSidebar(title?.label);
                                }}
                                className={`${isTitleOpen || isTitleActive ? "subdrop" : ""
                                  } ${isTitleActive ? "active" : ""}`}
                              >
                                <i className={`ti ti-${title.icon} me-2`}></i>
                                <span className="custom-active-span">
                                  {title?.label}
                                  {/* {t()} */}
                                </span>
                                {title?.submenu && (
                                  <span className="menu-arrow" />
                                )}
                              </Link>
                              <ul
                                style={{
                                  display:
                                    isTitleOpen || isTitleActive
                                      ? "block"
                                      : "none",
                                }}
                              >
                                {title?.submenuItems?.map(
                                  (item: any, titleIndex: any) => {
                                    const isItemActive = hasActiveNestedChild(
                                      item,
                                      Location.pathname
                                    );
                                    const isExternal = item?.external === true;

                                    const isSubdropToggledOff =
                                      activeLinksSubdropToggled.get(
                                        item?.link
                                      ) === true;

                                    const shouldShowSubdrop = isItemActive
                                      ? !isSubdropToggledOff
                                      : subsidebar === item?.label;

                                    return (
                                      <li
                                        className="submenu submenu-two"
                                        key={titleIndex}
                                      >
                                        {isExternal ? (
                                          <a
                                            href={item?.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${isItemActive ? "active" : ""
                                              } ${shouldShowSubdrop ? "subdrop" : ""
                                              }`}
                                          >
                                            {item?.label}
                                          </a>
                                        ) : (
                                          <Link
                                            to={item?.link}
                                            className={`${isItemActive ? "active" : ""
                                              } ${shouldShowSubdrop ? "subdrop" : ""
                                              }`}
                                            onClick={(e) => {
                                              if (isItemActive) {
                                                e.preventDefault();
                                                toggleActiveLinkSubdrop(
                                                  item?.link
                                                );
                                                if (item?.submenu) {
                                                  toggleSubsidebar(item?.label);
                                                }
                                              } else if (item?.submenu) {
                                                e.preventDefault();
                                                toggleSubsidebar(item?.label);
                                              }
                                            }}
                                          >
                                            {item?.label}
                                            {item?.submenu && (
                                              <span className="menu-arrow inside-submenu" />
                                            )}
                                          </Link>
                                        )}
                                      </li>
                                    );
                                  }
                                )}
                              </ul>
                            </li>
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* <CollapsedSidebar /> */}
    </div>
  );
};

export default Sidebar;
