"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var index_1 = require("../../core/common/dataTable/index");
var all_routes_1 = require("../router/all_routes");
var commonSelect_1 = require("../../core/common/commonSelect");
var EmployeeNameCell_1 = require("../../core/common/EmployeeNameCell");
var antd_1 = require("antd");
var collapse_header_1 = require("../../core/common/collapse-header/collapse-header");
var SocketContext_1 = require("../../SocketContext");
var date_fns_1 = require("date-fns");
var dayjs_1 = require("dayjs");
var TerminationDetailsModal_1 = require("../../core/modals/TerminationDetailsModal");
var react_toastify_1 = require("react-toastify");
var Termination = function () {
    var socket = SocketContext_1.useSocket();
    var _a = react_1.useState([]), rows = _a[0], setRows = _a[1];
    var _b = react_1.useState([]), rowsDepartments = _b[0], setRowsDepartments = _b[1];
    var _c = react_1.useState([]), departmentOptions = _c[0], setDepartmentOptions = _c[1];
    var _d = react_1.useState([]), employeeOptions = _d[0], setEmployeeOptions = _d[1];
    var _e = react_1.useState({
        totalTerminations: "0",
        recentTerminations: "0"
    }), stats = _e[0], setStats = _e[1];
    var _f = react_1.useState(true), loading = _f[0], setLoading = _f[1];
    var _g = react_1.useState(null), deletingTerminationId = _g[0], setDeletingTerminationId = _g[1];
    var _h = react_1.useState(false), isSubmitting = _h[0], setIsSubmitting = _h[1];
    var _j = react_1.useState([]), selectedKeys = _j[0], setSelectedKeys = _j[1];
    var _k = react_1.useState("alltime"), filterType = _k[0], setFilterType = _k[1];
    var _l = react_1.useState({}), customRange = _l[0], setCustomRange = _l[1];
    var _m = react_1.useState(null), editing = _m[0], setEditing = _m[1];
    // State for viewing termination details
    var _o = react_1.useState(null), viewingTermination = _o[0], setViewingTermination = _o[1];
    // Controlled edit form data
    var _p = react_1.useState({
        employeeId: "",
        employeeName: "",
        departmentId: "",
        departmentName: "",
        terminationType: "Lack of skills",
        noticeDate: "",
        reason: "",
        terminationDate: "",
        terminationId: ""
    }), editForm = _p[0], setEditForm = _p[1];
    var ddmmyyyyToYMD = function (s) {
        if (!s)
            return "";
        var d = date_fns_1.parse(s, "dd-MM-yyyy", new Date());
        return isNaN(d.getTime()) ? "" : date_fns_1.format(d, "yyyy-MM-dd");
    };
    var fetchEmployeesByDepartment = react_1.useCallback(function (departmentId) {
        if (!socket || !departmentId) {
            setEmployeeOptions([]);
            return;
        }
        console.log("[Termination] Fetching employees for department:", departmentId);
        socket.emit("hr/resignation/employees-by-department", departmentId);
    }, [socket]);
    var openEditModal = function (row) {
        console.log("[Termination] openEditModal - row:", row);
        console.log("[Termination] Setting editForm with employeeId:", row.employee_id, "departmentId:", row.departmentId);
        setEditForm({
            employeeId: row.employee_id || "",
            employeeName: row.employeeName || "",
            departmentId: row.departmentId || "",
            departmentName: row.department || "",
            terminationType: row.terminationType || "Lack of skills",
            noticeDate: row.noticeDate
                ? date_fns_1.format(date_fns_1.parse(row.noticeDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy")
                : "",
            reason: row.reason || "",
            terminationDate: row.terminationDate
                ? date_fns_1.format(date_fns_1.parse(row.terminationDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy")
                : "",
            terminationId: row.terminationId
        });
        // Create initial employee option from row data for immediate display
        if (row.employee_id && row.employeeName) {
            var getDisplayName = function (employeeName) {
                if (!employeeName)
                    return "Unknown Employee";
                var parts = employeeName.split(' - ');
                return parts.length > 1 ? parts.slice(1).join(' - ') : employeeName;
            };
            var initialEmployeeOption = {
                value: row.employee_id,
                label: (row.employeeId || 'N/A') + " - " + getDisplayName(row.employeeName)
            };
            console.log("[Termination] Setting initial employee option:", initialEmployeeOption);
            setEmployeeOptions([initialEmployeeOption]);
        }
        // Fetch employees for the selected department to populate dropdown options
        if (row.departmentId) {
            console.log("[Termination] Fetching employees for department in edit mode:", row.departmentId);
            fetchEmployeesByDepartment(row.departmentId);
        }
        else {
            console.warn("[Termination] No departmentId found in row data");
        }
    };
    var getModalContainer = function () {
        var modalElement = document.getElementById("modal-datepicker");
        return modalElement ? modalElement : document.body;
    };
    var parseYMD = function (s) {
        return s ? date_fns_1.parse(s, "yyyy-MM-dd", new Date()) : null;
    }; // string -> Date
    var toYMD = function (d) {
        if (!d)
            return "";
        var dt = "toDate" in d ? d.toDate() : d; // support dayjs or Date
        return date_fns_1.format(dt, "yyyy-MM-dd");
    };
    // state near top of component
    var _q = react_1.useState({
        employeeId: "",
        employeeName: "",
        departmentId: "",
        departmentName: "",
        reason: "",
        terminationType: "Lack of skills",
        noticeDate: "",
        terminationDate: ""
    }), addForm = _q[0], setAddForm = _q[1];
    // Validation errors for Add Termination
    var _r = react_1.useState({
        departmentId: "",
        employeeId: "",
        reason: "",
        terminationType: "",
        noticeDate: "",
        terminationDate: ""
    }), addErrors = _r[0], setAddErrors = _r[1];
    // Validation errors for Edit Termination
    var _s = react_1.useState({
        departmentId: "",
        employeeId: "",
        reason: "",
        terminationType: "",
        noticeDate: "",
        terminationDate: ""
    }), editErrors = _s[0], setEditErrors = _s[1];
    // Handle delete termination
    var handleDeleteClick = function (terminationId) {
        console.log("[Termination] Delete clicked:", terminationId);
        setDeletingTerminationId(terminationId);
    };
    var confirmDelete = function () {
        if (!socket || !deletingTerminationId) {
            react_toastify_1.toast.error("Socket not connected or no termination selected");
            return;
        }
        console.log("[Termination] Deleting termination:", deletingTerminationId);
        socket.emit("hr/termination/delete-termination", [deletingTerminationId]);
    };
    var fmtYMD = function (s) {
        if (!s)
            return "";
        var d = date_fns_1.parse(s, "yyyy-MM-dd", new Date());
        return isNaN(d.getTime()) ? s : date_fns_1.format(d, "dd MMM yyyy");
    };
    // event handlers
    var onListResponse = react_1.useCallback(function (res) {
        if (res === null || res === void 0 ? void 0 : res.done) {
            setRows(res.data || []);
        }
        else {
            setRows([]);
            // optionally toast error
            // toast.error(res?.message || "Failed to fetch terminations");
        }
        setLoading(false);
    }, []);
    var onDepartmentsListResponse = react_1.useCallback(function (res) {
        console.log("[Termination] departments list response", res === null || res === void 0 ? void 0 : res.data);
        if (res === null || res === void 0 ? void 0 : res.done) {
            setRowsDepartments(res.data || []);
            var opts = (res.data || []).map(function (dept) { return ({
                value: dept._id,
                label: dept.department
            }); });
            setDepartmentOptions(opts);
        }
        else {
            setRowsDepartments([]);
            setDepartmentOptions([]);
            // optionally toast error
            // toast.error(res?.message || "Failed to fetch resignations");
        }
        setLoading(false);
    }, []);
    var onEmployeesByDepartmentResponse = react_1.useCallback(function (res) {
        console.log("[Termination] employees-by-dept response:", res === null || res === void 0 ? void 0 : res.data, "done:", res === null || res === void 0 ? void 0 : res.done, "message:", res === null || res === void 0 ? void 0 : res.message);
        if (res === null || res === void 0 ? void 0 : res.done) {
            var opts_1 = (res.data || []).map(function (emp) {
                console.log("[Termination] Employee _id:", emp._id, "employeeId:", emp.employeeId, "employeeName:", emp.employeeName);
                return {
                    value: emp._id,
                    label: emp.employeeId + " - " + (emp.employeeName || ((emp.firstName || '') + " " + (emp.lastName || '')).trim())
                };
            });
            console.log("[Termination] Mapped employee options:", opts_1);
            // Merge with existing options to preserve any initial option set by openEditModal
            setEmployeeOptions(function (prevOptions) {
                // If there's a pre-existing option (from openEditModal), ensure it's included
                var existingIds = new Set(opts_1.map(function (o) { return o.value; }));
                var preservedOptions = prevOptions.filter(function (o) { return !existingIds.has(o.value); });
                return __spreadArrays(preservedOptions, opts_1);
            });
        }
        else {
            console.log("[Termination] Response not done or empty data");
            // Don't clear employee options on error - preserve any initial option
            console.error("[Termination] Failed to fetch employees:", res === null || res === void 0 ? void 0 : res.message);
        }
    }, []);
    var onStatsResponse = react_1.useCallback(function (res) {
        if ((res === null || res === void 0 ? void 0 : res.done) && res.data) {
            setStats(res.data);
        }
    }, []);
    var onAddResponse = react_1.useCallback(function (res) {
        console.log("[Termination] ===== onAddResponse CALLED =====");
        console.log("[Termination] onAddResponse received:", res);
        console.log("[Termination] Response done:", res === null || res === void 0 ? void 0 : res.done);
        console.log("[Termination] Response message:", res === null || res === void 0 ? void 0 : res.message);
        setIsSubmitting(false);
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success("Termination added successfully");
            // Reset form on success
            setAddForm({
                employeeId: "",
                employeeName: "",
                departmentId: "",
                departmentName: "",
                reason: "",
                terminationType: "Lack of skills",
                noticeDate: "",
                terminationDate: ""
            });
            // Clear errors
            setAddErrors({
                departmentId: "",
                employeeId: "",
                reason: "",
                terminationType: "",
                noticeDate: "",
                terminationDate: ""
            });
            // Clear employee options
            setEmployeeOptions([]);
            // Refresh the list
            if (socket) {
                socket.emit("hr/termination/terminationlist", __assign({ type: filterType }, customRange));
                socket.emit("hr/termination/termination-details");
            }
            // Close modal
            console.log("[Termination] Attempting to close modal");
            setTimeout(function () {
                var _a;
                var modalElement = document.getElementById("new_termination");
                console.log("[Termination] Modal element found:", !!modalElement);
                if (modalElement) {
                    var modalClosed = false;
                    // Try Bootstrap if available
                    if ((_a = window.bootstrap) === null || _a === void 0 ? void 0 : _a.Modal) {
                        try {
                            var modal = window.bootstrap.Modal.getInstance(modalElement);
                            if (!modal) {
                                console.log("[Termination] Creating new modal instance");
                                modal = new window.bootstrap.Modal(modalElement);
                            }
                            console.log("[Termination] Calling modal.hide()");
                            modal.hide();
                            modalClosed = true;
                        }
                        catch (error) {
                            console.error("[Termination] Bootstrap modal error:", error);
                        }
                    }
                    // Fallback: Force close manually
                    if (!modalClosed) {
                        console.log("[Termination] Using fallback modal close");
                        modalElement.classList.remove("show");
                        modalElement.setAttribute("aria-hidden", "true");
                        modalElement.style.display = "none";
                    }
                    // Force cleanup of backdrop and body classes
                    setTimeout(function () {
                        var _a;
                        console.log("[Termination] Forcing cleanup of modal backdrop");
                        document.body.classList.remove("modal-open");
                        var backdrops = document.getElementsByClassName("modal-backdrop");
                        while (backdrops.length > 0) {
                            (_a = backdrops[0].parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(backdrops[0]);
                        }
                    }, 100);
                }
            }, 100);
        }
        else {
            console.error("[Termination] Failed to add termination:", res === null || res === void 0 ? void 0 : res.message);
            // Handle backend validation errors inline
            if ((res === null || res === void 0 ? void 0 : res.errors) && typeof res.errors === 'object') {
                var backendErrors_1 = {};
                Object.keys(res.errors).forEach(function (key) {
                    if (key in addErrors) {
                        backendErrors_1[key] = res.errors[key];
                    }
                });
                setAddErrors(function (prev) { return (__assign(__assign({}, prev), backendErrors_1)); });
            }
            // Show toast for general error message
            if (res === null || res === void 0 ? void 0 : res.message) {
                react_toastify_1.toast.error(res.message);
            }
        }
    }, [socket, filterType, customRange, addErrors]);
    var onUpdateResponse = react_1.useCallback(function (res) {
        console.log("[Termination] onUpdateResponse received:", res);
        setIsSubmitting(false);
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success("Termination updated successfully");
            // Reset form on success
            setEditForm({
                employeeId: "",
                employeeName: "",
                departmentId: "",
                departmentName: "",
                terminationType: "Lack of skills",
                noticeDate: "",
                reason: "",
                terminationDate: "",
                terminationId: ""
            });
            // Clear errors
            setEditErrors({
                departmentId: "",
                employeeId: "",
                reason: "",
                terminationType: "",
                noticeDate: "",
                terminationDate: ""
            });
            // Clear employee options
            setEmployeeOptions([]);
            // Refresh the list
            if (socket) {
                socket.emit("hr/termination/terminationlist", __assign({ type: filterType }, customRange));
                socket.emit("hr/termination/termination-details");
            }
            // Close modal
            console.log("[Termination] Attempting to close edit modal");
            setTimeout(function () {
                var _a;
                var modalElement = document.getElementById("edit_termination");
                console.log("[Termination] Edit modal element found:", !!modalElement);
                if (modalElement) {
                    var modalClosed = false;
                    // Try Bootstrap if available
                    if ((_a = window.bootstrap) === null || _a === void 0 ? void 0 : _a.Modal) {
                        try {
                            var modal = window.bootstrap.Modal.getInstance(modalElement);
                            if (!modal) {
                                console.log("[Termination] Creating new edit modal instance");
                                modal = new window.bootstrap.Modal(modalElement);
                            }
                            console.log("[Termination] Calling edit modal.hide()");
                            modal.hide();
                            modalClosed = true;
                        }
                        catch (error) {
                            console.error("[Termination] Bootstrap edit modal error:", error);
                        }
                    }
                    // Fallback: Force close manually
                    if (!modalClosed) {
                        console.log("[Termination] Using fallback edit modal close");
                        modalElement.classList.remove("show");
                        modalElement.setAttribute("aria-hidden", "true");
                        modalElement.style.display = "none";
                    }
                    // Force cleanup of backdrop and body classes
                    setTimeout(function () {
                        var _a;
                        console.log("[Termination] Forcing cleanup of edit modal backdrop");
                        document.body.classList.remove("modal-open");
                        var backdrops = document.getElementsByClassName("modal-backdrop");
                        while (backdrops.length > 0) {
                            (_a = backdrops[0].parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(backdrops[0]);
                        }
                    }, 100);
                }
            }, 100);
        }
        else {
            console.error("[Termination] Failed to update termination:", res === null || res === void 0 ? void 0 : res.message);
            // Handle backend validation errors inline
            if ((res === null || res === void 0 ? void 0 : res.errors) && typeof res.errors === 'object') {
                var backendErrors_2 = {};
                Object.keys(res.errors).forEach(function (key) {
                    if (key in editErrors) {
                        backendErrors_2[key] = res.errors[key];
                    }
                });
                setEditErrors(function (prev) { return (__assign(__assign({}, prev), backendErrors_2)); });
            }
            // Show toast for general error message
            if (res === null || res === void 0 ? void 0 : res.message) {
                react_toastify_1.toast.error(res.message);
            }
        }
    }, [socket, filterType, customRange, editErrors]);
    var onDeleteResponse = react_1.useCallback(function (res) {
        var _a, _b, _c;
        console.log("[Termination] ===== onDeleteResponse CALLED =====");
        console.log("[Termination] Response:", res);
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success("Termination deleted successfully");
            setSelectedKeys([]);
            setDeletingTerminationId(null);
            // Refresh the termination list and stats
            if (socket) {
                socket.emit("hr/termination/terminationlist", __assign({ type: filterType }, customRange));
                socket.emit("hr/termination/termination-details");
                // Refresh employee list to show updated status (Active)
                socket.emit("hrm/employees/get-employee-stats");
                console.log("[Termination] Emitted employee refresh after deletion");
            }
            // Close modal (robust)
            console.log("[Termination] Attempting to close delete modal");
            var modalElement = document.getElementById("delete_modal");
            console.log("[Termination] Modal element found:", !!modalElement);
            var closed = false;
            if (modalElement) {
                console.log("[Termination] Checking for Bootstrap Modal instance");
                var modal = (_b = (_a = window.bootstrap) === null || _a === void 0 ? void 0 : _a.Modal) === null || _b === void 0 ? void 0 : _b.getInstance(modalElement);
                console.log("[Termination] Modal instance found:", !!modal);
                if (modal) {
                    console.log("[Termination] Calling modal.hide()");
                    modal.hide();
                    closed = true;
                    console.log("[Termination] Modal.hide() called successfully");
                }
            }
            // Fallback: forcibly remove modal classes and backdrop if still open
            if (!closed && modalElement) {
                console.log("[Termination] Using fallback modal close");
                modalElement.classList.remove("show");
                modalElement.setAttribute("aria-hidden", "true");
                modalElement.style.display = "none";
                document.body.classList.remove("modal-open");
                // Remove backdrop
                var backdrops = document.getElementsByClassName("modal-backdrop");
                console.log("[Termination] Backdrops found:", backdrops.length);
                while (backdrops.length > 0) {
                    (_c = backdrops[0].parentNode) === null || _c === void 0 ? void 0 : _c.removeChild(backdrops[0]);
                }
                console.log("[Termination] Fallback close completed");
            }
            console.log("[Termination] Delete response handling completed");
        }
        else {
            console.error("Failed to delete termination:", res === null || res === void 0 ? void 0 : res.message);
            if (res === null || res === void 0 ? void 0 : res.message) {
                react_toastify_1.toast.error(res.message);
            }
        }
    }, [socket, filterType, customRange]);
    // Process response handler
    var onProcessResponse = react_1.useCallback(function (res) {
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success(res.message || "Termination processed successfully");
        }
        else {
            react_toastify_1.toast.error((res === null || res === void 0 ? void 0 : res.message) || "Failed to process termination");
        }
    }, []);
    // Cancel response handler
    var onCancelResponse = react_1.useCallback(function (res) {
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success(res.message || "Termination cancelled successfully");
        }
        else {
            react_toastify_1.toast.error((res === null || res === void 0 ? void 0 : res.message) || "Failed to cancel termination");
        }
    }, []);
    // register socket listeners and join room
    react_1.useEffect(function () {
        if (!socket)
            return;
        socket.emit("join-room", "hr_room");
        socket.on("hr/termination/terminationlist-response", onListResponse);
        socket.on("hr/resignation/departmentlist-response", onDepartmentsListResponse);
        socket.on("hr/resignation/employees-by-department-response", onEmployeesByDepartmentResponse);
        socket.on("hr/termination/termination-details-response", onStatsResponse);
        socket.on("hr/termination/add-termination-response", onAddResponse);
        socket.on("hr/termination/update-termination-response", onUpdateResponse);
        socket.on("hr/termination/delete-termination-response", onDeleteResponse);
        socket.on("hr/termination/process-termination-response", onProcessResponse);
        socket.on("hr/termination/cancel-termination-response", onCancelResponse);
        return function () {
            socket.off("hr/termination/terminationlist-response", onListResponse);
            socket.off("hr/resignation/departmentlist-response", onDepartmentsListResponse);
            socket.off("hr/resignation/employees-by-department-response", onEmployeesByDepartmentResponse);
            socket.off("hr/termination/termination-details-response", onStatsResponse);
            socket.off("hr/termination/add-termination-response", onAddResponse);
            socket.off("hr/termination/update-termination-response", onUpdateResponse);
            socket.off("hr/termination/delete-termination-response", onDeleteResponse);
            socket.off("hr/termination/process-termination-response", onProcessResponse);
            socket.off("hr/termination/cancel-termination-response", onCancelResponse);
        };
    }, [
        socket,
        onListResponse,
        onDepartmentsListResponse,
        onEmployeesByDepartmentResponse,
        onStatsResponse,
        onAddResponse,
        onUpdateResponse,
        onDeleteResponse,
        onProcessResponse,
        onCancelResponse,
    ]);
    // fetchers
    var fetchList = react_1.useCallback(function (type, range) {
        if (!socket)
            return;
        setLoading(true);
        var payload = { type: type };
        if (type === "custom" && (range === null || range === void 0 ? void 0 : range.startDate) && (range === null || range === void 0 ? void 0 : range.endDate)) {
            payload.startDate = range.startDate;
            payload.endDate = range.endDate;
        }
        socket.emit("hr/termination/terminationlist", payload);
    }, [socket]);
    var fetchDepartmentsList = react_1.useCallback(function () {
        if (!socket)
            return;
        setLoading(true);
        socket.emit("hr/resignation/departmentlist");
    }, [socket]);
    var toIsoFromDDMMYYYY = function (s) {
        // s like "13-09-2025"
        var _a = s.split("-").map(Number), dd = _a[0], mm = _a[1], yyyy = _a[2];
        if (!dd || !mm || !yyyy)
            return null;
        // Construct UTC date to avoid TZ shifts
        var d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
        return isNaN(d.getTime()) ? null : d.toISOString();
    };
    // Handle department change in Add modal
    var handleAddDepartmentChange = function (opt) {
        console.log("[Termination] Add department selected - _id:", opt === null || opt === void 0 ? void 0 : opt.value, "label:", opt === null || opt === void 0 ? void 0 : opt.label);
        setAddForm(__assign(__assign({}, addForm), { departmentId: (opt === null || opt === void 0 ? void 0 : opt.value) || "", departmentName: (opt === null || opt === void 0 ? void 0 : opt.label) || "", employeeId: "", employeeName: "" }));
        // Clear department and dependent field errors
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { departmentId: "", employeeId: "" })); });
        if (opt === null || opt === void 0 ? void 0 : opt.value) {
            fetchEmployeesByDepartment(opt.value);
        }
        else {
            setEmployeeOptions([]);
        }
    };
    // Handle department change in Edit modal
    var handleEditDepartmentChange = function (opt) {
        console.log("[Termination] Edit department selected - _id:", opt === null || opt === void 0 ? void 0 : opt.value, "label:", opt === null || opt === void 0 ? void 0 : opt.label);
        setEditForm(__assign(__assign({}, editForm), { departmentId: (opt === null || opt === void 0 ? void 0 : opt.value) || "", departmentName: (opt === null || opt === void 0 ? void 0 : opt.label) || "", employeeId: "", employeeName: "" }));
        // Clear department and dependent field errors
        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { departmentId: "", employeeId: "" })); });
        if (opt === null || opt === void 0 ? void 0 : opt.value) {
            fetchEmployeesByDepartment(opt.value);
        }
        else {
            setEmployeeOptions([]);
        }
    };
    // Handle employee change in Add modal
    var handleAddEmployeeChange = function (opt) {
        console.log("[Termination] Add employee selected - _id:", opt === null || opt === void 0 ? void 0 : opt.value, "label:", opt === null || opt === void 0 ? void 0 : opt.label);
        // Extract employee name from label (format: "EMP-XXX - Employee Name")
        var employeeName = (opt === null || opt === void 0 ? void 0 : opt.label) ? opt.label.split(" - ")[1] || "" : "";
        setAddForm(__assign(__assign({}, addForm), { employeeId: (opt === null || opt === void 0 ? void 0 : opt.value) || "", employeeName: employeeName }));
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { employeeId: "" })); });
    };
    // Handle employee change in Edit modal
    var handleEditEmployeeChange = function (opt) {
        console.log("[Termination] Edit employee selected - _id:", opt === null || opt === void 0 ? void 0 : opt.value, "label:", opt === null || opt === void 0 ? void 0 : opt.label);
        // Extract employee name from label (format: "EMP-XXX - Employee Name")
        var employeeName = (opt === null || opt === void 0 ? void 0 : opt.label) ? opt.label.split(" - ")[1] || "" : "";
        setEditForm(__assign(__assign({}, editForm), { employeeId: (opt === null || opt === void 0 ? void 0 : opt.value) || "", employeeName: employeeName }));
        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { employeeId: "" })); });
    };
    // Validate Add Termination form
    var validateAddForm = function () {
        var errors = {
            departmentId: "",
            employeeId: "",
            reason: "",
            terminationType: "",
            noticeDate: "",
            terminationDate: ""
        };
        var isValid = true;
        if (!addForm.departmentId || addForm.departmentId === "") {
            errors.departmentId = "Department is required";
            isValid = false;
        }
        if (!addForm.employeeId || addForm.employeeId === "") {
            errors.employeeId = "Employee is required";
            isValid = false;
        }
        if (!addForm.terminationType || addForm.terminationType === "") {
            errors.terminationType = "Termination type is required";
            isValid = false;
        }
        if (!addForm.reason || addForm.reason.trim() === "") {
            errors.reason = "Reason is required";
            isValid = false;
        }
        if (!addForm.noticeDate || addForm.noticeDate === "") {
            errors.noticeDate = "Notice date is required";
            isValid = false;
        }
        if (!addForm.terminationDate || addForm.terminationDate === "") {
            errors.terminationDate = "Termination date is required";
            isValid = false;
        }
        // Date validation: termination date should be after or equal to notice date
        if (addForm.noticeDate && addForm.terminationDate) {
            var noticeDate = date_fns_1.parse(addForm.noticeDate, "dd-MM-yyyy", new Date());
            var terminationDate = date_fns_1.parse(addForm.terminationDate, "dd-MM-yyyy", new Date());
            if (!isNaN(noticeDate.getTime()) && !isNaN(terminationDate.getTime())) {
                if (terminationDate < noticeDate) {
                    errors.terminationDate = "Termination date must be on or after notice date";
                    isValid = false;
                }
            }
        }
        setAddErrors(errors);
        return isValid;
    };
    // Validate Edit Termination form
    var validateEditForm = function () {
        var errors = {
            departmentId: "",
            employeeId: "",
            reason: "",
            terminationType: "",
            noticeDate: "",
            terminationDate: ""
        };
        var isValid = true;
        if (!editForm.departmentId || editForm.departmentId === "") {
            errors.departmentId = "Department is required";
            isValid = false;
        }
        if (!editForm.employeeId || editForm.employeeId === "") {
            errors.employeeId = "Employee is required";
            isValid = false;
        }
        if (!editForm.terminationType || editForm.terminationType === "") {
            errors.terminationType = "Termination type is required";
            isValid = false;
        }
        if (!editForm.reason || editForm.reason.trim() === "") {
            errors.reason = "Reason is required";
            isValid = false;
        }
        if (!editForm.noticeDate || editForm.noticeDate === "") {
            errors.noticeDate = "Notice date is required";
            isValid = false;
        }
        if (!editForm.terminationDate || editForm.terminationDate === "") {
            errors.terminationDate = "Termination date is required";
            isValid = false;
        }
        // Date validation: termination date should be after or equal to notice date
        if (editForm.noticeDate && editForm.terminationDate) {
            var noticeDate = date_fns_1.parse(editForm.noticeDate, "dd-MM-yyyy", new Date());
            var terminationDate = date_fns_1.parse(editForm.terminationDate, "dd-MM-yyyy", new Date());
            if (!isNaN(noticeDate.getTime()) && !isNaN(terminationDate.getTime())) {
                if (terminationDate < noticeDate) {
                    errors.terminationDate = "Termination date must be on or after notice date";
                    isValid = false;
                }
            }
        }
        setEditErrors(errors);
        return isValid;
    };
    // Handle view termination details
    var handleViewClick = function (termination) {
        console.log("[Termination] View clicked:", termination);
        setViewingTermination(termination);
    };
    var handleAddSave = function () {
        console.log("[Termination] handleAddSave called");
        // Validate form first
        if (!validateAddForm()) {
            console.log("[Termination] Add form validation failed");
            return;
        }
        if (!socket || isSubmitting)
            return;
        var noticeIso = toIsoFromDDMMYYYY(addForm.noticeDate);
        if (!noticeIso) {
            console.error("[Termination] Invalid notice date format");
            return;
        }
        var terIso = toIsoFromDDMMYYYY(addForm.terminationDate);
        if (!terIso) {
            console.error("[Termination] Invalid termination date format");
            return;
        }
        var payload = {
            employeeId: addForm.employeeId,
            employeeName: addForm.employeeName,
            department: addForm.departmentName,
            terminationType: addForm.terminationType,
            noticeDate: noticeIso,
            reason: addForm.reason,
            terminationDate: terIso
        };
        console.log("[Termination] Emitting add-termination with payload:", payload);
        console.log("[Termination] Socket connected:", socket.connected);
        console.log("[Termination] Socket ID:", socket.id);
        setIsSubmitting(true);
        socket.emit("hr/termination/add-termination", payload);
    };
    var handleEditSave = function () {
        console.log("[Termination] handleEditSave called");
        // Validate form first
        if (!validateEditForm()) {
            console.log("[Termination] Edit form validation failed");
            return;
        }
        if (!socket || isSubmitting)
            return;
        var noticeIso = toIsoFromDDMMYYYY(editForm.noticeDate);
        if (!noticeIso) {
            console.error("[Termination] Invalid notice date format");
            return;
        }
        var terIso = toIsoFromDDMMYYYY(editForm.terminationDate);
        if (!terIso) {
            console.error("[Termination] Invalid termination date format");
            return;
        }
        var payload = {
            employeeId: editForm.employeeId,
            employeeName: editForm.employeeName,
            department: editForm.departmentName,
            terminationType: editForm.terminationType,
            noticeDate: noticeIso,
            reason: editForm.reason,
            terminationDate: terIso,
            terminationId: editForm.terminationId
        };
        console.log("[Termination] Emitting update-termination with payload:", payload);
        setIsSubmitting(true);
        socket.emit("hr/termination/update-termination", payload);
    };
    var fetchStats = react_1.useCallback(function () {
        if (!socket)
            return;
        socket.emit("hr/termination/termination-details");
    }, [socket]);
    // initial + reactive fetch
    react_1.useEffect(function () {
        if (!socket)
            return;
        fetchList(filterType, customRange);
        fetchDepartmentsList();
        fetchStats();
    }, [socket, fetchList, fetchDepartmentsList, fetchStats, filterType, customRange]);
    // Add Bootstrap modal event listeners for cleanup
    react_1.useEffect(function () {
        var deleteModalElement = document.getElementById("delete_modal");
        // Delete modal - cleanup on hide
        var handleDeleteModalHide = function () {
            console.log("[Termination] Delete modal hidden - clearing state");
            setDeletingTerminationId(null);
        };
        if (deleteModalElement) {
            deleteModalElement.addEventListener('hidden.bs.modal', handleDeleteModalHide);
        }
        // Cleanup event listeners on unmount
        return function () {
            if (deleteModalElement) {
                deleteModalElement.removeEventListener('hidden.bs.modal', handleDeleteModalHide);
            }
        };
    }, []);
    var handleFilterChange = function (opt) {
        var _a;
        var value = (_a = opt === null || opt === void 0 ? void 0 : opt.value) !== null && _a !== void 0 ? _a : "alltime";
        setFilterType(value);
        if (value !== "custom") {
            setCustomRange({});
            fetchList(value);
        }
    };
    var handleCustomRange = function (_, dateStrings) {
        if (dateStrings && dateStrings[0] && dateStrings[1]) {
            var range = { startDate: dateStrings[0], endDate: dateStrings[1] };
            setCustomRange(range);
            fetchList("custom", range);
        }
    };
    var handleBulkDelete = function () {
        if (!socket || selectedKeys.length === 0)
            return;
        if (window.confirm("Delete " + selectedKeys.length + " record(s)? This cannot be undone.")) {
            socket.emit("hr/termination/delete-termination", selectedKeys);
        }
    };
    var handleSelectionChange = function (keys) {
        setSelectedKeys(keys);
    };
    // Handle process termination
    var handleProcessTermination = function (terminationId) {
        if (!socket) {
            react_toastify_1.toast.error("Socket not connected");
            return;
        }
        if (window.confirm("Are you sure you want to process this termination? Employee status will be updated to 'Terminated'.")) {
            console.log("[Termination] Processing termination:", terminationId);
            socket.emit("hr/termination/process-termination", { terminationId: terminationId });
        }
    };
    // Handle cancel termination
    var handleCancelTermination = function (terminationId) {
        if (!socket) {
            react_toastify_1.toast.error("Socket not connected");
            return;
        }
        var reason = window.prompt("Please enter reason for cancellation (optional):");
        if (reason !== null) { // User clicked OK (even if empty string)
            console.log("[Termination] Cancelling termination:", terminationId);
            socket.emit("hr/termination/cancel-termination", { terminationId: terminationId, reason: reason });
        }
    };
    // Helper to find option object from ID value
    var toDepartmentOption = function (val) {
        return val ? departmentOptions.find(function (o) { return o.value === val; }) : undefined;
    };
    var toEmployeeOption = function (val) {
        return val ? employeeOptions.find(function (o) { return o.value === val; }) : undefined;
    };
    // table columns (aligned with resignation page structure)
    var columns = [
        {
            title: "Employee ID",
            dataIndex: "employeeId",
            render: function (text) { return (react_1["default"].createElement("span", { className: "fw-medium" }, text || "N/A")); },
            sorter: function (a, b) {
                return (a.employeeId || "").localeCompare(b.employeeId || "");
            }
        },
        {
            title: "Name",
            dataIndex: "employeeName",
            render: function (text, record) {
                // Extract just the name part if employeeName contains "ID - Name" format
                var getDisplayName = function (employeeName) {
                    if (!employeeName)
                        return "Unknown Employee";
                    var parts = employeeName.split(' - ');
                    if (parts.length > 1) {
                        return parts.slice(1).join(' - ');
                    }
                    return employeeName;
                };
                var displayName = getDisplayName(text);
                return (react_1["default"].createElement(EmployeeNameCell_1["default"], { name: displayName, image: record.employeeImage, employeeId: record.employee_id || record.employeeId, avatarTheme: "danger" }));
            },
            sorter: function (a, b) {
                var getDisplayName = function (employeeName) {
                    if (!employeeName)
                        return "";
                    var parts = employeeName.split(' - ');
                    if (parts.length > 1) {
                        return parts.slice(1).join(' - ');
                    }
                    return employeeName;
                };
                return getDisplayName(a.employeeName).localeCompare(getDisplayName(b.employeeName));
            }
        },
        {
            title: "Department",
            dataIndex: "department",
            render: function (text) { return text || "N/A"; }
        },
        {
            title: "Reason",
            dataIndex: "reason",
            render: function (text) {
                if (!text)
                    return '-';
                return (react_1["default"].createElement("div", { className: "text-truncate", title: text }, text));
            }
        },
        {
            title: "Notice Date",
            dataIndex: "noticeDate",
            render: function (val) { return fmtYMD(val); },
            sorter: function (a, b) {
                return new Date(a.noticeDate).getTime() - new Date(b.noticeDate).getTime();
            }
        },
        {
            title: "Termination Date",
            dataIndex: "terminationDate",
            render: function (val) { return fmtYMD(val); },
            sorter: function (a, b) {
                return new Date(a.terminationDate).getTime() -
                    new Date(b.terminationDate).getTime();
            }
        },
        {
            title: "Status",
            dataIndex: "status",
            render: function (status) {
                var statusMap = {
                    pending: { className: "badge badge-soft-warning", text: "Pending" },
                    processed: { className: "badge badge-soft-success", text: "Processed" },
                    cancelled: { className: "badge badge-soft-danger", text: "Cancelled" }
                };
                var statusInfo = statusMap[status === null || status === void 0 ? void 0 : status.toLowerCase()] || { className: "badge badge-soft-secondary", text: status || "Unknown" };
                return react_1["default"].createElement("span", { className: statusInfo.className }, statusInfo.text);
            },
            filters: [
                { text: "Pending", value: "pending" },
                { text: "Processed", value: "processed" },
                { text: "Cancelled", value: "cancelled" },
            ],
            onFilter: function (val, rec) { var _a; return ((_a = rec.status) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === val; }
        },
        {
            title: "",
            dataIndex: "actions",
            render: function (_, record) {
                var _a;
                var isPending = ((_a = record.status) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "pending" || !record.status;
                return (react_1["default"].createElement("div", { className: "action-icon d-inline-flex" },
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", onClick: function (e) {
                            e.preventDefault();
                            handleViewClick(record);
                        }, "data-bs-toggle": "modal", "data-bs-target": "#view_termination", title: "View Details" },
                        react_1["default"].createElement("i", { className: "ti ti-eye" })),
                    isPending && (react_1["default"].createElement(react_1["default"].Fragment, null,
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2 text-success", onClick: function (e) {
                                e.preventDefault();
                                handleProcessTermination(record.terminationId);
                            }, title: "Process Termination" },
                            react_1["default"].createElement("i", { className: "ti ti-check" })),
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2 text-danger", onClick: function (e) {
                                e.preventDefault();
                                handleCancelTermination(record.terminationId);
                            }, title: "Cancel Termination" },
                            react_1["default"].createElement("i", { className: "ti ti-x" })))),
                    react_1["default"].createElement("a", { href: "#", className: "me-2", "data-bs-toggle": "modal", "data-bs-target": "#edit_termination", onClick: function (e) {
                            openEditModal(record);
                        }, title: "Edit" },
                        react_1["default"].createElement("i", { className: "ti ti-edit" })),
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "#", onClick: function (e) {
                            e.preventDefault();
                            handleDeleteClick(record.terminationId);
                        }, "data-bs-toggle": "modal", "data-bs-target": "#delete_modal", title: "Delete" },
                        react_1["default"].createElement("i", { className: "ti ti-trash" }))));
            }
        },
    ];
    var rowSelection = {
        selectedRowKeys: selectedKeys,
        onChange: function (keys) { return setSelectedKeys(keys); }
    };
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3" },
                    react_1["default"].createElement("div", { className: "my-auto mb-2" },
                        react_1["default"].createElement("h3", { className: "mb-1" }, "Termination"),
                        react_1["default"].createElement("nav", null,
                            react_1["default"].createElement("ol", { className: "breadcrumb mb-0" },
                                react_1["default"].createElement("li", { className: "breadcrumb-item" },
                                    react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.adminDashboard },
                                        react_1["default"].createElement("i", { className: "ti ti-smart-home" }))),
                                react_1["default"].createElement("li", { className: "breadcrumb-item" }, "HR"),
                                react_1["default"].createElement("li", { className: "breadcrumb-item active", "aria-current": "page" }, "Termination")))),
                    react_1["default"].createElement("div", { className: "d-flex my-xl-auto right-content align-items-center flex-wrap" },
                        react_1["default"].createElement("label", { className: "mb-2" }),
                        react_1["default"].createElement("div", null,
                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-primary d-flex align-items-center", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#new_termination" },
                                react_1["default"].createElement("i", { className: "ti ti-circle-plus me-2" }),
                                "Add Termination")),
                        react_1["default"].createElement("div", { className: "head-icons ms-2" },
                            react_1["default"].createElement(collapse_header_1["default"], null)))),
                react_1["default"].createElement("div", { className: "row" },
                    react_1["default"].createElement("div", { className: "col-sm-12" },
                        react_1["default"].createElement("div", { className: "card" },
                            react_1["default"].createElement("div", { className: "card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3" },
                                react_1["default"].createElement("h5", { className: "d-flex align-items-center" }, "Termination List"),
                                react_1["default"].createElement("div", { className: "d-flex align-items-center flex-wrap row-gap-3" },
                                    react_1["default"].createElement("div", { className: "dropdown" },
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-inline-flex align-items-center fs-12" },
                                            react_1["default"].createElement("label", { className: "fs-12 d-inline-flex me-1" },
                                                "Sort By :",
                                                " "),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: [
                                                    { value: "today", label: "Today" },
                                                    { value: "yesterday", label: "Yesterday" },
                                                    { value: "last7days", label: "Last 7 Days" },
                                                    { value: "last30days", label: "Last 30 Days" },
                                                    { value: "thismonth", label: "This Month" },
                                                    { value: "lastmonth", label: "Last Month" },
                                                    { value: "thisyear", label: "This Year" },
                                                    { value: "alltime", label: "All Time" },
                                                ], defaultValue: filterType, onChange: handleFilterChange }))))),
                            react_1["default"].createElement("div", { className: "card-body p-0" },
                                react_1["default"].createElement(index_1["default"], { dataSource: rows, columns: columns, Selection: true }))))),
                react_1["default"].createElement("div", { className: "footer d-sm-flex align-items-center justify-content-between" },
                    react_1["default"].createElement("p", null, "2014 - 2025 \u00A9 Amasqis."),
                    react_1["default"].createElement("p", null,
                        "Designed & Developed By",
                        " ",
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", target: "_blank" }, "Amasqis")))),
            react_1["default"].createElement("div", { className: "modal fade", id: "new_termination" },
                react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-md" },
                    react_1["default"].createElement("div", { className: "modal-content" },
                        react_1["default"].createElement("div", { className: "modal-header" },
                            react_1["default"].createElement("h4", { className: "modal-title" }, "Add Termination"),
                            react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                                react_1["default"].createElement("i", { className: "ti ti-x" }))),
                        react_1["default"].createElement("form", null,
                            react_1["default"].createElement("div", { className: "modal-body pb-0" },
                                react_1["default"].createElement("div", { className: "row" },
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Department ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", value: toDepartmentOption(addForm.departmentId) || null, onChange: handleAddDepartmentChange, options: departmentOptions }),
                                            addErrors.departmentId && (react_1["default"].createElement("small", { className: "text-danger" }, addErrors.departmentId)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Terminated Employee ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", value: toEmployeeOption(addForm.employeeId) || null, onChange: handleAddEmployeeChange, options: employeeOptions }),
                                            addErrors.employeeId && (react_1["default"].createElement("small", { className: "text-danger" }, addErrors.employeeId)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Termination Type ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: [
                                                    { value: "Retirement", label: "Retirement" },
                                                    { value: "Insubordination", label: "Insubordination" },
                                                    { value: "Lack of skills", label: "Lack of skills" },
                                                ], value: { value: addForm.terminationType, label: addForm.terminationType }, onChange: function (opt) {
                                                    var _a;
                                                    setAddForm(__assign(__assign({}, addForm), { terminationType: (_a = opt === null || opt === void 0 ? void 0 : opt.value) !== null && _a !== void 0 ? _a : "Lack of skills" }));
                                                    setAddErrors(function (prev) { return (__assign(__assign({}, prev), { terminationType: "" })); });
                                                } }),
                                            addErrors.terminationType && (react_1["default"].createElement("small", { className: "text-danger" }, addErrors.terminationType)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Termination Date ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: { format: "DD-MM-YYYY", type: "mask" }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", onChange: function (_, dateString) {
                                                        setAddForm(__assign(__assign({}, addForm), { terminationDate: dateString }));
                                                        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { terminationDate: "" })); });
                                                    } }),
                                                react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                    react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                            addErrors.terminationDate && (react_1["default"].createElement("small", { className: "text-danger" }, addErrors.terminationDate)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Notice Date ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: { format: "DD-MM-YYYY", type: "mask" }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", onChange: function (_, dateString) {
                                                        setAddForm(__assign(__assign({}, addForm), { noticeDate: dateString }));
                                                        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { noticeDate: "" })); });
                                                    } }),
                                                react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                    react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                            addErrors.noticeDate && (react_1["default"].createElement("small", { className: "text-danger" }, addErrors.noticeDate)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Reason ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("textarea", { className: "form-control", rows: 3, value: addForm.reason, maxLength: 500, onChange: function (e) {
                                                    setAddForm(__assign(__assign({}, addForm), { reason: e.target.value }));
                                                    setAddErrors(function (prev) { return (__assign(__assign({}, prev), { reason: "" })); });
                                                }, placeholder: "Enter reason (max 500 characters)" }),
                                            react_1["default"].createElement("small", { className: "text-muted" },
                                                addForm.reason.length,
                                                "/500 characters"),
                                            addErrors.reason && (react_1["default"].createElement("div", null,
                                                react_1["default"].createElement("small", { className: "text-danger" }, addErrors.reason))))))),
                            react_1["default"].createElement("div", { className: "modal-footer" },
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", onClick: handleAddSave, disabled: isSubmitting }, isSubmitting ? "Adding..." : "Add Termination")))))),
            react_1["default"].createElement("div", { className: "modal fade", id: "edit_termination" },
                react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-md" },
                    react_1["default"].createElement("div", { className: "modal-content" },
                        react_1["default"].createElement("div", { className: "modal-header" },
                            react_1["default"].createElement("h4", { className: "modal-title" }, "Edit Termination"),
                            react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                                react_1["default"].createElement("i", { className: "ti ti-x" }))),
                        react_1["default"].createElement("form", null,
                            react_1["default"].createElement("div", { className: "modal-body pb-0" },
                                react_1["default"].createElement("div", { className: "row" },
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Department ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", value: toDepartmentOption(editForm.departmentId) || null, onChange: handleEditDepartmentChange, options: departmentOptions, disabled: true }),
                                            editErrors.departmentId && (react_1["default"].createElement("small", { className: "text-danger" }, editErrors.departmentId)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Terminated Employee ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", value: toEmployeeOption(editForm.employeeId) || null, onChange: handleEditEmployeeChange, options: employeeOptions, disabled: true }),
                                            editErrors.employeeId && (react_1["default"].createElement("small", { className: "text-danger" }, editErrors.employeeId)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Termination Type ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", value: { value: editForm.terminationType, label: editForm.terminationType }, onChange: function (opt) {
                                                    var _a;
                                                    setEditForm(__assign(__assign({}, editForm), { terminationType: (_a = opt === null || opt === void 0 ? void 0 : opt.value) !== null && _a !== void 0 ? _a : "Lack of skills" }));
                                                    setEditErrors(function (prev) { return (__assign(__assign({}, prev), { terminationType: "" })); });
                                                }, options: [
                                                    { value: "Retirement", label: "Retirement" },
                                                    { value: "Insubordination", label: "Insubordination" },
                                                    { value: "Lack of skills", label: "Lack of skills" },
                                                ] }),
                                            editErrors.terminationType && (react_1["default"].createElement("small", { className: "text-danger" }, editErrors.terminationType)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Termination Date ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: { format: "DD-MM-YYYY", type: "mask" }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: editForm.terminationDate ? dayjs_1["default"](editForm.terminationDate, "DD-MM-YYYY") : null, onChange: function (_, dateString) {
                                                        setEditForm(__assign(__assign({}, editForm), { terminationDate: dateString }));
                                                        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { terminationDate: "" })); });
                                                    } }),
                                                react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                    react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                            editErrors.terminationDate && (react_1["default"].createElement("small", { className: "text-danger" }, editErrors.terminationDate)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Notice Date ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: { format: "DD-MM-YYYY", type: "mask" }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: editForm.noticeDate ? dayjs_1["default"](editForm.noticeDate, "DD-MM-YYYY") : null, onChange: function (_, dateString) {
                                                        setEditForm(__assign(__assign({}, editForm), { noticeDate: dateString }));
                                                        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { noticeDate: "" })); });
                                                    } }),
                                                react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                    react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                            editErrors.noticeDate && (react_1["default"].createElement("small", { className: "text-danger" }, editErrors.noticeDate)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Reason ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("textarea", { className: "form-control", rows: 3, value: editForm.reason, maxLength: 500, onChange: function (e) {
                                                    setEditForm(__assign(__assign({}, editForm), { reason: e.target.value }));
                                                    setEditErrors(function (prev) { return (__assign(__assign({}, prev), { reason: "" })); });
                                                }, placeholder: "Enter reason (max 500 characters)" }),
                                            react_1["default"].createElement("small", { className: "text-muted" },
                                                editForm.reason.length,
                                                "/500 characters"),
                                            editErrors.reason && (react_1["default"].createElement("div", null,
                                                react_1["default"].createElement("small", { className: "text-danger" }, editErrors.reason))))))),
                            react_1["default"].createElement("div", { className: "modal-footer" },
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", onClick: handleEditSave, disabled: isSubmitting }, isSubmitting ? "Saving..." : "Save Changes")))))),
            react_1["default"].createElement("div", { className: "modal fade", id: "delete_modal" },
                react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered" },
                    react_1["default"].createElement("div", { className: "modal-content" },
                        react_1["default"].createElement("div", { className: "modal-body text-center" },
                            react_1["default"].createElement("span", { className: "avatar avatar-xl bg-transparent-danger text-danger mb-3" },
                                react_1["default"].createElement("i", { className: "ti ti-trash-x fs-36" })),
                            react_1["default"].createElement("h4", { className: "mb-1" }, "Confirm Delete"),
                            react_1["default"].createElement("p", { className: "mb-3" }, "Are you sure you want to delete this termination? This action cannot be undone."),
                            react_1["default"].createElement("div", { className: "d-flex justify-content-center" },
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-light me-3", "data-bs-dismiss": "modal" }, "Cancel"),
                                react_1["default"].createElement("button", { type: "button", onClick: confirmDelete, className: "btn btn-danger" }, "Yes, Delete")))))),
            react_1["default"].createElement(TerminationDetailsModal_1["default"], { termination: viewingTermination, modalId: "view_termination" }))));
};
exports["default"] = Termination;
