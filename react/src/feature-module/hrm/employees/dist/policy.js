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
var index_1 = require("../../../core/common/dataTable/index");
var datePicker_1 = require("../../../core/common/datePicker");
var collapse_header_1 = require("../../../core/common/collapse-header/collapse-header");
var SocketContext_1 = require("../../../SocketContext");
var luxon_1 = require("luxon");
var footer_1 = require("../../../core/common/footer");
var DepartmentDesignationSelector_1 = require("../../../components/DepartmentDesignationSelector");
var modalUtils_1 = require("../../../utils/modalUtils");
var staticOptions = [
    { value: "Select", label: "Select" },
];
var Policy = function () {
    var _a, _b;
    var _c = react_1.useState([]), policies = _c[0], setPolicies = _c[1];
    var _d = react_1.useState([]), sortedPolicies = _d[0], setSortedPolicies = _d[1];
    var _e = react_1.useState(""), sortOrder = _e[0], setSortOrder = _e[1];
    var _f = react_1.useState(""), policyName = _f[0], setPolicyName = _f[1];
    var _g = react_1.useState(""), effectiveDate = _g[0], setEffectiveDate = _g[1];
    var _h = react_1.useState(""), description = _h[0], setDescription = _h[1];
    var _j = react_1.useState(null), editingPolicy = _j[0], setEditingPolicy = _j[1];
    var _k = react_1.useState({ department: "", startDate: "", endDate: "" }), filters = _k[0], setFilters = _k[1];
    var _l = react_1.useState(null), policyToDelete = _l[0], setPolicyToDelete = _l[1];
    var _m = react_1.useState([]), departments = _m[0], setDepartments = _m[1];
    var _o = react_1.useState([]), designations = _o[0], setDesignations = _o[1];
    var _p = react_1.useState(false), loading = _p[0], setLoading = _p[1];
    var _q = react_1.useState(null), error = _q[0], setError = _q[1];
    var _r = react_1.useState(null), responseData = _r[0], setResponseData = _r[1];
    var _s = react_1.useState(staticOptions[0].value), selectedDepartment = _s[0], setSelectedDepartment = _s[1];
    var _t = react_1.useState(null), policyError = _t[0], setPolicyError = _t[1];
    var _u = react_1.useState(null), departmentError = _u[0], setDepartmentError = _u[1];
    var _v = react_1.useState(false), policyLoading = _v[0], setPolicyLoading = _v[1];
    var _w = react_1.useState(false), departmentLoading = _w[0], setDepartmentLoading = _w[1];
    var _x = react_1.useState(""), selectedFilterDepartment = _x[0], setSelectedFilterDepartment = _x[1];
    // NEW: State for Apply To mappings
    var _y = react_1.useState([]), applyToMappings = _y[0], setApplyToMappings = _y[1];
    var _z = react_1.useState(false), applyToAll = _z[0], setApplyToAll = _z[1];
    // State for viewing policy details
    var _0 = react_1.useState(null), viewingPolicy = _0[0], setViewingPolicy = _0[1];
    // Validation error states for Add Policy modal
    var _1 = react_1.useState(null), policyNameError = _1[0], setPolicyNameError = _1[1];
    var _2 = react_1.useState(null), effectiveDateError = _2[0], setEffectiveDateError = _2[1];
    var _3 = react_1.useState(null), applyToError = _3[0], setApplyToError = _3[1];
    var _4 = react_1.useState(null), descriptionError = _4[0], setDescriptionError = _4[1];
    // Validation error states for Edit Policy modal
    var _5 = react_1.useState(null), editPolicyNameError = _5[0], setEditPolicyNameError = _5[1];
    var _6 = react_1.useState(null), editEffectiveDateError = _6[0], setEditEffectiveDateError = _6[1];
    var _7 = react_1.useState(null), editApplyToError = _7[0], setEditApplyToError = _7[1];
    var _8 = react_1.useState(null), editDescriptionError = _8[0], setEditDescriptionError = _8[1];
    var socket = SocketContext_1.useSocket();
    react_1.useEffect(function () {
        if (!socket)
            return;
        var isMounted = true;
        setLoading(true);
        var timeoutId = setTimeout(function () {
            if (loading && isMounted) {
                console.warn("Policies loading timeout - showing fallback");
                setError("Policies loading timed out. Please refresh the page.");
                setLoading(false);
            }
        }, 30000);
        setPolicyLoading(true);
        socket.emit("hr/policy/get");
        setDepartmentLoading(true);
        socket.emit("hr/departments/get");
        // NEW: Fetch designations using the same pattern as designations.tsx
        socket.emit("hrm/designations/get");
        var handleAddPolicyResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                setResponseData(response.data);
                setError(null);
                setLoading(false);
                if (socket) {
                    socket.emit("hr/policy/get");
                }
                // Close modal after successful backend response
                modalUtils_1.hideModal('add_policy');
                // Reset form after successful submission
                resetAddPolicyForm();
            }
            else {
                parseBackendError(response.error || "Failed to add policy");
                setLoading(false);
            }
        };
        var handleGetPolicyResponse = function (response) {
            setPolicyLoading(false);
            if (!isMounted)
                return;
            if (response.done) {
                setPolicies(response.data);
                setSortedPolicies(response.data);
                setPolicyError(null);
                setLoading(false);
            }
            else {
                setPolicyError(response.error || "Failed to fetch policies");
                setLoading(false);
            }
        };
        var handleUpdatePolicyResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                setResponseData(response.data);
                setError(null);
                setLoading(false);
                if (socket) {
                    socket.emit("hr/policy/get");
                }
                // Close modal after successful backend response
                modalUtils_1.hideModal('edit_policy');
                // Reset validation errors after successful submission
                resetEditPolicyForm();
            }
            else {
                parseBackendError(response.error || "Failed to update policy", true);
                setLoading(false);
            }
        };
        var handleDeletePolicyResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                setResponseData(response.data);
                setError(null);
                setLoading(false);
                if (socket) {
                    socket.emit("hr/policy/get");
                }
            }
            else {
                setError(response.error || "Failed to add policy");
                setLoading(false);
            }
        };
        var handleDepartmentsResponse = function (response) {
            setDepartmentLoading(false);
            if (!isMounted)
                return;
            if (response.done) {
                setDepartments(response.data);
                setDepartmentError(null);
                setLoading(false);
            }
            else {
                setDepartmentError(response.error || "Failed to fetch departments");
                setLoading(false);
            }
        };
        var handleDesignationsResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                setDesignations(response.data);
                setLoading(false);
            }
            else {
                setError(response.error || "Failed to fetch designations");
                setLoading(false);
            }
        };
        socket.on("hr/policy/add-response", handleAddPolicyResponse);
        socket.on("hr/policy/get-response", handleGetPolicyResponse);
        socket.on("hr/policy/update-response", handleUpdatePolicyResponse);
        socket.on("hr/policy/delete-response", handleDeletePolicyResponse);
        socket.on("hr/departments/get-response", handleDepartmentsResponse);
        socket.on("hrm/designations/get-response", handleDesignationsResponse);
        return function () {
            isMounted = false;
            clearTimeout(timeoutId);
            socket.off("hr/policy/add-response", handleAddPolicyResponse);
            socket.off("hr/policy/get-response", handleGetPolicyResponse);
            socket.off("hr/policy/update-response", handleUpdatePolicyResponse);
            socket.off("hr/policy/delete-response", handleDeletePolicyResponse);
            socket.off("hr/departments/get-response", handleDepartmentsResponse);
            socket.off("hrm/designations/get-response", handleDesignationsResponse);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);
    // constants
    if (error)
        console.error("Page error:", error);
    if (policyError)
        console.error("Policy error:", policyError);
    if (departmentError)
        console.error("Department error:", departmentError);
    var dynamicOptions = Array.isArray(departments)
        ? departments.map(function (dept) { return ({
            value: dept._id,
            label: dept.department
        }); })
        : [];
    var options = __spreadArrays(staticOptions, dynamicOptions);
    // Add this helper function to get department name by ID
    var getDepartmentName = function (departmentId) {
        var dept = departments.find(function (d) { return d._id === departmentId; });
        return dept ? dept.department : "Unknown";
    };
    var columns = [
        {
            title: "Name",
            dataIndex: "policyName",
            render: function (text, record) { return (react_1["default"].createElement("h6", { className: "fw-medium fs-14 text-dark", style: { cursor: 'pointer' }, onClick: function () { return setViewingPolicy(record); }, "data-bs-toggle": "modal", "data-bs-target": "#view_policy" }, text)); },
            sorter: function (a, b) { return a.Name.length - b.Name.length; }
        },
        {
            title: "Assign To",
            dataIndex: "assignTo",
            render: function (assignTo, record) {
                // Check if policy applies to all employees
                if (record.applyToAll) {
                    return (react_1["default"].createElement("h6", { className: "fw-normal fs-14 text-success" },
                        react_1["default"].createElement("i", { className: "ti ti-users me-1" }),
                        "All Employees"));
                }
                if (!assignTo || assignTo.length === 0) {
                    return react_1["default"].createElement("span", { className: "text-muted" }, "Not assigned");
                }
                var deptNames = assignTo.map(function (a) { return a.departmentName; }).join(", ");
                return (react_1["default"].createElement("h6", { className: "fw-normal fs-14 text-dark" }, deptNames.length > 50 ? deptNames.substring(0, 50) + "..." : deptNames));
            },
            sorter: function (a, b) {
                var _a, _b, _c, _d;
                // Sort "All Employees" first
                if (a.applyToAll && !b.applyToAll)
                    return -1;
                if (!a.applyToAll && b.applyToAll)
                    return 1;
                var aName = ((_b = (_a = a.assignTo) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.departmentName) || "";
                var bName = ((_d = (_c = b.assignTo) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.departmentName) || "";
                return aName.localeCompare(bName);
            }
        },
        {
            title: "Description",
            dataIndex: "policyDescription",
            sorter: function (a, b) { return a.Description.length - b.Description.length; },
            render: function (text, record) { return (react_1["default"].createElement("h6", { className: "fw-normal fs-14 text-muted mb-0", style: {
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: text && text.length > 50 ? 'help' : 'default'
                }, title: text || '' }, text || 'No description')); }
        },
        {
            title: "In-effect Date",
            dataIndex: "effectiveDate",
            sorter: function (a, b) { return new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(); },
            render: function (date) { return luxon_1.DateTime.fromISO(date).toFormat("dd-MM-yyyy"); }
        },
        {
            title: "",
            dataIndex: "actions",
            render: function (_test, policy) { return (react_1["default"].createElement("div", { className: "action-icon d-inline-flex" },
                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#view_policy", onClick: function () { return setViewingPolicy(policy); } },
                    react_1["default"].createElement("i", { className: "ti ti-eye" })),
                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_policy", onClick: function () {
                        setEditingPolicy(policy);
                        // Set applyToAll state from policy
                        setApplyToAll(policy.applyToAll || false);
                        // Initialize mappings from policy data
                        if (policy.assignTo && policy.assignTo.length > 0) {
                            setApplyToMappings(policy.assignTo);
                        }
                        else {
                            // Fallback for backward compatibility - if no assignTo, create empty mappings
                            setApplyToMappings([]);
                        }
                    } },
                    react_1["default"].createElement("i", { className: "ti ti-edit" })),
                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#delete_modal", onClick: function () { setPolicyToDelete(policy); } },
                    react_1["default"].createElement("i", { className: "ti ti-trash" })))); }
        }
    ];
    var policiesWithKey = policies.map(function (policy, index) { return (__assign(__assign({}, policy), { key: policy._id || index.toString() })); });
    // helper functions
    // Helper function to parse backend errors and map them to field-specific errors
    var parseBackendError = function (errorMessage, isEditMode) {
        if (isEditMode === void 0) { isEditMode = false; }
        // Clear all errors first
        if (isEditMode) {
            setEditPolicyNameError(null);
            setEditEffectiveDateError(null);
            setEditApplyToError(null);
            setEditDescriptionError(null);
        }
        else {
            setPolicyNameError(null);
            setEffectiveDateError(null);
            setApplyToError(null);
            setDescriptionError(null);
        }
        // Convert error message to lowercase for easier matching
        var error = errorMessage.toLowerCase();
        // Map backend errors to specific fields
        if (error.includes("policy name") || error.includes("policyname")) {
            if (isEditMode) {
                setEditPolicyNameError(errorMessage);
            }
            else {
                setPolicyNameError(errorMessage);
            }
        }
        else if (error.includes("effective date") || error.includes("effectivedate") ||
            error.includes("in-effect date") || error.includes("date") ||
            error.includes("future")) {
            if (isEditMode) {
                setEditEffectiveDateError(errorMessage);
            }
            else {
                setEffectiveDateError(errorMessage);
            }
        }
        else if (error.includes("department") || error.includes("designation") ||
            error.includes("apply") || error.includes("assign")) {
            if (isEditMode) {
                setEditApplyToError(errorMessage);
            }
            else {
                setApplyToError(errorMessage);
            }
        }
        else if (error.includes("description") || error.includes("policydescription")) {
            if (isEditMode) {
                setEditDescriptionError(errorMessage);
            }
            else {
                setDescriptionError(errorMessage);
            }
        }
        else {
            // If we can't map to a specific field, show as general error
            setError(errorMessage);
        }
    };
    // Helper function to validate future date
    var isFutureDate = function (dateString) {
        if (!dateString)
            return false;
        var selectedDate = new Date(dateString);
        var today = new Date();
        // Set time to 00:00:00 for accurate date comparison
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    };
    // Reset Add Policy form fields and errors
    var resetAddPolicyForm = function () {
        setPolicyName("");
        setEffectiveDate("");
        setDescription("");
        setSelectedDepartment(staticOptions[0].value);
        setApplyToMappings([]);
        setApplyToAll(false);
        setError(null);
        setPolicyNameError(null);
        setEffectiveDateError(null);
        setApplyToError(null);
        setDescriptionError(null);
    };
    // Reset Edit Policy validation errors
    var resetEditPolicyForm = function () {
        setError(null);
        setEditPolicyNameError(null);
        setEditEffectiveDateError(null);
        setEditApplyToError(null);
        setEditDescriptionError(null);
    };
    var handleSubmit = function () {
        try {
            // Clear all errors at the start
            setPolicyNameError(null);
            setEffectiveDateError(null);
            setApplyToError(null);
            setDescriptionError(null);
            setError(null);
            // Validate all fields
            var hasError = false;
            if (!policyName.trim()) {
                setPolicyNameError("Policy Name is required");
                hasError = true;
            }
            if (!effectiveDate) {
                setEffectiveDateError("Effective Date is required");
                hasError = true;
            }
            else if (!isFutureDate(effectiveDate)) {
                setEffectiveDateError("Effective Date must be in the future");
                hasError = true;
            }
            if (!applyToAll && (!applyToMappings || applyToMappings.length === 0)) {
                setApplyToError("Please select at least one department or enable 'All Employees'");
                hasError = true;
            }
            if (!description || !description.trim()) {
                setDescriptionError("Description is required");
                hasError = true;
            }
            // If any validation failed, stop here
            if (hasError) {
                return;
            }
            setLoading(true);
            var payload = {
                policyName: policyName,
                applyToAll: applyToAll,
                assignTo: applyToAll ? [] : applyToMappings,
                policyDescription: description,
                effectiveDate: effectiveDate
            };
            if (socket) {
                socket.emit("hr/policy/add", payload);
                // Note: Modal will only close after successful backend response
                // The handleAddPolicyResponse will close the modal if response.done is true
            }
            else {
                setError("Socket connection is not available.");
                setLoading(false);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
            else {
                setError("An unexpected error occurred");
            }
            setLoading(false);
        }
    };
    console.log("selected department", selectedDepartment);
    var applyFilters = function (updatedFields) {
        try {
            setFilters(function (prevFilters) {
                var newFilters = __assign(__assign({}, prevFilters), updatedFields);
                if (socket) {
                    socket.emit("hr/policy/get", __assign({}, newFilters));
                }
                return newFilters;
            });
        }
        catch (error) {
            console.error("Error applying filters:", error);
        }
    };
    var onSelectDepartment = function (dept) {
        if (dept === "Select") {
            // Load default data - clear department filter
            setSelectedFilterDepartment("");
            applyFilters({ department: "" });
        }
        else {
            // Load data for selected department
            setSelectedFilterDepartment(dept);
            applyFilters({ department: dept });
        }
    };
    var handleDateRangeFilter = function (ranges) {
        if (ranges === void 0) { ranges = { start: "", end: "" }; }
        try {
            if (ranges.start && ranges.end) {
                ;
                applyFilters({ startDate: ranges.start, endDate: ranges.end });
            }
            else {
                applyFilters({ startDate: "", endDate: "" });
            }
        }
        catch (error) {
            console.error("Error handling time range selection:", error);
        }
    };
    var handleSort = function (order) {
        setSortOrder(order);
        if (!order) {
            setSortedPolicies(policies);
            return;
        }
        var sortedData = __spreadArrays(policies).sort(function (a, b) {
            var nameA = a.policyName.toLowerCase();
            var nameB = b.policyName.toLowerCase();
            if (order === "ascending") {
                return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            }
            if (order === "descending") {
                return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
            }
            return 0;
        });
        setSortedPolicies(sortedData); // may not need this later
        setPolicies(sortedData);
    };
    var handleUpdateSubmit = function (editingPolicy) {
        try {
            // Clear all errors at the start
            setEditPolicyNameError(null);
            setEditEffectiveDateError(null);
            setEditApplyToError(null);
            setEditDescriptionError(null);
            setError(null);
            var _id = editingPolicy._id, policyName_1 = editingPolicy.policyName, effectiveDate_1 = editingPolicy.effectiveDate, policyDescription = editingPolicy.policyDescription;
            if (!_id) {
                setError("Id not found");
                return;
            }
            // Validate all fields
            var hasError = false;
            if (!policyName_1 || !policyName_1.trim()) {
                setEditPolicyNameError("Policy Name is required");
                hasError = true;
            }
            if (!effectiveDate_1) {
                setEditEffectiveDateError("Effective Date is required");
                hasError = true;
            }
            else if (!isFutureDate(effectiveDate_1)) {
                setEditEffectiveDateError("Effective Date must be in the future");
                hasError = true;
            }
            if (!applyToAll && (!applyToMappings || applyToMappings.length === 0)) {
                setEditApplyToError("Please select at least one department or enable 'All Employees'");
                hasError = true;
            }
            if (!policyDescription || !policyDescription.trim()) {
                setEditDescriptionError("Description is required");
                hasError = true;
            }
            // If any validation failed, stop here
            if (hasError) {
                return;
            }
            setLoading(true);
            var payload = {
                _id: _id,
                policyName: policyName_1.trim(),
                policyDescription: policyDescription.trim(),
                applyToAll: applyToAll,
                assignTo: applyToAll ? [] : applyToMappings,
                effectiveDate: effectiveDate_1
            };
            if (socket) {
                socket.emit("hr/policy/update", payload);
                // Note: Modal will only close after successful backend response
                // The handleUpdatePolicyResponse will close the modal if response.done is true
            }
            else {
                setError("Socket connection is not available.");
                setLoading(false);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
            else {
                setError("An unexpected error occurred");
            }
            setLoading(false);
        }
    };
    var deletePolicy = function (policyId) {
        try {
            setLoading(true);
            setError(null);
            if (!socket) {
                setError("Socket connection is not available");
                setLoading(false);
                return;
            }
            if (!policyId) {
                setError("Policy ID is required");
                setLoading(false);
                return;
            }
            socket.emit("hr/policy/delete", { _id: policyId });
        }
        catch (error) {
            console.error("Delete error:", error);
            setError("Failed to initiate policy deletion");
            setLoading(false);
        }
    };
    if (policyLoading || departmentLoading) {
        return (react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "d-flex justify-content-center align-items-center", style: { height: "400px" } },
                    react_1["default"].createElement("div", { className: "spinner-border text-primary", role: "status" },
                        react_1["default"].createElement("span", { className: "visually-hidden" }, "Loading..."))))));
    }
    if (policyError || departmentError) {
        return (react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "alert alert-danger", role: "alert" },
                    react_1["default"].createElement("h4", { className: "alert-heading" }, "Error!"),
                    react_1["default"].createElement("p", null, "Failed to fetch policies")))));
    }
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3" },
                    react_1["default"].createElement("div", { className: "my-auto mb-2" },
                        react_1["default"].createElement("h2", { className: "mb-1" }, "Policies"),
                        react_1["default"].createElement("nav", null,
                            react_1["default"].createElement("ol", { className: "breadcrumb mb-0" },
                                react_1["default"].createElement("li", { className: "breadcrumb-item" },
                                    react_1["default"].createElement(react_router_dom_1.Link, { to: "index.html" },
                                        react_1["default"].createElement("i", { className: "ti ti-smart-home" }))),
                                react_1["default"].createElement("li", { className: "breadcrumb-item" }, "HR"),
                                react_1["default"].createElement("li", { className: "breadcrumb-item active", "aria-current": "page" }, "Policies")))),
                    react_1["default"].createElement("div", { className: "d-flex my-xl-auto right-content align-items-center flex-wrap " },
                        react_1["default"].createElement("div", { className: "me-2 mb-2" },
                            react_1["default"].createElement("div", { className: "dropdown" },
                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-toggle btn btn-white d-inline-flex align-items-center", "data-bs-toggle": "dropdown" },
                                    react_1["default"].createElement("i", { className: "ti ti-file-export me-1" }),
                                    "Export"),
                                react_1["default"].createElement("ul", { className: "dropdown-menu  dropdown-menu-end p-3" },
                                    react_1["default"].createElement("li", null,
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-item rounded-1" },
                                            react_1["default"].createElement("i", { className: "ti ti-file-type-pdf me-1" }),
                                            "Export as PDF")),
                                    react_1["default"].createElement("li", null,
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-item rounded-1" },
                                            react_1["default"].createElement("i", { className: "ti ti-file-type-xls me-1" }),
                                            "Export as Excel",
                                            " "))))),
                        react_1["default"].createElement("div", { className: "mb-2" },
                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#add_policy", className: "btn btn-primary d-flex align-items-center", onClick: function () {
                                    setPolicyName("");
                                    setEffectiveDate("");
                                    setDescription("");
                                    setSelectedDepartment(staticOptions[0].value);
                                    setApplyToMappings([]);
                                    setApplyToAll(false);
                                    setError(null);
                                } },
                                react_1["default"].createElement("i", { className: "ti ti-circle-plus me-2" }),
                                "Add Policy")),
                        react_1["default"].createElement("div", { className: "head-icons ms-2" },
                            react_1["default"].createElement(collapse_header_1["default"], null)))),
                react_1["default"].createElement("div", { className: "card" },
                    react_1["default"].createElement("div", { className: "card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3" },
                        react_1["default"].createElement("h5", null, "Policies List"),
                        react_1["default"].createElement("div", { className: "d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3" },
                            react_1["default"].createElement("div", { className: "me-3" },
                                react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                    react_1["default"].createElement(datePicker_1["default"], { onChange: handleDateRangeFilter }),
                                    react_1["default"].createElement("span", { className: "input-icon-addon" },
                                        react_1["default"].createElement("i", { className: "ti ti-chevron-down" })))),
                            react_1["default"].createElement("div", { className: "dropdown me-3" },
                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-toggle btn btn-white d-inline-flex align-items-center", "data-bs-toggle": "dropdown" },
                                    "Department",
                                    selectedFilterDepartment && selectedFilterDepartment !== "Select"
                                        ? ": " + (((_a = options.find(function (opt) { return opt.value === selectedFilterDepartment; })) === null || _a === void 0 ? void 0 : _a.label) || "None")
                                        : ": None"),
                                react_1["default"].createElement("ul", { className: "dropdown-menu dropdown-menu-end p-3" }, departmentError ? (react_1["default"].createElement("li", null,
                                    react_1["default"].createElement("div", { className: "alert alert-danger mb-0 p-2", role: "alert" },
                                        react_1["default"].createElement("small", null, departmentError)))) : (options.map(function (dept) { return (react_1["default"].createElement("li", { key: dept.value },
                                    react_1["default"].createElement("button", { type: "button", className: "dropdown-item rounded-1", onClick: function () { return onSelectDepartment(dept.value); } }, dept.label))); })))),
                            react_1["default"].createElement("div", { className: "dropdown" },
                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-toggle btn btn-white d-inline-flex align-items-center", "data-bs-toggle": "dropdown" },
                                    "Sort By",
                                    sortOrder ? ": " + (sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)) : ": None"),
                                react_1["default"].createElement("ul", { className: "dropdown-menu dropdown-menu-end p-3" },
                                    react_1["default"].createElement("li", null,
                                        react_1["default"].createElement("button", { type: "button", className: "dropdown-item rounded-1", onClick: function () { return handleSort("ascending"); } }, "Ascending")),
                                    react_1["default"].createElement("li", null,
                                        react_1["default"].createElement("button", { type: "button", className: "dropdown-item rounded-1", onClick: function () { return handleSort("descending"); } }, "Descending")),
                                    react_1["default"].createElement("li", null,
                                        react_1["default"].createElement("button", { type: "button", className: "dropdown-item rounded-1", onClick: function () { return handleSort(""); } }, "None")))))),
                    react_1["default"].createElement("div", { className: "card-body p-0" },
                        react_1["default"].createElement(index_1["default"], { dataSource: policiesWithKey, columns: columns, Selection: true })))),
            react_1["default"].createElement(footer_1["default"], null)),
        react_1["default"].createElement("div", { className: "modal fade", id: "add_policy" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Add Policy"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: function () {
                                setPolicyName("");
                                setEffectiveDate("");
                                setDescription("");
                                setSelectedDepartment(staticOptions[0].value);
                                setApplyToMappings([]);
                                setApplyToAll(false);
                                setError(null);
                            } },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", null,
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Policy Name ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control " + (policyNameError ? 'is-invalid' : ''), value: policyName, onChange: function (e) {
                                                setPolicyName(e.target.value);
                                                // Clear error when user starts typing
                                                if (policyNameError) {
                                                    setPolicyNameError(null);
                                                }
                                            } }),
                                        policyNameError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block" }, policyNameError)))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "In-effect Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("input", { type: "date", className: "form-control " + (effectiveDateError ? 'is-invalid' : ''), value: effectiveDate, onChange: function (e) {
                                                setEffectiveDate(e.target.value);
                                                // Clear error when user selects a date
                                                if (effectiveDateError) {
                                                    setEffectiveDateError(null);
                                                }
                                            } }),
                                        effectiveDateError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block" }, effectiveDateError)))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement(DepartmentDesignationSelector_1["default"], { departments: departments, designations: designations, selectedMappings: applyToMappings, applyToAll: applyToAll, onChange: function (mappings, isApplyToAll) {
                                            setApplyToMappings(mappings);
                                            setApplyToAll(isApplyToAll);
                                            // Clear error when user changes selection
                                            if (applyToError) {
                                                setApplyToError(null);
                                            }
                                        }, label: "Apply To", required: true, helpText: "Use 'All Employees' toggle to apply to everyone (includes future employees), or select specific departments and designations" }),
                                    applyToError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block mt-2" }, applyToError))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Policy Description ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("div", { className: "policy-description-container" },
                                            react_1["default"].createElement("textarea", { className: "form-control " + (descriptionError ? 'is-invalid' : ''), rows: 4, placeholder: "Enter policy details and description here...", value: description, onChange: function (e) {
                                                    setDescription(e.target.value);
                                                    // Clear error when user starts typing
                                                    if (descriptionError) {
                                                        setDescriptionError(null);
                                                    }
                                                }, maxLength: 5000 }),
                                            descriptionError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block" }, descriptionError)),
                                            react_1["default"].createElement("div", { className: "d-flex justify-content-between mt-2" },
                                                react_1["default"].createElement("small", { className: "text-muted" },
                                                    description.length,
                                                    "/5000 characters"))))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetAddPolicyForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", disabled: loading, onClick: handleSubmit }, "Add Policy")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_policy" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Edit Policy"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", null,
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Policy Name ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control " + (editPolicyNameError ? 'is-invalid' : ''), value: (editingPolicy === null || editingPolicy === void 0 ? void 0 : editingPolicy.policyName) || "", onChange: function (e) {
                                                setEditingPolicy(function (prev) {
                                                    return prev ? __assign(__assign({}, prev), { policyName: e.target.value }) : prev;
                                                });
                                                // Clear error when user starts typing
                                                if (editPolicyNameError) {
                                                    setEditPolicyNameError(null);
                                                }
                                            } }),
                                        editPolicyNameError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block" }, editPolicyNameError)))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "In-effect Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("input", { type: "date", className: "form-control " + (editEffectiveDateError ? 'is-invalid' : ''), value: ((_b = editingPolicy === null || editingPolicy === void 0 ? void 0 : editingPolicy.effectiveDate) === null || _b === void 0 ? void 0 : _b.slice(0, 10)) || "", onChange: function (e) {
                                                setEditingPolicy(function (prev) {
                                                    return prev ? __assign(__assign({}, prev), { effectiveDate: e.target.value }) : prev;
                                                });
                                                // Clear error when user selects a date
                                                if (editEffectiveDateError) {
                                                    setEditEffectiveDateError(null);
                                                }
                                            } }),
                                        editEffectiveDateError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block" }, editEffectiveDateError)))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement(DepartmentDesignationSelector_1["default"], { departments: departments, designations: designations, selectedMappings: applyToMappings, applyToAll: applyToAll, onChange: function (mappings, isApplyToAll) {
                                            setApplyToMappings(mappings);
                                            setApplyToAll(isApplyToAll);
                                            // Clear error when user changes selection
                                            if (editApplyToError) {
                                                setEditApplyToError(null);
                                            }
                                        }, label: "Apply To", required: true, helpText: "Use 'All Employees' toggle to apply to everyone (includes future employees), or select specific departments and designations" }),
                                    editApplyToError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block mt-2" }, editApplyToError))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Policy Description ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                        react_1["default"].createElement("div", { className: "policy-description-container" },
                                            react_1["default"].createElement("textarea", { className: "form-control " + (editDescriptionError ? 'is-invalid' : ''), rows: 4, placeholder: "Enter policy details and description here...", value: (editingPolicy === null || editingPolicy === void 0 ? void 0 : editingPolicy.policyDescription) || "", onChange: function (e) {
                                                    setEditingPolicy(function (prev) {
                                                        return prev ? __assign(__assign({}, prev), { policyDescription: e.target.value }) : prev;
                                                    });
                                                    // Clear error when user starts typing
                                                    if (editDescriptionError) {
                                                        setEditDescriptionError(null);
                                                    }
                                                }, maxLength: 5000 }),
                                            editDescriptionError && (react_1["default"].createElement("div", { className: "invalid-feedback d-block" }, editDescriptionError))))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetEditPolicyForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", onClick: function () {
                                    if (editingPolicy) {
                                        handleUpdateSubmit(editingPolicy);
                                    }
                                }, disabled: !editingPolicy || loading }, loading ? 'Saving...' : 'Update Policy')))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "delete_modal" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-body text-center" },
                        react_1["default"].createElement("span", { className: "avatar avatar-xl bg-transparent-danger text-danger mb-3" },
                            react_1["default"].createElement("i", { className: "ti ti-trash-x fs-36" })),
                        react_1["default"].createElement("h4", { className: "mb-1" }, "Confirm Deletion"),
                        react_1["default"].createElement("p", { className: "mb-3" }, policyToDelete
                            ? "Are you sure you want to delete policy \"" + policyToDelete.policyName + "\"? This cannot be undone."
                            : "You want to delete all the marked items, this can't be undone once you delete."),
                        react_1["default"].createElement("div", { className: "d-flex justify-content-center" },
                            react_1["default"].createElement("button", { className: "btn btn-light me-3", "data-bs-dismiss": "modal", onClick: function () { return setPolicyToDelete(null); }, disabled: loading }, "Cancel"),
                            react_1["default"].createElement("button", { className: "btn btn-danger", "data-bs-dismiss": "modal", onClick: function () {
                                    if (policyToDelete) {
                                        deletePolicy(policyToDelete._id);
                                    }
                                    setPolicyToDelete(null);
                                }, disabled: loading }, loading ? 'Deleting...' : 'Yes, Delete')))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "view_policy" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Policy Details"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("div", { className: "modal-body" }, viewingPolicy && (react_1["default"].createElement("div", { className: "policy-details-container" },
                        react_1["default"].createElement("div", { className: "mb-4" },
                            react_1["default"].createElement("div", { className: "d-flex align-items-center mb-2" },
                                react_1["default"].createElement("i", { className: "ti ti-file-text text-primary me-2 fs-20" }),
                                react_1["default"].createElement("h5", { className: "mb-0 text-muted" }, "Policy Name")),
                            react_1["default"].createElement("div", { className: "ps-4" },
                                react_1["default"].createElement("p", { className: "fs-16 mb-0" }, viewingPolicy.policyName))),
                        react_1["default"].createElement("div", { className: "mb-4" },
                            react_1["default"].createElement("div", { className: "d-flex align-items-center mb-2" },
                                react_1["default"].createElement("i", { className: "ti ti-calendar text-primary me-2 fs-20" }),
                                react_1["default"].createElement("h5", { className: "mb-0 text-muted" }, "In-effect Date")),
                            react_1["default"].createElement("div", { className: "ps-4" },
                                react_1["default"].createElement("p", { className: "fs-16 mb-0" }, luxon_1.DateTime.fromISO(viewingPolicy.effectiveDate).toFormat("dd MMMM yyyy")))),
                        react_1["default"].createElement("div", { className: "mb-4" },
                            react_1["default"].createElement("div", { className: "d-flex align-items-center mb-3" },
                                react_1["default"].createElement("i", { className: "ti ti-users text-primary me-2 fs-20" }),
                                react_1["default"].createElement("h5", { className: "mb-0 text-muted" }, "Applicable To")),
                            react_1["default"].createElement("div", { className: "ps-4" }, viewingPolicy.applyToAll ? (react_1["default"].createElement("div", { className: "border rounded p-4 bg-success bg-opacity-10" },
                                react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                                    react_1["default"].createElement("span", { className: "avatar avatar-lg bg-success me-3" },
                                        react_1["default"].createElement("i", { className: "ti ti-users fs-24" })),
                                    react_1["default"].createElement("div", null,
                                        react_1["default"].createElement("h5", { className: "text-success mb-1" }, "All Employees"),
                                        react_1["default"].createElement("p", { className: "text-muted mb-0 small" },
                                            react_1["default"].createElement("i", { className: "ti ti-info-circle me-1" }),
                                            "This policy applies to all current and future employees, departments, and designations."))))) : viewingPolicy.assignTo && viewingPolicy.assignTo.length > 0 ? (react_1["default"].createElement("div", { className: "departments-list" }, viewingPolicy.assignTo.map(function (mapping, index) {
                                var deptDesignations = designations.filter(function (d) { return mapping.designationIds.includes(d._id); });
                                return (react_1["default"].createElement("div", { key: index, className: "mb-3 border rounded p-3 bg-light" },
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center mb-2" },
                                        react_1["default"].createElement("i", { className: "ti ti-building text-success me-2" }),
                                        react_1["default"].createElement("strong", { className: "text-dark" }, mapping.departmentName),
                                        react_1["default"].createElement("span", { className: "badge bg-primary ms-2" },
                                            mapping.designationIds.length,
                                            " designation",
                                            mapping.designationIds.length !== 1 ? 's' : '')),
                                    deptDesignations.length > 0 && (react_1["default"].createElement("div", { className: "ms-4 mt-2" },
                                        react_1["default"].createElement("div", { className: "d-flex flex-wrap gap-2" }, deptDesignations.map(function (designation) { return (react_1["default"].createElement("span", { key: designation._id, className: "badge bg-secondary" },
                                            react_1["default"].createElement("i", { className: "ti ti-user-check me-1" }),
                                            designation.designation)); }))))));
                            }))) : (react_1["default"].createElement("p", { className: "text-muted mb-0" },
                                react_1["default"].createElement("i", { className: "ti ti-info-circle me-1" }),
                                "Not assigned to any department or designation")))),
                        react_1["default"].createElement("div", { className: "mb-3" },
                            react_1["default"].createElement("div", { className: "d-flex align-items-center mb-2" },
                                react_1["default"].createElement("i", { className: "ti ti-file-description text-primary me-2 fs-20" }),
                                react_1["default"].createElement("h5", { className: "mb-0 text-muted" }, "Description")),
                            react_1["default"].createElement("div", { className: "ps-4" },
                                react_1["default"].createElement("div", { className: "border rounded p-3 bg-light" },
                                    react_1["default"].createElement("p", { className: "mb-0", style: { whiteSpace: 'pre-wrap' } }, viewingPolicy.policyDescription || 'No description provided'))))))),
                    react_1["default"].createElement("div", { className: "modal-footer" },
                        react_1["default"].createElement("button", { type: "button", className: "btn btn-light", "data-bs-dismiss": "modal" },
                            react_1["default"].createElement("i", { className: "ti ti-x me-1" }),
                            "Close")))))));
};
exports["default"] = Policy;
