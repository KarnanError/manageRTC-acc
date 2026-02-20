import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HorizontalSidebarData } from '../../data/json/horizontalSidebar'
import ImageWithBasePath from '../imageWithBasePath';
import { useUser } from '@clerk/clerk-react';
import { useCompanyPages } from '../../../contexts/CompanyPagesContext';

const HorizontalSidebar = () => {
    const Location = useLocation();
    const { user } = useUser();
    const { isRouteEnabled, allEnabled, isLoading: isMenuLoading } = useCompanyPages();

    const [subOpen, setSubopen] = useState<any>("");
    const [subsidebar, setSubsidebar] = useState("");
  
    // Get current user role
    const getUserRole = (): string => {
      if (!user) return "guest";
      return (user.publicMetadata?.role as string)?.toLowerCase() || "employee";
    };

    // Check if user has access to menu item
    const hasAccess = (roles?: string[]): boolean => {
      if (!roles || roles.length === 0) return true;
      if (roles.includes("public")) return true;
      const userRole = getUserRole();
      return roles.includes(userRole);
    };

    /**
     * Check if a horizontal menu item is enabled by the company's plan/modules.
     * Uses `route` field (horizontal sidebar) or `link` (vertical sidebar).
     * Parent items are enabled if any child route is enabled.
     */
    const isMenuEnabled = (item: any): boolean => {
      if (allEnabled) return true;
      if (!item) return false;
      // Has second-level submenus
      if (item.subMenusTwo && item.subMenusTwo.length > 0) {
        return item.subMenusTwo.some((child: any) =>
          child.route ? isRouteEnabled(child.route) : false
        );
      }
      // Has first-level submenus
      if (item.subMenus && item.subMenus.length > 0) {
        return item.subMenus.some((child: any) => isMenuEnabled(child));
      }
      // Leaf: check route
      const route = item.route || item.link;
      if (!route || route === '#') return false;
      return isRouteEnabled(route);
    };

    const toggleSidebar = (title: any) => {
      localStorage.setItem("menuOpened", title);
      if (title === subOpen) {
        setSubopen("");
      } else {
        setSubopen(title);
      }
    };
  
    const toggleSubsidebar = (subitem: any) => {
      if (subitem === subsidebar) {
        setSubsidebar("");
      } else {
        setSubsidebar(subitem);
      }
    };
  
  return (
    <div className="sidebar sidebar-horizontal" id="horizontal-menu">
        <div className="sidebar-menu">
            <div className="main-menu">
                {isMenuLoading ? (
                  /* ── Skeleton: horizontal pill placeholders while module data loads ── */
                  <ul className="nav-menu">
                    <li className="menu-title"><span>Main</span></li>
                    {[...Array(7)].map((_, i) => (
                      <li key={`hskel-${i}`} style={{ display: "inline-flex", alignItems: "center", padding: "0 10px" }}>
                        <div style={{
                          height: 12,
                          borderRadius: 20,
                          background: "rgba(255,255,255,0.15)",
                          animation: "hpulse 1.4s ease-in-out infinite",
                          animationDelay: `${i * 0.12}s`,
                          width: `${52 + (i % 4) * 14}px`,
                        }} />
                      </li>
                    ))}
                    <style>{`
                      @keyframes hpulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                      }
                    `}</style>
                  </ul>
                ) : (
                <ul className="nav-menu">
                <li className="menu-title">
                    <span>Main</span>
                </li>
                {HorizontalSidebarData?.map((mainMenu, index) => (
                <React.Fragment key={`main-${index}`}>
                    {mainMenu?.menu?.filter((data: any) => hasAccess(data?.roles) && isMenuEnabled(data)).map((data, i) => (
                    <li className="submenu" key={`menu-${i}`}>
                        <Link to="#" className={`
                             ${
                                data?.subMenus
                                    ?.map((link: any) => link?.route)
                                    .includes(Location.pathname)
                                    ? "active"
                                    : ""
                                } ${subOpen === data.menuValue ? "subdrop" : ""}`} onClick={() => toggleSidebar(data.menuValue)}>
                        <i className={`ti ti-${data.icon}`}></i>
                        <span>{data.menuValue}</span>
                        <span className="menu-arrow"></span>
                        </Link>

                        {/* First-level Submenus */}
                        <ul style={{ display: subOpen === data.menuValue ? "block" : "none" }}>
                        {((data?.subMenus || []) as any[]).filter((subMenu: any) => hasAccess(subMenu?.roles) && isMenuEnabled(subMenu)).map((subMenu:any, j) => (
                            <li
                            key={`submenu-${j}`}
                            className={subMenu?.customSubmenuTwo ? "submenu" : ""}
                            >
                            <Link to={subMenu?.route || "#"} className={`${
                                subMenu?.subMenusTwo
                                    ?.map((link: any) => link?.route)
                                    .includes(Location.pathname) || subMenu?.route === Location.pathname
                                    ? "active"
                                    : ""
                                } ${subsidebar === subMenu.menuValue ? "subdrop" : ""}`} onClick={() => toggleSubsidebar(subMenu.menuValue)}>
                                <span>{subMenu?.menuValue}</span>
                                {subMenu?.customSubmenuTwo && <span className="menu-arrow"></span>}
                            </Link>

                            {/* Check if `customSubmenuTwo` exists */}
                            {subMenu?.customSubmenuTwo && subMenu?.subMenusTwo && (
                                <ul style={{ display: subsidebar === subMenu.menuValue ? "block" : "none" }}>
                                {subMenu.subMenusTwo.filter((subMenuTwo: any) => hasAccess(subMenuTwo?.roles) && isRouteEnabled(subMenuTwo?.route)).map((subMenuTwo:any, k:number) => (
                                    <li key={`submenu-two-${k}`}>
                                    <Link className={subMenuTwo.route === Location.pathname?'active':''} to={subMenuTwo.route}>{subMenuTwo.menuValue}</Link>
                                    </li>
                                ))}
                                </ul>
                            )}
                            </li>
                        ))}
                        </ul>
                    </li>
                    ))}
                </React.Fragment>
                ))}
                </ul>
                )}
                <div className="d-xl-flex align-items-center d-none">
                    <Link to="#" className="me-3 avatar avatar-sm">
                        <ImageWithBasePath
                            src={user?.imageUrl || "assets/img/profiles/avatar-07.jpg"}
                            alt="profile"
                            className="rounded-circle"
                        />
                    </Link>
                    <Link to="#" className="btn btn-icon btn-sm rounded-circle mode-toggle">
                        <i className="ti ti-sun"></i>
                    </Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default HorizontalSidebar