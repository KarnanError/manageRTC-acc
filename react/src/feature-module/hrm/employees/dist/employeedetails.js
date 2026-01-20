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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var all_routes_1 = require("../../router/all_routes");
var imageWithBasePath_1 = require("../../../core/common/imageWithBasePath");
var employeereportDetails_1 = require("../../../core/data/json/employeereportDetails");
var antd_1 = require("antd");
var commonSelect_1 = require("../../../core/common/commonSelect");
var collapse_header_1 = require("../../../core/common/collapse-header/collapse-header");
var SocketContext_1 = require("../../../SocketContext");
var react_toastify_1 = require("react-toastify");
var footer_1 = require("../../../core/common/footer");
var PromotionDetailsModal_1 = require("../../../core/modals/PromotionDetailsModal");
var ResignationDetailsModal_1 = require("../../../core/modals/ResignationDetailsModal");
var TerminationDetailsModal_1 = require("../../../core/modals/TerminationDetailsModal");
var dayjs_1 = require("dayjs");
var MODULES = [
    "holidays", "leaves", "clients", "projects", "tasks", "chats", "assets", "timingSheets"
];
var ACTIONS = [
    "read", "write", "create", "delete", "import", "export"
];
var initialPermissionsState = {
    enabledModules: {
        holidays: false,
        leaves: false,
        clients: false,
        projects: false,
        tasks: false,
        chats: false,
        assets: false,
        timingSheets: false
    },
    permissions: {
        holidays: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        leaves: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        clients: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        projects: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        tasks: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        chats: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        assets: { read: false, write: false, create: false, "delete": false, "import": false, "export": false },
        timingSheets: { read: false, write: false, create: false, "delete": false, "import": false, "export": false }
    },
    selectAll: {
        holidays: false,
        leaves: false,
        clients: false,
        projects: false,
        tasks: false,
        chats: false,
        assets: false,
        timingSheets: false
    }
};
var EmployeeDetails = function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41;
    var _42 = react_1.useState(initialPermissionsState), permissions = _42[0], setPermissions = _42[1];
    var fileInputRef = react_1.useRef(null);
    var _43 = react_1.useState(false), imageUpload = _43[0], setImageUpload = _43[1];
    var _44 = react_1.useState('info'), currentTab = _44[0], setCurrentTab = _44[1];
    var editEmployeeModalRef = react_1.useRef(null);
    var _45 = react_1.useState(null), editingEmployee = _45[0], setEditingEmployee = _45[1];
    var _46 = react_1.useState({}), editFormData = _46[0], setEditFormData = _46[1];
    // const [maritalStatus, setMaritalStatus] = useState<string>("");
    var _47 = react_1.useState({
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branch: ""
    }), bankFormData = _47[0], setBankFormData = _47[1];
    var _48 = react_1.useState({
        familyMemberName: "",
        relationship: "",
        phone: ""
    }), familyFormData = _48[0], setFamilyFormData = _48[1];
    var _49 = react_1.useState({
        passportNo: "",
        passportExpiryDate: null,
        nationality: "",
        religion: "",
        maritalStatus: "Select",
        employmentOfSpouse: "",
        noOfChildren: 0
    }), personalFormData = _49[0], setPersonalFormData = _49[1];
    var _50 = react_1.useState({
        institution: "",
        course: "",
        startDate: null,
        endDate: null
    }), educationFormData = _50[0], setEducationFormData = _50[1];
    var _51 = react_1.useState({
        name: "",
        relationship: "",
        phone1: "",
        phone2: ""
    }), emergencyFormData = _51[0], setEmergencyFormData = _51[1];
    var _52 = react_1.useState({
        company: "",
        designation: "",
        startDate: "",
        endDate: ""
    }), experienceFormData = _52[0], setExperienceFormData = _52[1];
    var _53 = react_1.useState({
        about: ""
    }), aboutFormData = _53[0], setAboutFormData = _53[1];
    // Handle Next button click
    var handleNext = function () {
        handleEditSubmit(undefined).then(function () {
            // Switch to permissions tab
            var addressTab = document.getElementById('address-tab3');
            if (addressTab) {
                addressTab.click();
            }
            setCurrentTab('permissions');
        });
    };
    // Handle permissions update
    var handlePermissionUpdateSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var payload;
        return __generator(this, function (_a) {
            if (e)
                e.preventDefault();
            if (!socket || !employee)
                return [2 /*return*/];
            try {
                setLoading(true);
                payload = {
                    employeeId: employee._id,
                    permissions: permissions.permissions,
                    enabledModules: permissions.enabledModules
                };
                socket.emit("hrm/employees/update-permissions", payload);
                react_toastify_1.toast.success("Employee permissions update request sent.");
            }
            catch (error) {
                react_toastify_1.toast.error("Failed to update permissions");
                console.error("Permissions update error:", error);
            }
            finally {
                setLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    // Handle file upload
    var uploadImage = function (file) { return __awaiter(void 0, void 0, void 0, function () {
        var formData, res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "amasqis");
                    return [4 /*yield*/, fetch("https://api.cloudinary.com/v1_1/dwc3b5zfe/image/upload", {
                            method: "POST",
                            body: formData
                        })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.secure_url];
            }
        });
    }); };
    var handleImageUpload = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var file, maxSize, formData, res, data_1, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file)
                        return [2 /*return*/];
                    maxSize = 4 * 1024 * 1024;
                    if (file.size > maxSize) {
                        react_toastify_1.toast.error("File size must be less than 4MB.", { position: "top-right", autoClose: 3000 });
                        event.target.value = "";
                        return [2 /*return*/];
                    }
                    if (!["image/jpeg", "image/png", "image/jpg", "image/ico"].includes(file.type)) return [3 /*break*/, 6];
                    setImageUpload(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "amasqis");
                    return [4 /*yield*/, fetch("https://api.cloudinary.com/v1_1/dwc3b5zfe/image/upload", { method: "POST", body: formData })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _b.sent();
                    setEditFormData(function (prev) { return (__assign(__assign({}, prev), { avatarUrl: data_1.secure_url })); });
                    setImageUpload(false);
                    react_toastify_1.toast.success("Image uploaded successfully!", { position: "top-right", autoClose: 3000 });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    setImageUpload(false);
                    react_toastify_1.toast.error("Failed to upload image. Please try again.", { position: "top-right", autoClose: 3000 });
                    event.target.value = "";
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 7];
                case 6:
                    react_toastify_1.toast.error("Please upload image file only.", { position: "top-right", autoClose: 3000 });
                    event.target.value = "";
                    _b.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var removeLogo = function () {
        setEditFormData(function (prev) { return (__assign(__assign({}, prev), { avatarUrl: "" })); });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    // Handle bank form validation and submission
    var handleBankFormSubmit = function (e) {
        e.preventDefault();
        // Validate all fields are filled
        if (!bankFormData.bankName || !bankFormData.accountNumber ||
            !bankFormData.ifscCode || !bankFormData.branch) {
            react_toastify_1.toast.error("All bank details fields are required!", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        if (!socket || !employee) {
            react_toastify_1.toast.error("Cannot save bank details at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        // Submit bank details to backend
        var payload = {
            employeeId: employee.employeeId,
            bank: __assign(__assign({}, bankFormData), { accountHolderName: employee.firstName + " " + employee.lastName })
        };
        socket.emit("hrm/employees/update-bank", payload);
        console.log("Socket event emitted successfully");
        react_toastify_1.toast.success("Bank details update request sent!", {
            position: "top-right",
            autoClose: 3000
        });
        // Close modal programmatically
        var closeButton = document.querySelector('#edit_bank [data-bs-dismiss="modal"]');
        if (closeButton)
            closeButton.click();
    };
    var resetBankForm = function () {
        var _a, _b, _c, _d;
        setBankFormData({
            bankName: ((_a = employee.bank) === null || _a === void 0 ? void 0 : _a.bankName) || "",
            accountNumber: ((_b = employee.bank) === null || _b === void 0 ? void 0 : _b.accountNumber) || "",
            ifscCode: ((_c = employee.bank) === null || _c === void 0 ? void 0 : _c.ifscCode) || "",
            branch: ((_d = employee.bank) === null || _d === void 0 ? void 0 : _d.branch) || ""
        });
    };
    // handle education form validation and submission
    var handleEducationFormSubmit = function (e) {
        e.preventDefault();
        // console.log("dateeeeddd",educationFormData.startDate);
        // return;
        if (!educationFormData.institution || !educationFormData.course || !educationFormData.startDate || !educationFormData.endDate) {
            react_toastify_1.toast.error("All education details fields are required!", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        if (!socket || !employee) {
            react_toastify_1.toast.error("Cannot save education details at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        var payload = {
            employeeId: employee.employeeId,
            educationDetails: {
                institution: educationFormData.institution,
                course: educationFormData.course,
                startDate: educationFormData.startDate ? educationFormData.startDate.toISOString() : "",
                endDate: educationFormData.endDate ? educationFormData.endDate.toISOString() : ""
            }
        };
        socket.emit("hrm/employees/update-education", payload);
        react_toastify_1.toast.success("Education details update request sent!", {
            position: "top-right",
            autoClose: 3000
        });
        // Close modal programmatically
        var closeButton = document.querySelector('#edit_education [data-bs-dismiss="modal"]');
        if (closeButton)
            closeButton.click();
    };
    var resetEducationForm = function () {
        var _a, _b, _c, _d;
        setEducationFormData({
            institution: ((_a = employee.education) === null || _a === void 0 ? void 0 : _a.institution) || "",
            course: ((_b = employee.education) === null || _b === void 0 ? void 0 : _b.degree) || "",
            startDate: ((_c = employee.education) === null || _c === void 0 ? void 0 : _c.startDate) ? dayjs_1["default"](employee.education.startDate) : null,
            endDate: ((_d = employee.education) === null || _d === void 0 ? void 0 : _d.endDate) ? dayjs_1["default"](employee.education.endDate) : null
        });
    };
    // handleFamily form validation and submission
    var handleFamilyFormSubmit = function (e) {
        e.preventDefault();
        // Validate all fields are filled
        if (!familyFormData.familyMemberName || !familyFormData.relationship || !familyFormData.phone) {
            console.log("Validation failed - missing required fields");
            react_toastify_1.toast.error("All family details fields are required!", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        if (!socket || !employee) {
            react_toastify_1.toast.error("Cannot save bank details at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        // Submit bank details to backend
        var payload = {
            employeeId: employee.employeeId,
            family: __assign({}, familyFormData)
        };
        socket.emit("hrm/employees/update-family", payload);
        react_toastify_1.toast.success("Family details update request sent!", {
            position: "top-right",
            autoClose: 3000
        });
        // Close modal programmatically
        var closeButton = document.querySelector('#edit_family [data-bs-dismiss="modal"]');
        if (closeButton)
            closeButton.click();
    };
    var resetFamilyForm = function () {
        var _a, _b, _c;
        setFamilyFormData({
            familyMemberName: ((_a = employee.family) === null || _a === void 0 ? void 0 : _a.Name) || "",
            relationship: ((_b = employee.family) === null || _b === void 0 ? void 0 : _b.relationship) || "",
            phone: ((_c = employee.family) === null || _c === void 0 ? void 0 : _c.phone) || ""
        });
    };
    // Handle personal info form validation and submission
    var handlePersonalFormSubmit = function (e) {
        e.preventDefault();
        // console.log("=== PERSONAL FORM SUBMIT STARTED ===");
        // console.log("personalFormData:", personalFormData);
        // console.log("employee:", employee);
        console.log("socket:", socket);
        // Validate required fields
        if (!personalFormData.passportNo || !personalFormData.passportExpiryDate ||
            !personalFormData.nationality || !personalFormData.religion || personalFormData.maritalStatus === "Select") {
            console.log("Validation failed - missing required fields");
            react_toastify_1.toast.error("Please fill all required fields!", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        if (!socket || !employee) {
            // console.log("Socket or employee not available");
            react_toastify_1.toast.error("Cannot save personal details at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        // Submit personal details to backend
        var payload = {
            employeeId: employee.employeeId,
            personal: {
                passport: {
                    number: personalFormData.passportNo,
                    expiryDate: personalFormData.passportExpiryDate ? dayjs_1["default"](personalFormData.passportExpiryDate).toISOString() : "",
                    country: personalFormData.nationality
                },
                religion: personalFormData.religion,
                maritalStatus: personalFormData.maritalStatus,
                employmentOfSpouse: personalFormData.maritalStatus === "Yes" ? personalFormData.employmentOfSpouse : "",
                noOfChildren: personalFormData.maritalStatus === "Yes" ? personalFormData.noOfChildren : 0
            }
        };
        socket.emit("hrm/employees/update-personal", payload);
        react_toastify_1.toast.success("Personal details update request sent!", {
            position: "top-right",
            autoClose: 3000
        });
        // Close modal programmatically
        var closeButton = document.querySelector('#edit_personal [data-bs-dismiss="modal"]');
        if (closeButton)
            closeButton.click();
    };
    var resetPersonalForm = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        setPersonalFormData({
            passportNo: ((_b = (_a = employee.personal) === null || _a === void 0 ? void 0 : _a.passport) === null || _b === void 0 ? void 0 : _b.number) || "",
            passportExpiryDate: ((_d = (_c = employee.personal) === null || _c === void 0 ? void 0 : _c.passport) === null || _d === void 0 ? void 0 : _d.expiryDate) ? dayjs_1["default"](employee.personal.passport.expiryDate) : null,
            nationality: ((_f = (_e = employee.personal) === null || _e === void 0 ? void 0 : _e.passport) === null || _f === void 0 ? void 0 : _f.country) || "",
            religion: ((_g = employee.personal) === null || _g === void 0 ? void 0 : _g.religion) || "",
            maritalStatus: ((_h = employee.personal) === null || _h === void 0 ? void 0 : _h.maritalStatus) || "Select",
            employmentOfSpouse: ((_j = employee.personal) === null || _j === void 0 ? void 0 : _j.employmentOfSpouse) ? "Yes" : "No",
            noOfChildren: ((_k = employee.personal) === null || _k === void 0 ? void 0 : _k.noOfChildren) || 0
        });
    };
    // handleEmergency form validation and submission
    var handleEmergencyFormSubmit = function (e) {
        e.preventDefault();
        // 1. Validate required fields
        if (!emergencyFormData.name || !emergencyFormData.relationship || !emergencyFormData.phone1) {
            console.log("Validation failed - missing required fields");
            react_toastify_1.toast.error("Name, Relationship, and Phone No 1 are required!", {
                position: "top-right",
                autoClose: 3000
            });
            return; // STOP here – don't close modal
        }
        console.log("Validation passed");
        if (!socket || !employee) {
            react_toastify_1.toast.error("Cannot save emergency contact at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        // 2. Prepare payload
        var phones = [emergencyFormData.phone1];
        if (emergencyFormData.phone2) {
            phones.push(emergencyFormData.phone2);
        }
        var payload = {
            employeeId: employee.employeeId,
            emergencyContacts: [{
                    name: emergencyFormData.name,
                    relationship: emergencyFormData.relationship,
                    phone: phones
                }]
        };
        socket.emit("hrm/employees/update-emergency", payload);
        // toast.success("Emergency contact update request sent!", {
        //     position: "top-right",
        //     autoClose: 3000,
        // });
        // 3. Close modal ONLY after everything passes
        var closeButton = document.querySelector('#edit_emergency [data-bs-dismiss="modal"]');
        if (closeButton) {
            closeButton.click();
        }
    };
    var resetEmergencyModel = function () {
        var _a, _b, _c, _d, _e, _f;
        setEmergencyFormData({
            name: ((_a = employee.emergencyContacts) === null || _a === void 0 ? void 0 : _a.name) || "",
            relationship: ((_b = employee.emergencyContacts) === null || _b === void 0 ? void 0 : _b.relationship) || "",
            phone1: ((_d = (_c = employee.emergencyContacts) === null || _c === void 0 ? void 0 : _c.phone) === null || _d === void 0 ? void 0 : _d[0]) || "",
            phone2: ((_f = (_e = employee.emergencyContacts) === null || _e === void 0 ? void 0 : _e.phone) === null || _f === void 0 ? void 0 : _f[1]) || ""
        });
    };
    // Handle experience form validation and submission
    var handleExperienceFormSubmit = function (e) {
        e.preventDefault();
        if (!socket || !employee) {
            react_toastify_1.toast.error("Cannot save experience details at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        var payload = {
            employeeId: employee.employeeId,
            experienceDetails: {
                companyName: experienceFormData.company,
                designation: experienceFormData.designation,
                startDate: experienceFormData.startDate,
                endDate: experienceFormData.endDate
            }
        };
        socket.emit("hrm/employees/update-experience", payload);
        react_toastify_1.toast.success("Experience details add request sent!", {
            position: "top-right",
            autoClose: 3000
        });
        // Close modal programmatically
        var closeButton = document.querySelector('#add_experience [data-bs-dismiss="modal"]');
        if (closeButton)
            closeButton.click();
    };
    var resetExperienceForm = function () {
        var _a, _b, _c, _d;
        setExperienceFormData({
            company: ((_a = employee.experience) === null || _a === void 0 ? void 0 : _a.previousCompany) || "",
            designation: ((_b = employee.experience) === null || _b === void 0 ? void 0 : _b.designation) || "",
            startDate: ((_c = employee.experience) === null || _c === void 0 ? void 0 : _c.startDate) || "",
            endDate: ((_d = employee.experience) === null || _d === void 0 ? void 0 : _d.endDate) || ""
        });
    };
    var handleAboutSubmit = function (e) {
        e.preventDefault();
        // Validate about field
        if (!aboutFormData.about || aboutFormData.about.trim() === "") {
            react_toastify_1.toast.error("About content cannot be empty!", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        if (!socket || !employee) {
            react_toastify_1.toast.error("Cannot update about at this time.", {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }
        try {
            setLoading(true);
            var payload = {
                employeeId: employee.employeeId,
                about: aboutFormData.about
            };
            socket.emit("hrm/employees/update-about", payload);
            react_toastify_1.toast.success("Employee about update request sent!", {
                position: "top-right",
                autoClose: 3000
            });
            // Optionally close modal if present
            var closeButton = document.querySelector('#edit_about [data-bs-dismiss="modal"]');
            if (closeButton)
                closeButton.click();
        }
        catch (error) {
            react_toastify_1.toast.error("Failed to update about", {
                position: "top-right",
                autoClose: 3000
            });
            console.error("About update error:", error);
        }
        finally {
            setLoading(false);
        }
    };
    var resetAboutForm = function () {
        setAboutFormData({
            about: typeof (employee === null || employee === void 0 ? void 0 : employee.about) === 'string' ? employee.about : ""
        });
    };
    // Permissions handlers
    var toggleModule = function (module) {
        setPermissions(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { enabledModules: __assign(__assign({}, prev.enabledModules), (_a = {}, _a[module] = !prev.enabledModules[module], _a)) }));
        });
    };
    var toggleSelectAllForModule = function (module) {
        setPermissions(function (prev) {
            var _a, _b;
            var newSelectAllState = !prev.selectAll[module];
            var newPermissionsForModule = ACTIONS.reduce(function (acc, action) {
                acc[action] = newSelectAllState;
                return acc;
            }, {});
            return __assign(__assign({}, prev), { permissions: __assign(__assign({}, prev.permissions), (_a = {}, _a[module] = newPermissionsForModule, _a)), selectAll: __assign(__assign({}, prev.selectAll), (_b = {}, _b[module] = newSelectAllState, _b)) });
        });
    };
    var toggleAllModules = function (enable) {
        setPermissions(function (prev) {
            var newEnabledModules = MODULES.reduce(function (acc, module) {
                acc[module] = enable;
                return acc;
            }, {});
            return __assign(__assign({}, prev), { enabledModules: newEnabledModules });
        });
    };
    var toggleGlobalSelectAll = function (checked) {
        setPermissions(function (prev) {
            // Build new permissions for every module & action
            var newPermissions = MODULES.reduce(function (accModules, module) {
                var newModulePermissions = ACTIONS.reduce(function (accActions, action) {
                    accActions[action] = checked;
                    return accActions;
                }, {});
                accModules[module] = newModulePermissions;
                return accModules;
            }, {});
            // Build new selectAll flags for every module
            var newSelectAll = MODULES.reduce(function (acc, module) {
                acc[module] = checked;
                return acc;
            }, {});
            return __assign(__assign({}, prev), { permissions: newPermissions, selectAll: newSelectAll });
        });
    };
    var handlePermissionChange = function (module, action, checked) {
        setPermissions(function (prev) {
            var _a, _b, _c;
            var updatedModulePermissions = __assign(__assign({}, prev.permissions[module]), (_a = {}, _a[action] = checked, _a));
            // Check if all actions selected for this module
            var allSelected = ACTIONS.every(function (act) { return updatedModulePermissions[act]; });
            return __assign(__assign({}, prev), { permissions: __assign(__assign({}, prev.permissions), (_b = {}, _b[module] = updatedModulePermissions, _b)), selectAll: __assign(__assign({}, prev.selectAll), (_c = {}, _c[module] = allSelected, _c)) });
        });
    };
    var allPermissionsSelected = function () {
        return MODULES.every(function (module) {
            return ACTIONS.every(function (action) { return permissions.permissions[module][action]; });
        });
    };
    var employeeId = react_router_dom_1.useParams().employeeId;
    var _54 = react_1.useState(null), error = _54[0], setError = _54[1];
    var _55 = react_1.useState(true), loading = _55[0], setLoading = _55[1];
    var _56 = react_1.useState(null), employee = _56[0], setEmployee = _56[1];
    var socket = SocketContext_1.useSocket();
    var _57 = react_1.useState({
        password: false,
        confirmPassword: false
    }), passwordVisibility = _57[0], setPasswordVisibility = _57[1];
    var _58 = react_1.useState([]), policies = _58[0], setPolicies = _58[1];
    var _59 = react_1.useState(false), policiesLoading = _59[0], setPoliciesLoading = _59[1];
    var _60 = react_1.useState(null), viewingPolicy = _60[0], setViewingPolicy = _60[1];
    var _61 = react_1.useState([]), department = _61[0], setDepartment = _61[1];
    var _62 = react_1.useState([]), designation = _62[0], setDesignation = _62[1];
    var _63 = react_1.useState([]), promotions = _63[0], setPromotions = _63[1];
    var _64 = react_1.useState(false), promotionsLoading = _64[0], setPromotionsLoading = _64[1];
    var _65 = react_1.useState([]), resignations = _65[0], setResignations = _65[1];
    var _66 = react_1.useState(false), resignationsLoading = _66[0], setResignationsLoading = _66[1];
    var _67 = react_1.useState([]), terminations = _67[0], setTerminations = _67[1];
    var _68 = react_1.useState(false), terminationsLoading = _68[0], setTerminationsLoading = _68[1];
    // Initialize edit form data when employee data is loaded
    react_1.useEffect(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18;
        if (employee) {
            setEditingEmployee(employee);
            setEditFormData(__assign(__assign({}, employee), { dateOfJoining: employee.dateOfJoining || "", personal: __assign(__assign({}, employee.personal), { birthday: ((_a = employee.personal) === null || _a === void 0 ? void 0 : _a.birthday) || null, gender: ((_b = employee.personal) === null || _b === void 0 ? void 0 : _b.gender) || "", address: {
                        street: ((_d = (_c = employee.personal) === null || _c === void 0 ? void 0 : _c.address) === null || _d === void 0 ? void 0 : _d.street) || "",
                        city: ((_f = (_e = employee.personal) === null || _e === void 0 ? void 0 : _e.address) === null || _f === void 0 ? void 0 : _f.city) || "",
                        state: ((_h = (_g = employee.personal) === null || _g === void 0 ? void 0 : _g.address) === null || _h === void 0 ? void 0 : _h.state) || "",
                        postalCode: ((_k = (_j = employee.personal) === null || _j === void 0 ? void 0 : _j.address) === null || _k === void 0 ? void 0 : _k.postalCode) || "",
                        country: ((_m = (_l = employee.personal) === null || _l === void 0 ? void 0 : _l.address) === null || _m === void 0 ? void 0 : _m.country) || ""
                    } }) }));
            // Initialize bank form data
            setBankFormData({
                bankName: ((_o = employee.bank) === null || _o === void 0 ? void 0 : _o.bankName) || "",
                accountNumber: ((_p = employee.bank) === null || _p === void 0 ? void 0 : _p.accountNumber) || "",
                ifscCode: ((_q = employee.bank) === null || _q === void 0 ? void 0 : _q.ifscCode) || "",
                branch: ((_r = employee.bank) === null || _r === void 0 ? void 0 : _r.branch) || ""
            });
            // Initialize personal form data
            setPersonalFormData({
                passportNo: ((_t = (_s = employee.personal) === null || _s === void 0 ? void 0 : _s.passport) === null || _t === void 0 ? void 0 : _t.number) || "",
                passportExpiryDate: ((_v = (_u = employee.personal) === null || _u === void 0 ? void 0 : _u.passport) === null || _v === void 0 ? void 0 : _v.expiryDate) ? dayjs_1["default"](employee.personal.passport.expiryDate) : null,
                nationality: ((_x = (_w = employee.personal) === null || _w === void 0 ? void 0 : _w.passport) === null || _x === void 0 ? void 0 : _x.country) || "",
                religion: ((_y = employee.personal) === null || _y === void 0 ? void 0 : _y.religion) || "",
                maritalStatus: ((_z = employee.personal) === null || _z === void 0 ? void 0 : _z.maritalStatus) || "Select",
                employmentOfSpouse: ((_0 = employee.personal) === null || _0 === void 0 ? void 0 : _0.employmentOfSpouse) ? "Yes" : "No",
                noOfChildren: ((_1 = employee.personal) === null || _1 === void 0 ? void 0 : _1.noOfChildren) || 0
            });
            setFamilyFormData({
                familyMemberName: ((_2 = employee.family) === null || _2 === void 0 ? void 0 : _2.Name) || "",
                relationship: ((_3 = employee.family) === null || _3 === void 0 ? void 0 : _3.relationship) || "",
                phone: ((_4 = employee.family) === null || _4 === void 0 ? void 0 : _4.phone) || ""
            });
            // Initialize education form data
            setEducationFormData({
                institution: ((_5 = employee.education) === null || _5 === void 0 ? void 0 : _5.institution) || "",
                course: ((_6 = employee.education) === null || _6 === void 0 ? void 0 : _6.degree) || "",
                startDate: ((_7 = employee.education) === null || _7 === void 0 ? void 0 : _7.startDate) ? dayjs_1["default"](employee.education.startDate) : null,
                endDate: ((_8 = employee.education) === null || _8 === void 0 ? void 0 : _8.endDate) ? dayjs_1["default"](employee.education.endDate) : null
            });
            setEmergencyFormData({
                name: ((_9 = employee.emergencyContacts) === null || _9 === void 0 ? void 0 : _9.name) || "",
                relationship: ((_10 = employee.emergencyContacts) === null || _10 === void 0 ? void 0 : _10.relationship) || "",
                phone1: ((_12 = (_11 = employee.emergencyContacts) === null || _11 === void 0 ? void 0 : _11.phone) === null || _12 === void 0 ? void 0 : _12[0]) || "",
                phone2: ((_14 = (_13 = employee.emergencyContacts) === null || _13 === void 0 ? void 0 : _13.phone) === null || _14 === void 0 ? void 0 : _14[1]) || ""
            });
            setExperienceFormData({
                company: ((_15 = employee.experience) === null || _15 === void 0 ? void 0 : _15.previousCompany) || "",
                designation: ((_16 = employee.experience) === null || _16 === void 0 ? void 0 : _16.designation) || "",
                startDate: ((_17 = employee.experience) === null || _17 === void 0 ? void 0 : _17.startDate) || "",
                endDate: ((_18 = employee.experience) === null || _18 === void 0 ? void 0 : _18.endDate) || ""
            });
            setAboutFormData({
                about: typeof employee.about === 'string' ? employee.about : ""
            });
        }
    }, [employee]);
    // Handle edit form changes
    var handleEditFormChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        if (name.includes('.')) {
            var parts_1 = name.split('.');
            setEditFormData(function (prev) {
                var _a, _b, _c;
                var _d;
                if (parts_1.length === 3 && parts_1[0] === 'personal' && parts_1[1] === 'address') {
                    // Handle personal.address.field updates
                    var currentAddress = ((_d = prev.personal) === null || _d === void 0 ? void 0 : _d.address) || {
                        street: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: ""
                    };
                    return __assign(__assign({}, prev), { personal: __assign(__assign({}, prev.personal), { address: __assign(__assign({}, currentAddress), (_a = {}, _a[parts_1[2]] = value, _a)) }) });
                }
                else if (parts_1.length === 2) {
                    // Handle other nested fields
                    var parent = parts_1[0], child = parts_1[1];
                    return __assign(__assign({}, prev), (_b = {}, _b[parent] = __assign(__assign({}, prev[parent]), (_c = {}, _c[child] = value, _c)), _b));
                }
                return prev;
            });
        }
        else {
            setEditFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
    };
    var handleEditSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var lifecycleStatuses, currentStatus, payload;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            if (e)
                e.preventDefault();
            if (!editFormData || !socket) {
                react_toastify_1.toast.error("No employee data available for editing.");
                return [2 /*return*/];
            }
            lifecycleStatuses = ["Terminated", "Resigned", "On Notice"];
            currentStatus = editFormData.status || "Active";
            payload = {
                employeeId: editFormData.employeeId || "",
                firstName: editFormData.firstName || "",
                lastName: editFormData.lastName || "",
                account: {
                    userName: ((_a = editFormData.account) === null || _a === void 0 ? void 0 : _a.userName) || ""
                },
                contact: {
                    email: ((_b = editFormData.contact) === null || _b === void 0 ? void 0 : _b.email) || "",
                    phone: ((_c = editFormData.contact) === null || _c === void 0 ? void 0 : _c.phone) || ""
                },
                personal: {
                    gender: ((_d = editFormData.personal) === null || _d === void 0 ? void 0 : _d.gender) || "",
                    birthday: ((_e = editFormData.personal) === null || _e === void 0 ? void 0 : _e.birthday) || null,
                    address: ((_f = editFormData.personal) === null || _f === void 0 ? void 0 : _f.address) || {
                        street: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: ""
                    }
                },
                companyName: editFormData.companyName || "",
                departmentId: editFormData.departmentId || "",
                designationId: editFormData.designationId || "",
                dateOfJoining: editFormData.dateOfJoining || null,
                about: editFormData.about || "",
                avatarUrl: editFormData.avatarUrl || ""
            };
            // Only include status if it's NOT a lifecycle status
            // Lifecycle statuses should only be set through termination/resignation workflows
            if (!lifecycleStatuses.includes(currentStatus)) {
                payload.status = currentStatus;
            }
            try {
                socket.emit("hrm/employees/update", payload);
                react_toastify_1.toast.success("Employee update request sent.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
            catch (error) {
                react_toastify_1.toast.error("Failed to update employee.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
            return [2 /*return*/];
        });
    }); };
    var handleDepartmentResponse = function (response) {
        if (response.done && Array.isArray(response.data)) {
            var mappedDepartments = response.data.map(function (d) { return ({
                value: d._id,
                label: d.department
            }); });
            setDepartment(__spreadArrays([{ value: "", label: "Select" }], mappedDepartments));
        }
    };
    var handleDesignationResponse = function (response) {
        if (response.done && Array.isArray(response.data)) {
            var mappedDesignations = response.data.map(function (d) { return ({
                value: d._id,
                label: d.designation
            }); });
            setDesignation(__spreadArrays([{ value: "", label: "Select" }], mappedDesignations));
        }
    };
    react_1.useEffect(function () {
        if (!socket || !employeeId)
            return;
        var isMounted = true;
        setLoading(true);
        var timeoutId = setTimeout(function () {
            if (loading && isMounted) {
                console.warn("Employees loading timeout - showing fallback");
                setError("Employees loading timed out. Please refresh the page.");
                setLoading(false);
            }
        }, 30000);
        var payload = {
            employeeId: employeeId
        };
        socket.emit("hrm/employees/get-details", payload);
        // Fetch policies
        setPoliciesLoading(true);
        socket.emit("hr/policy/get");
        // Fetch departments for Edit Employee modal
        socket.emit("hr/departments/get");
        // Fetch promotions for this employee
        setPromotionsLoading(true);
        console.log('[EmployeeDetails] Emitting promotion:getAll');
        socket.emit("promotion:getAll", {});
        // Fetch resignations for this employee
        setResignationsLoading(true);
        console.log('[EmployeeDetails] Emitting hr/resignation/resignationlist');
        socket.emit("hr/resignation/resignationlist", { type: "alltime" });
        // Fetch terminations for this employee
        setTerminationsLoading(true);
        console.log('[EmployeeDetails] Emitting hr/termination/terminationlist');
        socket.emit("hr/termination/terminationlist", { type: "alltime" });
        var handleDetailsResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                setEmployee(response.data);
                setError(null);
                setLoading(false);
            }
            else {
                console.log(error);
                setError(response.error || "Failed to fetch details");
                setLoading(false);
            }
        };
        var handleUpdateEmployeeResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Employee updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
                setError(null);
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update employee.", {
                    position: "top-right",
                    autoClose: 3000
                });
                setError(response.error || "Failed to update employee.");
            }
        };
        var handleBankUpdateResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Bank details updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update bank details.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handlePersonalUpdateResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Personal details updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update personal details.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handleFamilyUpdateResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Family details updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update personal details.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handleEducataionUpdateResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Education details updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update education details.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handleEmergencyUpdateResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Emergency contact updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update emergency contact.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handleExperienceResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("Experience details added successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to add experience details.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handleAboutResponse = function (response) {
            if (response.done) {
                react_toastify_1.toast.success("About information updated successfully!", {
                    position: "top-right",
                    autoClose: 3000
                });
                // Refresh employee details
                if (socket) {
                    socket.emit("hrm/employees/get-details", { employeeId: employeeId });
                }
            }
            else {
                react_toastify_1.toast.error(response.error || "Failed to update about information.", {
                    position: "top-right",
                    autoClose: 3000
                });
            }
        };
        var handleGetPolicyResponse = function (response) {
            setPoliciesLoading(false);
            if (!isMounted)
                return;
            if (response.done) {
                setPolicies(response.data || []);
            }
            else {
                console.error("Failed to fetch policies:", response.error);
                setPolicies([]);
            }
        };
        var handleGetPromotionsResponse = function (response) {
            var _a;
            console.log('[EmployeeDetails] Received promotions response:', response);
            setPromotionsLoading(false);
            if (!isMounted)
                return;
            if (response.done) {
                console.log('[EmployeeDetails] Setting promotions, count:', ((_a = response.data) === null || _a === void 0 ? void 0 : _a.length) || 0);
                console.log('[EmployeeDetails] Promotion data:', response.data);
                setPromotions(response.data || []);
            }
            else {
                console.error("[EmployeeDetails] Failed to fetch promotions:", response.error);
                setPromotions([]);
            }
        };
        // Handle promotion create/update to refresh the list automatically
        var handlePromotionCreateResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                // Refresh promotions list to show the new promotion
                socket.emit("promotion:getAll", {});
                // Also refresh employee details as they might have changed
                socket.emit("hrm/employees/get-details", { employeeId: employeeId });
            }
        };
        var handlePromotionUpdateResponse = function (response) {
            if (!isMounted)
                return;
            if (response.done) {
                // Refresh promotions list to show updated promotion
                socket.emit("promotion:getAll", {});
                // Also refresh employee details as they might have changed
                socket.emit("hrm/employees/get-details", { employeeId: employeeId });
            }
        };
        var handleGetResignationsResponse = function (response) {
            var _a;
            console.log('[EmployeeDetails] Received resignations response:', response);
            setResignationsLoading(false);
            if (!isMounted)
                return;
            if (response.done) {
                console.log('[EmployeeDetails] Setting resignations, count:', ((_a = response.data) === null || _a === void 0 ? void 0 : _a.length) || 0);
                console.log('[EmployeeDetails] Resignation data:', response.data);
                setResignations(response.data || []);
            }
            else {
                console.error("[EmployeeDetails] Failed to fetch resignations:", response.error);
                setResignations([]);
            }
        };
        var handleGetTerminationsResponse = function (response) {
            var _a;
            console.log('[EmployeeDetails] Received terminations response:', response);
            setTerminationsLoading(false);
            if (!isMounted)
                return;
            if (response.done) {
                console.log('[EmployeeDetails] Setting terminations, count:', ((_a = response.data) === null || _a === void 0 ? void 0 : _a.length) || 0);
                console.log('[EmployeeDetails] Termination data:', response.data);
                setTerminations(response.data || []);
            }
            else {
                console.error("[EmployeeDetails] Failed to fetch terminations:", response.error);
                setTerminations([]);
            }
        };
        socket.on("hrm/employees/get-details-response", handleDetailsResponse);
        socket.on("hrm/employees/update-response", handleUpdateEmployeeResponse);
        socket.on("hrm/employees/update-bank-response", handleBankUpdateResponse);
        socket.on("hrm/employees/update-personal-response", handlePersonalUpdateResponse);
        socket.on("hrm/employees/update-family-response", handleFamilyUpdateResponse);
        socket.on("hrm/employees/update-education-response", handleEducataionUpdateResponse);
        socket.on("hrm/employees/update-emergency-response", handleEmergencyUpdateResponse);
        socket.on("hrm/employees/update-experience-response", handleExperienceResponse);
        socket.on("hrm/employees/update-about-response", handleAboutResponse);
        socket.on("hr/policy/get-response", handleGetPolicyResponse);
        socket.on("hr/departments/get-response", handleDepartmentResponse);
        socket.on("hrm/designations/get-response", handleDesignationResponse);
        socket.on("promotion:getAll:response", handleGetPromotionsResponse);
        socket.on("promotion:create:response", handlePromotionCreateResponse);
        socket.on("promotion:update:response", handlePromotionUpdateResponse);
        socket.on("hr/resignation/resignationlist-response", handleGetResignationsResponse);
        socket.on("hr/termination/terminationlist-response", handleGetTerminationsResponse);
        return function () {
            socket.off("hrm/employees/get-details-response", handleDetailsResponse);
            socket.off("hrm/employees/update-response", handleUpdateEmployeeResponse);
            socket.off("hrm/employees/update-bank-response", handleBankUpdateResponse);
            socket.off("hrm/employees/update-personal-response", handlePersonalUpdateResponse);
            socket.off("hrm/employees/update-family-response", handleFamilyUpdateResponse);
            socket.off("hrm/employees/update-education-response", handleEducataionUpdateResponse);
            socket.off("hrm/employees/update-emergency-response", handleEmergencyUpdateResponse);
            socket.off("hrm/employees/update-experience-response", handleExperienceResponse);
            socket.off("hrm/employees/update-about-response", handleAboutResponse);
            socket.off("hr/policy/get-response", handleGetPolicyResponse);
            socket.off("hr/departments/get-response", handleDepartmentResponse);
            socket.off("hrm/designations/get-response", handleDesignationResponse);
            socket.off("promotion:getAll:response", handleGetPromotionsResponse);
            socket.off("promotion:create:response", handlePromotionCreateResponse);
            socket.off("promotion:update:response", handlePromotionUpdateResponse);
            socket.off("hr/resignation/resignationlist-response", handleGetResignationsResponse);
            socket.off("hr/termination/terminationlist-response", handleGetTerminationsResponse);
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [socket, employeeId]);
    // Filter policies that apply to the current employee
    var getApplicablePolicies = function () {
        if (!employee || !policies.length)
            return [];
        return policies.filter(function (policy) {
            // If applyToAll is true, this policy applies to ALL employees (current and future)
            if (policy.applyToAll === true)
                return true;
            // If no assignTo mappings and not applyToAll, the policy doesn't apply to anyone
            if (!policy.assignTo || policy.assignTo.length === 0)
                return false;
            // Check if any department-designation mapping matches the employee
            return policy.assignTo.some(function (mapping) {
                // Check if the department matches
                if (mapping.departmentId !== employee.departmentId)
                    return false;
                // Check if the employee's designation is included
                return mapping.designationIds.includes(employee.designationId);
            });
        });
    };
    var applicablePolicies = getApplicablePolicies();
    // Get employee's most recent promotion (if any)
    var getEmployeePromotion = function () {
        if (!employee || !promotions.length) {
            console.log('[EmployeeDetails] No promotion data:', {
                hasEmployee: !!employee,
                promotionsCount: promotions.length
            });
            return null;
        }
        console.log('[EmployeeDetails] Checking promotions:', {
            employeeId: employee._id,
            employeeEmployeeId: employee.employeeId,
            totalPromotions: promotions.length,
            promotionEmployeeIds: promotions.map(function (p) {
                var _a, _b;
                return ({
                    promotionId: p._id,
                    employeeId: (_a = p.employee) === null || _a === void 0 ? void 0 : _a.id,
                    employeeName: (_b = p.employee) === null || _b === void 0 ? void 0 : _b.name
                });
            })
        });
        // Filter promotions for this specific employee
        // Check multiple possible ID fields to ensure we find the promotion
        var employeePromotions = promotions.filter(function (promo) {
            var _a;
            var promoEmployeeId = (_a = promo.employee) === null || _a === void 0 ? void 0 : _a.id;
            var matches = promoEmployeeId === employee._id ||
                promoEmployeeId === employee.employeeId ||
                promoEmployeeId === employeeId; // Also check the route param
            if (matches) {
                console.log('[EmployeeDetails] Found matching promotion:', promo);
            }
            return matches;
        });
        console.log('[EmployeeDetails] Filtered promotions for employee:', employeePromotions.length);
        if (employeePromotions.length === 0)
            return null;
        // Sort by promotion date (most recent first) and return the first one
        var sortedPromotions = employeePromotions.sort(function (a, b) {
            return new Date(b.promotionDate).getTime() - new Date(a.promotionDate).getTime();
        });
        console.log('[EmployeeDetails] Returning promotion:', sortedPromotions[0]);
        return sortedPromotions[0];
    };
    var employeePromotion = getEmployeePromotion();
    // Get employee's most recent resignation (if any)
    var getEmployeeResignation = function () {
        if (!employee || !resignations.length) {
            console.log('[EmployeeDetails] No resignation data:', {
                hasEmployee: !!employee,
                resignationsCount: resignations.length
            });
            return null;
        }
        if (!employee._id && !employee.employeeId) {
            console.log('[EmployeeDetails] Employee missing ID fields:', {
                _id: employee._id,
                employeeId: employee.employeeId
            });
            return null;
        }
        console.log('[EmployeeDetails] Checking resignations:', {
            employeeId: employee._id,
            employeeEmployeeId: employee.employeeId,
            totalResignations: resignations.length,
            resignationEmployeeIds: resignations.map(function (r) { return ({
                resignationId: r.resignationId,
                employeeId: r.employeeId,
                employeeName: r.employeeName
            }); })
        });
        // Filter resignations for this specific employee
        var employeeResignations = resignations.filter(function (resignation) {
            var matches = resignation.employeeId === employee._id ||
                resignation.employeeId === employee.employeeId ||
                resignation.employeeId === employeeId; // Also check the route param
            if (matches) {
                console.log('[EmployeeDetails] Found matching resignation:', resignation);
            }
            return matches;
        });
        console.log('[EmployeeDetails] Filtered resignations for employee:', employeeResignations.length);
        if (employeeResignations.length === 0)
            return null;
        // Sort by resignation date (most recent first) and return the first one
        var sortedResignations = employeeResignations.sort(function (a, b) {
            return new Date(b.resignationDate).getTime() - new Date(a.resignationDate).getTime();
        });
        console.log('[EmployeeDetails] Returning resignation:', sortedResignations[0]);
        return sortedResignations[0];
    };
    var employeeResignation = getEmployeeResignation();
    // Get employee's most recent termination (if any)
    var getEmployeeTermination = function () {
        if (!employee || !terminations.length) {
            console.log('[EmployeeDetails] No termination data:', {
                hasEmployee: !!employee,
                terminationsCount: terminations.length
            });
            return null;
        }
        if (!employee._id && !employee.employeeId) {
            console.log('[EmployeeDetails] Employee missing ID fields:', {
                _id: employee._id,
                employeeId: employee.employeeId
            });
            return null;
        }
        console.log('[EmployeeDetails] Checking terminations:', {
            employeeId: employee._id,
            employeeEmployeeId: employee.employeeId,
            totalTerminations: terminations.length,
            terminationEmployeeIds: terminations.map(function (t) { return ({
                terminationId: t.terminationId,
                employeeId: t.employeeId,
                employeeName: t.employeeName
            }); })
        });
        // Filter terminations for this specific employee
        var employeeTerminations = terminations.filter(function (termination) {
            // Handle both employee_id (ObjectId string) and employeeId (EMP-XXXX)
            var matches = termination.employee_id === employee._id ||
                termination.employee_id === employee.employeeId ||
                termination.employee_id === employeeId; // Also check the route param
            if (matches) {
                console.log('[EmployeeDetails] Found matching termination:', termination);
            }
            return matches;
        });
        console.log('[EmployeeDetails] Filtered terminations for employee:', employeeTerminations.length);
        if (employeeTerminations.length === 0)
            return null;
        // Sort by termination date (most recent first) and return the first one
        var sortedTerminations = employeeTerminations.sort(function (a, b) {
            return new Date(b.terminationDate).getTime() - new Date(a.terminationDate).getTime();
        });
        console.log('[EmployeeDetails] Returning termination:', sortedTerminations[0]);
        return sortedTerminations[0];
    };
    var employeeTermination = getEmployeeTermination();
    if (!employeeId) {
        return (react_1["default"].createElement("div", { className: 'alert alert-warning d-flex align-items-center justify-content-center pt-50 mt-5' },
            react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.employeeList, className: "btn btn-outline-primary btn-sm" }, "Select an employee from the Employee List")));
    }
    if (loading) {
        return react_1["default"].createElement("p", { className: 'text-center' }, "Loading employee data");
    }
    if (error && !employee) {
        return (react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "alert alert-danger", role: "alert" },
                    react_1["default"].createElement("h4", { className: "alert-heading" }, "Error!"),
                    react_1["default"].createElement("p", null, error)))));
    }
    var togglePasswordVisibility = function (field) {
        setPasswordVisibility(function (prevState) {
            var _a;
            return (__assign(__assign({}, prevState), (_a = {}, _a[field] = !prevState[field], _a)));
        });
    };
    var getModalContainer = function () {
        var activeModal = document.querySelector('.modal.show');
        if (activeModal instanceof HTMLElement) {
            return activeModal;
        }
        var fallbackModal = document.getElementById('modal-datepicker');
        return fallbackModal || document.body;
    };
    var getModalContainer2 = function () {
        var activeModal = document.querySelector('.modal.show');
        if (activeModal instanceof HTMLElement) {
            return activeModal;
        }
        var fallbackModal = document.getElementById('modal_datepicker');
        return fallbackModal || document.body;
    };
    var data = employeereportDetails_1.employeereportDetails;
    var columns = [
        {
            title: "Name",
            dataIndex: "Name",
            render: function (text, record) { return (react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.employeedetails, className: "link-default" }, "Emp-001")); },
            sorter: function (a, b) { return a.Name.length - b.Name.length; }
        },
        {
            title: "Email",
            dataIndex: "Email",
            sorter: function (a, b) { return a.Email.length - b.Email.length; }
        },
        {
            title: "Created Date",
            dataIndex: "CreatedDate",
            sorter: function (a, b) { return a.CreatedDate.length - b.CreatedDate.length; }
        },
        {
            title: "Role",
            dataIndex: "Role",
            render: function (text, record) { return (react_1["default"].createElement("span", { className: "badge d-inline-flex align-items-center badge-xs " + (text === 'Employee' ? 'badge-pink-transparent' : 'badge-soft-purple') }, text)); },
            sorter: function (a, b) { return a.Role.length - b.Role.length; }
        },
        {
            title: "Status",
            dataIndex: "Status",
            render: function (text, record) { return (react_1["default"].createElement("span", { className: "badge d-inline-flex align-items-center badge-xs " + (text === 'Active' ? 'badge-success' : 'badge-danger') },
                react_1["default"].createElement("i", { className: "ti ti-point-filled me-1" }),
                text)); },
            sorter: function (a, b) { return a.Status.length - b.Status.length; }
        },
    ];
    // Department and designation options are now fetched dynamically from database
    // via socket events and stored in state variables: department, designation
    var martialstatus = [
        { value: "Select", label: "Select" },
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
    ];
    var salaryChoose = [
        { value: "Select", label: "Select" },
        { value: "Monthly", label: "Monthly" },
        { value: "Annualy", label: "Annualy" },
    ];
    var paymenttype = [
        { value: "Select", label: "Select" },
        { value: "Cash", label: "Cash" },
        { value: "Debit Card", label: "Debit Card" },
        { value: "Mobile Payment", label: "Mobile Payment" },
    ];
    var pfcontribution = [
        { value: "Select", label: "Select" },
        { value: "Employee Contribution", label: "Employee Contribution" },
        { value: "Employer Contribution", label: "Employer Contribution" },
        { value: "Provident Fund Interest", label: "Provident Fund Interest" },
    ];
    var additionalrate = [
        { value: "Select", label: "Select" },
        { value: "ESI", label: "ESI" },
        { value: "EPS", label: "EPS" },
        { value: "EPF", label: "EPF" },
    ];
    var esi = [
        { value: "Select", label: "Select" },
        { value: "Employee Contribution", label: "Employee Contribution" },
        { value: "Employer Contribution", label: "Employer Contribution" },
        { value: "Maternity Benefit ", label: "Maternity Benefit " },
    ];
    function formatDate(isoDateString) {
        if (!isoDateString)
            return ""; // handle undefined or empty
        var date = new Date(isoDateString);
        if (isNaN(date.getTime()))
            return "";
        var day = date.getDate();
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var month = monthNames[date.getMonth()];
        var year = date.getFullYear();
        return day + " " + month + " " + year;
    }
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        react_1["default"].createElement("div", { className: "page-wrapper" },
            react_1["default"].createElement("div", { className: "content" },
                react_1["default"].createElement("div", { className: "d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3" },
                    react_1["default"].createElement("div", { className: "my-auto mb-2" },
                        react_1["default"].createElement("h6", { className: "fw-medium d-inline-flex align-items-center mb-3 mb-sm-0" },
                            react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.employeeList },
                                react_1["default"].createElement("i", { className: "ti ti-arrow-left me-2" }),
                                "Employee List"))),
                    react_1["default"].createElement("div", { className: "d-flex my-xl-auto right-content align-items-center flex-wrap " },
                        react_1["default"].createElement("div", { className: "mb-2" },
                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#add_bank_satutory", className: "btn btn-primary d-flex align-items-center" },
                                react_1["default"].createElement("i", { className: "ti ti-circle-plus me-2" }),
                                "Bank & Statutory")),
                        react_1["default"].createElement("div", { className: "head-icons ms-2" },
                            react_1["default"].createElement(collapse_header_1["default"], null)))),
                react_1["default"].createElement("div", { className: "row" },
                    react_1["default"].createElement("div", { className: "col-xl-4 theiaStickySidebar" },
                        react_1["default"].createElement("div", { className: "card card-bg-1" },
                            react_1["default"].createElement("div", { className: "card-body p-0" },
                                react_1["default"].createElement("span", { className: "avatar avatar-xl avatar-rounded border border-2 border-white m-auto d-flex mb-2" }, (employee === null || employee === void 0 ? void 0 : employee.avatarUrl) ? (react_1["default"].createElement("img", { src: employee.avatarUrl, alt: "Profile", className: "w-100 h-100 object-fit-cover" })) : (react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-center w-100 h-100 bg-light rounded-circle" },
                                    react_1["default"].createElement("i", { className: "ti ti-user fs-24 text-gray-5" })))),
                                react_1["default"].createElement("div", { className: "text-center px-3 pb-3 border-bottom" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("h5", { className: "d-flex align-items-center justify-content-center mb-1" }, employee === null || employee === void 0 ? void 0 :
                                            employee.firstName,
                                            " ", employee === null || employee === void 0 ? void 0 :
                                            employee.lastName,
                                            react_1["default"].createElement("i", { className: "ti ti-discount-check-filled text-success ms-1" })),
                                        react_1["default"].createElement("span", { className: "badge badge-soft-dark fw-medium me-2" },
                                            react_1["default"].createElement("i", { className: "ti ti-point-filled me-1" }),
                                            (employee === null || employee === void 0 ? void 0 : employee.role) || 'employee'),
                                        react_1["default"].createElement("span", { className: "badge badge-soft-secondary fw-medium" },
                                            react_1["default"].createElement("i", { className: "ti ti-point-filled me-1" }),
                                            "Years of Experience: ",
                                            (employee === null || employee === void 0 ? void 0 : employee.yearsOfExperience) || '-')),
                                    react_1["default"].createElement("div", null,
                                        react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-id me-2" }),
                                                "Employee ID"),
                                            react_1["default"].createElement("p", { className: "text-dark" }, (employee === null || employee === void 0 ? void 0 : employee.employeeId) || '-')),
                                        react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar-check me-2" }),
                                                "Date Of Join"),
                                            react_1["default"].createElement("p", { className: "text-dark" }, formatDate(employee === null || employee === void 0 ? void 0 : employee.dateOfJoining) || '-')),
                                        react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar-check me-2" }),
                                                "Report Office"),
                                            react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                                                react_1["default"].createElement("p", { className: "text-gray-9 mb-0" }, (employee === null || employee === void 0 ? void 0 : employee.reportOffice) || '—'))),
                                        react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mt-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-building me-2" }),
                                                "Department"),
                                            react_1["default"].createElement("p", { className: "text-dark" }, (employee === null || employee === void 0 ? void 0 : employee.department) || '—')),
                                        react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mt-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-briefcase me-2" }),
                                                "Designation"),
                                            react_1["default"].createElement("p", { className: "text-dark" }, (employee === null || employee === void 0 ? void 0 : employee.designation) || '—')),
                                        employeePromotion && (react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mt-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-trending-up me-2" }),
                                                "Promotion"),
                                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "text-success fw-medium mb-0 text-decoration-none", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#view_employee_promotion", title: "Click to view promotion details" },
                                                employeePromotion.promotionTo.designation.name,
                                                react_1["default"].createElement("i", { className: "ti ti-external-link ms-1 fs-12" })))),
                                        employeeResignation && (react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mt-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-door-exit me-2" }),
                                                "Resignation"),
                                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "text-danger fw-medium mb-0 text-decoration-none", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#view_employee_resignation", title: "Click to view resignation details" },
                                                dayjs_1["default"](employeeResignation.resignationDate).format("DD MMM YYYY"),
                                                react_1["default"].createElement("i", { className: "ti ti-external-link ms-1 fs-12" })))),
                                        employeeTermination && (react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mt-2" },
                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                react_1["default"].createElement("i", { className: "ti ti-user-x me-2" }),
                                                "Termination"),
                                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "text-danger fw-medium mb-0 text-decoration-none", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#view_employee_termination", title: "Click to view termination details" },
                                                dayjs_1["default"](employeeTermination.terminationDate).format("DD MMM YYYY"),
                                                react_1["default"].createElement("i", { className: "ti ti-external-link ms-1 fs-12" })))),
                                        react_1["default"].createElement("div", { className: "row gx-2 mt-3" },
                                            react_1["default"].createElement("div", { className: "col-6" },
                                                react_1["default"].createElement("div", null,
                                                    react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-dark w-100", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_employee" },
                                                        react_1["default"].createElement("i", { className: "ti ti-edit me-1" }),
                                                        "Edit Info"))),
                                            react_1["default"].createElement("div", { className: "col-6" },
                                                react_1["default"].createElement("div", null,
                                                    react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.chat, className: "btn btn-primary w-100" },
                                                        react_1["default"].createElement("i", { className: "ti ti-message-heart me-1" }),
                                                        "Message")))))),
                                react_1["default"].createElement("div", { className: "p-3 border-bottom" },
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("h6", null, "Basic information"),
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-icon btn-sm", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_employee" },
                                            react_1["default"].createElement("i", { className: "ti ti-edit" }))),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-phone me-2" }),
                                            "Phone"),
                                        react_1["default"].createElement("p", { className: "text-dark" }, ((_a = employee === null || employee === void 0 ? void 0 : employee.contact) === null || _a === void 0 ? void 0 : _a.phone) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-mail-check me-2" }),
                                            "Email"),
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "text-info d-inline-flex align-items-center" },
                                            ((_b = employee === null || employee === void 0 ? void 0 : employee.contact) === null || _b === void 0 ? void 0 : _b.email) || '-',
                                            react_1["default"].createElement("i", { className: "ti ti-copy text-dark ms-2" }))),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-gender-male me-2" }),
                                            "Gender"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, ((_c = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _c === void 0 ? void 0 : _c.gender) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-cake me-2" }),
                                            "Birdthday"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, formatDate((_d = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _d === void 0 ? void 0 : _d.birthday) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-map-pin-check me-2" }),
                                            "Address"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, (_f = (_e = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _e === void 0 ? void 0 : _e.address) === null || _f === void 0 ? void 0 :
                                            _f.street,
                                            " ",
                                            ((_h = (_g = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _g === void 0 ? void 0 : _g.address) === null || _h === void 0 ? void 0 : _h.city) || '-',
                                            " ",
                                            react_1["default"].createElement("br", null),
                                            " ",
                                            ((_k = (_j = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _j === void 0 ? void 0 : _j.address) === null || _k === void 0 ? void 0 : _k.state) || '-',
                                            " ",
                                            ((_m = (_l = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _l === void 0 ? void 0 : _l.address) === null || _m === void 0 ? void 0 : _m.country) || '-',
                                            " ",
                                            ((_p = (_o = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _o === void 0 ? void 0 : _o.address) === null || _p === void 0 ? void 0 : _p.postalCode) || '-'))),
                                react_1["default"].createElement("div", { className: "p-3 border-bottom" },
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("h6", null, "Personal Information"),
                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-icon btn-sm", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_personal" },
                                            react_1["default"].createElement("i", { className: "ti ti-edit" }))),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                            "Passport No"),
                                        react_1["default"].createElement("p", { className: "text-dark" }, ((_r = (_q = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _q === void 0 ? void 0 : _q.passport) === null || _r === void 0 ? void 0 : _r.number) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-calendar-x me-2" }),
                                            "Passport Exp Date"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, formatDate((_t = (_s = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _s === void 0 ? void 0 : _s.passport) === null || _t === void 0 ? void 0 : _t.expiryDate) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-gender-male me-2" }),
                                            "Nationality"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, ((_v = (_u = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _u === void 0 ? void 0 : _u.passport) === null || _v === void 0 ? void 0 : _v.country) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-bookmark-plus me-2" }),
                                            "Religion"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, ((_w = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _w === void 0 ? void 0 : _w.religion) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-hotel-service me-2" }),
                                            "Marital status"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, ((_x = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _x === void 0 ? void 0 : _x.maritalStatus) || '-')),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-briefcase-2 me-2" }),
                                            "Employment of spouse"),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, ((_y = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _y === void 0 ? void 0 : _y.employmentOfSpouse) || "-")),
                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                            react_1["default"].createElement("i", { className: "ti ti-baby-bottle me-2" }),
                                            "No. of children",
                                            ((_z = employee === null || employee === void 0 ? void 0 : employee.bank) === null || _z === void 0 ? void 0 : _z.bankName) || '-'),
                                        react_1["default"].createElement("p", { className: "text-dark text-end" }, ((_0 = employee === null || employee === void 0 ? void 0 : employee.personal) === null || _0 === void 0 ? void 0 : _0.noOfChildren) || '-')),
                                    react_1["default"].createElement("div", { className: "border-top mt-3 pt-3" },
                                        react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                            react_1["default"].createElement("h6", { className: "mb-0" }, "Emergency Contact Number"),
                                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-icon btn-sm", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_emergency" },
                                                react_1["default"].createElement("i", { className: "ti ti-edit" }))),
                                        (employee === null || employee === void 0 ? void 0 : employee.emergencyContacts) ? (react_1["default"].createElement("div", null,
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                    react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                        react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                        "Name:"),
                                                    react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_1 = employee === null || employee === void 0 ? void 0 : employee.emergencyContacts) === null || _1 === void 0 ? void 0 : _1.name) || '-'))),
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                    react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                        react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                        "Relationship:"),
                                                    react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_2 = employee === null || employee === void 0 ? void 0 : employee.emergencyContacts) === null || _2 === void 0 ? void 0 : _2.relationship) || '-'))),
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                    react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                        react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                        "Phone Number1:"),
                                                    react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_4 = (_3 = employee === null || employee === void 0 ? void 0 : employee.emergencyContacts) === null || _3 === void 0 ? void 0 : _3.phone) === null || _4 === void 0 ? void 0 : _4[0]) || '-'))),
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                    react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                        react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                        "Phone Number2:"),
                                                    react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_6 = (_5 = employee === null || employee === void 0 ? void 0 : employee.emergencyContacts) === null || _5 === void 0 ? void 0 : _5.phone) === null || _6 === void 0 ? void 0 : _6[1]) || '-'))))) : (react_1["default"].createElement("p", { className: "text-muted" }, "No education records available"))))))),
                    react_1["default"].createElement("div", { className: "col-xl-8" },
                        react_1["default"].createElement("div", null,
                            react_1["default"].createElement("div", { className: "tab-content custom-accordion-items" },
                                react_1["default"].createElement("div", { className: "tab-pane active show", id: "bottom-justified-tab1", role: "tabpanel" },
                                    react_1["default"].createElement("div", { className: "accordion accordions-items-seperate", id: "accordionExample" },
                                        react_1["default"].createElement("div", { className: "accordion-item" },
                                            react_1["default"].createElement("div", { className: "accordion-header", id: "headingOne" },
                                                react_1["default"].createElement("div", { className: "accordion-button" },
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center flex-fill" },
                                                        react_1["default"].createElement("h5", null, "About Employee"),
                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-sm btn-icon ms-auto", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_about" },
                                                            react_1["default"].createElement("i", { className: "ti ti-edit" })),
                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-flex align-items-center collapsed collapse-arrow", "data-bs-toggle": "collapse", "data-bs-target": "#primaryBorderOne", "aria-expanded": "false", "aria-controls": "primaryBorderOne" },
                                                            react_1["default"].createElement("i", { className: "ti ti-chevron-down fs-18" }))))),
                                            react_1["default"].createElement("div", { id: "primaryBorderOne", className: "accordion-collapse collapse show border-top", "aria-labelledby": "headingOne", "data-bs-parent": "#accordionExample" },
                                                react_1["default"].createElement("div", { className: "accordion-body mt-2" }, aboutFormData.about || '-'))),
                                        react_1["default"].createElement("div", { className: "accordion-item" },
                                            react_1["default"].createElement("div", { className: "accordion-header", id: "headingTwo" },
                                                react_1["default"].createElement("div", { className: "accordion-button" },
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center flex-fill" },
                                                        react_1["default"].createElement("h5", null, "Bank Information"),
                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-sm btn-icon ms-auto", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_bank" },
                                                            react_1["default"].createElement("i", { className: "ti ti-edit" })),
                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-flex align-items-center collapsed collapse-arrow", "data-bs-toggle": "collapse", "data-bs-target": "#primaryBorderTwo", "aria-expanded": "false", "aria-controls": "primaryBorderTwo" },
                                                            react_1["default"].createElement("i", { className: "ti ti-chevron-down fs-18" }))))),
                                            react_1["default"].createElement("div", { id: "primaryBorderOne", className: "accordion-collapse collapse show border-top ", "aria-labelledby": "headingOne", "data-bs-parent": "#accordionExample" },
                                                react_1["default"].createElement("div", { className: "accordion-body mt-2 " },
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                            react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                            "Bank Name"),
                                                        react_1["default"].createElement("p", { className: "text-dark" }, ((_7 = employee === null || employee === void 0 ? void 0 : employee.bank) === null || _7 === void 0 ? void 0 : _7.bankName) || '-')),
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                            react_1["default"].createElement("i", { className: "ti ti-id me-2" }),
                                                            "Account Number"),
                                                        react_1["default"].createElement("p", { className: "text-dark" }, ((_8 = employee === null || employee === void 0 ? void 0 : employee.bank) === null || _8 === void 0 ? void 0 : _8.accountNumber) || '-')),
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                            react_1["default"].createElement("i", { className: "ti ti-id me-2" }),
                                                            "IFSC Code"),
                                                        react_1["default"].createElement("p", { className: "text-dark" }, ((_9 = employee === null || employee === void 0 ? void 0 : employee.bank) === null || _9 === void 0 ? void 0 : _9.ifscCode) || '-')),
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between mb-2" },
                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                            react_1["default"].createElement("i", { className: "ti ti-map-pin-check me-2" }),
                                                            "Branch"),
                                                        react_1["default"].createElement("p", { className: "text-dark" }, ((_10 = employee === null || employee === void 0 ? void 0 : employee.bank) === null || _10 === void 0 ? void 0 : _10.branch) || '-'))))),
                                        react_1["default"].createElement("div", { className: "accordion-item" },
                                            react_1["default"].createElement("div", { className: "accordion-header", id: "headingThree" },
                                                react_1["default"].createElement("div", { className: "accordion-button" },
                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between flex-fill" },
                                                        react_1["default"].createElement("h5", null, "Family Information"),
                                                        react_1["default"].createElement("div", { className: "d-flex" },
                                                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-icon btn-sm", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_family" },
                                                                react_1["default"].createElement("i", { className: "ti ti-edit" })),
                                                            react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-flex align-items-center collapsed collapse-arrow", "data-bs-toggle": "collapse", "data-bs-target": "#primaryBorderThree", "aria-expanded": "false", "aria-controls": "primaryBorderThree" },
                                                                react_1["default"].createElement("i", { className: "ti ti-chevron-down fs-18" })))))),
                                            react_1["default"].createElement("div", { id: "primaryBorderThree", className: "accordion-collapse collapse show border-top", "aria-labelledby": "headingThree", "data-bs-parent": "#accordionExample" },
                                                react_1["default"].createElement("div", { className: "accordion-body" },
                                                    react_1["default"].createElement("div", { className: "row" },
                                                        react_1["default"].createElement("div", { className: "col-md-4" },
                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" }, "Name"),
                                                            react_1["default"].createElement("h6", { className: "d-flex align-items-center fw-medium mt-1" }, ((_11 = employee === null || employee === void 0 ? void 0 : employee.family) === null || _11 === void 0 ? void 0 : _11.Name) || '-')),
                                                        react_1["default"].createElement("div", { className: "col-md-4" },
                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" }, "Relationship"),
                                                            react_1["default"].createElement("h6", { className: "d-flex align-items-center fw-medium mt-1" }, ((_12 = employee === null || employee === void 0 ? void 0 : employee.family) === null || _12 === void 0 ? void 0 : _12.relationship) || '-')),
                                                        react_1["default"].createElement("div", { className: "col-md-4" },
                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" }, "Phone"),
                                                            react_1["default"].createElement("h6", { className: "d-flex align-items-center fw-medium mt-1" }, ((_13 = employee === null || employee === void 0 ? void 0 : employee.family) === null || _13 === void 0 ? void 0 : _13.phone) || '-')))))),
                                        react_1["default"].createElement("div", { className: "row" },
                                            react_1["default"].createElement("div", { className: "col-md-6" },
                                                react_1["default"].createElement("div", { className: "accordion-item" },
                                                    react_1["default"].createElement("div", { className: "row" },
                                                        react_1["default"].createElement("div", { className: "accordion-header", id: "headingFour" },
                                                            react_1["default"].createElement("div", { className: "accordion-button" },
                                                                react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between flex-fill" },
                                                                    react_1["default"].createElement("h5", null, "Education Details"),
                                                                    react_1["default"].createElement("div", { className: "d-flex" },
                                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-icon btn-sm", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#edit_education" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-edit" })),
                                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-flex align-items-center collapsed collapse-arrow", "data-bs-toggle": "collapse", "data-bs-target": "#primaryBorderFour", "aria-expanded": "false", "aria-controls": "primaryBorderFour" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-chevron-down fs-18" })))))),
                                                        react_1["default"].createElement("div", { id: "primaryBorderFour", className: "accordion-collapse collapse show border-top", "aria-labelledby": "headingFour", "data-bs-parent": "#accordionExample" },
                                                            react_1["default"].createElement("div", { className: "accordion-body" }, (employee === null || employee === void 0 ? void 0 : employee.education) ? (react_1["default"].createElement("div", null,
                                                                react_1["default"].createElement("div", { className: "mb-3" },
                                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                            "Institution Name:"),
                                                                        react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_14 = employee === null || employee === void 0 ? void 0 : employee.education) === null || _14 === void 0 ? void 0 : _14.institution) || '-'))),
                                                                react_1["default"].createElement("div", { className: "mb-3" },
                                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                            "Course Name:"),
                                                                        react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_15 = employee === null || employee === void 0 ? void 0 : employee.education) === null || _15 === void 0 ? void 0 : _15.degree) || '-'))),
                                                                react_1["default"].createElement("div", { className: "mb-3" },
                                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                            "Start Date:"),
                                                                        react_1["default"].createElement("p", { className: "text-dark mb-0" }, formatDate((_16 = employee === null || employee === void 0 ? void 0 : employee.education) === null || _16 === void 0 ? void 0 : _16.startDate) || '-'))),
                                                                react_1["default"].createElement("div", { className: "mb-3" },
                                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                        react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                            "End Date:"),
                                                                        react_1["default"].createElement("p", { className: "text-dark mb-0" }, formatDate((_17 = employee === null || employee === void 0 ? void 0 : employee.education) === null || _17 === void 0 ? void 0 : _17.endDate) || '-'))))) : (react_1["default"].createElement("p", { className: "text-muted" }, "No education records available"))))))),
                                            react_1["default"].createElement("div", { className: "col-md-6" },
                                                react_1["default"].createElement("div", { className: "accordion-item" },
                                                    react_1["default"].createElement("div", { className: "row" },
                                                        react_1["default"].createElement("div", { className: "accordion-header", id: "headingFive" },
                                                            react_1["default"].createElement("div", { className: "accordion-button collapsed" },
                                                                react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between flex-fill" },
                                                                    react_1["default"].createElement("h5", null, "Experience"),
                                                                    react_1["default"].createElement("div", { className: "d-flex" },
                                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "btn btn-icon btn-sm", "data-bs-toggle": "modal", "data-inert": true, "data-bs-target": "#add_experience" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-edit" })),
                                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-flex align-items-center collapsed collapse-arrow", "data-bs-toggle": "collapse", "data-bs-target": "#primaryBorderFive", "aria-expanded": "false", "aria-controls": "primaryBorderFive" },
                                                                            react_1["default"].createElement("i", { className: "ti ti-chevron-down fs-18" })))))),
                                                        react_1["default"].createElement("div", { id: "primaryBorderFive", className: "accordion-collapse collapse show border-top", "aria-labelledby": "headingFive", "data-bs-parent": "#accordionExample" },
                                                            react_1["default"].createElement("div", { className: "accordion-body" },
                                                                react_1["default"].createElement("div", null, (employee === null || employee === void 0 ? void 0 : employee.experience) ? (react_1["default"].createElement("div", null,
                                                                    react_1["default"].createElement("div", { className: "mb-3" },
                                                                        react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                                react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                                "Company Name:"),
                                                                            react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_18 = employee === null || employee === void 0 ? void 0 : employee.experience) === null || _18 === void 0 ? void 0 : _18.previousCompany) || '-'))),
                                                                    react_1["default"].createElement("div", { className: "mb-3" },
                                                                        react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                                react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                                "Role:"),
                                                                            react_1["default"].createElement("p", { className: "text-dark mb-0" }, ((_19 = employee === null || employee === void 0 ? void 0 : employee.experience) === null || _19 === void 0 ? void 0 : _19.designation) || '-'))),
                                                                    react_1["default"].createElement("div", { className: "mb-3" },
                                                                        react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                                react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                                "Start Date:"),
                                                                            react_1["default"].createElement("p", { className: "text-dark mb-0" }, formatDate((_20 = employee === null || employee === void 0 ? void 0 : employee.experience) === null || _20 === void 0 ? void 0 : _20.startDate) || '-'))),
                                                                    react_1["default"].createElement("div", { className: "mb-3" },
                                                                        react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mb-2" },
                                                                            react_1["default"].createElement("span", { className: "d-inline-flex align-items-center" },
                                                                                react_1["default"].createElement("i", { className: "ti ti-e-passport me-2" }),
                                                                                "End Date:"),
                                                                            react_1["default"].createElement("p", { className: "text-dark mb-0" }, formatDate((_21 = employee === null || employee === void 0 ? void 0 : employee.experience) === null || _21 === void 0 ? void 0 : _21.endDate) || '-'))))) : (react_1["default"].createElement("p", { className: "text-muted" }, "No experience records available"))))))))),
                                        react_1["default"].createElement("div", { className: "card" },
                                            react_1["default"].createElement("div", { className: "card-body" },
                                                react_1["default"].createElement("div", { className: "contact-grids-tab p-0 mb-3" },
                                                    react_1["default"].createElement("ul", { className: "nav nav-underline", id: "myTab", role: "tablist" },
                                                        react_1["default"].createElement("li", { className: "nav-item", role: "presentation" },
                                                            react_1["default"].createElement("button", { className: "nav-link active", id: "policy-tab2", "data-bs-toggle": "tab", "data-bs-target": "#policy2", type: "button", role: "tab", "aria-selected": "true" }, "Policy")),
                                                        react_1["default"].createElement("li", { className: "nav-item", role: "presentation" },
                                                            react_1["default"].createElement("button", { className: "nav-link", id: "address-tab2", "data-bs-toggle": "tab", "data-bs-target": "#address2", type: "button", role: "tab", "aria-selected": "false" }, "Assets")))),
                                                react_1["default"].createElement("div", { className: "tab-content", id: "myTabContent3" },
                                                    react_1["default"].createElement("div", { className: "tab-pane fade show active", id: "policy2", role: "tabpanel", "aria-labelledby": "policy-tab2", tabIndex: 0 },
                                                        react_1["default"].createElement("div", { className: "row" }, policiesLoading ? (react_1["default"].createElement("div", { className: "col-12 text-center py-4" },
                                                            react_1["default"].createElement("div", { className: "spinner-border text-primary", role: "status" },
                                                                react_1["default"].createElement("span", { className: "visually-hidden" }, "Loading policies...")),
                                                            react_1["default"].createElement("p", { className: "mt-2 text-muted" }, "Loading policies..."))) : applicablePolicies.length > 0 ? (applicablePolicies.map(function (policy, idx) { return (react_1["default"].createElement("div", { key: policy._id, className: "col-md-12 d-flex mb-3" },
                                                            react_1["default"].createElement("div", { className: "card flex-fill" },
                                                                react_1["default"].createElement("div", { className: "card-body" },
                                                                    react_1["default"].createElement("div", { className: "d-flex align-items-start justify-content-between" },
                                                                        react_1["default"].createElement("div", { className: "flex-grow-1" },
                                                                            react_1["default"].createElement("h5", { className: "mb-2", style: { cursor: 'pointer' }, onClick: function () { return setViewingPolicy(policy); }, "data-bs-toggle": "modal", "data-bs-target": "#view_policy_employee" },
                                                                                react_1["default"].createElement("i", { className: "ti ti-file-text me-2 text-primary" }),
                                                                                policy.policyName),
                                                                            react_1["default"].createElement("p", { className: "text-muted mb-2" }, policy.policyDescription || 'No description provided'),
                                                                            react_1["default"].createElement("div", { className: "d-flex align-items-center gap-3 mt-3" },
                                                                                react_1["default"].createElement("span", { className: "badge bg-light text-dark" },
                                                                                    react_1["default"].createElement("i", { className: "ti ti-calendar me-1" }),
                                                                                    "Effective: ",
                                                                                    new Date(policy.effectiveDate).toLocaleDateString('en-US', {
                                                                                        year: 'numeric',
                                                                                        month: 'short',
                                                                                        day: 'numeric'
                                                                                    })),
                                                                                react_1["default"].createElement("span", { className: "badge bg-success-transparent" },
                                                                                    react_1["default"].createElement("i", { className: "ti ti-check me-1" }),
                                                                                    "Active")))))))); })) : (react_1["default"].createElement("div", { className: "col-12" },
                                                            react_1["default"].createElement("div", { className: "card" },
                                                                react_1["default"].createElement("div", { className: "card-body text-center py-5" },
                                                                    react_1["default"].createElement("i", { className: "ti ti-file-off fs-1 text-muted mb-3 d-block" }),
                                                                    react_1["default"].createElement("h5", { className: "text-muted" }, "No Policies Assigned"),
                                                                    react_1["default"].createElement("p", { className: "text-muted mb-0" }, "There are currently no policies assigned to your department and designation."))))))),
                                                    react_1["default"].createElement("div", { className: "tab-pane fade", id: "address2", role: "tabpanel", "aria-labelledby": "address-tab2", tabIndex: 0 },
                                                        react_1["default"].createElement("div", { className: "row" }, (_22 = employee === null || employee === void 0 ? void 0 : employee.assets) === null || _22 === void 0 ? void 0 : _22.map(function (asset, idx) { return (react_1["default"].createElement("div", { key: idx, className: "col-md-12 d-flex mb-3" },
                                                            react_1["default"].createElement("div", { className: "card flex-fill" },
                                                                react_1["default"].createElement("div", { className: "card-body" },
                                                                    react_1["default"].createElement("div", { className: "row align-items-center" },
                                                                        react_1["default"].createElement("div", { className: "col-md-8" },
                                                                            react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                                                                                react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.projectdetails, className: "flex-shrink-0 me-2" },
                                                                                    react_1["default"].createElement("img", { src: asset.assetImageUrl || "assets/img/products/default.jpg", className: "img-fluid rounded-circle", alt: asset.assetName, style: { width: "48px", height: "48px" } })),
                                                                                react_1["default"].createElement("div", null,
                                                                                    react_1["default"].createElement("h6", { className: "mb-1" },
                                                                                        react_1["default"].createElement(react_router_dom_1.Link, { to: all_routes_1.all_routes.projectdetails },
                                                                                            asset.assetName,
                                                                                            " - #",
                                                                                            asset.serialNumber)),
                                                                                    react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                                                                                        react_1["default"].createElement("p", null,
                                                                                            react_1["default"].createElement("span", { className: "text-primary" },
                                                                                                "AST - 001",
                                                                                                " ",
                                                                                                react_1["default"].createElement("i", { className: "ti ti-point-filled text-primary mx-1" })),
                                                                                            "Assigned on ",
                                                                                            new Date(asset.issuedDate).toLocaleDateString(),
                                                                                            " ",
                                                                                            new Date(asset.issuedDate).toLocaleTimeString()))))),
                                                                        react_1["default"].createElement("div", { className: "col-md-3" },
                                                                            react_1["default"].createElement("div", null,
                                                                                react_1["default"].createElement("span", { className: "mb-1 d-block" }, "Assigned by"),
                                                                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "fw-normal d-flex align-items-center" },
                                                                                    react_1["default"].createElement("img", { className: "avatar avatar-sm rounded-circle me-2", src: asset.assigneeAvatar || "assets/img/profiles/default.jpg", alt: "Assignee", style: { width: "32px", height: "32px" } }),
                                                                                    asset.assignedBy || "Unknown"))),
                                                                        react_1["default"].createElement("div", { className: "col-md-1" },
                                                                            react_1["default"].createElement("div", { className: "dropdown ms-2" },
                                                                                react_1["default"].createElement(react_router_dom_1.Link, { to: "#", className: "d-inline-flex align-items-center", "data-bs-toggle": "dropdown", "aria-expanded": "false" },
                                                                                    react_1["default"].createElement("i", { className: "ti ti-dots-vertical" }))))))))); }))))))))))))),
            react_1["default"].createElement(footer_1["default"], null)),
        react_1["default"].createElement(react_toastify_1.ToastContainer, null),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_employee" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                            react_1["default"].createElement("h4", { className: "modal-title me-2" }, "Edit Employee"),
                            react_1["default"].createElement("span", null,
                                "Employee ID : ",
                                (editFormData === null || editFormData === void 0 ? void 0 : editFormData.employeeId) || (employee === null || employee === void 0 ? void 0 : employee.employeeId))),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("button", { type: "button", ref: editEmployeeModalRef, "data-bs-dismiss": "modal", style: { display: "none" } }),
                    react_1["default"].createElement("form", { onSubmit: handleEditSubmit },
                        react_1["default"].createElement("div", { className: "contact-grids-tab" },
                            react_1["default"].createElement("ul", { className: "nav nav-underline", id: "myTab2", role: "tablist" },
                                react_1["default"].createElement("li", { className: "nav-item", role: "presentation" },
                                    react_1["default"].createElement("button", { className: "nav-link active", id: "info-tab3", "data-bs-toggle": "tab", "data-bs-target": "#basic-info3", type: "button", role: "tab", "aria-selected": "true" }, "Basic Information")),
                                react_1["default"].createElement("li", { className: "nav-item", role: "presentation" },
                                    react_1["default"].createElement("button", { className: "nav-link", id: "address-tab3", "data-bs-toggle": "tab", "data-bs-target": "#address3", type: "button", role: "tab", "aria-selected": "false" }, "Permissions")))),
                        react_1["default"].createElement("div", { className: "tab-content", id: "myTabContent2" },
                            react_1["default"].createElement("div", { className: "tab-pane fade show active", id: "basic-info3", role: "tabpanel", "aria-labelledby": "info-tab3", tabIndex: 0 },
                                react_1["default"].createElement("div", { className: "modal-body pb-0" },
                                    react_1["default"].createElement("div", { className: "row" },
                                        react_1["default"].createElement("div", { className: "col-md-12" },
                                            react_1["default"].createElement("div", { className: "d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4" },
                                                editFormData.avatarUrl ? (react_1["default"].createElement("img", { src: editFormData.avatarUrl, alt: "Profile", className: "avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0" })) : (react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames" },
                                                    react_1["default"].createElement("i", { className: "ti ti-photo text-gray-2 fs-16" }))),
                                                react_1["default"].createElement("div", { className: "profile-upload" },
                                                    react_1["default"].createElement("div", { className: "mb-2" },
                                                        react_1["default"].createElement("h6", { className: "mb-1" }, "Edit Profile Image"),
                                                        react_1["default"].createElement("p", { className: "fs-12" }, "Image should be below 4 mb")),
                                                    react_1["default"].createElement("div", { className: "profile-uploader d-flex align-items-center" },
                                                        react_1["default"].createElement("div", { className: "drag-upload-btn btn btn-sm btn-primary me-2" },
                                                            loading ? "Uploading..." : "Upload",
                                                            react_1["default"].createElement("input", { type: "file", className: "form-control image-sign", accept: ".png,.jpeg,.jpg,.ico", ref: fileInputRef, onChange: handleImageUpload, disabled: loading, style: {
                                                                    cursor: loading ? "not-allowed" : "pointer",
                                                                    opacity: 0,
                                                                    position: "absolute",
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: "100%",
                                                                    height: "100%"
                                                                } })),
                                                        react_1["default"].createElement("button", { type: "button", className: "btn btn-light btn-sm", onClick: removeLogo, disabled: loading }, "Cancel"))))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "First Name ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", name: "firstName", value: editFormData.firstName || "", onChange: handleEditFormChange }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" }, "Last Name"),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", name: "lastName", value: editFormData.lastName || "", onChange: handleEditFormChange }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Employee ID ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", name: "employeeId", value: editFormData.employeeId || "", readOnly: true }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Date of Joining ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                    react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: "DD-MM-YYYY", getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: editFormData.dateOfJoining ? dayjs_1["default"](editFormData.dateOfJoining) : null, onChange: function (date) { return setEditFormData(function (prev) { return (__assign(__assign({}, prev), { dateOfJoining: date ? date.format('YYYY-MM-DD') : null })); }); } }),
                                                    react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                        react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Username ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", name: "account.userName", value: ((_23 = editFormData.account) === null || _23 === void 0 ? void 0 : _23.userName) || "", onChange: handleEditFormChange }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Email ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("input", { type: "email", className: "form-control", name: "contact.email", value: ((_24 = editFormData.contact) === null || _24 === void 0 ? void 0 : _24.email) || "", onChange: handleEditFormChange }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Gender ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("select", { className: "form-control", name: "personal.gender", value: ((_25 = editFormData.personal) === null || _25 === void 0 ? void 0 : _25.gender) || "", onChange: handleEditFormChange },
                                                    react_1["default"].createElement("option", { value: "" }, "Select Gender"),
                                                    react_1["default"].createElement("option", { value: "male" }, "Male"),
                                                    react_1["default"].createElement("option", { value: "female" }, "Female"),
                                                    react_1["default"].createElement("option", { value: "other" }, "Other")))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Birthday ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                                    react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: "DD-MM-YYYY", getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: ((_26 = editFormData.personal) === null || _26 === void 0 ? void 0 : _26.birthday) ? dayjs_1["default"](editFormData.personal.birthday) : null, onChange: function (date) { return setEditFormData(function (prev) { return (__assign(__assign({}, prev), { personal: __assign(__assign({}, prev.personal), { birthday: date ? date.format('YYYY-MM-DD') : null }) })); }); } }),
                                                    react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                        react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))),
                                        react_1["default"].createElement("div", { className: "col-md-12" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" }, "Address"),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", placeholder: "Street", name: "personal.address.street", value: ((_28 = (_27 = editFormData.personal) === null || _27 === void 0 ? void 0 : _27.address) === null || _28 === void 0 ? void 0 : _28.street) || "", onChange: handleEditFormChange }),
                                                react_1["default"].createElement("div", { className: "row mt-3" },
                                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                                        react_1["default"].createElement("input", { type: "text", className: "form-control", placeholder: "City", name: "personal.address.city", value: ((_30 = (_29 = editFormData.personal) === null || _29 === void 0 ? void 0 : _29.address) === null || _30 === void 0 ? void 0 : _30.city) || "", onChange: handleEditFormChange })),
                                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                                        react_1["default"].createElement("input", { type: "text", className: "form-control", placeholder: "State", name: "personal.address.state", value: ((_32 = (_31 = editFormData.personal) === null || _31 === void 0 ? void 0 : _31.address) === null || _32 === void 0 ? void 0 : _32.state) || "", onChange: handleEditFormChange }))),
                                                react_1["default"].createElement("div", { className: "row mt-3" },
                                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                                        react_1["default"].createElement("input", { type: "text", className: "form-control", placeholder: "Postal Code", name: "personal.address.postalCode", value: ((_34 = (_33 = editFormData.personal) === null || _33 === void 0 ? void 0 : _33.address) === null || _34 === void 0 ? void 0 : _34.postalCode) || "", onChange: handleEditFormChange })),
                                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                                        react_1["default"].createElement("input", { type: "text", className: "form-control", placeholder: "Country", name: "personal.address.country", value: ((_36 = (_35 = editFormData.personal) === null || _35 === void 0 ? void 0 : _35.address) === null || _36 === void 0 ? void 0 : _36.country) || "", onChange: handleEditFormChange }))))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Phone Number ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", name: "contact.phone", value: ((_37 = editFormData.contact) === null || _37 === void 0 ? void 0 : _37.phone) || "", onChange: handleEditFormChange }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Company ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("input", { type: "text", className: "form-control", name: "companyName", value: editFormData.companyName || "", onChange: handleEditFormChange }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" }, "Department"),
                                                react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: department, value: department.find(function (opt) { return opt.value === editFormData.departmentId; }) || department[0], onChange: function (option) {
                                                        if (option) {
                                                            setEditFormData(function (prev) { return (__assign(__assign({}, prev), { departmentId: option.value, designationId: "" // Clear designation when department changes
                                                             })); });
                                                            if (socket && option.value) {
                                                                socket.emit("hrm/designations/get", { departmentId: option.value });
                                                            }
                                                        }
                                                    } }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" }, "Designation"),
                                                react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: designation, value: designation.find(function (opt) { return opt.value === editFormData.designationId; }) || designation[0], onChange: function (option) {
                                                        if (option) {
                                                            setEditFormData(function (prev) { return (__assign(__assign({}, prev), { designationId: option.value })); });
                                                        }
                                                    } }))),
                                        react_1["default"].createElement("div", { className: "col-md-6" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "Status ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("div", null,
                                                    react_1["default"].createElement("div", { className: "form-check form-switch" },
                                                        react_1["default"].createElement("input", { className: "form-check-input", type: "checkbox", role: "switch", id: "editStatusSwitch", checked: editFormData.status === "Active", disabled: ((_38 = editFormData.status) === null || _38 === void 0 ? void 0 : _38.toLowerCase()) !== "active" &&
                                                                ((_39 = editFormData.status) === null || _39 === void 0 ? void 0 : _39.toLowerCase()) !== "inactive", onChange: function (e) {
                                                                var _a;
                                                                var currentStatus = (_a = editFormData.status) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                                                                // Only allow editing if status is Active or Inactive
                                                                if (currentStatus !== "active" && currentStatus !== "inactive") {
                                                                    return;
                                                                }
                                                                setEditFormData(function (prev) { return (__assign(__assign({}, prev), { status: e.target.checked ? "Active" : "Inactive" })); });
                                                            } }),
                                                        react_1["default"].createElement("label", { className: "form-check-label", htmlFor: "editStatusSwitch", style: {
                                                                opacity: (((_40 = editFormData.status) === null || _40 === void 0 ? void 0 : _40.toLowerCase()) !== "active" &&
                                                                    ((_41 = editFormData.status) === null || _41 === void 0 ? void 0 : _41.toLowerCase()) !== "inactive") ? 0.6 : 1
                                                            } },
                                                            react_1["default"].createElement("span", { className: "badge " + (editFormData.status === "Active"
                                                                    ? "badge-success"
                                                                    : "badge-danger") + " d-inline-flex align-items-center" },
                                                                react_1["default"].createElement("i", { className: "ti ti-point-filled me-1" }),
                                                                editFormData.status || "Active")))))),
                                        react_1["default"].createElement("div", { className: "col-md-12" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "About ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("textarea", { className: "form-control", rows: 4, name: "about", value: typeof editFormData.about === 'string' ? editFormData.about : "", onChange: handleEditFormChange, placeholder: "Write something about the employee..." }))))),
                                react_1["default"].createElement("div", { className: "modal-footer" },
                                    react_1["default"].createElement("button", { type: "button", className: "btn btn-outline-light border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                                    react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", disabled: loading, onClick: handleNext }, loading ? "Saving..." : "Save & Next"))),
                            react_1["default"].createElement("div", { className: "tab-pane fade", id: "address3", role: "tabpanel", "aria-labelledby": "address-tab3", tabIndex: 0 },
                                react_1["default"].createElement("div", { className: "modal-body pb-0" },
                                    react_1["default"].createElement("div", { className: "card" },
                                        react_1["default"].createElement("div", { className: "card-body" },
                                            react_1["default"].createElement("div", { className: "d-flex align-items-center justify-content-between pb-3 border-bottom" },
                                                react_1["default"].createElement("h6", { className: "mb-0" }, "Enable Modules"),
                                                react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                                                    react_1["default"].createElement("div", { className: "form-check form-switch me-3" },
                                                        react_1["default"].createElement("label", { className: "form-check-label" },
                                                            react_1["default"].createElement("input", { className: "form-check-input", type: "checkbox", role: "switch", checked: Object.values(permissions.enabledModules).every(Boolean), onChange: function (e) { return toggleAllModules(e.target.checked); } }),
                                                            react_1["default"].createElement("span", { className: "text-dark" }, "Enable All"))),
                                                    react_1["default"].createElement("div", { className: "form-check form-switch" },
                                                        react_1["default"].createElement("label", { className: "form-check-label" },
                                                            react_1["default"].createElement("input", { className: "form-check-input", type: "checkbox", role: "switch", checked: allPermissionsSelected(), onChange: function (e) { return toggleGlobalSelectAll(e.target.checked); } }),
                                                            react_1["default"].createElement("span", { className: "text-dark" }, "Select All"))))),
                                            react_1["default"].createElement("div", { className: "table-responsive border rounded mt-3" },
                                                react_1["default"].createElement("table", { className: "table" },
                                                    react_1["default"].createElement("tbody", null, MODULES.map(function (module) { return (react_1["default"].createElement("tr", { key: module },
                                                        react_1["default"].createElement("td", null,
                                                            react_1["default"].createElement("div", { className: "form-check form-switch me-2" },
                                                                react_1["default"].createElement("label", { className: "form-check-label mt-0" },
                                                                    react_1["default"].createElement("input", { className: "form-check-input me-2", type: "checkbox", role: "switch", checked: permissions.enabledModules[module], onChange: function () { return toggleModule(module); } }),
                                                                    module.charAt(0).toUpperCase() + module.slice(1)))),
                                                        ACTIONS.map(function (action) { return (react_1["default"].createElement("td", { key: action },
                                                            react_1["default"].createElement("div", { className: "form-check d-flex align-items-center" },
                                                                react_1["default"].createElement("label", { className: "form-check-label mt-0" },
                                                                    react_1["default"].createElement("input", { className: "form-check-input", type: "checkbox", checked: permissions.permissions[module][action], onChange: function (e) {
                                                                            return handlePermissionChange(module, action, e.target.checked);
                                                                        }, disabled: !permissions.enabledModules[module] }),
                                                                    action.charAt(0).toUpperCase() + action.slice(1))))); }))); })))))),
                                    react_1["default"].createElement("div", { className: "modal-footer" },
                                        react_1["default"].createElement("button", { type: "button", className: "btn btn-outline-light border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                                        react_1["default"].createElement("button", { type: "button", className: "btn btn-primary", onClick: function (e) {
                                                handlePermissionUpdateSubmit(e);
                                                // Close modal after submission
                                                setTimeout(function () {
                                                    var closeButton = document.querySelector('#edit_employee [data-bs-dismiss="modal"]');
                                                    if (closeButton) {
                                                        closeButton.click();
                                                    }
                                                }, 100);
                                            }, disabled: loading }, loading ? "Saving..." : "Save"))))))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_about" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Edit Personal Info"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetAboutForm },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handleAboutSubmit },
                        react_1["default"].createElement("div", { className: "tab-content", id: "myTabContent2" },
                            react_1["default"].createElement("div", { className: "tab-pane fade show active", id: "basic-info3", role: "tabpanel", "aria-labelledby": "info-tab3", tabIndex: 0 },
                                react_1["default"].createElement("div", { className: "modal-body pb-0" },
                                    react_1["default"].createElement("div", { className: "row" },
                                        react_1["default"].createElement("div", { className: "col-md-12" },
                                            react_1["default"].createElement("div", { className: "mb-3" },
                                                react_1["default"].createElement("label", { className: "form-label" },
                                                    "About ",
                                                    react_1["default"].createElement("span", { className: "text-danger" }, "*")),
                                                react_1["default"].createElement("textarea", { className: "form-control", rows: 4, name: "about", value: aboutFormData.about || "", required: true, onChange: function (e) { return setAboutFormData({ about: e.target.value }); }, placeholder: "Write something about the employee..." }))))),
                                react_1["default"].createElement("div", { className: "modal-footer" },
                                    react_1["default"].createElement("button", { type: "button", className: "btn btn-outline-light border me-2", "data-bs-dismiss": "modal", onClick: resetAboutForm }, "Cancel"),
                                    react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_personal" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Edit Personal Info"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetPersonalForm },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handlePersonalFormSubmit },
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Passport No ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: personalFormData.passportNo, onChange: function (e) { return setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { passportNo: e.target.value })); }); }, required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Passport Expiry Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: "DD-MM-YYYY", getPopupContainer: function () { return document.getElementById('edit_personal') || document.body; }, placeholder: "DD-MM-YYYY", value: personalFormData.passportExpiryDate, onChange: function (date) { return setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { passportExpiryDate: date })); }); }, required: true }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Nationality ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: personalFormData.nationality, onChange: function (e) { return setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { nationality: e.target.value })); }); }, required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" }, "Religion"),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: personalFormData.religion, onChange: function (e) { return setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { religion: e.target.value })); }); }, required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Marital status ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: martialstatus, value: martialstatus.find(function (opt) { return opt.value === personalFormData.maritalStatus; }) || martialstatus[0], onChange: function (option) {
                                                if (option) {
                                                    setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { maritalStatus: option.value })); });
                                                }
                                            } }))),
                                personalFormData.maritalStatus === "Yes" && (react_1["default"].createElement(react_1["default"].Fragment, null,
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Employment spouse"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: personalFormData.employmentOfSpouse, onChange: function (e) { return setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { employmentOfSpouse: e.target.value })); }); }, required: true }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "No. of children"),
                                            react_1["default"].createElement("input", { type: "number", className: "form-control", value: personalFormData.noOfChildren, onChange: function (e) { return setPersonalFormData(function (prev) { return (__assign(__assign({}, prev), { noOfChildren: parseInt(e.target.value) || 0 })); }); }, required: true }))))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetPersonalForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_emergency" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Emergency Contact Details"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetEmergencyModel },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handleEmergencyFormSubmit },
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "border-bottom mb-3 " },
                                react_1["default"].createElement("div", { className: "row" },
                                    react_1["default"].createElement("h5", { className: "mb-3" }, "Secondary Contact Details"),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Name ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: emergencyFormData.name, required: true, onChange: function (e) { return setEmergencyFormData(__assign(__assign({}, emergencyFormData), { name: e.target.value })); } }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Relationship ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: emergencyFormData.relationship, required: true, onChange: function (e) { return setEmergencyFormData(__assign(__assign({}, emergencyFormData), { relationship: e.target.value })); } }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Phone No 1 ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: emergencyFormData.phone1, required: true, onChange: function (e) { return setEmergencyFormData(__assign(__assign({}, emergencyFormData), { phone1: e.target.value })); } }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Phone No 2"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", value: emergencyFormData.phone2, onChange: function (e) { return setEmergencyFormData(__assign(__assign({}, emergencyFormData), { phone2: e.target.value })); } })))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetEmergencyModel }, "Cancel"),
                            react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_bank" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Bank Details"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetBankForm },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handleBankFormSubmit },
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Bank Name ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: bankFormData.bankName, onChange: function (e) { return setBankFormData(function (prev) { return (__assign(__assign({}, prev), { bankName: e.target.value })); }); }, required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Bank Account No ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: bankFormData.accountNumber, onChange: function (e) { return setBankFormData(function (prev) { return (__assign(__assign({}, prev), { accountNumber: e.target.value })); }); }, required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "IFSC Code ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: bankFormData.ifscCode, onChange: function (e) { return setBankFormData(function (prev) { return (__assign(__assign({}, prev), { ifscCode: e.target.value })); }); }, required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Branch Address ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: bankFormData.branch, onChange: function (e) { return setBankFormData(function (prev) { return (__assign(__assign({}, prev), { branch: e.target.value })); }); }, required: true }))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetBankForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_family" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Family Information"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetFamilyForm },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handleFamilyFormSubmit },
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Name ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: familyFormData.familyMemberName, required: true, onChange: function (e) { return setFamilyFormData(function (prev) { return (__assign(__assign({}, prev), { familyMemberName: e.target.value })); }); } }))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" }, "Relationship "),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: familyFormData.relationship, required: true, onChange: function (e) { return setFamilyFormData(function (prev) { return (__assign(__assign({}, prev), { relationship: e.target.value })); }); } }))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" }, "Phone "),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: familyFormData.phone, required: true, onChange: function (e) { return setFamilyFormData(function (prev) { return (__assign(__assign({}, prev), { phone: e.target.value })); }); } }))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetFamilyForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "edit_education" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Education Information"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetEducationForm },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handleEducationFormSubmit },
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Institution Name ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: educationFormData.institution, required: true, onChange: function (e) {
                                                setEducationFormData(function (prev) { return (__assign(__assign({}, prev), { institution: e.target.value })); });
                                            } }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Course ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: educationFormData.course, required: true, onChange: function (e) {
                                                setEducationFormData(function (prev) { return (__assign(__assign({}, prev), { course: e.target.value })); });
                                            } }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Start Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: "DD-MM-YYYY", getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: educationFormData.startDate, onChange: function (date) { return setEducationFormData(function (prev) { return (__assign(__assign({}, prev), { startDate: date || null })); }); } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "End Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: {
                                                    format: "DD-MM-YYYY",
                                                    type: "mask"
                                                }, required: true, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", value: educationFormData.endDate, onChange: function (date) {
                                                    setEducationFormData(function (prev) { return (__assign(__assign({}, prev), { endDate: date || null })); });
                                                } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetEducationForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "add_experience" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Company Information"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close", onClick: resetExperienceForm },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", { onSubmit: handleExperienceFormSubmit },
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Previous Company Name",
                                            " ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: experienceFormData.company, required: true, onChange: function (e) { return setExperienceFormData(__assign(__assign({}, experienceFormData), { company: e.target.value })); } }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Designation ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", value: experienceFormData.designation, required: true, onChange: function (e) { return setExperienceFormData(__assign(__assign({}, experienceFormData), { designation: e.target.value })); } }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Start Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: {
                                                    format: "DD-MM-YYYY",
                                                    type: "mask"
                                                }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", required: true, value: experienceFormData.startDate ? dayjs_1["default"](experienceFormData.startDate) : null, onChange: function (date) { return setExperienceFormData(__assign(__assign({}, experienceFormData), { startDate: date ? date.toISOString() : "" })); } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "End Date ",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("div", { className: "input-icon-end position-relative" },
                                            react_1["default"].createElement(antd_1.DatePicker, { className: "form-control datetimepicker", format: {
                                                    format: "DD-MM-YYYY",
                                                    type: "mask"
                                                }, getPopupContainer: getModalContainer, placeholder: "DD-MM-YYYY", required: true, value: experienceFormData.endDate ? dayjs_1["default"](experienceFormData.endDate) : null, onChange: function (date) { return setExperienceFormData(__assign(__assign({}, experienceFormData), { endDate: date ? date.toISOString() : "" })); } }),
                                            react_1["default"].createElement("span", { className: "input-icon-addon" },
                                                react_1["default"].createElement("i", { className: "ti ti-calendar text-gray-7" }))))),
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-check-label d-flex align-items-center mt-0" },
                                            react_1["default"].createElement("input", { className: "form-check-input mt-0 me-2", type: "checkbox", defaultChecked: true }),
                                            react_1["default"].createElement("span", { className: "text-dark" }, "Check if you working present")))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal", onClick: resetExperienceForm }, "Cancel"),
                            react_1["default"].createElement("button", { type: "submit", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "add_bank_satutory" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Bank & Statutory"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", null,
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "border-bottom mb-4" },
                                react_1["default"].createElement("h5", { className: "mb-3" }, "Basic Salary Information"),
                                react_1["default"].createElement("div", { className: "row mb-2" },
                                    react_1["default"].createElement("div", { className: "col-md-4" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "Salary basis ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: salaryChoose, defaultValue: salaryChoose[0] }))),
                                    react_1["default"].createElement("div", { className: "col-md-4" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Salary basis"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", defaultValue: "$", required: true }))),
                                    react_1["default"].createElement("div", { className: "col-md-4" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Payment type"),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: paymenttype, defaultValue: paymenttype[0] }))))),
                            react_1["default"].createElement("div", { className: "border-bottom mb-4" },
                                react_1["default"].createElement("h5", { className: "mb-3" }, "PF Information"),
                                react_1["default"].createElement("div", { className: "row mb-2" },
                                    react_1["default"].createElement("div", { className: "col-md-4" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" },
                                                "PF contribution ",
                                                react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: pfcontribution, defaultValue: pfcontribution[0] }))),
                                    react_1["default"].createElement("div", { className: "col-md-4" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "PF No"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", required: true }))),
                                    react_1["default"].createElement("div", { className: "col-md-4" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Employee PF rate"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", required: true }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Additional rate"),
                                            react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: additionalrate, defaultValue: additionalrate[0] }))),
                                    react_1["default"].createElement("div", { className: "col-md-6" },
                                        react_1["default"].createElement("div", { className: "mb-3" },
                                            react_1["default"].createElement("label", { className: "form-label" }, "Total rate"),
                                            react_1["default"].createElement("input", { type: "text", className: "form-control", required: true }))))),
                            react_1["default"].createElement("h5", { className: "mb-3" }, "ESI Information"),
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-4" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "ESI contribution",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: esi, defaultValue: esi[0] }))),
                                react_1["default"].createElement("div", { className: "col-md-4" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" }, "ESI Number"),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-4" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Employee ESI rate",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", required: true }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" }, "Additional rate"),
                                        react_1["default"].createElement(commonSelect_1["default"], { className: 'select', options: additionalrate, defaultValue: additionalrate[0] }))),
                                react_1["default"].createElement("div", { className: "col-md-6" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" }, "Total rate"),
                                        react_1["default"].createElement("input", { type: "text", className: "form-control", required: true }))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", "data-bs-dismiss": "modal", className: "btn btn-primary" }, "Save")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "asset_info" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-lg" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Asset Information"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("div", { className: "modal-body" },
                        react_1["default"].createElement("div", { className: "bg-light p-3 rounded show d-flex align-items-center mb-3" },
                            react_1["default"].createElement("span", { className: "avatar avatar-lg flex-shrink-0 me-2" },
                                react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/laptop.jpg", alt: "img", className: "ig-fluid rounded-circle" })),
                            react_1["default"].createElement("div", null,
                                react_1["default"].createElement("h6", null, "Dell Laptop - #343556656"),
                                react_1["default"].createElement("p", { className: "fs-13" },
                                    react_1["default"].createElement("span", { className: "text-primary" }, "AST - 001 "),
                                    react_1["default"].createElement("i", { className: "ti ti-point-filled text-primary" }),
                                    " Assigned on 22 Nov, 2022 10:32AM"))),
                        react_1["default"].createElement("div", { className: "row" },
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Type"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "Laptop"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Brand"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "Dell"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Category"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "Computer"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Serial No"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "3647952145678"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Cost"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "$800"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Vendor"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "Compusoft Systems Ltd.,"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Warranty"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "12 Jan 2022 - 12 Jan 2026"))),
                            react_1["default"].createElement("div", { className: "col-md-6" },
                                react_1["default"].createElement("div", { className: "mb-3" },
                                    react_1["default"].createElement("p", { className: "fs-13 mb-0" }, "Location"),
                                    react_1["default"].createElement("p", { className: "text-gray-9" }, "46 Laurel Lane, TX 79701")))),
                        react_1["default"].createElement("div", null,
                            react_1["default"].createElement("p", { className: "fs-13 mb-2" }, "Asset Images"),
                            react_1["default"].createElement("div", { className: "d-flex align-items-center" },
                                react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/laptop-01.jpg", alt: "img", className: "img-fluid rounded me-2" }),
                                react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/laptop-2.jpg", alt: "img", className: "img-fluid rounded me-2" }),
                                react_1["default"].createElement(imageWithBasePath_1["default"], { src: "assets/img/laptop-3.jpg", alt: "img", className: "img-fluid rounded" }))))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "refuse_msg" },
            react_1["default"].createElement("div", { className: "modal-dialog modal-dialog-centered modal-md" },
                react_1["default"].createElement("div", { className: "modal-content" },
                    react_1["default"].createElement("div", { className: "modal-header" },
                        react_1["default"].createElement("h4", { className: "modal-title" }, "Raise Issue"),
                        react_1["default"].createElement("button", { type: "button", className: "btn-close custom-btn-close", "data-bs-dismiss": "modal", "aria-label": "Close" },
                            react_1["default"].createElement("i", { className: "ti ti-x" }))),
                    react_1["default"].createElement("form", null,
                        react_1["default"].createElement("div", { className: "modal-body pb-0" },
                            react_1["default"].createElement("div", { className: "row" },
                                react_1["default"].createElement("div", { className: "col-md-12" },
                                    react_1["default"].createElement("div", { className: "mb-3" },
                                        react_1["default"].createElement("label", { className: "form-label" },
                                            "Description",
                                            react_1["default"].createElement("span", { className: "text-danger" }, " *")),
                                        react_1["default"].createElement("textarea", { className: "form-control", rows: 4, defaultValue: "" }))))),
                        react_1["default"].createElement("div", { className: "modal-footer" },
                            react_1["default"].createElement("button", { type: "button", className: "btn btn-white border me-2", "data-bs-dismiss": "modal" }, "Cancel"),
                            react_1["default"].createElement("button", { type: "button", "data-bs-dismiss": "modal", className: "btn btn-primary" }, "Submit")))))),
        react_1["default"].createElement("div", { className: "modal fade", id: "view_policy_employee" },
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
                                react_1["default"].createElement("p", { className: "fs-16 mb-0" }, new Date(viewingPolicy.effectiveDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })))),
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
                            "Close"))))),
        react_1["default"].createElement(PromotionDetailsModal_1["default"], { promotion: employeePromotion, modalId: "view_employee_promotion" }),
        react_1["default"].createElement(ResignationDetailsModal_1["default"], { resignation: employeeResignation, modalId: "view_employee_resignation" }),
        react_1["default"].createElement(TerminationDetailsModal_1["default"], { termination: employeeTermination, modalId: "view_employee_termination" })));
};
exports["default"] = EmployeeDetails;
