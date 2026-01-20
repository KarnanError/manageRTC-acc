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
var ResignationDetailsModal_1 = require("../../core/modals/ResignationDetailsModal");
var react_toastify_1 = require("react-toastify");
var Resignation = function () {
    var socket = SocketContext_1.useSocket();
    var _a = react_1.useState([]), rows = _a[0], setRows = _a[1];
    var _b = react_1.useState([]), departmentOptions = _b[0], setDepartmentOptions = _b[1];
    var _c = react_1.useState([]), employeeOptions = _c[0], setEmployeeOptions = _c[1];
    var _d = react_1.useState({
        totalResignations: "0",
        recentResignations: "0"
    }), stats = _d[0], setStats = _d[1];
    var _e = react_1.useState(true), loading = _e[0], setLoading = _e[1];
    var _f = react_1.useState(null), deletingResignationId = _f[0], setDeletingResignationId = _f[1];
    var _g = react_1.useState(false), isSubmitting = _g[0], setIsSubmitting = _g[1];
    var _h = react_1.useState([]), selectedKeys = _h[0], setSelectedKeys = _h[1];
    var _j = react_1.useState("thisyear"), filterType = _j[0], setFilterType = _j[1];
    var _k = react_1.useState({}), customRange = _k[0], setCustomRange = _k[1];
    var _l = react_1.useState(null), editing = _l[0], setEditing = _l[1];
    // State for viewing resignation details
    var _m = react_1.useState(null), viewingResignation = _m[0], setViewingResignation = _m[1];
    // Controlled edit form data
    var _o = react_1.useState({
        employeeId: "",
        departmentId: "",
        noticeDate: "",
        reason: "",
        resignationDate: "",
        resignationId: ""
    }), editForm = _o[0], setEditForm = _o[1];
    var ddmmyyyyToYMD = function (s) {
        if (!s)
            return "";
        var d = date_fns_1.parse(s, "dd-MM-yyyy", new Date());
        return isNaN(d.getTime()) ? "" : date_fns_1.format(d, "yyyy-MM-dd");
    };
    // Define fetchers early so they can be used in openEditModal
    var fetchStats = react_1.useCallback(function () {
        if (!socket)
            return;
        socket.emit("hr/resignation/resignation-details");
    }, [socket]);
    var fetchDepartments = react_1.useCallback(function () {
        if (!socket)
            return;
        socket.emit("hr/resignation/departmentlist");
    }, [socket]);
    var fetchEmployeesByDepartment = react_1.useCallback(function (departmentId) {
        if (!socket || !departmentId) {
            console.log("fetchEmployeesByDepartment - socket or departmentId missing", { socket: !!socket, departmentId: departmentId });
            setEmployeeOptions([]);
            return;
        }
        console.log("emit employees-by-department with departmentId:", departmentId, "type:", typeof departmentId);
        socket.emit("hr/resignation/employees-by-department", departmentId);
    }, [socket]);
    var openEditModal = function (row) {
        console.log("[Resignation] openEditModal - row:", row);
        setEditForm({
            employeeId: row.employee_id || "",
            departmentId: row.departmentId || "",
            noticeDate: row.noticeDate
                ? date_fns_1.format(date_fns_1.parse(row.noticeDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy")
                : "",
            reason: row.reason || "",
            resignationDate: row.resignationDate
                ? date_fns_1.format(date_fns_1.parse(row.resignationDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy")
                : "",
            resignationId: row.resignationId
        });
        // Fetch employees for the selected department
        if (row.departmentId) {
            fetchEmployeesByDepartment(row.departmentId);
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
    var _p = react_1.useState({
        employeeId: "",
        departmentId: "",
        reason: "",
        noticeDate: "",
        resignationDate: ""
    }), addForm = _p[0], setAddForm = _p[1];
    // Validation errors for Add Resignation
    var _q = react_1.useState({
        departmentId: "",
        employeeId: "",
        reason: "",
        noticeDate: "",
        resignationDate: ""
    }), addErrors = _q[0], setAddErrors = _q[1];
    // Validation errors for Edit Resignation
    var _r = react_1.useState({
        departmentId: "",
        employeeId: "",
        reason: "",
        noticeDate: "",
        resignationDate: ""
    }), editErrors = _r[0], setEditErrors = _r[1];
    // Handle opening Add modal - reset form
    var handleAddModalOpen = function () {
        console.log("[Resignation] handleAddModalOpen - Resetting Add form");
        setAddForm({
            employeeId: "",
            departmentId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        });
        setAddErrors({
            departmentId: "",
            employeeId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        });
        setEmployeeOptions([]);
        setIsSubmitting(false); // Reset loading state
    };
    // Handle closing Add modal - reset form state
    var handleAddModalClose = function () {
        console.log("[Resignation] handleAddModalClose - Cleaning up Add modal state");
        setAddForm({
            employeeId: "",
            departmentId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        });
        setAddErrors({
            departmentId: "",
            employeeId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        });
        setEmployeeOptions([]);
        setIsSubmitting(false);
    };
    // Handle closing Edit modal - reset form state
    var handleEditModalClose = function () {
        console.log("[Resignation] handleEditModalClose - Cleaning up Edit modal state");
        setEditForm({
            employeeId: "",
            departmentId: "",
            noticeDate: "",
            reason: "",
            resignationDate: "",
            resignationId: ""
        });
        setEditErrors({
            departmentId: "",
            employeeId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        });
        setEmployeeOptions([]);
        setIsSubmitting(false);
    };
    // Handle delete resignation
    var handleDeleteClick = function (resignationId) {
        console.log("[Resignation] Delete clicked:", resignationId);
        setDeletingResignationId(resignationId);
    };
    var confirmDelete = function () {
        if (!socket || !deletingResignationId) {
            react_toastify_1.toast.error("Socket not connected or no resignation selected");
            return;
        }
        console.log("[Resignation] Deleting resignation:", deletingResignationId);
        socket.emit("hr/resignation/delete-resignation", [deletingResignationId]);
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
            console.error("Failed to fetch resignations:", res === null || res === void 0 ? void 0 : res.message);
            if (res === null || res === void 0 ? void 0 : res.message) {
                react_toastify_1.toast.error(res.message);
            }
        }
        setLoading(false);
    }, []);
    var onDepartmentsListResponse = react_1.useCallback(function (res) {
        console.log("departments list response", res === null || res === void 0 ? void 0 : res.data);
        if (res === null || res === void 0 ? void 0 : res.done) {
            var opts = (res.data || []).map(function (dept) { return ({
                value: dept._id,
                label: dept.department
            }); });
            setDepartmentOptions(opts);
        }
        else {
            setDepartmentOptions([]);
        }
    }, []);
    var onEmployeesByDepartmentResponse = react_1.useCallback(function (res) {
        console.log("employees-by-dept response:", res === null || res === void 0 ? void 0 : res.data, "done:", res === null || res === void 0 ? void 0 : res.done, "message:", res === null || res === void 0 ? void 0 : res.message);
        if (res === null || res === void 0 ? void 0 : res.done) {
            var opts = (res.data || []).map(function (emp) {
                console.log("Employee _id:", emp._id, "employeeId:", emp.employeeId, "employeeName:", emp.employeeName);
                return {
                    value: emp._id,
                    label: emp.employeeId + " - " + (emp.employeeName || ((emp.firstName || '') + " " + (emp.lastName || '')).trim())
                };
            });
            console.log("Mapped employee options:", opts);
            setEmployeeOptions(opts);
        }
        else {
            console.log("Response not done or empty data");
            setEmployeeOptions([]);
        }
    }, []);
    var onStatsResponse = react_1.useCallback(function (res) {
        if ((res === null || res === void 0 ? void 0 : res.done) && res.data) {
            setStats(res.data);
        }
    }, []);
    var onAddResponse = react_1.useCallback(function (res) {
        console.log("[Resignation] onAddResponse received:", res);
        setIsSubmitting(false);
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success("Resignation added successfully");
            // Reset form on success
            setAddForm({
                employeeId: "",
                departmentId: "",
                reason: "",
                noticeDate: "",
                resignationDate: ""
            });
            // Clear errors
            setAddErrors({
                departmentId: "",
                employeeId: "",
                reason: "",
                noticeDate: "",
                resignationDate: ""
            });
            // Clear employee options
            setEmployeeOptions([]);
            // Refresh the list
            if (socket) {
                socket.emit("hr/resignation/resignationlist", __assign({ type: filterType }, customRange));
                socket.emit("hr/resignation/resignation-details");
            }
            // Close modal with improved reliability
            console.log("[Resignation] Attempting to close modal");
            setTimeout(function () {
                var _a;
                var modalElement = document.getElementById("new_resignation");
                console.log("[Resignation] Modal element found:", !!modalElement);
                if (modalElement) {
                    var modalClosed = false;
                    // Try Bootstrap if available
                    if ((_a = window.bootstrap) === null || _a === void 0 ? void 0 : _a.Modal) {
                        try {
                            var modal = window.bootstrap.Modal.getInstance(modalElement);
                            if (!modal) {
                                console.log("[Resignation] Creating new modal instance");
                                modal = new window.bootstrap.Modal(modalElement);
                            }
                            console.log("[Resignation] Calling modal.hide()");
                            modal.hide();
                            modalClosed = true;
                        }
                        catch (error) {
                            console.error("[Resignation] Bootstrap modal error:", error);
                        }
                    }
                    // Fallback: Force close manually
                    if (!modalClosed) {
                        console.log("[Resignation] Using fallback modal close");
                        modalElement.classList.remove("show");
                        modalElement.setAttribute("aria-hidden", "true");
                        modalElement.style.display = "none";
                    }
                    // Force cleanup of backdrop and body classes
                    setTimeout(function () {
                        var _a;
                        console.log("[Resignation] Forcing cleanup of modal backdrop");
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
            console.error("Failed to add resignation:", res === null || res === void 0 ? void 0 : res.message);
            // Handle backend validation errors inline
            if ((res === null || res === void 0 ? void 0 : res.errors) && typeof res.errors === 'object') {
                // Map backend errors to form fields
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
    }, [socket, filterType, customRange]);
    var onUpdateResponse = react_1.useCallback(function (res) {
        var _a, _b;
        setIsSubmitting(false);
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success("Resignation updated successfully");
            // Reset form on success
            setEditForm({
                employeeId: "",
                departmentId: "",
                reason: "",
                noticeDate: "",
                resignationDate: "",
                resignationId: ""
            });
            // Clear errors
            setEditErrors({
                departmentId: "",
                employeeId: "",
                reason: "",
                noticeDate: "",
                resignationDate: ""
            });
            // Clear employee options
            setEmployeeOptions([]);
            // Refresh the list
            if (socket) {
                socket.emit("hr/resignation/resignationlist", __assign({ type: filterType }, customRange));
                socket.emit("hr/resignation/resignation-details");
            }
            // Close modal properly
            var modalElement = document.getElementById("edit_resignation");
            if (modalElement) {
                var modalClosed = false;
                if ((_a = window.bootstrap) === null || _a === void 0 ? void 0 : _a.Modal) {
                    try {
                        var modal = window.bootstrap.Modal.getInstance(modalElement);
                        if (modal) {
                            modal.hide();
                            modalClosed = true;
                        }
                        else {
                            var newModal = new window.bootstrap.Modal(modalElement);
                            newModal.hide();
                            modalClosed = true;
                        }
                    }
                    catch (error) {
                        console.error("[Resignation] Bootstrap modal error:", error);
                    }
                }
                // Fallback: Force close manually
                if (!modalClosed) {
                    modalElement.classList.remove("show");
                    modalElement.setAttribute("aria-hidden", "true");
                    modalElement.style.display = "none";
                    document.body.classList.remove("modal-open");
                    var backdrops = document.getElementsByClassName("modal-backdrop");
                    while (backdrops.length > 0) {
                        (_b = backdrops[0].parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(backdrops[0]);
                    }
                }
            }
        }
        else {
            console.error("Failed to update resignation:", res === null || res === void 0 ? void 0 : res.message);
            // Handle backend validation errors inline
            if ((res === null || res === void 0 ? void 0 : res.errors) && typeof res.errors === 'object') {
                // Map backend errors to form fields
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
    }, [socket, filterType, customRange]);
    var onDeleteResponse = react_1.useCallback(function (res) {
        var _a, _b, _c;
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success("Resignation deleted successfully");
            setSelectedKeys([]);
            setDeletingResignationId(null);
            // Refresh the resignation list and stats
            if (socket) {
                socket.emit("hr/resignation/resignationlist", __assign({ type: filterType }, customRange));
                socket.emit("hr/resignation/resignation-details");
                // Refresh employee list to show updated status (Active)
                socket.emit("hrm/employees/get-employee-stats");
                console.log("[Resignation] Emitted employee refresh after deletion");
            }
            // Close modal (robust)
            var modalElement = document.getElementById("delete_modal");
            var closed = false;
            if (modalElement) {
                var modal = (_b = (_a = window.bootstrap) === null || _a === void 0 ? void 0 : _a.Modal) === null || _b === void 0 ? void 0 : _b.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                    closed = true;
                }
            }
            // Fallback: forcibly remove modal classes and backdrop if still open
            if (!closed && modalElement) {
                modalElement.classList.remove("show");
                modalElement.setAttribute("aria-hidden", "true");
                modalElement.style.display = "none";
                document.body.classList.remove("modal-open");
                // Remove backdrop
                var backdrops = document.getElementsByClassName("modal-backdrop");
                while (backdrops.length > 0) {
                    (_c = backdrops[0].parentNode) === null || _c === void 0 ? void 0 : _c.removeChild(backdrops[0]);
                }
            }
        }
        else {
            console.error("Failed to delete resignation:", res === null || res === void 0 ? void 0 : res.message);
            if (res === null || res === void 0 ? void 0 : res.message) {
                react_toastify_1.toast.error(res.message);
            }
        }
    }, [socket, filterType, customRange]);
    // fetchers
    var fetchList = react_1.useCallback(function (type, range) {
        if (!socket)
            return;
        setLoading(true);
        var payload = { type: type };
        if (type === "custom" && (range === null || range === void 0 ? void 0 : range.startDate) && (range === null || range === void 0 ? void 0 : range.endDate)) {
            payload.startDate = range.startDate;
            payload.endDate = range === null || range === void 0 ? void 0 : range.endDate;
        }
        socket.emit("hr/resignation/resignationlist", payload);
    }, [socket]);
    // Approval response handler (defined after fetchList)
    var onApproveResponse = react_1.useCallback(function (res) {
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success(res.message || "Resignation approved successfully");
            fetchList(filterType, customRange);
            fetchStats();
        }
        else {
            react_toastify_1.toast.error((res === null || res === void 0 ? void 0 : res.message) || "Failed to approve resignation");
        }
    }, [fetchList, fetchStats, filterType, customRange]);
    // Rejection response handler (defined after fetchList)
    var onRejectResponse = react_1.useCallback(function (res) {
        if (res === null || res === void 0 ? void 0 : res.done) {
            react_toastify_1.toast.success(res.message || "Resignation rejected successfully");
            fetchList(filterType, customRange);
            fetchStats();
        }
        else {
            react_toastify_1.toast.error((res === null || res === void 0 ? void 0 : res.message) || "Failed to reject resignation");
        }
    }, [fetchList, fetchStats, filterType, customRange]);
    // register socket listeners and join room (moved here after callback definitions)
    react_1.useEffect(function () {
        if (!socket)
            return;
        socket.emit("join-room", "hr_room");
        socket.on("hr/resignation/resignationlist-response", onListResponse);
        socket.on("hr/resignation/departmentlist-response", onDepartmentsListResponse);
        socket.on("hr/resignation/employees-by-department-response", onEmployeesByDepartmentResponse);
        socket.on("hr/resignation/resignation-details-response", onStatsResponse);
        socket.on("hr/resignation/add-resignation-response", onAddResponse);
        socket.on("hr/resignation/update-resignation-response", onUpdateResponse);
        socket.on("hr/resignation/delete-resignation-response", onDeleteResponse);
        socket.on("hr/resignation/approve-resignation-response", onApproveResponse);
        socket.on("hr/resignation/reject-resignation-response", onRejectResponse);
        return function () {
            socket.off("hr/resignation/resignationlist-response", onListResponse);
            socket.off("hr/resignation/departmentlist-response", onDepartmentsListResponse);
            socket.off("hr/resignation/employees-by-department-response", onEmployeesByDepartmentResponse);
            socket.off("hr/resignation/resignation-details-response", onStatsResponse);
            socket.off("hr/resignation/add-resignation-response", onAddResponse);
            socket.off("hr/resignation/update-resignation-response", onUpdateResponse);
            socket.off("hr/resignation/delete-resignation-response", onDeleteResponse);
            socket.off("hr/resignation/approve-resignation-response", onApproveResponse);
            socket.off("hr/resignation/reject-resignation-response", onRejectResponse);
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
        onApproveResponse,
        onRejectResponse,
    ]);
    var toIsoFromDDMMYYYY = function (s) {
        // s like "13-09-2025"
        var _a = s.split("-").map(Number), dd = _a[0], mm = _a[1], yyyy = _a[2];
        if (!dd || !mm || !yyyy)
            return null;
        // Construct UTC date to avoid TZ shifts
        var d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
        return isNaN(d.getTime()) ? null : d.toISOString();
    };
    var handleAddSave = function () {
        console.log("[Resignation] handleAddSave called");
        // Validate form first
        if (!validateAddForm()) {
            console.log("[Resignation] Validation failed");
            return;
        }
        if (!socket || isSubmitting)
            return;
        var noticeIso = toIsoFromDDMMYYYY(addForm.noticeDate);
        if (!noticeIso) {
            setAddErrors(function (prev) { return (__assign(__assign({}, prev), { noticeDate: "Invalid notice date format" })); });
            return;
        }
        var resIso = toIsoFromDDMMYYYY(addForm.resignationDate);
        if (!resIso) {
            setAddErrors(function (prev) { return (__assign(__assign({}, prev), { resignationDate: "Invalid resignation date format" })); });
            return;
        }
        var payload = {
            employeeId: addForm.employeeId,
            noticeDate: noticeIso,
            reason: addForm.reason,
            resignationDate: resIso
        };
        console.log("[Resignation] Emitting add-resignation with normalized payload:", payload);
        setIsSubmitting(true);
        socket.emit("hr/resignation/add-resignation", payload);
    };
    var handleEditSave = function () {
        console.log("[Resignation] handleEditSave called");
        // Validate form first
        if (!validateEditForm()) {
            console.log("[Resignation] Validation failed");
            return;
        }
        if (!socket || isSubmitting)
            return;
        var noticeIso = toIsoFromDDMMYYYY(editForm.noticeDate);
        if (!noticeIso) {
            setEditErrors(function (prev) { return (__assign(__assign({}, prev), { noticeDate: "Invalid notice date format" })); });
            return;
        }
        var resIso = toIsoFromDDMMYYYY(editForm.resignationDate);
        if (!resIso) {
            setEditErrors(function (prev) { return (__assign(__assign({}, prev), { resignationDate: "Invalid resignation date format" })); });
            return;
        }
        var payload = {
            employeeId: editForm.employeeId,
            noticeDate: noticeIso,
            reason: editForm.reason,
            resignationDate: resIso,
            resignationId: editForm.resignationId
        };
        console.log("[Resignation] Emitting update-resignation with normalized payload:", payload);
        setIsSubmitting(true);
        socket.emit("hr/resignation/update-resignation", payload);
    };
    // initial + reactive fetch
    react_1.useEffect(function () {
        if (!socket)
            return;
        fetchList(filterType, customRange);
        fetchDepartments();
        fetchStats();
    }, [socket, fetchList, fetchDepartments, fetchStats, filterType, customRange]);
    // Add Bootstrap modal event listeners for cleanup
    react_1.useEffect(function () {
        var addModalElement = document.getElementById("new_resignation");
        var editModalElement = document.getElementById("edit_resignation");
        var deleteModalElement = document.getElementById("delete_modal");
        // Add modal - cleanup on hide
        var handleAddModalHide = function () {
            handleAddModalClose();
        };
        // Edit modal - cleanup on hide
        var handleEditModalHide = function () {
            handleEditModalClose();
        };
        // Delete modal - cleanup on hide
        var handleDeleteModalHide = function () {
            console.log("[Resignation] Delete modal hidden - clearing state");
            setDeletingResignationId(null);
        };
        if (addModalElement) {
            addModalElement.addEventListener('hidden.bs.modal', handleAddModalHide);
        }
        if (editModalElement) {
            editModalElement.addEventListener('hidden.bs.modal', handleEditModalHide);
        }
        if (deleteModalElement) {
            deleteModalElement.addEventListener('hidden.bs.modal', handleDeleteModalHide);
        }
        // Cleanup event listeners on unmount
        return function () {
            if (addModalElement) {
                addModalElement.removeEventListener('hidden.bs.modal', handleAddModalHide);
            }
            if (editModalElement) {
                editModalElement.removeEventListener('hidden.bs.modal', handleEditModalHide);
            }
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
            socket.emit("hr/resignation/delete-resignation", selectedKeys);
        }
    };
    var handleSelectionChange = function (keys) {
        setSelectedKeys(keys);
    };
    var handleAddDepartmentChange = function (opt) {
        console.log("Add department selected - _id:", opt === null || opt === void 0 ? void 0 : opt.value);
        setAddForm(__assign(__assign({}, addForm), { departmentId: (opt === null || opt === void 0 ? void 0 : opt.value) || "", employeeId: "" }));
        // Clear department and dependent field errors
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { departmentId: "", employeeId: "" })); });
        if (opt === null || opt === void 0 ? void 0 : opt.value) {
            fetchEmployeesByDepartment(opt.value);
        }
    };
    var handleAddEmployeeChange = function (opt) {
        console.log("[Resignation] Add employee selected - id:", opt === null || opt === void 0 ? void 0 : opt.value);
        setAddForm(__assign(__assign({}, addForm), { employeeId: (opt === null || opt === void 0 ? void 0 : opt.value) || "" }));
        // Clear employee error initially
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { employeeId: "" })); });
    };
    var handleEditDepartmentChange = function (opt) {
        console.log("Edit department selected - _id:", opt === null || opt === void 0 ? void 0 : opt.value);
        setEditForm(__assign(__assign({}, editForm), { departmentId: (opt === null || opt === void 0 ? void 0 : opt.value) || "", employeeId: "" }));
        // Clear department and dependent field errors
        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { departmentId: "", employeeId: "" })); });
        if (opt === null || opt === void 0 ? void 0 : opt.value) {
            fetchEmployeesByDepartment(opt.value);
        }
    };
    var handleEditEmployeeChange = function (opt) {
        console.log("[Resignation] Edit employee selected - id:", opt === null || opt === void 0 ? void 0 : opt.value);
        setEditForm(__assign(__assign({}, editForm), { employeeId: (opt === null || opt === void 0 ? void 0 : opt.value) || "" }));
        // Clear employee error initially
        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { employeeId: "" })); });
    };
    // Validate Add Resignation form
    var validateAddForm = function () {
        var errors = {
            departmentId: "",
            employeeId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        };
        var isValid = true;
        if (!addForm.departmentId || addForm.departmentId === "") {
            errors.departmentId = "Please select a department";
            isValid = false;
        }
        if (!addForm.employeeId || addForm.employeeId === "") {
            errors.employeeId = "Please select a resigning employee";
            isValid = false;
        }
        if (!addForm.reason || addForm.reason.trim() === "") {
            errors.reason = "Please enter a reason for resignation";
            isValid = false;
        }
        if (!addForm.noticeDate || addForm.noticeDate === "") {
            errors.noticeDate = "Please select a notice date";
            isValid = false;
        }
        if (!addForm.resignationDate || addForm.resignationDate === "") {
            errors.resignationDate = "Please select a resignation date";
            isValid = false;
        }
        // Date validation: resignation date should be after or equal to notice date
        if (addForm.noticeDate && addForm.resignationDate) {
            var noticeIso = toIsoFromDDMMYYYY(addForm.noticeDate);
            var resignationIso = toIsoFromDDMMYYYY(addForm.resignationDate);
            if (noticeIso && resignationIso) {
                var noticeDate = new Date(noticeIso);
                var resignationDate = new Date(resignationIso);
                if (resignationDate < noticeDate) {
                    errors.resignationDate = "Resignation date cannot be earlier than notice date";
                    isValid = false;
                }
            }
        }
        setAddErrors(errors);
        return isValid;
    };
    // Validate Edit Resignation form
    var validateEditForm = function () {
        var errors = {
            departmentId: "",
            employeeId: "",
            reason: "",
            noticeDate: "",
            resignationDate: ""
        };
        var isValid = true;
        if (!editForm.departmentId || editForm.departmentId === "") {
            errors.departmentId = "Please select a department";
            isValid = false;
        }
        if (!editForm.employeeId || editForm.employeeId === "") {
            errors.employeeId = "Please select a resigning employee";
            isValid = false;
        }
        if (!editForm.reason || editForm.reason.trim() === "") {
            errors.reason = "Please enter a reason for resignation";
            isValid = false;
        }
        if (!editForm.noticeDate || editForm.noticeDate === "") {
            errors.noticeDate = "Please select a notice date";
            isValid = false;
        }
        if (!editForm.resignationDate || editForm.resignationDate === "") {
            errors.resignationDate = "Please select a resignation date";
            isValid = false;
        }
        // Date validation: resignation date should be after or equal to notice date
        if (editForm.noticeDate && editForm.resignationDate) {
            var noticeIso = toIsoFromDDMMYYYY(editForm.noticeDate);
            var resignationIso = toIsoFromDDMMYYYY(editForm.resignationDate);
            if (noticeIso && resignationIso) {
                var noticeDate = new Date(noticeIso);
                var resignationDate = new Date(resignationIso);
                if (resignationDate < noticeDate) {
                    errors.resignationDate = "Resignation date cannot be earlier than notice date";
                    isValid = false;
                }
            }
        }
        setEditErrors(errors);
        return isValid;
    };
    // Handle view resignation details
    var handleViewClick = function (resignation) {
        console.log("[Resignation] View clicked:", resignation);
        setViewingResignation(resignation);
    };
    // Handle approve resignation
    var handleApproveResignation = function (resignationId) {
        if (!socket) {
            react_toastify_1.toast.error("Socket not connected");
            return;
        }
        if (window.confirm("Are you sure you want to approve this resignation? Employee status will be updated to 'On Notice'.")) {
            console.log("[Resignation] Approving resignation:", resignationId);
            socket.emit("hr/resignation/approve-resignation", { resignationId: resignationId });
        }
    };
    // Handle reject resignation
    var handleRejectResignation = function (resignationId) {
        if (!socket) {
            react_toastify_1.toast.error("Socket not connected");
            return;
        }
        var reason = window.prompt("Please enter reason for rejection (optional):");
        if (reason !== null) { // User clicked OK (even if empty string)
            console.log("[Resignation] Rejecting resignation:", resignationId);
            socket.emit("hr/resignation/reject-resignation", { resignationId: resignationId, reason: reason });
        }
    };
    // table columns (preserved look, wired to backend fields)
    var columns = [
        {
            title: "Employee ID",
            dataIndex: "employeeId",
            render: function (text) { return (react_1["default"].createElement("span", { className: "fw-medium" }, text)); },
            sorter: function (a, b) {
                return a.employeeId.localeCompare(b.employeeId);
            }
        },
        {
            title: "Name",
            dataIndex: "employeeName",
            render: function (text, record) {
                // Extract just the name part if employeeName contains "ID - Name" format
                var getDisplayName = function (employeeName) {
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
            dataIndex: "department"
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
            title: "Resignation Date",
            dataIndex: "resignationDate",
            render: function (val) { return fmtYMD(val); },
            sorter: function (a, b) {
                return new Date(a.resignationDate).getTime() -
                    new Date(b.resignationDate).getTime();
            }
        },
        {
            title: "Status",
            dataIndex: "resignationStatus",
            render: function (status) {
                var statusMap = {
                    pending: { className: "badge badge-soft-warning", text: "Pending" },
                    approved: { className: "badge badge-soft-success", text: "Approved" },
                    rejected: { className: "badge badge-soft-danger", text: "Rejected" },
                    withdrawn: { className: "badge badge-soft-secondary", text: "Withdrawn" }
                };
                var statusInfo = statusMap[status === null || status === void 0 ? void 0 : status.toLowerCase()] || { className: "badge badge-soft-secondary", text: status || "Unknown" };
                return react_1["default"].createElement("span", { className: statusInfo.className }, statusInfo.text);
            },
            filters: [
                { text: "Pending", value: "pending" },
                { text: "Approved", value: "approved" },
                { text: "Rejected", value: "rejected" },
            ],
            onFilter: function (val, rec) { var _a; return ((_a = rec.resignationStatus) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === val; }
        },
        {
            title: "",
            dataIndex: "actions",
            render: function (_, record) {
                var _a;
                var isPending = ((_a = record.resignationStatus) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "pending" || !record.resignationStatus;
                return (react_1["default"].createElement("div", { className: "action-icon d-inline-flex" },
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", onClick: function (e) {
                            e.preventDefault();
                            handleViewClick(record);
                        }, "data-bs-toggle": "modal", "data-bs-target": "#view_resignation", title: "View Details" },
                        react_1["default"].createElement("i", { className: "ti ti-eye" })),
                    isPending && (react_1["default"].createElement(react_1["default"].Fragment, null,
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2 text-success", onClick: function (e) {
                                e.preventDefault();
                                handleApproveResignation(record.resignationId);
                            }, title: "Approve Resignation" },
                            react_1["default"].createElement("i", { className: "ti ti-check" })),
                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2 text-danger", onClick: function (e) {
                                e.preventDefault();
                                handleRejectResignation(record.resignationId);
                            }, title: "Reject Resignation" },
                            react_1["default"].createElement("i", { className: "ti ti-x" })))),
                    react_1["default"].createElement("a", { href: "#", className: "me-2", "data-bs-toggle": "modal", "data-bs-target": "#edit_resignation", onClick: function (e) {
                            openEditModal(record);
                        }, title: "Edit" },
                        react_1["default"].createElement("i", { className: "ti ti-edit" })),
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "#", onClick: function (e) {
                            e.preventDefault();
                            handleDeleteClick(record.resignationId);
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
                        react_1["default"].createElement("h2", { className: "mb-1" }, "Resignation"),
                        react_1["default"].createElement("nav", null,
                            react_1["default"].createElement("ol", { className: "breadcrumb mb-0" },
                                react_1["default"].createElement("li", { className: "breadcrumb-item" },
                                    react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.adminDashboard },
                                        react_1["default"].createElement("i", { className: "ti ti-smart-home" }))),
                                react_1["default"].createElement("li", { className: "breadcrumb-item" }, "HR"),
                                react_1["default"].createElement("li", { className: "breadcrumb-item active", "aria-current": "page" }, "Resignation")))),
                    react_1["default"].createElement("div", { className: "d-flex my-xl-auto right-content align-items-center flex-wrap " },
                        react_1["default"].createElement("div", { className: "mb-2" },
                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-primary d-flex align-items-center", "data-bs-toggle": "modal", "data-bs-target": "#new_resignation", onClick: handleAddModalOpen },
                                react_1["default"].createElement("i", { className: "ti ti-circle-plus me-2" }),
                                "Add Resignation")),
                        react_1["default"].createElement("div", { className: "head-icons ms-2" },
                            react_1["default"].createElement(collapse_header_1["default"], null)))),
                react_1["default"].createElement("div", { className: "row" },
                    react_1["default"].createElement("div", { className: "col-sm-12" },
                        react_1["default"].createElement("div", { className: "card" },
                            react_1["default"].createElement("div", { className: "card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3" },
                                react_1["default"].createElement("h5", { className: "d-flex align-items-center" }, "Resignation List"),
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
                                react_1["default"].createElement(index_1["default"], { dataSource: rows, columns: columns, Selection: true })))))),
            react_1["default"].createElement("div", { className: "footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3" },
                react_1["default"].createElement("p", { className: "mb-0" }, "2014 - 2025 \u00A9 SmartHR."),
                react_1["default"].createElement("p", null,
                    "Designed & Developed By",
                    " ",
                    react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "text-primary" }, "Dreams")))),
        react_1["default"].createElement("div", { className: "modal fade", id: "new_resignation" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-md" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Add Resignation"),
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
                                        react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: departmentOptions, value: departmentOptions.find(function (opt) { return opt.value === addForm.departmentId; }) || null, onChange: handleAddDepartmentChange }),
                                        addErrors.departmentId && react_1["default"].createElement("div", { className: "text-danger" }, addErrors.departmentId))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Resigning Employee ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: employeeOptions, value: employeeOptions.find(function (opt) { return opt.value === addForm.employeeId; }) || null, onChange: handleAddEmployeeChange }),
                                        addErrors.employeeId && react_1["default"].createElement("div", { className: "text-danger" }, addErrors.employeeId))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("div", { className: "d-flex justify-content-between align-items-center mb-1" },
                                            react_1["default"].createElement("label", { className: "form-label mb-0" },
                                                "Reason ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("small", { className: "text-muted" },
                                                addForm.reason.length,
                                                "/500 characters")),
                                        react_1["default"].createElement("textarea", { className: "form-control", rows: 3, maxLength: 500, value: addForm.reason, onChange: function (e) {
                                                setAddForm(__assign(__assign({}, addForm), { reason: e.target.value }));
                                                // Clear error when user starts typing
                                                if (e.target.value.trim() && addErrors.reason) {
                                                    setAddErrors(function (prev) { return (__assign(__assign({}, prev), { reason: "" })); });
                                                }
                                            }, placeholder: "Enter reason for resignation (max 500 characters)" }),
                                        addErrors.reason && react_1["default"].createElement("div", { className: "text-danger" }, addErrors.reason))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Notice Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: {
                                                    format: "DD-MM-YYYY",
                                                    type: "mask"
                                                }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: addForm.noticeDate ? dayjs_1["default"](addForm.noticeDate, "DD-MM-YYYY") : null, onChange: function (_, dateString) {
                                                    setAddForm(__assign(__assign({}, addForm), { noticeDate: dateString }));
                                                    // Clear error when date is selected
                                                    if (dateString && addErrors.noticeDate) {
                                                        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { noticeDate: "" })); });
                                                    }
                                                } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                        addErrors.noticeDate && react_1["default"].createElement("div", { className: "text-danger" }, addErrors.noticeDate))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Resignation Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: {
                                                    format: "DD-MM-YYYY",
                                                    type: "mask"
                                                }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: addForm.resignationDate ? dayjs_1["default"](addForm.resignationDate, "DD-MM-YYYY") : null, onChange: function (_, dateString) {
                                                    setAddForm(__assign(__assign({}, addForm), { resignationDate: dateString }));
                                                    // Clear error when date is selected
                                                    if (dateString && addErrors.resignationDate) {
                                                        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { resignationDate: "" })); });
                                                    }
                                                } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                        addErrors.resignationDate && react_1["default"].createElement("div", { className: "text-danger" }, addErrors.resignationDate))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", disabled: isSubmitting }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", onClick: handleAddSave, disabled: isSubmitting }, isSubmitting ? (react_1["default"].createElement(react_1["default"].Fragment, null,
                                react_1["default"].createElement("span", { className: "spinner-border spinner-border-sm me-2", role: "status", "aria-hidden": "true" }),
                                "Adding...")) : ("Add Resignation"))))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_resignation" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-md" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Edit Resignation"),
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
                                        react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: departmentOptions, value: departmentOptions.find(function (opt) { return opt.value === editForm.departmentId; }) || null, onChange: handleEditDepartmentChange, disabled: true }),
                                        editErrors.departmentId && react_1["default"].createElement("div", { className: "text-danger" }, editErrors.departmentId))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Resigning Employee ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: employeeOptions, value: employeeOptions.find(function (opt) { return opt.value === editForm.employeeId; }) || null, onChange: handleEditEmployeeChange, disabled: true }),
                                        editErrors.employeeId && react_1["default"].createElement("div", { className: "text-danger" }, editErrors.employeeId))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("div", { className: "d-flex justify-content-between align-items-center mb-1" },
                                            react_1["default"].createElement("label", { className: "form-label mb-0" },
                                                "Reason ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("small", { className: "text-muted" },
                                                editForm.reason.length,
                                                "/500 characters")),
                                        react_1["default"].createElement("textarea", { className: "form-control", rows: 3, maxLength: 500, value: editForm.reason, onChange: function (e) {
                                                setEditForm(__assign(__assign({}, editForm), { reason: e.target.value }));
                                                // Clear error when user starts typing
                                                if (e.target.value.trim() && editErrors.reason) {
                                                    setEditErrors(function (prev) { return (__assign(__assign({}, prev), { reason: "" })); });
                                                }
                                            }, placeholder: "Enter reason for resignation (max 500 characters)" }),
                                        editErrors.reason && react_1["default"].createElement("div", { className: "text-danger" }, editErrors.reason))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Notice Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: { format: "DD-MM-YYYY", type: "mask" }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: editForm.noticeDate
                                                    ? dayjs_1["default"](editForm.noticeDate, "DD-MM-YYYY")
                                                    : null, onChange: function (_, dateString) {
                                                    setEditForm(__assign(__assign({}, editForm), { noticeDate: dateString }));
                                                    // Clear error when date is selected
                                                    if (dateString && editErrors.noticeDate) {
                                                        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { noticeDate: "" })); });
                                                    }
                                                } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                        editErrors.noticeDate && react_1["default"].createElement("div", { className: "text-danger" }, editErrors.noticeDate))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Resignation Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: { format: "DD-MM-YYYY", type: "mask" }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: editForm.resignationDate
                                                    ? dayjs_1["default"](editForm.resignationDate, "DD-MM-YYYY")
                                                    : null, onChange: function (_, dateString) {
                                                    setEditForm(__assign(__assign({}, editForm), { resignationDate: dateString }));
                                                    // Clear error when date is selected
                                                    if (dateString && editErrors.resignationDate) {
                                                        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { resignationDate: "" })); });
                                                    }
                                                } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                        editErrors.resignationDate && react_1["default"].createElement("div", { className: "text-danger" }, editErrors.resignationDate))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", disabled: isSubmitting }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", onClick: handleEditSave, disabled: isSubmitting }, isSubmitting ? (react_1["default"].createElement(react_1["default"].Fragment, null,
                                react_1["default"].createElement("span", { className: "spinner-border spinner-border-sm me-2", role: "status", "aria-hidden": "true" }),
                                "Saving...")) : ("Save Changes"))))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "delete_modal" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-body text-center" },
                        react_1["default"].createElement("span", { className: "avatar avatar-xl bg-transparent-danger text-danger mb-3" },
                            react_1["default"].createElement("i", { className: "ti ti-trash-x fs-36" })),
                        react_1["default"].createElement("h4", { className: "mb-1" }, "Confirm Delete"),
                        react_1["default"].createElement("p", { className: "mb-3" }, "Are you sure you want to delete this resignation? This action cannot be undone."),
                        react_1["default"].createElement("div", { className: "d-flex justify-content-center" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-light me-3", "data-bs-dismiss": "modal" }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", onClick: confirmDelete, className: "btn btn-danger" }, "Yes, Delete")))))),
        react_1["default"].createElement(ResignationDetailsModal_1["default"], { resignation: viewingResignation, modalId: "view_resignation" })));
};
exports["default"] = Resignation;
