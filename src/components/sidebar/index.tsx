import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarData } from "../../core/json/siderbar_data";
// import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { all_routes } from "../../routes/all_routes";
import sidebarLogo from "../../assets/img/logo.png";
import {
  customer15,
  logo,
  logoSmall,
  logoWhite,
  logoSmallWhite,
} from "../../utils/imagepath";

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

const Sidebar = () => {
  const route = all_routes;
  const Location = useLocation();
  // const { t } = useTranslation();

  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");
  // Track which active links have subdrop class manually toggled off (true = toggled off, false/undefined = show subdrop)
  const [activeLinksSubdropToggled, setActiveLinksSubdropToggled] = useState<
    Map<string, boolean>
  >(new Map());

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

  useEffect(() => {
    // Reset subdrop toggle state when route changes
    setActiveLinksSubdropToggled(new Map());

    SidebarData.forEach((mainLabel: any) => {
      mainLabel.submenuItems.forEach((title: any) => {
        const hasActiveChild = title.submenuItems?.some((item: any) => {
          // Check if the item's link matches the current path
          if (item.link === Location.pathname) {
            return true;
          }
          // Check for nested children
          if (hasActiveNestedChild(item, Location.pathname)) {
            // If item has submenu and active child, open the subsidebar
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
  }, [Location.pathname]);

  const [toggle, SetToggle] = useState(false);
  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    SetToggle((current) => !current);
  };

  const { expandMenus } = useSelector(
    (state: any) => state.themeSetting.expandMenus
  );
  const dataLayout = useSelector((state: any) => state.themeSetting.dataLayout);

  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    document.body.classList.add("expand-menu");
  };

  const handleMobileClose = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 991) {
      document.querySelector(".main-wrapper")?.classList.remove("slide-nav");
      document.querySelector(".sidebar-overlay")?.classList.remove("opened");
      document.querySelector("html")?.classList.remove("menu-opened");
    }
  };

  return (
    <div>
      <div
        className={`sidebar ${toggle ? "" : "active"} ${
          dataLayout === "layout-hovered" ? "expand-menu" : ""
        }`}
        id="sidebar"
      >
        {/* Mobile Sidebar Brand Header & Close Button */}
        <div className="sidebar-logo d-flex align-items-center justify-content-between px-3 border-bottom d-lg-none">
          <Link
            to="/admin-dashboard"
            className="d-flex align-items-center text-decoration-none py-2"
            onClick={handleMobileClose}
          >
            <img
              src={sidebarLogo}
              alt="Grow Naturals"
              className="brand-logo-img"
              style={{ maxHeight: "38px", width: "auto", maxWidth: "165px", objectFit: "contain" }}
            />
          </Link>
          <button
            type="button"
            className="btn-close-sidebar"
            onClick={handleMobileClose}
            aria-label="Close menu"
          >
            <i className="ti ti-x fs-18" />
          </button>
        </div>

        <div className="sidebar-inner slimscroll">

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
                          hasNoSubmenu && (
                            Location.pathname === title?.link ||
                            (title?.link === "/admin-dashboard" && (Location.pathname === "/" || Location.pathname === "/index" || Location.pathname === "/dashboard"))
                          );

                        return (
                          <React.Fragment key={i}>
                            <li
                              className={`submenu ${
                                isDirectActive
                                  ? "custom-active-hassubroute-false active"
                                  : ""
                              }`}
                            >
                              <Link
                                to={title?.link || "#"}
                                onClick={(e) => {
                                  if (title?.submenu && !title?.link) {
                                    e.preventDefault();
                                  } else {
                                    handleMobileClose();
                                  }
                                  toggleSidebar(title?.label);
                                }}
                                className={`${
                                  isTitleOpen || isTitleActive ? "subdrop" : ""
                                } ${isTitleActive || isDirectActive ? "active" : ""}`}
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
                                            className={`${
                                              isItemActive ? "active" : ""
                                            } ${
                                              shouldShowSubdrop ? "subdrop" : ""
                                            }`}
                                          >
                                            {item?.label}
                                          </a>
                                        ) : (
                                          <Link
                                            to={item?.link}
                                            className={`${
                                              isItemActive ? "active" : ""
                                            } ${
                                              shouldShowSubdrop ? "subdrop" : ""
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
                                              } else {
                                                handleMobileClose();
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
      {/* <CollapsedSidebar /> */}
    </div>
  );
};

export default Sidebar;
