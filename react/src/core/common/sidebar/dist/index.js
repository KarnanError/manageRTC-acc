"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var react_custom_scrollbars_2_1 = require("react-custom-scrollbars-2");
var imageWithBasePath_1 = require("../imageWithBasePath");
require("../../../style/icon/tabler-icons/webfont/tabler-icons.css");
var sidebarSlice_1 = require("../../data/redux/sidebarSlice");
var react_redux_1 = require("react-redux");
var themeSettingSlice_1 = require("../../data/redux/themeSettingSlice");
var usePreviousRoute_1 = require("./usePreviousRoute");
var sidebarMenu_1 = require("../../data/json/sidebarMenu");
var Sidebar = function () {
    var Location = react_router_dom_1.useLocation();
    var SidebarDataTest = sidebarMenu_1["default"]();
    var _a = react_1.useState("Dashboard"), subOpen = _a[0], setSubopen = _a[1];
    var _b = react_1.useState(""), subsidebar = _b[0], setSubsidebar = _b[1];
    var toggleSidebar = function (title) {
        localStorage.setItem("menuOpened", title);
        if (title === subOpen) {
            setSubopen("");
        }
        else {
            setSubopen(title);
        }
    };
    var toggleSubsidebar = function (subitem) {
        if (subitem === subsidebar) {
            setSubsidebar("");
        }
        else {
            setSubsidebar(subitem);
        }
    };
    var handleLayoutChange = function (layout) {
        dispatch(themeSettingSlice_1.setDataLayout(layout));
    };
    var handleClick = function (label, themeSetting, layout) {
        toggleSidebar(label);
        if (themeSetting) {
            handleLayoutChange(layout);
        }
    };
    var getLayoutClass = function (label) {
        switch (label) {
            case "Default":
                return "default_layout";
            case "Mini":
                return "mini_layout";
            case "Box":
                return "boxed_layout";
            case "Dark":
                return "dark_data_theme";
            case "RTL":
                return "rtl";
            default:
                return "";
        }
    };
    var location = react_router_dom_1.useLocation();
    var dispatch = react_redux_1.useDispatch();
    var previousLocation = usePreviousRoute_1["default"]();
    react_1.useEffect(function () {
        var layoutPages = [
            "/layout-dark",
            "/layout-rtl",
            "/layout-mini",
            "/layout-box",
            "/layout-default",
        ];
        var isCurrentLayoutPage = layoutPages.some(function (path) {
            return location.pathname.includes(path);
        });
        var isPreviousLayoutPage = previousLocation &&
            layoutPages.some(function (path) { return previousLocation.pathname.includes(path); });
    }, [location, previousLocation, dispatch]);
    react_1.useEffect(function () {
        var currentMenu = localStorage.getItem("menuOpened") || "Dashboard";
        setSubopen(currentMenu);
        // Select all 'submenu' elements
        var submenus = document.querySelectorAll(".submenu");
        // Loop through each 'submenu'
        submenus.forEach(function (submenu) {
            // Find all 'li' elements within the 'submenu'
            var listItems = submenu.querySelectorAll("li");
            submenu.classList.remove("active");
            // Check if any 'li' has the 'active' class
            listItems.forEach(function (item) {
                if (item.classList.contains("active")) {
                    // Add 'active' class to the 'submenu'
                    submenu.classList.add("active");
                    return;
                }
            });
        });
    }, [Location.pathname]);
    var onMouseEnter = function () {
        dispatch(sidebarSlice_1.setExpandMenu(true));
    };
    var onMouseLeave = function () {
        dispatch(sidebarSlice_1.setExpandMenu(false));
    };
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement("div", { className: "sidebar", id: "sidebar", onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave },
            react_1["default"].createElement("div", { className: "sidebar-logo text-center" },
                react_1["default"].createElement(react_router_dom_1.Link, { to: "routes.index", className: "logo logo-normal" },
                    react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/logo.svg", alt: "Logo" })),
                react_1["default"].createElement(react_router_dom_1.Link, { to: "routes.index", className: "logo-small" },
                    react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/logo-small.svg", alt: "Logo" })),
                react_1["default"].createElement(react_router_dom_1.Link, { to: "routes.index", className: "dark-logo" },
                    react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/logo-white.svg", alt: "Logo" }))),
            react_1["default"].createElement("div", { className: "modern-profile p-3 pb-0" },
                react_1["default"].createElement("div", { className: "text-center rounded bg-light p-3 mb-4 user-profile" },
                    react_1["default"].createElement("div", { className: "avatar avatar-lg online mb-3" },
                        react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/profiles/avatar-02.jpg", alt: "Img", className: "img-fluid rounded-circle" })),
                    react_1["default"].createElement("h6", { className: "fs-12 fw-normal mb-1" }, "Adrian Herman"),
                    react_1["default"].createElement("p", { className: "fs-10" }, "System Admin")),
                react_1["default"].createElement("div", { className: "sidebar-nav mb-3" },
                    react_1["default"].createElement("ul", { className: "nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent", role: "tablist" },
                        react_1["default"].createElement("li", { className: "nav-item" },
                            react_1["default"].createElement(react_router_dom_1.Link, { className: "nav-link active border-0", to: "#" }, "Menu")),
                        react_1["default"].createElement("li", { className: "nav-item" },
                            react_1["default"].createElement(react_router_dom_1.Link, { className: "nav-link border-0", to: "#" }, "Chats")),
                        react_1["default"].createElement("li", { className: "nav-item" },
                            react_1["default"].createElement(react_router_dom_1.Link, { className: "nav-link border-0", to: "#" }, "Inbox"))))),
            react_1["default"].createElement("div", { className: "sidebar-header p-3 pb-0 pt-2" },
                react_1["default"].createElement("div", { className: "text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center" },
                    react_1["default"].createElement("div", { className: "avatar avatar-md onlin" },
                        react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/profiles/avatar-02.jpg", alt: "Img", className: "img-fluid rounded-circle" })),
                    react_1["default"].createElement("div", { className: "text-start sidebar-profile-info ms-2" },
                        react_1["default"].createElement("h6", { className: "fs-12 fw-normal mb-1" }, "Adrian Herman"),
                        react_1["default"].createElement("p", { className: "fs-10" }, "System Admin"))),
                react_1["default"].createElement("div", { className: "input-group input-group-flat d-inline-flex mb-4" },
                    react_1["default"].createElement("span", { className: "input-icon-addon" },
                        react_1["default"].createElement("i", { className: "ti ti-search" })),
                    react_1["default"].createElement("input", { type: "text", className: "form-control", placeholder: "Search in ManageRTC" }),
                    react_1["default"].createElement("span", { className: "input-group-text" },
                        react_1["default"].createElement("kbd", null, "CTRL + / "))),
                react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between menu-item mb-3" },
                    react_1["default"].createElement("div", { className: "me-3" },
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-menubar position-relative" },
                            react_1["default"].createElement("i", { className: "ti ti-shopping-bag" }),
                            react_1["default"].createElement("span", { className: "badge bg-success rounded-pill d-flex align-items-center justify-content-center header-badge" }, "5"))),
                    react_1["default"].createElement("div", { className: "me-3" },
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-menubar" },
                            react_1["default"].createElement("i", { className: "ti ti-layout-grid-remove" }))),
                    react_1["default"].createElement("div", { className: "me-3" },
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-menubar position-relative" },
                            react_1["default"].createElement("i", { className: "ti ti-brand-hipchat" }),
                            react_1["default"].createElement("span", { className: "badge bg-info rounded-pill d-flex align-items-center justify-content-center header-badge" }, "5"))),
                    react_1["default"].createElement("div", { className: "me-3 notification-item" },
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-menubar position-relative me-1" },
                            react_1["default"].createElement("i", { className: "ti ti-bell" }),
                            react_1["default"].createElement("span", { className: "notification-status-dot" }))),
                    react_1["default"].createElement("div", { className: "me-0" },
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-menubar" },
                            react_1["default"].createElement("i", { className: "ti ti-message" }))))),
            react_1["default"].createElement(react_custom_scrollbars_2_1["default"], null,
                react_1["default"].createElement("div", { className: "sidebar-inner slimscroll" },
                    react_1["default"].createElement("div", { id: "sidebar-menu", className: "sidebar-menu" },
                        react_1["default"].createElement("ul", null, SidebarDataTest === null || SidebarDataTest === void 0 ? void 0 : SidebarDataTest.map(function (mainLabel, index) {
                            var _a;
                            return (react_1["default"].createElement(react_1["default"].Fragment, { key: "main-" + index },
                                react_1["default"].createElement("li", { className: "menu-title" },
                                    react_1["default"].createElement("span", null, mainLabel === null || mainLabel === void 0 ? void 0 : mainLabel.tittle)),
                                react_1["default"].createElement("li", null,
                                    react_1["default"].createElement("ul", null, (_a = mainLabel === null || mainLabel === void 0 ? void 0 : mainLabel.submenuItems) === null || _a === void 0 ? void 0 : _a.map(function (title, i) {
                                        var _a, _b, _c, _d;
                                        var link_array = [];
                                        if ("submenuItems" in title) {
                                            (_a = title.submenuItems) === null || _a === void 0 ? void 0 : _a.forEach(function (link) {
                                                var _a;
                                                link_array.push(link === null || link === void 0 ? void 0 : link.link);
                                                if ((link === null || link === void 0 ? void 0 : link.submenu) && "submenuItems" in link) {
                                                    (_a = link.submenuItems) === null || _a === void 0 ? void 0 : _a.forEach(function (item) {
                                                        link_array.push(item === null || item === void 0 ? void 0 : item.link);
                                                    });
                                                }
                                            });
                                        }
                                        title.links = link_array;
                                        return (react_1["default"].createElement("li", { className: "submenu", key: "title-" + i },
                                            react_1["default"].createElement(react_router_dom_1.Link, { to: (title === null || title === void 0 ? void 0 : title.submenu) ? "#" : title === null || title === void 0 ? void 0 : title.link, onClick: function () {
                                                    return handleClick(title === null || title === void 0 ? void 0 : title.label, title === null || title === void 0 ? void 0 : title.themeSetting, getLayoutClass(title === null || title === void 0 ? void 0 : title.label));
                                                }, className: (subOpen === (title === null || title === void 0 ? void 0 : title.label) ? "subdrop" : "") + " " + (((_b = title === null || title === void 0 ? void 0 : title.links) === null || _b === void 0 ? void 0 : _b.includes(Location.pathname)) ? "active"
                                                    : "") + " " + (((_c = title === null || title === void 0 ? void 0 : title.submenuItems) === null || _c === void 0 ? void 0 : _c.map(function (link) { return link === null || link === void 0 ? void 0 : link.link; }).includes(Location.pathname)) ||
                                                    (title === null || title === void 0 ? void 0 : title.link) === Location.pathname
                                                    ? "active"
                                                    : "") },
                                                react_1["default"].createElement("i", { className: "ti ti-" + title.icon }),
                                                react_1["default"].createElement("span", null, title === null || title === void 0 ? void 0 : title.label),
                                                (title === null || title === void 0 ? void 0 : title.dot) && (react_1["default"].createElement("span", { className: "badge badge-danger fs-10 fw-medium text-white p-1" }, "Hot")),
                                                react_1["default"].createElement("span", { className: (title === null || title === void 0 ? void 0 : title.submenu) ? "menu-arrow" : "" })),
                                            (title === null || title === void 0 ? void 0 : title.submenu) !== false &&
                                                subOpen === (title === null || title === void 0 ? void 0 : title.label) && (react_1["default"].createElement("ul", { style: {
                                                    display: subOpen === (title === null || title === void 0 ? void 0 : title.label)
                                                        ? "block"
                                                        : "none"
                                                } }, (_d = title === null || title === void 0 ? void 0 : title.submenuItems) === null || _d === void 0 ? void 0 : _d.map(function (item, j) {
                                                var _a, _b;
                                                return (react_1["default"].createElement("li", { className: (item === null || item === void 0 ? void 0 : item.submenuItems) ? "submenu submenu-two"
                                                        : "", key: "item-" + j },
                                                    react_1["default"].createElement(react_router_dom_1.Link, { to: (item === null || item === void 0 ? void 0 : item.submenu) ? "#" : item === null || item === void 0 ? void 0 : item.link, className: (((_a = item === null || item === void 0 ? void 0 : item.submenuItems) === null || _a === void 0 ? void 0 : _a.map(function (link) { return link === null || link === void 0 ? void 0 : link.link; }).includes(Location.pathname)) ||
                                                            (item === null || item === void 0 ? void 0 : item.link) === Location.pathname
                                                            ? "active"
                                                            : "") + " " + (subsidebar === (item === null || item === void 0 ? void 0 : item.label)
                                                            ? "subdrop"
                                                            : ""), onClick: function () {
                                                            toggleSubsidebar(item === null || item === void 0 ? void 0 : item.label);
                                                        } }, item === null || item === void 0 ? void 0 :
                                                        item.label,
                                                        react_1["default"].createElement("span", { className: (item === null || item === void 0 ? void 0 : item.submenu) ? "menu-arrow"
                                                                : "" })),
                                                    (item === null || item === void 0 ? void 0 : item.submenuItems) ? (react_1["default"].createElement("ul", { style: {
                                                            display: subsidebar === (item === null || item === void 0 ? void 0 : item.label)
                                                                ? "block"
                                                                : "none"
                                                        } }, (_b = item === null || item === void 0 ? void 0 : item.submenuItems) === null || _b === void 0 ? void 0 : _b.map(function (items, k) {
                                                        var _a;
                                                        return (react_1["default"].createElement("li", { key: "submenu-item-" + k },
                                                            react_1["default"].createElement(react_router_dom_1.Link, { to: (items === null || items === void 0 ? void 0 : items.submenu) ? "#"
                                                                    : items === null || items === void 0 ? void 0 : items.link, className: (subsidebar === (items === null || items === void 0 ? void 0 : items.label)
                                                                    ? "submenu-two subdrop"
                                                                    : "submenu-two") + " " + (((_a = items === null || items === void 0 ? void 0 : items.submenuItems) === null || _a === void 0 ? void 0 : _a.map(function (link) {
                                                                    return link.link;
                                                                }).includes(Location.pathname)) ||
                                                                    (items === null || items === void 0 ? void 0 : items.link) ===
                                                                        Location.pathname
                                                                    ? "active"
                                                                    : "") }, items === null || items === void 0 ? void 0 : items.label)));
                                                    }))) : null));
                                            })))));
                                    })))));
                        }))))))));
};
exports["default"] = Sidebar;
