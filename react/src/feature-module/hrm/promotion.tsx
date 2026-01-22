import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/common/dataTable/index";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import CommonSelect from "../../core/common/commonSelect";
import EmployeeNameCell from "../../core/common/EmployeeNameCell";
import { DatePicker } from "antd";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Footer from "../../core/common/footer";
import { useSocket } from "../../SocketContext";
import { toast } from "react-toastify";
import { useModalCleanup } from "../../core/hooks/useModalCleanup";
import dayjs, { Dayjs } from "dayjs";
import { Socket } from "socket.io-client";
import PromotionDetailsModal from "../../core/modals/PromotionDetailsModal";

interface Employee {
  id: string;
  name: string;
  email: string;
  image: string;
  department: string;
  departmentId: string;
  designation: string;
  designationId: string;
  employeeId: string;
}

interface Department {
  _id: string;
  department: string;
}

interface Designation {
  id: string;
  name: string;
  level?: number;
  departmentId?: string;
}

interface Promotion {
  _id: string;
  employee: {
    id: string;
    name: string;
    image: string;
    employeeId?: string; // Add employeeId to the interface
  };
  promotionFrom: {
    department: {
      id: string;
      name: string;
    };
    designation: {
      id: string;
      name: string;
    };
  };
  promotionTo: {
    department: {
      id: string;
      name: string;
    };
    designation: {
      id: string;
      name: string;
    };
  };
  promotionDate: string;
  promotionType?: string;
  reason?: string;
  notes?: string;
}

const Promotion = () => {
  const socket = useSocket() as Socket | null;
  const { cleanupModals } = useModalCleanup();

  // State management
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for Add Promotion
  const [newPromotion, setNewPromotion] = useState({
    sourceDepartmentId: "", // For filtering employees
    employeeId: "",
    targetDepartmentId: "", // Department To - where employee is being promoted
    designationToId: "",
    promotionDate: null as Dayjs | null,
    promotionType: "Regular",
  });

  // Form state for Edit Promotion
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editForm, setEditForm] = useState({
    departmentId: "",
    designationToId: "",
    promotionDate: null as Dayjs | null,
    promotionType: "Regular",
  });

  // State for deletion
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(null);

  // State for viewing promotion details
  const [viewingPromotion, setViewingPromotion] = useState<Promotion | null>(null);

  // Validation errors for Add Promotion
  const [addErrors, setAddErrors] = useState({
    sourceDepartmentId: "",
    employeeId: "",
    targetDepartmentId: "",
    designationToId: "",
    promotionDate: "",
    promotionType: "",
  });

  // Track employees already promoted (for duplicate check)
  const [promotedEmployeeIds, setPromotedEmployeeIds] = useState<Set<string>>(new Set());

  // Validation errors for Edit Promotion
  const [editErrors, setEditErrors] = useState({
    departmentId: "",
    designationToId: "",
    promotionDate: "",
    promotionType: "",
  });

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  /**
   * Reliable modal closing function with multiple fallback methods
   * Does not depend on Bootstrap Modal instance
   */
  const closeModalReliably = (modalId: string) => {
    console.log("[Promotion] closeModalReliably called for:", modalId);
    
    try {
      // Method 1: Try Bootstrap Modal API if available via window.bootstrap
      const modalElement = document.getElementById(modalId);
      if (modalElement && typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          console.log("[Promotion] Closing modal using Bootstrap instance");
          modalInstance.hide();
          return;
        }
      }
    } catch (error) {
      console.log("[Promotion] Bootstrap Modal method failed:", error);
    }

    try {
      // Method 2: Click the close button
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
        if (closeButton) {
          console.log("[Promotion] Closing modal by clicking close button");
          closeButton.click();
          return;
        }
      }
    } catch (error) {
      console.log("[Promotion] Close button method failed:", error);
    }

    try {
      // Method 3: Manual DOM manipulation as last resort
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        console.log("[Promotion] Closing modal using manual DOM manipulation");
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        modalElement.removeAttribute('role');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    } catch (error) {
      console.error("[Promotion] All modal closing methods failed:", error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (!socket) {
      console.log("[Promotion] Socket not available yet");
      return;
    }

    console.log("[Promotion] Socket connected, fetching initial data...");
    console.log("[Promotion] Socket ID:", socket?.id);
    console.log("[Promotion] Socket connected:", socket?.connected);

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
    const handleGetAllResponse = (response: any) => {
      console.log("[Promotion] Received promotions response:", response);
      console.log("[Promotion] Response type:", typeof response, "done:", response?.done);
      if (response.done && response.data) {
        console.log("[Promotion] Setting promotions, count:", response.data.length);
        setPromotions(response.data);
        // Track promoted employee IDs
        const promotedIds = new Set<string>(response.data.map((p: Promotion) => p.employee.id));
        setPromotedEmployeeIds(promotedIds);
      } else {
        const errorMsg = response.error || "Failed to fetch promotions";
        console.error("[Promotion] Error fetching promotions:", errorMsg);
        toast.error(errorMsg);
      }
      setLoading(false);
    };

    const handleGetDepartmentsResponse = (response: any) => {
      console.log("[Promotion] Received departments response:", response);
      console.log("[Promotion] Response type:", typeof response, "done:", response?.done);
      if (response.done && response.data) {
        console.log("[Promotion] Setting departments, count:", response.data.length);
        setDepartments(response.data);
      } else {
        const errorMsg = response.error || "Failed to fetch departments";
        console.error("[Promotion] Error fetching departments:", errorMsg);
        toast.error(errorMsg);
      }
    };

    const handleGetEmployeesByDepartmentResponse = (response: any) => {
      console.log("[Promotion] Received employees-by-department response:", response);
      console.log("[Promotion] Response type:", typeof response, "done:", response?.done);
      if (response.done && response.data) {
        console.log("[Promotion] Setting employees, count:", response.data.length);
        setEmployees(response.data);
      } else {
        const errorMsg = response.error || response.message || "Failed to fetch employees";
        console.error("[Promotion] Error fetching employees:", errorMsg);
        setEmployees([]);
      }
    };

    const handleGetDesignationsResponse = (response: any) => {
      console.log("[Promotion] Received designations response:", response);
      console.log("[Promotion] Response type:", typeof response, "done:", response?.done);
      if (response.done && response.data) {
        console.log("[Promotion] Setting designations, count:", response.data.length);
        setDesignations(response.data);
      } else {
        const errorMsg = response.error || "Failed to fetch designations";
        console.error("[Promotion] Error fetching designations:", errorMsg);
        toast.error(errorMsg);
      }
    };

    const handleGetDesignationsByDepartmentResponse = (response: any) => {
      console.log("[Promotion] ===== RECEIVED promotion:getDesignationsByDepartment:response:", response);
      console.log("[Promotion] Response type:", typeof response, "done:", response?.done);
      if (response.done && response.data) {
        console.log("[Promotion] ✓ SUCCESS - Setting designations, count:", response.data.length);
        console.log("[Promotion] Designations data:", response.data.map((d: any) => ({ id: d.id, name: d.name, departmentId: d.departmentId })));
        setDesignations(response.data);
      } else {
        const errorMsg = response.error || response.message || "Failed to fetch designations";
        console.error("[Promotion] ✗ ERROR fetching designations:", errorMsg);
        setDesignations([]);
        toast.error(errorMsg);
      }
    };

    const handlePromotionCreated = (promotion: Promotion) => {
      console.log("[Promotion] Promotion created:", promotion);
      setPromotions((prev) => [promotion, ...prev]);
      // Add to promoted employee IDs
      setPromotedEmployeeIds((prev) => new Set(prev).add(promotion.employee.id));
      toast.success("Promotion added successfully");
    };

    const handlePromotionUpdated = (promotion: Promotion) => {
      console.log("[Promotion] Promotion updated:", promotion);
      setPromotions((prev) =>
        prev.map((p) => (p._id === promotion._id ? promotion : p))
      );
      toast.success("Promotion updated successfully");
    };

    const handlePromotionDeleted = (data: { promotionId: string }) => {
      console.log("[Promotion] Promotion deleted:", data);
      // Find the promotion being deleted to get employeeId
      const deletedPromotion = promotions.find(p => p._id === data.promotionId);
      setPromotions((prev) => prev.filter((p) => p._id !== data.promotionId));
      // Remove from promoted employee IDs
      if (deletedPromotion) {
        setPromotedEmployeeIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(deletedPromotion.employee.id);
          return newSet;
        });
      }
      toast.success("Promotion deleted successfully");
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
    return () => {
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
  useEffect(() => {
    const addModalElement = document.getElementById("new_promotion");
    const editModalElement = document.getElementById("edit_promotion");

    const handleAddModalOpen = () => {
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
        promotionType: "",
      });
      
      // Reset form to ensure clean state
      setNewPromotion({
        sourceDepartmentId: "",
        employeeId: "",
        targetDepartmentId: "",
        designationToId: "",
        promotionDate: null,
        promotionType: "Regular",
      });
      
      // Clear designations
      setDesignations([]);
    };

    const handleEditModalOpen = () => {
      console.log("[Promotion] Edit modal opened - errors already cleared in handleEditClick");
    };

    if (addModalElement) {
      addModalElement.addEventListener("shown.bs.modal", handleAddModalOpen);
    }

    if (editModalElement) {
      editModalElement.addEventListener("shown.bs.modal", handleEditModalOpen);
    }

    return () => {
      if (addModalElement) {
        addModalElement.removeEventListener("shown.bs.modal", handleAddModalOpen);
      }
      if (editModalElement) {
        editModalElement.removeEventListener("shown.bs.modal", handleEditModalOpen);
      }
    };
  }, []);

  // Fetch employees by department
  const fetchEmployeesByDepartment = React.useCallback((departmentId: string) => {
    if (!socket || !departmentId) {
      console.log("[Promotion] fetchEmployeesByDepartment - socket or departmentId missing", { socket: !!socket, departmentId });
      setEmployees([]);
      return;
    }
    console.log("[Promotion] Fetching employees for department:", departmentId, "type:", typeof departmentId);
    socket.emit("promotion:getEmployeesByDepartment", departmentId);
  }, [socket]);

  // Fetch designations by department
  const fetchDesignationsByDepartment = React.useCallback((departmentId: string) => {
    if (!socket || !departmentId) {
      console.log("[Promotion] fetchDesignationsByDepartment - socket or departmentId missing", { socket: !!socket, departmentId });
      setDesignations([]);
      return;
    }
    console.log("[Promotion] ===== EMITTING promotion:getDesignationsByDepartment with departmentId:", departmentId, "type:", typeof departmentId);
    socket.emit("promotion:getDesignationsByDepartment", departmentId);
  }, [socket]);

  // Handle department change in Add form
  const handleAddDepartmentChange = (option: any) => {
    console.log("[Promotion] Add source department selected - _id:", option?.value);
    setNewPromotion({
      ...newPromotion,
      sourceDepartmentId: option?.value || "",
      employeeId: "", // Reset employee when department changes
      targetDepartmentId: "", // Reset target department
      designationToId: "", // Reset designation when department changes
    });
    // Clear all dependent field errors
    setAddErrors(prev => ({ ...prev, sourceDepartmentId: "", employeeId: "", targetDepartmentId: "", designationToId: "" }));
    if (option?.value) {
      fetchEmployeesByDepartment(option.value);
      // Do NOT fetch designations here - they depend on target department only
    } else {
      setEmployees([]);
    }
    // Clear designations since target department is reset
    setDesignations([]);
  };

  // Handle employee change in Add form
  const handleAddEmployeeChange = (option: any) => {
    console.log("[Promotion] Add employee selected - id:", option?.value);
    const employee = employees.find(emp => emp.id === option?.value);
    
    const newTargetDeptId = employee?.departmentId || "";
    console.log("[Promotion] Auto-populating target department:", newTargetDeptId);
    
    setNewPromotion({
      ...newPromotion,
      employeeId: option?.value || "",
      targetDepartmentId: newTargetDeptId, // Auto-populate with employee's current department
      designationToId: "", // Reset designation when employee changes
    });
    
    // Clear employee, department, and designation errors
    setAddErrors(prev => ({ ...prev, employeeId: "", targetDepartmentId: "", designationToId: "" }));
    
    // Fetch designations for the auto-populated target department
    if (newTargetDeptId) {
      console.log("[Promotion] Fetching designations for auto-populated department:", newTargetDeptId);
      fetchDesignationsByDepartment(newTargetDeptId);
    } else {
      console.log("[Promotion] No department to fetch designations for, clearing designations");
      setDesignations([]);
    }
  };

  // Handle target department change in Add form
  const handleAddTargetDepartmentChange = (option: any) => {
    console.log("[Promotion] Add target department selected - _id:", option?.value);
    setNewPromotion({
      ...newPromotion,
      targetDepartmentId: option?.value || "",
      designationToId: "", // Reset designation when target department changes
    });
    // Clear target department and designation errors
    setAddErrors(prev => ({ ...prev, targetDepartmentId: "", designationToId: "" }));
    if (option?.value) {
      console.log("[Promotion] Fetching designations for target department:", option.value);
      // Clear existing designations first to show loading state
      setDesignations([]);
      // Fetch designations for the target department
      fetchDesignationsByDepartment(option.value);
    } else {
      console.log("[Promotion] No target department selected, clearing designations");
      setDesignations([]);
    }
  };

  // Handle designation change in Add form
  const handleAddDesignationChange = (option: any) => {
    console.log("[Promotion] Add designation selected - id:", option?.value);
    setNewPromotion({
      ...newPromotion,
      designationToId: option?.value || "",
    });
    // Clear designation error
    setAddErrors(prev => ({ ...prev, designationToId: "" }));
  };

  // Handle promotion type change in Add form
  const handleAddPromotionTypeChange = (option: any) => {
    setNewPromotion({
      ...newPromotion,
      promotionType: option?.value || "Regular",
    });
    // Clear promotion type error
    setAddErrors(prev => ({ ...prev, promotionType: "" }));
  };

  // Handle promotion date change in Add form
  const handleAddPromotionDateChange = (date: Dayjs | null) => {
    setNewPromotion({
      ...newPromotion,
      promotionDate: date,
    });
    // Clear date error
    setAddErrors(prev => ({ ...prev, promotionDate: "" }));
  };

  // Validate Add Promotion form
  const validateAddForm = (): boolean => {
    const errors = {
      sourceDepartmentId: "",
      employeeId: "",
      targetDepartmentId: "",
      designationToId: "",
      promotionDate: "",
      promotionType: "",
    };

    let isValid = true;

    if (!newPromotion.sourceDepartmentId || newPromotion.sourceDepartmentId === "") {
      errors.sourceDepartmentId = "Please select a department";
      isValid = false;
    }

    if (!newPromotion.employeeId || newPromotion.employeeId === "") {
      errors.employeeId = "Please select an employee";
      isValid = false;
    } else {
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
    } else if (newPromotion.employeeId) {
      // Check if promoting to same designation (regardless of department change)
      const employee = employees.find(emp => emp.id === newPromotion.employeeId);
      if (employee && employee.designationId === newPromotion.designationToId) {
        // If same designation, check if it's also the same department
        if (employee.departmentId === newPromotion.targetDepartmentId) {
          errors.designationToId = "Cannot promote to the same department and designation. Please select a different department or designation.";
        } else {
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
  const validateEditForm = (): boolean => {
    const errors = {
      departmentId: "",
      designationToId: "",
      promotionDate: "",
      promotionType: "",
    };

    let isValid = true;

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
  const handleAddPromotion = () => {
    console.log("[Promotion] handleAddPromotion called", { newPromotion, socketConnected: !!socket });

    // Validate form first
    if (!validateAddForm()) {
      return;
    }

    if (!socket) {
      toast.error("Socket not connected. Please refresh the page.");
      return;
    }

    // Validation: Ensure required IDs exist
    if (!newPromotion.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    if (!newPromotion.targetDepartmentId) {
      toast.error("Please select a target department");
      return;
    }

    if (!newPromotion.designationToId) {
      toast.error("Please select a target designation");
      return;
    }

    // Send ONLY IDs to backend (normalized data model)
    const promotionData = {
      employeeId: newPromotion.employeeId,
      promotionTo: {
        departmentId: newPromotion.targetDepartmentId,
        designationId: newPromotion.designationToId
      },
      promotionDate: newPromotion.promotionDate.toISOString(),
      promotionType: newPromotion.promotionType,
    };

    console.log("[Promotion] Adding promotion with normalized data:", promotionData);

    // Set up timeout for response
    const timeoutId = setTimeout(() => {
      toast.error("Request timeout. Please check your connection and try again.");
    }, 10000);

    socket.emit("promotion:create", promotionData);

    socket.once("promotion:create:response", (response: any) => {
      clearTimeout(timeoutId);
      console.log("[Promotion] Create response:", response);
      if (response.done) {
        // Success! Show toast first
        toast.success("Promotion added successfully!");
        
        // Re-fetch promotions list to ensure fully resolved data
        console.log("[Promotion] Re-fetching promotions after create");
        socket.emit("promotion:getAll", {});
        
        // Close modal with delay for animation
        setTimeout(() => {
          closeModalReliably("new_promotion");
          
          // Reset form after modal closing animation
          setTimeout(() => {
            setNewPromotion({
              sourceDepartmentId: "",
              employeeId: "",
              targetDepartmentId: "",
              designationToId: "",
              promotionDate: null,
              promotionType: "Regular",
            });
            setAddErrors({
              sourceDepartmentId: "",
              employeeId: "",
              targetDepartmentId: "",
              designationToId: "",
              promotionDate: "",
              promotionType: "",
            });
            setEmployees([]);
            setDesignations([]);
          }, 300);
        }, 100);
      } else {
        // Handle field-level errors from backend validation
        const errorMessage = response.error || "Failed to add promotion";
        
        // Check if it's an employee lifecycle conflict
        if (errorMessage.includes("promotion") || errorMessage.includes("resignation") || errorMessage.includes("termination")) {
          setAddErrors(prev => ({ ...prev, employeeId: errorMessage }));
        }
        
        toast.error(errorMessage);
        console.error("[Promotion] Create failed:", response);
      }
    });
  };

  // Handle edit promotion
  const handleEditClick = (promotion: Promotion) => {
    console.log("[Promotion] Edit clicked:", promotion);
    
    // Validate promotion structure before proceeding
    if (!promotion.promotionTo?.department?.id || !promotion.promotionTo?.designation?.id) {
      toast.error("Invalid promotion data. Please refresh the page and try again.");
      console.error("[Promotion] Invalid promotion structure:", promotion);
      return;
    }
    
    setEditingPromotion(promotion);
    setEditForm({
      departmentId: promotion.promotionTo.department.id,
      designationToId: promotion.promotionTo.designation.id,
      promotionDate: dayjs(promotion.promotionDate),
      promotionType: promotion.promotionType || "Regular",
    });
    // Clear edit errors when opening modal
    setEditErrors({
      departmentId: "",
      designationToId: "",
      promotionDate: "",
      promotionType: "",
    });
    // Fetch designations for the promotion's target department
    if (promotion.promotionTo.department.id) {
      fetchDesignationsByDepartment(promotion.promotionTo.department.id);
    }
  };

  const handleUpdatePromotion = () => {
    console.log("[Promotion] handleUpdatePromotion called", { editForm, editingPromotion });

    // Validate form first
    if (!validateEditForm()) {
      return;
    }

    if (!socket || !editingPromotion) {
      toast.error("Socket not connected or no promotion selected");
      return;
    }

    // Validation: Ensure required IDs exist
    if (!editForm.departmentId) {
      toast.error("Please select a department");
      return;
    }

    if (!editForm.designationToId) {
      toast.error("Please select a designation");
      return;
    }

    // Send ONLY IDs to backend (normalized data model)
    const updateData = {
      promotionTo: {
        departmentId: editForm.departmentId,
        designationId: editForm.designationToId
      },
      promotionDate: editForm.promotionDate.toISOString(),
      promotionType: editForm.promotionType,
    };

    console.log("[Promotion] Updating promotion with normalized data:", { promotionId: editingPromotion._id, update: updateData });

    const timeoutId = setTimeout(() => {
      toast.error("Update timeout. Please try again.");
    }, 10000);

    socket.emit("promotion:update", {
      promotionId: editingPromotion._id,
      update: updateData,
    });

    socket.once("promotion:update:response", (response: any) => {
      clearTimeout(timeoutId);
      console.log("[Promotion] Update response:", response);
      if (response.done) {
        // Success! Show toast first
        toast.success("Promotion updated successfully!");
        
        // Re-fetch promotions list to ensure fully resolved data
        console.log("[Promotion] Re-fetching promotions after update");
        socket.emit("promotion:getAll", {});
        
        // Close modal with delay for animation
        setTimeout(() => {
          closeModalReliably("edit_promotion");
          
          // Reset form after modal closing animation
          setTimeout(() => {
            setEditingPromotion(null);
            setEditForm({
              departmentId: "",
              designationToId: "",
              promotionDate: null,
              promotionType: "Regular",
            });
            setEditErrors({
              departmentId: "",
              designationToId: "",
              promotionDate: "",
              promotionType: "",
            });
            setDesignations([]);
          }, 300);
        }, 100);
      } else {
        const errorMsg = response.error || "Failed to update promotion";
        console.error("[Promotion] Update failed:", response);
        
        // Map backend errors to form fields for inline display
        const newErrors = {
          departmentId: "",
          designationToId: "",
          promotionDate: "",
          promotionType: "",
        };
        
        // Check error message and set appropriate field error
        const errorLower = errorMsg.toLowerCase();
        if (errorLower.includes("designation") && errorLower.includes("different")) {
          newErrors.designationToId = errorMsg;
        } else if (errorLower.includes("designation")) {
          newErrors.designationToId = errorMsg;
        } else if (errorLower.includes("department")) {
          newErrors.departmentId = errorMsg;
        } else if (errorLower.includes("date")) {
          newErrors.promotionDate = errorMsg;
        } else if (errorLower.includes("type")) {
          newErrors.promotionType = errorMsg;
        } else {
          // Generic error - show as toast only
          toast.error(errorMsg);
        }
        
        // Set inline errors if any field-specific error was detected
        if (Object.values(newErrors).some(err => err !== "")) {
          setEditErrors(newErrors);
        }
      }
    });
  };

  // Handle delete promotion
  const handleDeleteClick = (promotionId: string) => {
    console.log("[Promotion] Delete clicked:", promotionId);
    setDeletingPromotionId(promotionId);
  };

  // Handle view promotion details
  const handleViewClick = (promotion: Promotion) => {
    console.log("[Promotion] View clicked:", promotion);
    setViewingPromotion(promotion);
  };

  const confirmDelete = () => {
    if (!socket || !deletingPromotionId) {
      toast.error("Socket not connected or no promotion selected");
      return;
    }

    console.log("[Promotion] Deleting promotion:", deletingPromotionId);

    const timeoutId = setTimeout(() => {
      toast.error("Delete timeout. Please try again.");
    }, 10000);

    socket.emit("promotion:delete", { promotionId: deletingPromotionId });

    socket.once("promotion:delete:response", (response: any) => {
      clearTimeout(timeoutId);
      console.log("[Promotion] Delete response:", response);
      if (response.done) {
        // Show toast first
        toast.success("Promotion deleted successfully!");
        
        // Re-fetch promotions list to ensure consistency
        console.log("[Promotion] Re-fetching promotions after delete");
        socket.emit("promotion:getAll", {});
        
        // Close modal with delay for animation
        setTimeout(() => {
          closeModalReliably("delete_modal");
          setDeletingPromotionId(null);
        }, 100);
      } else {
        toast.error(response.error || "Failed to delete promotion");
        console.error("[Promotion] Delete failed:", response);
      }
    });
  };

  // Convert departments to select options
  const departmentOptions = departments.map(dept => ({
    value: dept._id,
    label: dept.department
  }));

  // Convert employees to select options
  const employeeOptions = employees.length > 0
    ? employees.map(emp => ({
      value: emp.id,
      label: `${emp.employeeId} - ${emp.name}`,
    }))
    : [{ value: "", label: departments.length === 0 ? "Loading departments..." : "Select a department first" }];

  // Convert designations to select options - depends ONLY on target department
  const designationOptions = designations.length > 0
    ? designations.map(des => ({
      value: des.id,
      label: des.name,
    }))
    : [{ value: "", label: !newPromotion.targetDepartmentId ? "Select target department first" : (loading ? "Loading designations..." : "No designations available in this department") }];

  // Promotion type options
  const promotionTypeOptions = [
    { value: "Performance Based", label: "Performance Based" },
    { value: "Experience Based", label: "Experience Based" },
    { value: "Qualification Based", label: "Qualification Based" },
    { value: "Special Achievement", label: "Special Achievement" },
    { value: "Regular", label: "Regular" },
    { value: "Other", label: "Other" },
  ];

  // Get designation from based on selected employee for add form
  const getDesignationFrom = () => {
    if (newPromotion.employeeId) {
      const employee = employees.find(emp => emp.id === newPromotion.employeeId);
      return employee ? employee.designation : "";
    }
    return "";
  };

  // Get department from based on selected employee for add form
  const getDepartmentFrom = () => {
    if (newPromotion.employeeId) {
      const employee = employees.find(emp => emp.id === newPromotion.employeeId);
      return employee ? employee.department : "";
    }
    return "";
  };

  const data = promotions
    .filter(promotion => {
      // Filter out promotions with incomplete data structure
      return promotion?.employee?.id && 
             promotion?.promotionFrom?.department?.name && 
             promotion?.promotionFrom?.designation?.name &&
             promotion?.promotionTo?.designation?.name;
    })
    .map(promotion => {
      // Look up the actual employee from employees array to get the correct employeeId
      const employee = employees.find(emp => emp.id === promotion.employee.id);
      const displayEmployeeId = promotion.employee.employeeId || employee?.employeeId || promotion.employee.id;
      
      return {
        key: promotion._id,
        Employee_ID: displayEmployeeId,
        Promoted_Employee: promotion.employee.name,
        Image: promotion.employee.image,
        Department: promotion.promotionFrom.department.name,
        Designation_From: promotion.promotionFrom.designation.name,
        Designation_To: promotion.promotionTo.designation.name,
        Promotion_Date: dayjs(promotion.promotionDate).format("DD MMM YYYY"),
        _original: promotion,
      };
    });

  const columns = [
    {
      title: "Employee ID",
      dataIndex: "Employee_ID",
      render: (text: string) => (
        <span className="fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) =>
        a.Employee_ID.localeCompare(b.Employee_ID),
    },
    {
      title: "Name",
      dataIndex: "Promoted_Employee",
      render: (text: string, record: any) => (
        <EmployeeNameCell
          name={text}
          image={record.Image}
          employeeId={record._original.employee.id}
          avatarTheme="primary"
        />
      ),
      sorter: (a: any, b: any) =>
        a.Promoted_Employee.localeCompare(b.Promoted_Employee),
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: (a: any, b: any) => a.Department.localeCompare(b.Department),
    },
    {
      title: "Designation From",
      dataIndex: "Designation_From",
      sorter: (a: any, b: any) =>
        a.Designation_From.localeCompare(b.Designation_From),
    },
    {
      title: "Designation To",
      dataIndex: "Designation_To",
      sorter: (a: any, b: any) =>
        a.Designation_To.localeCompare(b.Designation_To),
    },
    {
      title: "Promotion Date",
      dataIndex: "Promotion_Date",
      sorter: (a: any, b: any) =>
        a.Promotion_Date.localeCompare(b.Promotion_Date),
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            onClick={(e) => {
              e.preventDefault();
              handleViewClick(record._original);
            }}
            data-bs-toggle="modal"
            data-bs-target="#view_promotion"
          >
            <i className="ti ti-eye" />
          </Link>
          <Link
            to="#"
            className="me-2"
            onClick={(e) => {
              e.preventDefault();
              handleEditClick(record._original);
            }}
            data-bs-toggle="modal"
            data-bs-target="#edit_promotion"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDeleteClick(record._original._id);
            }}
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Promotion</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Performance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Promotion
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#new_promotion"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Promotion
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Promotion List */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                  <h5 className="d-flex align-items-center">Promotion List</h5>
                  <div className="d-flex align-items-center flex-wrap row-gap-3">
                    <div className="input-icon position-relative me-2">
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                      <input
                        type="text"
                        className="form-control date-range bookingrange"
                        placeholder="dd/mm/yyyy - dd/mm/yyyy "
                      />
                    </div>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-white d-inline-flex align-items-center fs-12"
                        data-bs-toggle="dropdown"
                      >
                        <p className="fs-12 d-inline-flex me-1">Sort By : </p>
                        Last 7 Days
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Recently Added
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Ascending
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Desending
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading promotions...</p>
                    </div>
                  ) : promotions.length === 0 ? (
                    <div className="text-center p-5">
                      <i className="ti ti-clipboard-text fs-48 text-muted mb-3 d-block" />
                      <h5 className="text-muted">No promotions found</h5>
                      <p className="text-muted">Click "Add Promotion" to create your first promotion record</p>
                    </div>
                  ) : (
                    <Table dataSource={data} columns={columns} Selection={true} />
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* /Promotion List  */}
        </div>
        {/* Footer */}
        <Footer />
        {/* /Footer */}
      </div>
      {/* /Page Wrapper */}
      <>
        {/* Add Promotion */}
        <div className="modal fade" id="new_promotion">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Promotion</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form>
                <div className="modal-body pb-0" id="modal-datepicker">
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Department <span className="text-danger">*</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={departmentOptions}
                          value={departmentOptions.find(opt => opt.value === newPromotion.sourceDepartmentId) || null}
                          onChange={handleAddDepartmentChange}
                        />
                        {addErrors.sourceDepartmentId && (
                          <div className="text-danger fs-12 mt-1">{addErrors.sourceDepartmentId}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Promotion For <span className="text-danger">*</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={employeeOptions}
                          value={employeeOptions.find(opt => opt.value === newPromotion.employeeId) || null}
                          onChange={handleAddEmployeeChange}
                        />
                        {addErrors.employeeId && (
                          <div className="text-danger fs-12 mt-1">{addErrors.employeeId}</div>
                        )}
                      </div>
                    </div>
                    {newPromotion.employeeId && (
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Current Designation</label>
                          <input
                            type="text"
                            className="form-control"
                            value={getDesignationFrom()}
                            disabled
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Two-Column Layout */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Department To <span className="text-danger">*</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={departmentOptions}
                          value={departmentOptions.find(opt => opt.value === newPromotion.targetDepartmentId) || null}
                          onChange={handleAddTargetDepartmentChange}
                          disabled={!newPromotion.employeeId}
                        />
                        {addErrors.targetDepartmentId && (
                          <div className="text-danger fs-12 mt-1">{addErrors.targetDepartmentId}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Promotion To <span className="text-danger">*</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={designationOptions}
                          value={designationOptions.find(opt => opt.value === newPromotion.designationToId) || null}
                          onChange={handleAddDesignationChange}
                          disabled={!newPromotion.targetDepartmentId}
                        />
                        {addErrors.designationToId && (
                          <div className="text-danger fs-12 mt-1">{addErrors.designationToId}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Promotion Type <span className="text-danger">*</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={promotionTypeOptions}
                          value={promotionTypeOptions.find(opt => opt.value === newPromotion.promotionType) || null}
                          onChange={handleAddPromotionTypeChange}
                        />
                        {addErrors.promotionType && (
                          <div className="text-danger fs-12 mt-1">{addErrors.promotionType}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Promotion Date <span className="text-danger">*</span>
                        </label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            value={newPromotion.promotionDate}
                            onChange={handleAddPromotionDateChange}
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar text-gray-7" />
                          </span>
                        </div>
                        {addErrors.promotionDate && (
                          <div className="text-danger fs-12 mt-1">{addErrors.promotionDate}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-white border me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPromotion}
                    className="btn btn-primary"
                    disabled={loading || employees.length === 0 || designations.length === 0}
                  >
                    {loading ? "Loading..." : "Add Promotion"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Add Promotion */}
        {/* Edit Promotion */}
        <div className="modal fade" id="edit_promotion">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Promotion</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form>
                <div className="modal-body pb-0" id="modal-datepicker">
                  <div className="row">
                    {editingPromotion && (
                      <>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Employee</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editingPromotion.employee.name}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Current Designation</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editingPromotion.promotionFrom.designation.name}
                              disabled
                            />
                          </div>
                        </div>
                        
                        {/* Two-Column Layout */}
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Department To <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              className="select"
                              options={departmentOptions}
                              value={departmentOptions.find(opt => opt.value === editForm.departmentId) || null}
                              onChange={(option: any) => {
                                setEditForm({ ...editForm, departmentId: option.value, designationToId: "" });
                                setEditErrors(prev => ({ ...prev, departmentId: "", designationToId: "" }));
                                if (option?.value) {
                                  fetchDesignationsByDepartment(option.value);
                                } else {
                                  setDesignations([]);
                                }
                              }}
                            />
                            {editErrors.departmentId && (
                              <div className="text-danger fs-12 mt-1">{editErrors.departmentId}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Promotion To <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              className="select"
                              options={designationOptions}
                              value={designationOptions.find(opt => opt.value === editForm.designationToId) || null}
                              onChange={(option: any) => {
                                setEditForm({ ...editForm, designationToId: option.value });
                                setEditErrors(prev => ({ ...prev, designationToId: "" }));
                              }}
                            />
                            {editErrors.designationToId && (
                              <div className="text-danger fs-12 mt-1">{editErrors.designationToId}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Promotion Type <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              className="select"
                              options={promotionTypeOptions}
                              value={promotionTypeOptions.find(opt => opt.value === editForm.promotionType) || null}
                              onChange={(option: any) => {
                                setEditForm({ ...editForm, promotionType: option.value });
                                setEditErrors(prev => ({ ...prev, promotionType: "" }));
                              }}
                            />
                            {editErrors.promotionType && (
                              <div className="text-danger fs-12 mt-1">{editErrors.promotionType}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Promotion Date <span className="text-danger">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format="DD-MM-YYYY"
                                value={editForm.promotionDate}
                                onChange={(date) => {
                                  setEditForm({ ...editForm, promotionDate: date });
                                  setEditErrors(prev => ({ ...prev, promotionDate: "" }));
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar text-gray-7" />
                              </span>
                            </div>
                            {editErrors.promotionDate && (
                              <div className="text-danger fs-12 mt-1">{editErrors.promotionDate}</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-white border me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdatePromotion}
                    className="btn btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Edit Promotion */}
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                  <i className="ti ti-trash-x fs-36" />
                </span>
                <h4 className="mb-1">Confirm Delete</h4>
                <p className="mb-3">
                  Are you sure you want to delete this promotion? This action cannot be undone.
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light me-3"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="btn btn-danger"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
        {/* View Promotion Detail Modal */}
        <PromotionDetailsModal promotion={viewingPromotion} modalId="view_promotion" />
        {/* /View Promotion Detail Modal */}
      </>
    </>
  );
};

export default Promotion;