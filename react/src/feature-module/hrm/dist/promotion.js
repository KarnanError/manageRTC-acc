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
var footer_1 = require("../../core/common/footer");
var SocketContext_1 = require("../../SocketContext");
var react_toastify_1 = require("react-toastify");
var useModalCleanup_1 = require("../../core/hooks/useModalCleanup");
var dayjs_1 = require("dayjs");
var PromotionDetailsModal_1 = require("../../core/modals/PromotionDetailsModal");
var Promotion = function () {
    var socket = SocketContext_1.useSocket();
    var cleanupModals = useModalCleanup_1.useModalCleanup().cleanupModals;
    // State management
    var _a = react_1.useState([]), promotions = _a[0], setPromotions = _a[1];
    var _b = react_1.useState([]), employees = _b[0], setEmployees = _b[1];
    var _c = react_1.useState([]), departments = _c[0], setDepartments = _c[1];
    var _d = react_1.useState([]), designations = _d[0], setDesignations = _d[1];
    var _e = react_1.useState(true), loading = _e[0], setLoading = _e[1];
    // Form state for Add Promotion
    var _f = react_1.useState({
        sourceDepartmentId: "",
        employeeId: "",
        targetDepartmentId: "",
        designationToId: "",
        promotionDate: null,
        promotionType: "Regular"
    }), newPromotion = _f[0], setNewPromotion = _f[1];
    // Form state for Edit Promotion
    var _g = react_1.useState(null), editingPromotion = _g[0], setEditingPromotion = _g[1];
    var _h = react_1.useState({
        departmentId: "",
        designationToId: "",
        promotionDate: null,
        promotionType: "Regular"
    }), editForm = _h[0], setEditForm = _h[1];
    // State for deletion
    var _j = react_1.useState(null), deletingPromotionId = _j[0], setDeletingPromotionId = _j[1];
    // State for viewing promotion details
    var _k = react_1.useState(null), viewingPromotion = _k[0], setViewingPromotion = _k[1];
    // Validation errors for Add Promotion
    var _l = react_1.useState({
        sourceDepartmentId: "",
        employeeId: "",
        targetDepartmentId: "",
        designationToId: "",
        promotionDate: "",
        promotionType: ""
    }), addErrors = _l[0], setAddErrors = _l[1];
    // Track employees already promoted (for duplicate check)
    var _m = react_1.useState(new Set()), promotedEmployeeIds = _m[0], setPromotedEmployeeIds = _m[1];
    // Validation errors for Edit Promotion
    var _o = react_1.useState({
        departmentId: "",
        designationToId: "",
        promotionDate: "",
        promotionType: ""
    }), editErrors = _o[0], setEditErrors = _o[1];
    var getModalContainer = function () {
        var modalElement = document.getElementById("modal-datepicker");
        return modalElement ? modalElement : document.body;
    };
    /**
     * Reliable modal closing function with multiple fallback methods
     * Does not depend on Bootstrap Modal instance
     */
    var closeModalReliably = function (modalId) {
        console.log("[Promotion] closeModalReliably called for:", modalId);
        try {
            // Method 1: Try Bootstrap Modal API if available via window.bootstrap
            var modalElement = document.getElementById(modalId);
            if (modalElement && typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal) {
                var modalInstance = window.bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    console.log("[Promotion] Closing modal using Bootstrap instance");
                    modalInstance.hide();
                    return;
                }
            }
        }
        catch (error) {
            console.log("[Promotion] Bootstrap Modal method failed:", error);
        }
        try {
            // Method 2: Click the close button
            var modalElement = document.getElementById(modalId);
            if (modalElement) {
                var closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]');
                if (closeButton) {
                    console.log("[Promotion] Closing modal by clicking close button");
                    closeButton.click();
                    return;
                }
            }
        }
        catch (error) {
            console.log("[Promotion] Close button method failed:", error);
        }
        try {
            // Method 3: Manual DOM manipulation as last resort
            var modalElement = document.getElementById(modalId);
            if (modalElement) {
                console.log("[Promotion] Closing modal using manual DOM manipulation");
                modalElement.classList.remove('show');
                modalElement.style.display = 'none';
                modalElement.setAttribute('aria-hidden', 'true');
                modalElement.removeAttribute('aria-modal');
                modalElement.removeAttribute('role');
                // Remove backdrop
                var backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                // Remove modal-open class from body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        }
        catch (error) {
            console.error("[Promotion] All modal closing methods failed:", error);
        }
    };
    // Fetch initial data
    react_1.useEffect(function () {
        if (!socket) {
            console.log("[Promotion] Socket not available yet");
            return;
        }
        console.log("[Promotion] Socket connected, fetching initial data...");
        console.log("[Promotion] Socket ID:", socket === null || socket === void 0 ? void 0 : socket.id);
        console.log("[Promotion] Socket connected:", socket === null || socket === void 0 ? void 0 : socket.connected);
        // Fetch promotions
        socket.emit("promotion:getAll", {});
        console.log("[Promotion] Emitted promotion:getAll");
        // Fetch departments for dropdown
        socket.emit("promotion:getDepartments");
        console.log("[Promotion] Emitted promotion:getDepartments");
        // Fetch designations for dropdown
        socket.emit("promotion:getDesignations");
        console.log("[Promotion] Emitted promotion:getDesignations");
        // Setup socket listeners
        var handleGetAllResponse = function (response) {
            console.log("[Promotion] Received promotions response:", response);
            console.log("[Promotion] Response type:", typeof response, "done:", response === null || response === void 0 ? void 0 : response.done);
            if (response.done && response.data) {
                console.log("[Promotion] Setting promotions, count:", response.data.length);
                setPromotions(response.data);
                // Track promoted employee IDs
                var promotedIds = new Set(response.data.map(function (p) { return p.employee.id; }));
                setPromotedEmployeeIds(promotedIds);
            }
            else {
                var errorMsg = response.error || "Failed to fetch promotions";
                console.error("[Promotion] Error fetching promotions:", errorMsg);
                react_toastify_1.toast.error(errorMsg);
            }
            setLoading(false);
        };
        var handleGetDepartmentsResponse = function (response) {
            console.log("[Promotion] Received departments response:", response);
            console.log("[Promotion] Response type:", typeof response, "done:", response === null || response === void 0 ? void 0 : response.done);
            if (response.done && response.data) {
                console.log("[Promotion] Setting departments, count:", response.data.length);
                setDepartments(response.data);
            }
            else {
                var errorMsg = response.error || "Failed to fetch departments";
                console.error("[Promotion] Error fetching departments:", errorMsg);
                react_toastify_1.toast.error(errorMsg);
            }
        };
        var handleGetEmployeesByDepartmentResponse = function (response) {
            console.log("[Promotion] Received employees-by-department response:", response);
            console.log("[Promotion] Response type:", typeof response, "done:", response === null || response === void 0 ? void 0 : response.done);
            if (response.done && response.data) {
                console.log("[Promotion] Setting employees, count:", response.data.length);
                setEmployees(response.data);
            }
            else {
                var errorMsg = response.error || response.message || "Failed to fetch employees";
                console.error("[Promotion] Error fetching employees:", errorMsg);
                setEmployees([]);
            }
        };
        var handleGetDesignationsResponse = function (response) {
            console.log("[Promotion] Received designations response:", response);
            console.log("[Promotion] Response type:", typeof response, "done:", response === null || response === void 0 ? void 0 : response.done);
            if (response.done && response.data) {
                console.log("[Promotion] Setting designations, count:", response.data.length);
                setDesignations(response.data);
            }
            else {
                var errorMsg = response.error || "Failed to fetch designations";
                console.error("[Promotion] Error fetching designations:", errorMsg);
                react_toastify_1.toast.error(errorMsg);
            }
        };
        var handleGetDesignationsByDepartmentResponse = function (response) {
            console.log("[Promotion] ===== RECEIVED promotion:getDesignationsByDepartment:response:", response);
            console.log("[Promotion] Response type:", typeof response, "done:", response === null || response === void 0 ? void 0 : response.done);
            if (response.done && response.data) {
                console.log("[Promotion] ✓ SUCCESS - Setting designations, count:", response.data.length);
                console.log("[Promotion] Designations data:", response.data.map(function (d) { return ({ id: d.id, name: d.name, departmentId: d.departmentId }); }));
                setDesignations(response.data);
            }
            else {
                var errorMsg = response.error || response.message || "Failed to fetch designations";
                console.error("[Promotion] ✗ ERROR fetching designations:", errorMsg);
                setDesignations([]);
                react_toastify_1.toast.error(errorMsg);
            }
        };
        var handlePromotionCreated = function (promotion) {
            console.log("[Promotion] Promotion created:", promotion);
            setPromotions(function (prev) { return __spreadArrays([promotion], prev); });
            // Add to promoted employee IDs
            setPromotedEmployeeIds(function (prev) { return new Set(prev).add(promotion.employee.id); });
            react_toastify_1.toast.success("Promotion added successfully");
        };
        var handlePromotionUpdated = function (promotion) {
            console.log("[Promotion] Promotion updated:", promotion);
            setPromotions(function (prev) {
                return prev.map(function (p) { return (p._id === promotion._id ? promotion : p); });
            });
            react_toastify_1.toast.success("Promotion updated successfully");
        };
        var handlePromotionDeleted = function (data) {
            console.log("[Promotion] Promotion deleted:", data);
            // Find the promotion being deleted to get employeeId
            var deletedPromotion = promotions.find(function (p) { return p._id === data.promotionId; });
            setPromotions(function (prev) { return prev.filter(function (p) { return p._id !== data.promotionId; }); });
            // Remove from promoted employee IDs
            if (deletedPromotion) {
                setPromotedEmployeeIds(function (prev) {
                    var newSet = new Set(prev);
                    newSet["delete"](deletedPromotion.employee.id);
                    return newSet;
                });
            }
            react_toastify_1.toast.success("Promotion deleted successfully");
        };
        socket.on("promotion:getAll:response", handleGetAllResponse);
        socket.on("promotion:getDepartments:response", handleGetDepartmentsResponse);
        socket.on("promotion:getEmployeesByDepartment:response", handleGetEmployeesByDepartmentResponse);
        socket.on("promotion:getDesignations:response", handleGetDesignationsResponse);
        socket.on("promotion:getDesignationsByDepartment:response", handleGetDesignationsByDepartmentResponse);
        socket.on("promotion:created", handlePromotionCreated);
        socket.on("promotion:updated", handlePromotionUpdated);
        socket.on("promotion:deleted", handlePromotionDeleted);
        // Cleanup listeners on unmount
        return function () {
            socket.off("promotion:getAll:response", handleGetAllResponse);
            socket.off("promotion:getDepartments:response", handleGetDepartmentsResponse);
            socket.off("promotion:getEmployeesByDepartment:response", handleGetEmployeesByDepartmentResponse);
            socket.off("promotion:getDesignations:response", handleGetDesignationsResponse);
            socket.off("promotion:getDesignationsByDepartment:response", handleGetDesignationsByDepartmentResponse);
            socket.off("promotion:created", handlePromotionCreated);
            socket.off("promotion:updated", handlePromotionUpdated);
            socket.off("promotion:deleted", handlePromotionDeleted);
            cleanupModals();
        };
    }, [socket, cleanupModals]);
    // Handle modal open events to reset errors
    react_1.useEffect(function () {
        var addModalElement = document.getElementById("new_promotion");
        var editModalElement = document.getElementById("edit_promotion");
        var handleAddModalOpen = function () {
            console.log("[Promotion] Add modal opened - clearing errors and resetting form");
            // Clear employees list to force fresh fetch
            setEmployees([]);
            // Clear errors
            setAddErrors({
                sourceDepartmentId: "",
                employeeId: "",
                targetDepartmentId: "",
                designationToId: "",
                promotionDate: "",
                promotionType: ""
            });
            // Reset form to ensure clean state
            setNewPromotion({
                sourceDepartmentId: "",
                employeeId: "",
                targetDepartmentId: "",
                designationToId: "",
                promotionDate: null,
                promotionType: "Regular"
            });
            // Clear designations
            setDesignations([]);
        };
        var handleEditModalOpen = function () {
            console.log("[Promotion] Edit modal opened - errors already cleared in handleEditClick");
        };
        if (addModalElement) {
            addModalElement.addEventListener("shown.bs.modal", handleAddModalOpen);
        }
        if (editModalElement) {
            editModalElement.addEventListener("shown.bs.modal", handleEditModalOpen);
        }
        return function () {
            if (addModalElement) {
                addModalElement.removeEventListener("shown.bs.modal", handleAddModalOpen);
            }
            if (editModalElement) {
                editModalElement.removeEventListener("shown.bs.modal", handleEditModalOpen);
            }
        };
    }, []);
    // Fetch employees by department
    var fetchEmployeesByDepartment = react_1["default"].useCallback(function (departmentId) {
        if (!socket || !departmentId) {
            console.log("[Promotion] fetchEmployeesByDepartment - socket or departmentId missing", { socket: !!socket, departmentId: departmentId });
            setEmployees([]);
            return;
        }
        console.log("[Promotion] Fetching employees for department:", departmentId, "type:", typeof departmentId);
        socket.emit("promotion:getEmployeesByDepartment", departmentId);
    }, [socket]);
    // Fetch designations by department
    var fetchDesignationsByDepartment = react_1["default"].useCallback(function (departmentId) {
        if (!socket || !departmentId) {
            console.log("[Promotion] fetchDesignationsByDepartment - socket or departmentId missing", { socket: !!socket, departmentId: departmentId });
            setDesignations([]);
            return;
        }
        console.log("[Promotion] ===== EMITTING promotion:getDesignationsByDepartment with departmentId:", departmentId, "type:", typeof departmentId);
        socket.emit("promotion:getDesignationsByDepartment", departmentId);
    }, [socket]);
    // Handle department change in Add form
    var handleAddDepartmentChange = function (option) {
        console.log("[Promotion] Add source department selected - _id:", option === null || option === void 0 ? void 0 : option.value);
        setNewPromotion(__assign(__assign({}, newPromotion), { sourceDepartmentId: (option === null || option === void 0 ? void 0 : option.value) || "", employeeId: "", targetDepartmentId: "", designationToId: "" }));
        // Clear all dependent field errors
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { sourceDepartmentId: "", employeeId: "", targetDepartmentId: "", designationToId: "" })); });
        if (option === null || option === void 0 ? void 0 : option.value) {
            fetchEmployeesByDepartment(option.value);
            // Do NOT fetch designations here - they depend on target department only
        }
        else {
            setEmployees([]);
        }
        // Clear designations since target department is reset
        setDesignations([]);
    };
    // Handle employee change in Add form
    var handleAddEmployeeChange = function (option) {
        console.log("[Promotion] Add employee selected - id:", option === null || option === void 0 ? void 0 : option.value);
        var employee = employees.find(function (emp) { return emp.id === (option === null || option === void 0 ? void 0 : option.value); });
        var newTargetDeptId = (employee === null || employee === void 0 ? void 0 : employee.departmentId) || "";
        console.log("[Promotion] Auto-populating target department:", newTargetDeptId);
        setNewPromotion(__assign(__assign({}, newPromotion), { employeeId: (option === null || option === void 0 ? void 0 : option.value) || "", targetDepartmentId: newTargetDeptId, designationToId: "" }));
        // Clear employee, department, and designation errors
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { employeeId: "", targetDepartmentId: "", designationToId: "" })); });
        // Fetch designations for the auto-populated target department
        if (newTargetDeptId) {
            console.log("[Promotion] Fetching designations for auto-populated department:", newTargetDeptId);
            fetchDesignationsByDepartment(newTargetDeptId);
        }
        else {
            console.log("[Promotion] No department to fetch designations for, clearing designations");
            setDesignations([]);
        }
    };
    // Handle target department change in Add form
    var handleAddTargetDepartmentChange = function (option) {
        console.log("[Promotion] Add target department selected - _id:", option === null || option === void 0 ? void 0 : option.value);
        setNewPromotion(__assign(__assign({}, newPromotion), { targetDepartmentId: (option === null || option === void 0 ? void 0 : option.value) || "", designationToId: "" }));
        // Clear target department and designation errors
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { targetDepartmentId: "", designationToId: "" })); });
        if (option === null || option === void 0 ? void 0 : option.value) {
            console.log("[Promotion] Fetching designations for target department:", option.value);
            // Clear existing designations first to show loading state
            setDesignations([]);
            // Fetch designations for the target department
            fetchDesignationsByDepartment(option.value);
        }
        else {
            console.log("[Promotion] No target department selected, clearing designations");
            setDesignations([]);
        }
    };
    // Handle designation change in Add form
    var handleAddDesignationChange = function (option) {
        console.log("[Promotion] Add designation selected - id:", option === null || option === void 0 ? void 0 : option.value);
        setNewPromotion(__assign(__assign({}, newPromotion), { designationToId: (option === null || option === void 0 ? void 0 : option.value) || "" }));
        // Clear designation error
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { designationToId: "" })); });
    };
    // Handle promotion type change in Add form
    var handleAddPromotionTypeChange = function (option) {
        setNewPromotion(__assign(__assign({}, newPromotion), { promotionType: (option === null || option === void 0 ? void 0 : option.value) || "Regular" }));
        // Clear promotion type error
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { promotionType: "" })); });
    };
    // Handle promotion date change in Add form
    var handleAddPromotionDateChange = function (date) {
        setNewPromotion(__assign(__assign({}, newPromotion), { promotionDate: date }));
        // Clear date error
        setAddErrors(function (prev) { return (__assign(__assign({}, prev), { promotionDate: "" })); });
    };
    // Validate Add Promotion form
    var validateAddForm = function () {
        var errors = {
            sourceDepartmentId: "",
            employeeId: "",
            targetDepartmentId: "",
            designationToId: "",
            promotionDate: "",
            promotionType: ""
        };
        var isValid = true;
        if (!newPromotion.sourceDepartmentId || newPromotion.sourceDepartmentId === "") {
            errors.sourceDepartmentId = "Please select a department";
            isValid = false;
        }
        if (!newPromotion.employeeId || newPromotion.employeeId === "") {
            errors.employeeId = "Please select an employee";
            isValid = false;
        }
        else {
            // Check for duplicate promotion
            if (promotedEmployeeIds.has(newPromotion.employeeId)) {
                errors.employeeId = "This employee already has an existing promotion";
                isValid = false;
            }
        }
        if (!newPromotion.targetDepartmentId || newPromotion.targetDepartmentId === "") {
            errors.targetDepartmentId = "Please select a target department";
            isValid = false;
        }
        if (!newPromotion.designationToId || newPromotion.designationToId === "") {
            errors.designationToId = "Please select a promotion designation";
            isValid = false;
        }
        else if (newPromotion.employeeId) {
            // Check if promoting to same designation (regardless of department change)
            var employee = employees.find(function (emp) { return emp.id === newPromotion.employeeId; });
            if (employee && employee.designationId === newPromotion.designationToId) {
                // If same designation, check if it's also the same department
                if (employee.departmentId === newPromotion.targetDepartmentId) {
                    errors.designationToId = "Cannot promote to the same department and designation. Please select a different department or designation.";
                }
                else {
                    // Same designation but different department - this is a lateral move, which may be valid
                    // But we should still warn or prevent based on business rules
                    errors.designationToId = "Employee already holds this designation in another department. Please select a different designation for promotion.";
                }
                isValid = false;
            }
        }
        if (!newPromotion.promotionType || newPromotion.promotionType === "") {
            errors.promotionType = "Please select a promotion type";
            isValid = false;
        }
        if (!newPromotion.promotionDate) {
            errors.promotionDate = "Please select a promotion date";
            isValid = false;
        }
        setAddErrors(errors);
        return isValid;
    };
    // Validate Edit Promotion form
    var validateEditForm = function () {
        var errors = {
            departmentId: "",
            designationToId: "",
            promotionDate: "",
            promotionType: ""
        };
        var isValid = true;
        if (!editForm.departmentId || editForm.departmentId === "") {
            errors.departmentId = "Please select a department";
            isValid = false;
        }
        if (!editForm.designationToId || editForm.designationToId === "") {
            errors.designationToId = "Please select a promotion designation";
            isValid = false;
        }
        if (!editForm.promotionType || editForm.promotionType === "") {
            errors.promotionType = "Please select a promotion type";
            isValid = false;
        }
        if (!editForm.promotionDate) {
            errors.promotionDate = "Please select a promotion date";
            isValid = false;
        }
        setEditErrors(errors);
        return isValid;
    };
    // Handle add promotion
    var handleAddPromotion = function () {
        console.log("[Promotion] handleAddPromotion called", { newPromotion: newPromotion, socketConnected: !!socket });
        // Validate form first
        if (!validateAddForm()) {
            return;
        }
        if (!socket) {
            react_toastify_1.toast.error("Socket not connected. Please refresh the page.");
            return;
        }
        // Validation: Ensure required IDs exist
        if (!newPromotion.employeeId) {
            react_toastify_1.toast.error("Please select an employee");
            return;
        }
        if (!newPromotion.targetDepartmentId) {
            react_toastify_1.toast.error("Please select a target department");
            return;
        }
        if (!newPromotion.designationToId) {
            react_toastify_1.toast.error("Please select a target designation");
            return;
        }
        // Send ONLY IDs to backend (normalized data model)
        var promotionData = {
            employeeId: newPromotion.employeeId,
            promotionTo: {
                departmentId: newPromotion.targetDepartmentId,
                designationId: newPromotion.designationToId
            },
            promotionDate: newPromotion.promotionDate.toISOString(),
            promotionType: newPromotion.promotionType
        };
        console.log("[Promotion] Adding promotion with normalized data:", promotionData);
        // Set up timeout for response
        var timeoutId = setTimeout(function () {
            react_toastify_1.toast.error("Request timeout. Please check your connection and try again.");
        }, 10000);
        socket.emit("promotion:create", promotionData);
        socket.once("promotion:create:response", function (response) {
            clearTimeout(timeoutId);
            console.log("[Promotion] Create response:", response);
            if (response.done) {
                // Success! Show toast first
                react_toastify_1.toast.success("Promotion added successfully!");
                // Re-fetch promotions list to ensure fully resolved data
                console.log("[Promotion] Re-fetching promotions after create");
                socket.emit("promotion:getAll", {});
                // Close modal with delay for animation
                setTimeout(function () {
                    closeModalReliably("new_promotion");
                    // Reset form after modal closing animation
                    setTimeout(function () {
                        setNewPromotion({
                            sourceDepartmentId: "",
                            employeeId: "",
                            targetDepartmentId: "",
                            designationToId: "",
                            promotionDate: null,
                            promotionType: "Regular"
                        });
                        setAddErrors({
                            sourceDepartmentId: "",
                            employeeId: "",
                            targetDepartmentId: "",
                            designationToId: "",
                            promotionDate: "",
                            promotionType: ""
                        });
                        setEmployees([]);
                        setDesignations([]);
                    }, 300);
                }, 100);
            }
            else {
                // Handle field-level errors from backend validation
                var errorMessage_1 = response.error || "Failed to add promotion";
                // Check if it's an employee lifecycle conflict
                if (errorMessage_1.includes("promotion") || errorMessage_1.includes("resignation") || errorMessage_1.includes("termination")) {
                    setAddErrors(function (prev) { return (__assign(__assign({}, prev), { employeeId: errorMessage_1 })); });
                }
                react_toastify_1.toast.error(errorMessage_1);
                console.error("[Promotion] Create failed:", response);
            }
        });
    };
    // Handle edit promotion
    var handleEditClick = function (promotion) {
        var _a, _b, _c, _d;
        console.log("[Promotion] Edit clicked:", promotion);
        // Validate promotion structure before proceeding
        if (!((_b = (_a = promotion.promotionTo) === null || _a === void 0 ? void 0 : _a.department) === null || _b === void 0 ? void 0 : _b.id) || !((_d = (_c = promotion.promotionTo) === null || _c === void 0 ? void 0 : _c.designation) === null || _d === void 0 ? void 0 : _d.id)) {
            react_toastify_1.toast.error("Invalid promotion data. Please refresh the page and try again.");
            console.error("[Promotion] Invalid promotion structure:", promotion);
            return;
        }
        setEditingPromotion(promotion);
        setEditForm({
            departmentId: promotion.promotionTo.department.id,
            designationToId: promotion.promotionTo.designation.id,
            promotionDate: dayjs_1["default"](promotion.promotionDate),
            promotionType: promotion.promotionType || "Regular"
        });
        // Clear edit errors when opening modal
        setEditErrors({
            departmentId: "",
            designationToId: "",
            promotionDate: "",
            promotionType: ""
        });
        // Fetch designations for the promotion's target department
        if (promotion.promotionTo.department.id) {
            fetchDesignationsByDepartment(promotion.promotionTo.department.id);
        }
    };
    var handleUpdatePromotion = function () {
        console.log("[Promotion] handleUpdatePromotion called", { editForm: editForm, editingPromotion: editingPromotion });
        // Validate form first
        if (!validateEditForm()) {
            return;
        }
        if (!socket || !editingPromotion) {
            react_toastify_1.toast.error("Socket not connected or no promotion selected");
            return;
        }
        // Validation: Ensure required IDs exist
        if (!editForm.departmentId) {
            react_toastify_1.toast.error("Please select a department");
            return;
        }
        if (!editForm.designationToId) {
            react_toastify_1.toast.error("Please select a designation");
            return;
        }
        // Send ONLY IDs to backend (normalized data model)
        var updateData = {
            promotionTo: {
                departmentId: editForm.departmentId,
                designationId: editForm.designationToId
            },
            promotionDate: editForm.promotionDate.toISOString(),
            promotionType: editForm.promotionType
        };
        console.log("[Promotion] Updating promotion with normalized data:", { promotionId: editingPromotion._id, update: updateData });
        var timeoutId = setTimeout(function () {
            react_toastify_1.toast.error("Update timeout. Please try again.");
        }, 10000);
        socket.emit("promotion:update", {
            promotionId: editingPromotion._id,
            update: updateData
        });
        socket.once("promotion:update:response", function (response) {
            clearTimeout(timeoutId);
            console.log("[Promotion] Update response:", response);
            if (response.done) {
                // Success! Show toast first
                react_toastify_1.toast.success("Promotion updated successfully!");
                // Re-fetch promotions list to ensure fully resolved data
                console.log("[Promotion] Re-fetching promotions after update");
                socket.emit("promotion:getAll", {});
                // Close modal with delay for animation
                setTimeout(function () {
                    closeModalReliably("edit_promotion");
                    // Reset form after modal closing animation
                    setTimeout(function () {
                        setEditingPromotion(null);
                        setEditForm({
                            departmentId: "",
                            designationToId: "",
                            promotionDate: null,
                            promotionType: "Regular"
                        });
                        setEditErrors({
                            departmentId: "",
                            designationToId: "",
                            promotionDate: "",
                            promotionType: ""
                        });
                        setDesignations([]);
                    }, 300);
                }, 100);
            }
            else {
                var errorMsg = response.error || "Failed to update promotion";
                console.error("[Promotion] Update failed:", response);
                // Map backend errors to form fields for inline display
                var newErrors = {
                    departmentId: "",
                    designationToId: "",
                    promotionDate: "",
                    promotionType: ""
                };
                // Check error message and set appropriate field error
                var errorLower = errorMsg.toLowerCase();
                if (errorLower.includes("designation") && errorLower.includes("different")) {
                    newErrors.designationToId = errorMsg;
                }
                else if (errorLower.includes("designation")) {
                    newErrors.designationToId = errorMsg;
                }
                else if (errorLower.includes("department")) {
                    newErrors.departmentId = errorMsg;
                }
                else if (errorLower.includes("date")) {
                    newErrors.promotionDate = errorMsg;
                }
                else if (errorLower.includes("type")) {
                    newErrors.promotionType = errorMsg;
                }
                else {
                    // Generic error - show as toast only
                    react_toastify_1.toast.error(errorMsg);
                }
                // Set inline errors if any field-specific error was detected
                if (Object.values(newErrors).some(function (err) { return err !== ""; })) {
                    setEditErrors(newErrors);
                }
            }
        });
    };
    // Handle delete promotion
    var handleDeleteClick = function (promotionId) {
        console.log("[Promotion] Delete clicked:", promotionId);
        setDeletingPromotionId(promotionId);
    };
    // Handle view promotion details
    var handleViewClick = function (promotion) {
        console.log("[Promotion] View clicked:", promotion);
        setViewingPromotion(promotion);
    };
    var confirmDelete = function () {
        if (!socket || !deletingPromotionId) {
            react_toastify_1.toast.error("Socket not connected or no promotion selected");
            return;
        }
        console.log("[Promotion] Deleting promotion:", deletingPromotionId);
        var timeoutId = setTimeout(function () {
            react_toastify_1.toast.error("Delete timeout. Please try again.");
        }, 10000);
        socket.emit("promotion:delete", { promotionId: deletingPromotionId });
        socket.once("promotion:delete:response", function (response) {
            clearTimeout(timeoutId);
            console.log("[Promotion] Delete response:", response);
            if (response.done) {
                // Show toast first
                react_toastify_1.toast.success("Promotion deleted successfully!");
                // Re-fetch promotions list to ensure consistency
                console.log("[Promotion] Re-fetching promotions after delete");
                socket.emit("promotion:getAll", {});
                // Close modal with delay for animation
                setTimeout(function () {
                    closeModalReliably("delete_modal");
                    setDeletingPromotionId(null);
                }, 100);
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to delete promotion");
                console.error("[Promotion] Delete failed:", response);
            }
        });
    };
    // Convert departments to select options
    var departmentOptions = departments.map(function (dept) { return ({
        value: dept._id,
        label: dept.department
    }); });
    // Convert employees to select options
    var employeeOptions = employees.length > 0
        ? employees.map(function (emp) { return ({
            value: emp.id,
            label: emp.employeeId + " - " + emp.name
        }); })
        : [{ value: "", label: departments.length === 0 ? "Loading departments..." : "Select a department first" }];
    // Convert designations to select options - depends ONLY on target department
    var designationOptions = designations.length > 0
        ? designations.map(function (des) { return ({
            value: des.id,
            label: des.name
        }); })
        : [{ value: "", label: !newPromotion.targetDepartmentId ? "Select target department first" : (loading ? "Loading designations..." : "No designations available in this department") }];
    // Promotion type options
    var promotionTypeOptions = [
        { value: "Performance Based", label: "Performance Based" },
        { value: "Experience Based", label: "Experience Based" },
        { value: "Qualification Based", label: "Qualification Based" },
        { value: "Special Achievement", label: "Special Achievement" },
        { value: "Regular", label: "Regular" },
        { value: "Other", label: "Other" },
    ];
    // Get designation from based on selected employee for add form
    var getDesignationFrom = function () {
        if (newPromotion.employeeId) {
            var employee = employees.find(function (emp) { return emp.id === newPromotion.employeeId; });
            return employee ? employee.designation : "";
        }
        return "";
    };
    // Get department from based on selected employee for add form
    var getDepartmentFrom = function () {
        if (newPromotion.employeeId) {
            var employee = employees.find(function (emp) { return emp.id === newPromotion.employeeId; });
            return employee ? employee.department : "";
        }
        return "";
    };
    var data = promotions
        .filter(function (promotion) {
        var _a, _b, _c, _d, _e, _f, _g;
        // Filter out promotions with incomplete data structure
        return ((_a = promotion === null || promotion === void 0 ? void 0 : promotion.employee) === null || _a === void 0 ? void 0 : _a.id) && ((_c = (_b = promotion === null || promotion === void 0 ? void 0 : promotion.promotionFrom) === null || _b === void 0 ? void 0 : _b.department) === null || _c === void 0 ? void 0 : _c.name) && ((_e = (_d = promotion === null || promotion === void 0 ? void 0 : promotion.promotionFrom) === null || _d === void 0 ? void 0 : _d.designation) === null || _e === void 0 ? void 0 : _e.name) && ((_g = (_f = promotion === null || promotion === void 0 ? void 0 : promotion.promotionTo) === null || _f === void 0 ? void 0 : _f.designation) === null || _g === void 0 ? void 0 : _g.name);
    })
        .map(function (promotion) {
        // Look up the actual employee from employees array to get the correct employeeId
        var employee = employees.find(function (emp) { return emp.id === promotion.employee.id; });
        var displayEmployeeId = promotion.employee.employeeId || (employee === null || employee === void 0 ? void 0 : employee.employeeId) || promotion.employee.id;
        return {
            key: promotion._id,
            Employee_ID: displayEmployeeId,
            Promoted_Employee: promotion.employee.name,
            Image: promotion.employee.image,
            Department: promotion.promotionFrom.department.name,
            Designation_From: promotion.promotionFrom.designation.name,
            Designation_To: promotion.promotionTo.designation.name,
            Promotion_Date: dayjs_1["default"](promotion.promotionDate).format("DD MMM YYYY"),
            _original: promotion
        };
    });
    var columns = [
        {
            title: "Employee ID",
            dataIndex: "Employee_ID",
            render: function (text) { return (react_1["default"].createElement("span", { className: "fw-medium" }, text)); },
            sorter: function (a, b) {
                return a.Employee_ID.localeCompare(b.Employee_ID);
            }
        },
        {
            title: "Name",
            dataIndex: "Promoted_Employee",
            render: function (text, record) { return (react_1["default"].createElement(EmployeeNameCell_1["default"], { name: text, image: record.Image, employeeId: record._original.employee.id, avatarTheme: "primary" })); },
            sorter: function (a, b) {
                return a.Promoted_Employee.localeCompare(b.Promoted_Employee);
            }
        },
        {
            title: "Department",
            dataIndex: "Department",
            sorter: function (a, b) { return a.Department.localeCompare(b.Department); }
        },
        {
            title: "Designation From",
            dataIndex: "Designation_From",
            sorter: function (a, b) {
                return a.Designation_From.localeCompare(b.Designation_From);
            }
        },
        {
            title: "Designation To",
            dataIndex: "Designation_To",
            sorter: function (a, b) {
                return a.Designation_To.localeCompare(b.Designation_To);
            }
        },
        {
            title: "Promotion Date",
            dataIndex: "Promotion_Date",
            sorter: function (a, b) {
                return a.Promotion_Date.localeCompare(b.Promotion_Date);
            }
        },
        {
            title: "",
            dataIndex: "actions",
            render: function (_, record) { return (react_1["default"].createElement("div", { className: "action-icon d-inline-flex" },
                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", onClick: function (e) {
                        e.preventDefault();
                        handleViewClick(record._original);
                    }, "data-bs-toggle": "modal", "data-bs-target": "#view_promotion" },
                    react_1["default"].createElement("i", { className: "ti ti-eye" })),
                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "me-2", onClick: function (e) {
                        e.preventDefault();
                        handleEditClick(record._original);
                    }, "data-bs-toggle": "modal", "data-bs-target": "#edit_promotion" },
                    react_1["default"].createElement("i", { className: "ti ti-edit" })),
                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", onClick: function (e) {
                        e.preventDefault();
                        handleDeleteClick(record._original._id);
                    }, "data-bs-toggle": "modal", "data-bs-target": "#delete_modal" },
                    react_1["default"].createElement("i", { className: "ti ti-trash" })))); }
        },
    ];
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3" },
                    react_1["default"].createElement("div", { className: "my-auto mb-2" },
                        react_1["default"].createElement("h2", { className: "mb-1" }, "Promotion"),
                        react_1["default"].createElement("nav", null,
                            react_1["default"].createElement("ol", { className: "breadcrumb mb-0" },
                                react_1["default"].createElement("li", { className: "breadcrumb-item" },
                                    react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.adminDashboard },
                                        react_1["default"].createElement("i", { className: "ti ti-smart-home" }))),
                                react_1["default"].createElement("li", { className: "breadcrumb-item" }, "Performance"),
                                react_1["default"].createElement("li", { className: "breadcrumb-item active", "aria-current": "page" }, "Promotion")))),
                    react_1["default"].createElement("div", { className: "d-flex my-xl-auto right-content align-items-center flex-wrap " },
                        react_1["default"].createElement("div", { className: "mb-2" },
                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-primary d-flex align-items-center", "data-bs-toggle": "modal", "data-bs-target": "#new_promotion" },
                                react_1["default"].createElement("i", { className: "ti ti-circle-plus me-2" }),
                                "Add Promotion")),
                        react_1["default"].createElement("div", { className: "head-icons ms-2" },
                            react_1["default"].createElement(collapse_header_1["default"], null)))),
                react_1["default"].createElement("div", { className: "row" },
                    react_1["default"].createElement("div", { className: "col-sm-12" },
                        react_1["default"].createElement("div", { className: "card" },
                            react_1["default"].createElement("div", { className: "card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3" },
                                react_1["default"].createElement("h5", { className: "d-flex align-items-center" }, "Promotion List"),
                                react_1["default"].createElement("div", { className: "d-flex align-items-center flex-wrap row-gap-3" },
                                    react_1["default"].createElement("div", { className: "input-icon position-relative me-2" },
                                        react_1["default"].createElement("span", { className: "input-icon-addon" },
                                            react_1["default"].createElement("i", { className: "ti ti-calendar" })),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control date-range bookingrange", placeholder: "dd/mm/yyyy - dd/mm/yyyy " })),
                                    react_1["default"].createElement("div", { className: "dropdown" },
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-toggle btn btn-white d-inline-flex align-items-center fs-12", "data-bs-toggle": "dropdown" },
                                            react_1["default"].createElement("p", { className: "fs-12 d-inline-flex me-1" }, "Sort By : "),
                                            "Last 7 Days"),
                                        react_1["default"].createElement("ul", { className: "dropdown-menu  dropdown-menu-end p-3" },
                                            react_1["default"].createElement("li", null,
                                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-item rounded-1" }, "Recently Added")),
                                            react_1["default"].createElement("li", null,
                                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-item rounded-1" }, "Ascending")),
                                            react_1["default"].createElement("li", null,
                                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "dropdown-item rounded-1" }, "Desending")))))),
                            react_1["default"].createElement("div", { className: "card-body p-0" }, loading ? (react_1["default"].createElement("div", { className: "text-center p-5" },
                                react_1["default"].createElement("div", { className: "spinner-border text-primary", role: "status" },
                                    react_1["default"].createElement("span", { className: "visually-hidden" }, "Loading...")),
                                react_1["default"].createElement("p", { className: "mt-2" }, "Loading promotions..."))) : promotions.length === 0 ? (react_1["default"].createElement("div", { className: "text-center p-5" },
                                react_1["default"].createElement("i", { className: "ti ti-clipboard-text fs-48 text-muted mb-3 d-block" }),
                                react_1["default"].createElement("h5", { className: "text-muted" }, "No promotions found"),
                                react_1["default"].createElement("p", { className: "text-muted" }, "Click \"Add Promotion\" to create your first promotion record"))) : (react_1["default"].createElement(index_1["default"], { dataSource: data, columns: columns, Selection: true }))))))),
            react_1["default"].createElement(footer_1["default"], null)),
        react_1["default"].createElement(react_1["default"].Fragment, null,
            react_1["default"].createElement("div", { className: "modal fade", id: "new_promotion" },
                react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                    react_1["default"].createElement("div", { className: "modal-content" },
                        react_1["default"].createElement("div", { className: "modal-header" },
                            react_1["default"].createElement("h4", { className: "modal-title" }, "Add Promotion"),
                            react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                                react_1["default"].createElement("i", { className: "ti ti-x" }))),
                        react_1["default"].createElement("form", null,
                            react_1["default"].createElement("div", { className: "modal-body pb-0", id: "modal-datepicker" },
                                react_1["default"].createElement("div", { className: "row" },
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Department ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: departmentOptions, value: departmentOptions.find(function (opt) { return opt.value === newPromotion.sourceDepartmentId; }) || null, onChange: handleAddDepartmentChange }),
                                            addErrors.sourceDepartmentId && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, addErrors.sourceDepartmentId)))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion For ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: employeeOptions, value: employeeOptions.find(function (opt) { return opt.value === newPromotion.employeeId; }) || null, onChange: handleAddEmployeeChange }),
                                            addErrors.employeeId && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, addErrors.employeeId)))),
                                    newPromotion.employeeId && (react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Current Designation"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: getDesignationFrom(), disabled: true })))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Department To ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: departmentOptions, value: departmentOptions.find(function (opt) { return opt.value === newPromotion.targetDepartmentId; }) || null, onChange: handleAddTargetDepartmentChange, disabled: !newPromotion.employeeId }),
                                            addErrors.targetDepartmentId && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, addErrors.targetDepartmentId)))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion To ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: designationOptions, value: designationOptions.find(function (opt) { return opt.value === newPromotion.designationToId; }) || null, onChange: handleAddDesignationChange, disabled: !newPromotion.targetDepartmentId }),
                                            addErrors.designationToId && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, addErrors.designationToId)))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion Type ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: promotionTypeOptions, value: promotionTypeOptions.find(function (opt) { return opt.value === newPromotion.promotionType; }) || null, onChange: handleAddPromotionTypeChange }),
                                            addErrors.promotionType && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, addErrors.promotionType)))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion Date ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: "DD-MM-YYYY", value: newPromotion.promotionDate, onChange: handleAddPromotionDateChange, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY" }),
                                                react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                    react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                            addErrors.promotionDate && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, addErrors.promotionDate)))))),
                            react_1["default"].createElement("div", { className: "modal-footer" },
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                                react_1["default"].createElement("button", { type: "button", onClick: handleAddPromotion, className: "btn btn-primary", disabled: loading || employees.length === 0 || designations.length === 0 }, loading ? "Loading..." : "Add Promotion")))))),
            react_1["default"].createElement("div", { className: "modal fade", id: "edit_promotion" },
                react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                    react_1["default"].createElement("div", { className: "modal-content" },
                        react_1["default"].createElement("div", { className: "modal-header" },
                            react_1["default"].createElement("h4", { className: "modal-title" }, "Edit Promotion"),
                            react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                                react_1["default"].createElement("i", { className: "ti ti-x" }))),
                        react_1["default"].createElement("form", null,
                            react_1["default"].createElement("div", { className: "modal-body pb-0", id: "modal-datepicker" },
                                react_1["default"].createElement("div", { className: "row" }, editingPromotion && (react_1["default"].createElement(react_1["default"].Fragment, null,
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Employee"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: editingPromotion.employee.name, disabled: true }))),
                                    react_1["default"].createElement("div", { className: "col-md-12" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Current Designation"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: editingPromotion.promotionFrom.designation.name, disabled: true }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Department To ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: departmentOptions, value: departmentOptions.find(function (opt) { return opt.value === editForm.departmentId; }) || null, onChange: function (option) {
                                                    setEditForm(__assign(__assign({}, editForm), { departmentId: option.value, designationToId: "" }));
                                                    setEditErrors(function (prev) { return (__assign(__assign({}, prev), { departmentId: "", designationToId: "" })); });
                                                    if (option === null || option === void 0 ? void 0 : option.value) {
                                                        fetchDesignationsByDepartment(option.value);
                                                    }
                                                    else {
                                                        setDesignations([]);
                                                    }
                                                } }),
                                            editErrors.departmentId && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, editErrors.departmentId)))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion To ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: designationOptions, value: designationOptions.find(function (opt) { return opt.value === editForm.designationToId; }) || null, onChange: function (option) {
                                                    setEditForm(__assign(__assign({}, editForm), { designationToId: option.value }));
                                                    setEditErrors(function (prev) { return (__assign(__assign({}, prev), { designationToId: "" })); });
                                                } }),
                                            editErrors.designationToId && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, editErrors.designationToId)))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion Type ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: "select", options: promotionTypeOptions, value: promotionTypeOptions.find(function (opt) { return opt.value === editForm.promotionType; }) || null, onChange: function (option) {
                                                    setEditForm(__assign(__assign({}, editForm), { promotionType: option.value }));
                                                    setEditErrors(function (prev) { return (__assign(__assign({}, prev), { promotionType: "" })); });
                                                } }),
                                            editErrors.promotionType && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, editErrors.promotionType)))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Promotion Date ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                            react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: "DD-MM-YYYY", value: editForm.promotionDate, onChange: function (date) {
                                                        setEditForm(__assign(__assign({}, editForm), { promotionDate: date }));
                                                        setEditErrors(function (prev) { return (__assign(__assign({}, prev), { promotionDate: "" })); });
                                                    }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY" }),
                                                react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                    react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))),
                                            editErrors.promotionDate && (react_1["default"].createElement("div", { className: "text-danger fs-12 mt-1" }, editErrors.promotionDate)))))))),
                            react_1["default"].createElement("div", { className: "modal-footer" },
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                                react_1["default"].createElement("button", { type: "button", onClick: handleUpdatePromotion, className: "btn btn-primary" }, "Save Changes")))))),
            react_1["default"].createElement("div", { className: "modal fade", id: "delete_modal" },
                react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered" },
                    react_1["default"].createElement("div", { className: "modal-content" },
                        react_1["default"].createElement("div", { className: "modal-body text-center" },
                            react_1["default"].createElement("span", { className: "avatar avatar-xl bg-transparent-danger text-danger mb-3" },
                                react_1["default"].createElement("i", { className: "ti ti-trash-x fs-36" })),
                            react_1["default"].createElement("h4", { className: "mb-1" }, "Confirm Delete"),
                            react_1["default"].createElement("p", { className: "mb-3" }, "Are you sure you want to delete this promotion? This action cannot be undone."),
                            react_1["default"].createElement("div", { className: "d-flex justify-content-center" },
                                react_1["default"].createElement("button", { type: "button", className: "btn btn-light me-3", "data-bs-dismiss": "modal" }, "Cancel"),
                                react_1["default"].createElement("button", { type: "button", onClick: confirmDelete, className: "btn btn-danger" }, "Yes, Delete")))))),
            react_1["default"].createElement(PromotionDetailsModal_1["default"], { promotion: viewingPromotion, modalId: "view_promotion" }))));
};
exports["default"] = Promotion;
