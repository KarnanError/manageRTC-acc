import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import { toast } from "react-toastify";
import CommonSelect, { Option } from "../../../core/common/commonSelect";
import CommonTagsInput from "../../../core/common/Taginput";
import Select from "react-select";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import Footer from "../../../core/common/footer";

interface Project {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  client?: string;
  teamMembers?: string[];
  teamLeader?: string[];
  projectManager?: string[];
  projectValue?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  overdue: number;
}

interface FormData {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  priority: string;
  projectValue: string;
  totalWorkingHours: string;
  extraTime: string;
  description: string;
  teamMembers: Array<{ value: string; label: string }>;
  teamLeader: Array<{ value: string; label: string }>;
  projectManager: Array<{ value: string; label: string }>;
  status: string;
  tags: string[];
}

const initialFormData: FormData = {
  name: "",
  client: "",
  startDate: "",
  endDate: "",
  priority: "Medium",
  projectValue: "",
  totalWorkingHours: "",
  extraTime: "",
  description: "",
  teamMembers: [],
  teamLeader: [],
  projectManager: [],
  status: "Active",
  tags: [],
};

const ProjectList = () => {
  const socket = useSocket() as any;

  useEffect(() => {
  }, [socket]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({ total: 0, active: 0, completed: 0, onHold: 0, overdue: 0 });
  const [clients, setClients] = useState<Array<{ value: string; label: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ value: string; label: string; position: string; department: string; employeeId?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    client: "all",
    search: ""
  });

  // Form state for create/edit
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal step and image upload states
  const [currentStep, setCurrentStep] = useState(1);
  const [logo, setLogo] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState(false);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Active", label: "Active" },
    { value: "Completed", label: "Completed" },
    { value: "On Hold", label: "On Hold" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const clientOptions = [
    { value: "all", label: "All Clients" },
    ...clients.map(client => ({ value: client.label, label: client.label }))
  ];


  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 500);
  }, []);


  const clearFilters = useCallback(() => {
    setFilters({
      status: "all",
      priority: "all",
      client: "all",
      search: ""
    });
  }, []);

  const loadProjects = useCallback((filterParams = {}) => {

    if (!socket) return;

    setLoading(true);
    socket.emit("project:getAllData", filterParams);
  }, [socket]);

  const handleCreateProject = useCallback((projectData: any) => {
    if (!socket) return;

    socket.emit("project:create", projectData);
  }, [socket]);

  const handleUpdateProject = useCallback((projectId: string, updateData: any) => {
    if (!socket) return;

    socket.emit("project:update", { projectId, update: updateData });
  }, [socket]);

  const handleDeleteProject = useCallback((projectId: string) => {
    if (!socket) return;

    socket.emit("project:delete", { projectId });
  }, [socket]);

  const loadModalData = useCallback(() => {
    console.log("[ProjectList] loadModalData called, socket:", !!socket);
    if (!socket) {
      console.warn("[ProjectList] Socket not available");
      return;
    }
    console.log("[ProjectList] Emitting project:getAllData");
    socket.emit("project:getAllData");
  }, [socket]);

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    const cloudName = "amasqis";
    const uploadPreset = "amasqis_preset";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.secure_url;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (4MB limit)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError("Image should be below 4 MB");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/x-icon"];
    if (!validTypes.includes(file.type)) {
      setFormError("Only JPEG, PNG, and ICO images are allowed");
      return;
    }

    try {
      setImageUpload(true);
      const imageUrl = await uploadImage(file);
      setLogo(imageUrl);
      setFormError(null);
    } catch (error) {
      setFormError("Failed to upload image. Please try again.");
    } finally {
      setImageUpload(false);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get select options with default
  const getSelectOptions = (
    options: Array<{ value: string; label: string }>,
    defaultLabel: string = "Select"
  ) => {
    return [{ value: "", label: defaultLabel }, ...options];
  };

  const getModalContainer = () => {
    const modal = document.querySelector(".modal-content") as HTMLElement | null;
    return modal || document.body;
  };

  const validateProjectField = useCallback((fieldName: string, value: any): string => {
    switch (fieldName) {
      case "name":
        if (!value || !value.trim()) return "Project name is required";
        break;
      case "client":
        if (!value || !value.trim()) return "Client is required";
        break;
      case "startDate":
        if (!value) return "Start date is required";
        break;
      case "endDate":
        if (!value) return "End date is required";
        break;
      case "priority":
        if (!value || value === "") return "Priority is required";
        break;
      case "projectValue": {
        if (value === undefined || value === null || value === "") return "Project value is required";
        const num = Number(value);
        if (Number.isNaN(num) || num < 0) return "Project value must be a positive number";
        break;
      }
      case "description":
        if (!value || !value.trim()) return "Description is required";
        break;
      case "teamMembers":
        if (!value || (Array.isArray(value) && value.length === 0)) return "Team members are required";
        break;
      case "teamLeader":
        if (!value || (Array.isArray(value) && value.length === 0)) return "Team leader is required";
        break;
      case "projectManager":
        if (!value || (Array.isArray(value) && value.length === 0)) return "Project manager is required";
        break;
    }
    return "";
  }, []);

  const handleEditFieldBlur = useCallback((fieldName: string, value: any) => {
    const error = validateProjectField(fieldName, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[fieldName] = error;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  }, [validateProjectField]);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const computeProjectErrors = useCallback((data: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    const nameError = validateProjectField("name", data.name);
    if (nameError) errors.name = nameError;

    const clientError = validateProjectField("client", data.client);
    if (clientError) errors.client = clientError;

    const startError = validateProjectField("startDate", data.startDate);
    if (startError) errors.startDate = startError;

    const endError = validateProjectField("endDate", data.endDate);
    if (endError) errors.endDate = endError;

    const priorityError = validateProjectField("priority", data.priority);
    if (priorityError) errors.priority = priorityError;

    const valueError = validateProjectField("projectValue", data.projectValue);
    if (valueError) errors.projectValue = valueError;

    const descriptionError = validateProjectField("description", data.description);
    if (descriptionError) errors.description = descriptionError;

    const teamMembersError = validateProjectField("teamMembers", data.teamMembers);
    if (teamMembersError) errors.teamMembers = teamMembersError;

    const teamLeaderError = validateProjectField("teamLeader", data.teamLeader);
    if (teamLeaderError) errors.teamLeader = teamLeaderError;

    const projectManagerError = validateProjectField("projectManager", data.projectManager);
    if (projectManagerError) errors.projectManager = projectManagerError;

    if (data.startDate && data.endDate) {
      const start = dayjs(data.startDate, "DD-MM-YYYY");
      const end = dayjs(data.endDate, "DD-MM-YYYY");
      if (start.isValid() && end.isValid() && !end.isAfter(start)) {
        errors.endDate = "End date must be after start date";
      }
    }

    return errors;
  }, [validateProjectField]);

  const focusFirstError = useCallback((errors: Record<string, string>) => {
    setTimeout(() => {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
        document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        (errorElement as HTMLElement).focus?.();
      }
    }, 100);
  }, []);

  const validateEditBasicInfo = useCallback((): boolean => {
    const errors = computeProjectErrors(formData);
    const basicInfoFields = ["name", "client", "startDate", "endDate", "priority", "projectValue", "description"];
    const basicInfoErrors: Record<string, string> = {};
    basicInfoFields.forEach((field) => {
      if (errors[field]) {
        basicInfoErrors[field] = errors[field];
      }
    });

    setFieldErrors(basicInfoErrors);

    if (Object.keys(basicInfoErrors).length > 0) {
      setFormError(null);
      focusFirstError(basicInfoErrors);
      return false;
    }

    setFormError(null);
    return true;
  }, [computeProjectErrors, focusFirstError, formData]);

  const validateEditTeamMembers = useCallback((): boolean => {
    const errors = computeProjectErrors(formData);
    const teamFields = ["teamMembers", "teamLeader", "projectManager"];
    const teamErrors: Record<string, string> = {};
    teamFields.forEach((field) => {
      if (errors[field]) {
        teamErrors[field] = errors[field];
      }
    });

    setFieldErrors(teamErrors);

    if (Object.keys(teamErrors).length > 0) {
      setFormError(null);
      focusFirstError(teamErrors);
      return false;
    }

    setFormError(null);
    return true;
  }, [computeProjectErrors, focusFirstError, formData]);

  const validateEditProjectForm = useCallback((): boolean => {
    const errors = computeProjectErrors(formData);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(null);
      focusFirstError(errors);
      return false;
    }

    setFormError(null);
    return true;
  }, [computeProjectErrors, focusFirstError, formData]);

  const validateAddProjectForm = useCallback((): boolean => {
    const errors = computeProjectErrors(formData);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(null);
      focusFirstError(errors);
      return false;
    }

    setFormError(null);
    return true;
  }, [computeProjectErrors, focusFirstError, formData]);

  const validateAddStepOne = useCallback((): boolean => {
    const errors = computeProjectErrors(formData);
    const stepFields = ["name", "client", "startDate", "endDate", "priority", "projectValue", "description"];
    const stepErrors: Record<string, string> = {};
    stepFields.forEach((field) => {
      if (errors[field]) {
        stepErrors[field] = errors[field];
      }
    });

    setFieldErrors((prev) => {
      const next = { ...prev };
      stepFields.forEach((field) => {
        if (stepErrors[field]) {
          next[field] = stepErrors[field];
        } else {
          delete next[field];
        }
      });
      return next;
    });

    if (Object.keys(stepErrors).length > 0) {
      setFormError(null);
      focusFirstError(stepErrors);
      return false;
    }

    setFormError(null);
    return true;
  }, [computeProjectErrors, focusFirstError, formData]);

  const handleNext = () => {
    if (!validateAddStepOne()) {
      return;
    }
    setFormError(null);
    setCurrentStep(2);
  };

  const handlePrevious = () => {
    setCurrentStep(1);
    setFormError(null);
  };

  const handleModalSubmit = () => {
    if (!validateAddProjectForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    socket?.emit("project:create", {
      name: formData.name,
      client: formData.client,
      startDate: formData.startDate,
      endDate: formData.endDate,
      priority: formData.priority,
      projectValue: formData.projectValue,
      description: formData.description,
      teamMembers: formData.teamMembers.map((member: any) => member.value),
      teamLeader: formData.teamLeader.map((leader: any) => leader.value),
      projectManager: formData.projectManager.map((manager: any) => manager.value),
      status: formData.status,
      tags: formData.tags,
      logo: logo,
    });
  };

  const handleEditBasicInfoSave = () => {
    if (!editingProject) return;

    if (!validateEditBasicInfo()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    socket?.emit("project:update", {
      projectId: editingProject._id,
      update: {
        name: formData.name.trim(),
        client: formData.client.trim(),
        status: formData.status,
        priority: formData.priority,
        projectValue: formData.projectValue,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
      }
    });
  };

  const handleEditProjectSubmit = () => {
    if (!editingProject) return;

    if (!validateEditTeamMembers()) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    socket?.emit("project:update", {
      projectId: editingProject._id,
      update: {
        name: formData.name.trim(),
        client: formData.client.trim(),
        status: formData.status,
        priority: formData.priority,
        projectValue: formData.projectValue,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        teamMembers: (formData.teamMembers || []).map((member: any) => member.value),
        teamLeader: (formData.teamLeader || []).map((leader: any) => leader.value),
        projectManager: (formData.projectManager || []).map((manager: any) => manager.value),
        tags: formData.tags,
      }
    });
  };


  useEffect(() => {
    if (!socket) return;

    const handleGetAllDataResponse = (response: any) => {
      setLoading(false);

      if (response.done) {
        setProjects(response.data.projects || []);
        setStats(response.data.stats || { total: 0, active: 0, completed: 0, onHold: 0, overdue: 0 });
        // Transform clients from string[] to { value, label }[] format
        const transformedClients = (response.data.clients || []).map((client: string) => ({
          value: client,
          label: client
        }));
        setClients(transformedClients);
        setEmployees(response.data.employees || []);
        setError(null);
      } else {
        setError(response.error || "Failed to load projects");
        toast.error(response.error || "Failed to load projects");
      }
    };

    const handleCreateResponse = (response: any) => {
      setIsSubmitting(false);
      if (response.done) {
        toast.success("Project created successfully");
        setFormData(initialFormData);
        setCurrentStep(1);
        setLogo(null);
        removeLogo();
        setShowAddModal(false);
        setFieldErrors({});
        loadProjects(filters);
      } else {
        setFormError(response.error || "Failed to create project");
        toast.error(response.error || "Failed to create project");
      }
    };

    const handleUpdateResponse = (response: any) => {
      setIsSubmitting(false);
      if (response.done) {
        toast.success("Project updated successfully");
        setFormData(initialFormData);
        setEditingProject(null);
        setShowEditModal(false);
        setFieldErrors({});
        loadProjects(filters);
      } else {
        setFormError(response.error || "Failed to update project");
        toast.error(response.error || "Failed to update project");
      }
    };

    const handleDeleteResponse = (response: any) => {
      if (response.done) {
        toast.success("Project deleted successfully");
        setDeletingProject(null);
        setShowDeleteModal(false);
        loadProjects(filters);
      } else {
        toast.error(response.error || "Failed to delete project");
      }
    };


    socket.on("project:getAllData-response", handleGetAllDataResponse);
    socket.on("project:create-response", handleCreateResponse);
    socket.on("project:update-response", handleUpdateResponse);
    socket.on("project:delete-response", handleDeleteResponse);


    loadProjects(filters);

    return () => {
      socket.off("project:getAllData-response", handleGetAllDataResponse);
      socket.off("project:create-response", handleCreateResponse);
      socket.off("project:update-response", handleUpdateResponse);
      socket.off("project:delete-response", handleDeleteResponse);
    };
  }, [socket, loadProjects, filters]);


  useEffect(() => {
    if (socket) {
      loadProjects(filters);
    }
  }, [filters, socket, loadProjects]);


  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const columns = [
    {
      title: "Project ID",
      dataIndex: "_id",
      render: (text: string, record: Project) => (
        <Link to={`/projects-details/${record._id}`}>
          {record.projectId.substring(0, 8).toUpperCase()}
        </Link>
      ),
      sorter: (a: Project, b: Project) => a.projectId.localeCompare(b.projectId),
    },
    {
      title: "Project Name",
      dataIndex: "name",
      render: (text: string, record: Project) => (
        <h6 className="fw-medium">
          <Link to={`${all_routes.projectdetails}/${record._id}`}>
            {record.name || "Unnamed Project"}
          </Link>
        </h6>
      ),
      sorter: (a: Project, b: Project) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Client",
      dataIndex: "client",
      render: (text: string, record: Project) => (
        <div className="d-flex align-items-center file-name-icon">
          <div className="avatar avatar-sm border avatar-rounded bg-primary text-white">
            <span className="fs-12 fw-medium">
              {(record.client && record.client.length > 0 ? record.client.charAt(0).toUpperCase() : '?')}
            </span>
          </div>
          <div className="ms-2">
            <h6 className="fw-normal">
              <Link to="#">{record.client || "No Client"}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: Project, b: Project) => (a.client || "").localeCompare(b.client || ""),
    },
    {
      title: "Team",
      dataIndex: "teamMembers",
      render: (text: string[], record: Project) => (
        <div className="avatar-list-stacked avatar-group-sm">
          {record.teamMembers && record.teamMembers.length > 0 ? (
            record.teamMembers.slice(0, 3).map((member, index) => (
              <span key={index} className="avatar avatar-rounded bg-primary text-white">
                <span className="fs-12 fw-medium">
                  {member && typeof member === 'string' && member.length > 0 ? member.charAt(0).toUpperCase() : '?'}
                </span>
              </span>
            ))
          ) : (
            <span className="avatar avatar-rounded bg-secondary text-white">
              <span className="fs-12 fw-medium">?</span>
            </span>
          )}
          {record.teamMembers && record.teamMembers.length > 3 && (
            <Link
              className="avatar bg-primary avatar-rounded text-fixed-white fs-12 fw-medium"
              to="#"
            >
              +{record.teamMembers.length - 3}
            </Link>
          )}
        </div>
      ),
      sorter: (a: Project, b: Project) => (a.teamMembers?.length || 0) - (b.teamMembers?.length || 0),
    },
    {
      title: "Deadline",
      dataIndex: "endDate",
      render: (text: Date, record: Project) => (
        <span>
          {record.endDate ? new Date(record.endDate).toLocaleDateString() : "No Deadline"}
        </span>
      ),
      sorter: (a: Project, b: Project) => {
        const aDate = a.endDate ? new Date(a.endDate).getTime() : 0;
        const bDate = b.endDate ? new Date(b.endDate).getTime() : 0;
        return aDate - bDate;
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (text: string, record: Project) => (
        <span
          className={`badge ${record.priority === "High"
            ? "badge-danger"
            : record.priority === "Low"
              ? "badge-success"
              : "badge-warning"
            } d-inline-flex align-items-center`}
        >
          <i className="ti ti-point-filled me-1" />
          {record.priority || "Medium"}
        </span>
      ),
      sorter: (a: Project, b: Project) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string, record: Project) => (
        <span
          className={`badge ${record.status === "Active"
            ? "badge-success"
            : record.status === "Completed"
              ? "badge-primary"
              : record.status === "On Hold"
                ? "badge-warning"
                : "badge-secondary"
            } d-inline-flex align-items-center badge-xs`}
        >
          <i className="ti ti-point-filled me-1" />
          {record.status || "Unknown"}
        </span>
      ),
      sorter: (a: Project, b: Project) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "",
      dataIndex: "actions",
      render: (text: any, record: Project) => (
        <div className="action-icon d-inline-flex">
          <button
            className="btn btn-icon btn-sm me-2"
            onClick={() => {
              setEditingProject(record);
              // Convert team member IDs to objects matching form format
              const teamMembersData = (record.teamMembers || []).map((memberId: string) => {
                const employee = employees.find(emp => emp.value === memberId);
                return employee || { value: memberId, label: memberId };
              });

              const teamLeaderData = (record.teamLeader || []).map((leaderId: string) => {
                const employee = employees.find(emp => emp.value === leaderId);
                return employee || { value: leaderId, label: leaderId };
              });

              const projectManagerData = (record.projectManager || []).map((managerId: string) => {
                const employee = employees.find(emp => emp.value === managerId);
                return employee || { value: managerId, label: managerId };
              });
              
              setFormData({
                name: record.name,
                client: record.client || "",
                startDate: record.startDate ? dayjs(record.startDate).format("DD-MM-YYYY") : "",
                endDate: record.endDate ? dayjs(record.endDate).format("DD-MM-YYYY") : "",
                priority: record.priority || "Medium",
                projectValue: record.projectValue !== undefined && record.projectValue !== null ? String(record.projectValue) : "",
                totalWorkingHours: "",
                extraTime: "",
                description: record.description || "",
                teamMembers: teamMembersData,
                teamLeader: teamLeaderData,
                projectManager: projectManagerData,
                status: record.status || "Active",
                tags: [],
              });
              setFormError(null);
              setFieldErrors({});
              setShowEditModal(true);
            }}
            title="Edit"
          >
            <i className="ti ti-edit" />
          </button>
          <button
            className="btn btn-icon btn-sm text-danger"
            onClick={() => {
              setDeletingProject(record);
              setShowDeleteModal(true);
            }}
            title="Delete"
          >
            <i className="ti ti-trash" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <>
      <>
        <div className="page-wrapper">
          <div className="content">
            <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
              <div className="my-auto mb-2">
                <h2 className="mb-1">Projects</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={all_routes.adminDashboard}>
                        <i className="ti ti-smart-home" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">Employee</li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Projects
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                <div className="me-2 mb-2">
                  <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                    <Link
                      to={all_routes.projectlist}
                      className="btn btn-icon btn-sm active bg-primary text-white me-1"
                    >
                      <i className="ti ti-list-tree" />
                    </Link>
                    <Link
                      to={all_routes.project}
                      className="btn btn-icon btn-sm"
                    >
                      <i className="ti ti-layout-grid" />
                    </Link>
                  </div>
                </div>
                <div className="me-2 mb-2">
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-file-export me-1" />
                      Export
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-file-type-pdf me-1" />
                          Export as PDF
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-file-type-xls me-1" />
                          Export as Excel{" "}
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mb-2">
                  <button
                    onClick={() => {
                      setFormData(initialFormData);
                      setFormError(null);
                      loadModalData();
                      setShowAddModal(true);
                    }}
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Add Project
                  </button>
                </div>
                <div className="ms-2 head-icons">
                  <CollapseHeader />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5>Project List</h5>
                <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                  <div className="dropdown me-2">
                    <CommonSelect
                      className="select"
                      options={statusOptions}
                      defaultValue={filters.status}
                      onChange={(option) => setFilters(prev => ({ ...prev, status: option?.value || "all" }))}
                    />
                  </div>
                  <div className="dropdown me-2">
                    <CommonSelect
                      className="select"
                      options={priorityOptions}
                      defaultValue={filters.priority}
                      onChange={(option) => setFilters(prev => ({ ...prev, priority: option?.value || "all" }))}
                    />
                  </div>
                  <div className="dropdown me-2">
                    <CommonSelect
                      className="select"
                      options={clientOptions}
                      defaultValue={filters.client}
                      onChange={(option) => setFilters(prev => ({ ...prev, client: option?.value || "all" }))}
                    />
                  </div>
                  <div className="input-group me-2" style={{ width: '200px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search projects..."
                      defaultValue={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                  {(filters.status !== "all" || filters.priority !== "all" || filters.client !== "all" || filters.search) && (
                    <button
                      className="btn btn-outline-secondary me-2"
                      onClick={clearFilters}
                      title="Clear all filters"
                    >
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading projects...</p>
                  </div>
                ) : (
                  <Table dataSource={projects} columns={columns} Selection={true} />
                )}
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </>

      {/* Add Project Modal - Using ProjectModal Structure */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header header-border align-items-center justify-content-between">
                <h5 className="modal-title">Add Project</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setCurrentStep(1);
                    setFormData(initialFormData);
                    setFormError(null);
                    setLogo(null);
                    removeLogo();
                  }}
                ><i className="ti ti-x" /></button>
              </div>

              <div className="add-info-fieldset">
                <div className="add-details-wizard p-3 pb-0">
                  <ul className="progress-bar-wizard d-flex align-items-center border-bottom">
                    <li className={`p-2 pt-0 ${currentStep === 1 ? "active" : ""}`}>
                      <h6 className="fw-medium">Basic Information</h6>
                    </li>
                    <li className={`p-2 pt-0 ${currentStep === 2 ? "active" : ""}`}>
                      <h6 className="fw-medium">Members</h6>
                    </li>
                  </ul>
                </div>

                {currentStep === 1 && (
                  <fieldset id="first-field-file">
                    <div className="modal-body">
                      {formError && (
                        <div className="alert alert-danger mb-3" role="alert">
                          {formError}
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-12">
                          <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                            <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                              {logo ? (
                                <img
                                  src={logo}
                                  alt="Uploaded Logo"
                                  className="rounded-circle"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : imageUpload ? (
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Uploading...</span>
                                </div>
                              ) : (
                                <i className="ti ti-photo text-gray-2 fs-16" />
                              )}
                            </div>
                            <div className="profile-upload">
                              <div className="mb-2">
                                <h6 className="mb-1">Upload Project Logo</h6>
                                <p className="fs-12">Image should be below 4 mb</p>
                              </div>
                              <div className="profile-uploader d-flex align-items-center">
                                <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                  {logo ? "Change" : "Upload"}
                                  <input
                                    type="file"
                                    className="form-control image-sign"
                                    accept=".png,.jpeg,.jpg,.ico"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                  />
                                </div>
                                {logo ? (
                                  <Link to="#" onClick={removeLogo} className="btn btn-light btn-sm">
                                    Remove
                                  </Link>
                                ) : (
                                  <Link to="#" className="btn btn-light btn-sm">
                                    Cancel
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Project Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                              value={formData.name}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, name: e.target.value }));
                                clearFieldError("name");
                              }}
                              onBlur={(e) => handleEditFieldBlur("name", e.target.value)}
                              placeholder="Enter project name"
                            />
                            {fieldErrors.name && (
                              <div className="invalid-feedback d-block">{fieldErrors.name}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Client <span className="text-danger">*</span></label>
                            <div data-field="client">
                              <CommonSelect
                                className={`select ${fieldErrors.client ? "is-invalid" : ""}`}
                                options={[{ value: "", label: "Select Client" }, ...clients]}
                                value={clients.find(c => c.label === formData.client) || { value: "", label: "Select Client" }}
                                onChange={(option) => {
                                  setFormData(prev => ({ ...prev, client: option?.label || "" }));
                                  clearFieldError("client");
                                  handleEditFieldBlur("client", option?.label || "");
                                }}
                              />
                            </div>
                            {fieldErrors.client && (
                              <div className="invalid-feedback d-block">{fieldErrors.client}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Start Date <span className="text-danger">*</span>
                                </label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format="DD-MM-YYYY"
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    value={formData.startDate ? dayjs(formData.startDate, "DD-MM-YYYY") : null}
                                    onChange={(date, dateString) => {
                                      const dateStr = Array.isArray(dateString) ? dateString[0] : dateString;
                                      setFormData(prev => ({ ...prev, startDate: dateStr }));
                                      clearFieldError("startDate");
                                      handleEditFieldBlur("startDate", dateStr);
                                    }}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
                                {fieldErrors.startDate && (
                                  <div className="invalid-feedback d-block">{fieldErrors.startDate}</div>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  End Date <span className="text-danger">*</span>
                                </label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format="DD-MM-YYYY"
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    value={formData.endDate ? dayjs(formData.endDate, "DD-MM-YYYY") : null}
                                    onChange={(date, dateString: any) => {
                                      const dateStr = typeof dateString === 'string' ? dateString : (Array.isArray(dateString) ? dateString[0] : '');
                                      setFormData(prev => ({ ...prev, endDate: dateStr }));
                                      clearFieldError("endDate");
                                      handleEditFieldBlur("endDate", dateStr);
                                    }}
                                    disabledDate={(current) => {
                                      if (!formData.startDate) return false;
                                      const startDate = dayjs(formData.startDate, 'DD-MM-YYYY');
                                      return current && (current.isSame(startDate, 'day') || current.isBefore(startDate, 'day'));
                                    }}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
                                {fieldErrors.endDate && (
                                  <div className="invalid-feedback d-block">{fieldErrors.endDate}</div>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Priority <span className="text-danger">*</span></label>
                                <div data-field="priority">
                                  <CommonSelect
                                    className={`select ${fieldErrors.priority ? "is-invalid" : ""}`}
                                    options={[
                                      { value: "High", label: "High" },
                                      { value: "Medium", label: "Medium" },
                                      { value: "Low", label: "Low" },
                                    ]}
                                    value={{ value: formData.priority, label: formData.priority }}
                                    onChange={(option) => {
                                      const nextValue = option?.value || "Medium";
                                      setFormData(prev => ({ ...prev, priority: nextValue }));
                                      clearFieldError("priority");
                                      handleEditFieldBlur("priority", nextValue);
                                    }}
                                  />
                                </div>
                                {fieldErrors.priority && (
                                  <div className="invalid-feedback d-block">{fieldErrors.priority}</div>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Project Value <span className="text-danger">*</span></label>
                                <div className="input-group">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    name="projectValue"
                                    className={`form-control ${fieldErrors.projectValue ? "is-invalid" : ""}`}
                                    value={formData.projectValue}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setFormData(prev => ({ ...prev, projectValue: value }));
                                        clearFieldError("projectValue");
                                      }
                                    }}
                                    onBlur={(e) => handleEditFieldBlur("projectValue", e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                {fieldErrors.projectValue && (
                                  <div className="invalid-feedback d-block">{fieldErrors.projectValue}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-0">
                            <label className="form-label">Description <span className="text-danger">*</span></label>
                            <textarea
                              name="description"
                              className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
                              rows={4}
                              placeholder="Enter project description"
                              value={formData.description}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, description: e.target.value }));
                                clearFieldError("description");
                              }}
                              onBlur={(e) => handleEditFieldBlur("description", e.target.value)}
                            />
                            {fieldErrors.description && (
                              <div className="invalid-feedback d-block">{fieldErrors.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <div className="d-flex align-items-center justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-light border me-2"
                          onClick={() => {
                            setShowAddModal(false);
                            setCurrentStep(1);
                            setFormData(initialFormData);
                            setFormError(null);
                            setLogo(null);
                            removeLogo();
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleNext}
                        >
                          Add Team Member
                        </button>
                      </div>
                    </div>
                  </fieldset>
                )}

                {currentStep === 2 && (
                  <fieldset className="d-block">
                    <div className="modal-body">
                      {formError && (
                        <div className="alert alert-danger mb-3" role="alert">
                          {formError}
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Project Manager <span className="text-danger">*</span></label>
                            <div data-field="projectManager">
                              <Select
                              isMulti
                              options={employees}
                              value={formData.projectManager}
                              onChange={(selectedOptions: any) => {
                                setFormData(prev => ({ ...prev, projectManager: selectedOptions || [] }));
                                clearFieldError("projectManager");
                                handleEditFieldBlur("projectManager", selectedOptions || []);
                              }}
                              placeholder="Select project managers"
                              className={`basic-multi-select ${fieldErrors.projectManager ? "is-invalid" : ""}`}
                              classNamePrefix="select"
                              getOptionLabel={(option: any) => `${option.employeeId} - ${option.label}`}
                              getOptionValue={(option: any) => option.value}
                              />
                            </div>
                            <small className="form-text text-muted">
                              Select multiple employees as project managers
                            </small>
                            {fieldErrors.projectManager && (
                              <div className="invalid-feedback d-block">{fieldErrors.projectManager}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Team Leader <span className="text-danger">*</span></label>
                            <div data-field="teamLeader">
                              <Select
                              isMulti
                              options={employees}
                              value={formData.teamLeader}
                              onChange={(selectedOptions: any) => {
                                setFormData(prev => ({ ...prev, teamLeader: selectedOptions || [] }));
                                clearFieldError("teamLeader");
                                handleEditFieldBlur("teamLeader", selectedOptions || []);
                              }}
                              placeholder="Select team leaders"
                              className={`basic-multi-select ${fieldErrors.teamLeader ? "is-invalid" : ""}`}
                              classNamePrefix="select"
                              getOptionLabel={(option: any) => `${option.employeeId} - ${option.label}`}
                              getOptionValue={(option: any) => option.value}
                              />
                            </div>
                            <small className="form-text text-muted">
                              Select multiple employees as team leaders
                            </small>
                            {fieldErrors.teamLeader && (
                              <div className="invalid-feedback d-block">{fieldErrors.teamLeader}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Team Members <span className="text-danger">*</span></label>
                            <div data-field="teamMembers">
                              <Select
                              isMulti
                              options={employees}
                              value={formData.teamMembers}
                              onChange={(selectedOptions: any) => {
                                const newTeamMembers = selectedOptions || [];
                                setFormData(prev => ({ ...prev, teamMembers: newTeamMembers }));
                                clearFieldError("teamMembers");
                                handleEditFieldBlur("teamMembers", newTeamMembers);
                                
                                // Validate team members against team leader and project manager
                                const teamMemberIds = newTeamMembers.map((member: any) => member.value);
                                const teamLeaderIds = formData.teamLeader.map((leader: any) => leader.value);
                                const projectManagerIds = formData.projectManager.map((manager: any) => manager.value);
                                
                                const hasLeaderConflict = teamLeaderIds.some(id => teamMemberIds.includes(id));
                                const hasManagerConflict = projectManagerIds.some(id => teamMemberIds.includes(id));
                                
                                if (hasLeaderConflict) {
                                  setFormError("Team member cannot be selected as both a team member and team leader");
                                } else if (hasManagerConflict) {
                                  setFormError("Team member cannot be selected as both a team member and project manager");
                                } else {
                                  setFormError(null);
                                }
                              }}
                              placeholder="Select team members"
                              className={`basic-multi-select ${fieldErrors.teamMembers ? "is-invalid" : ""}`}
                              classNamePrefix="select"
                              getOptionLabel={(option: any) => `${option.employeeId} - ${option.label}`}
                              getOptionValue={(option: any) => option.value}
                              />
                            </div>
                            <small className="form-text text-muted">
                              Select multiple employees for the project team
                            </small>
                            {fieldErrors.teamMembers && (
                              <div className="invalid-feedback d-block">{fieldErrors.teamMembers}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <input
                              type="text"
                              className="form-control"
                              value="Active"
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div>
                            <label className="form-label">Tags</label>
                            <CommonTagsInput
                              value={formData.tags}
                              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                              placeholder="Add project tags"
                              className="custom-input-class"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <div className="d-flex align-items-center justify-content-between w-100">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handlePrevious}
                        >
                          Previous
                        </button>
                        <div className="d-flex align-items-center">
                          <button
                            type="button"
                            className="btn btn-outline-light border me-2"
                            onClick={() => {
                              setShowAddModal(false);
                              setCurrentStep(1);
                              setFormData(initialFormData);
                              setFormError(null);
                              setLogo(null);
                              removeLogo();
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleModalSubmit}
                            disabled={isSubmitting || Object.keys(fieldErrors).length > 0}
                          >
                            {isSubmitting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Creating...
                              </>
                            ) : (
                              "Create Project"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal - Using Tab Navigation Like Edit Employee */}
      {showEditModal && editingProject && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header header-border align-items-center justify-content-between">
                <h5 className="modal-title">Edit Project</h5>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentStep(1);
                    setFieldErrors({});
                    setFormError(null);
                  }}
                ><i className="ti ti-x" /></button>
              </div>

              <form>
                <div className="contact-grids-tab">
                  <ul className="nav nav-underline" id="editProjectTab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${currentStep === 1 ? "active" : ""}`}
                        id="basic-info-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#basic-info-tab-pane"
                        type="button"
                        role="tab"
                        aria-selected={currentStep === 1}
                        onClick={() => setCurrentStep(1)}
                      >
                        Basic Information
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${currentStep === 2 ? "active" : ""}`}
                        id="members-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#members-tab-pane"
                        type="button"
                        role="tab"
                        aria-selected={currentStep === 2}
                        onClick={() => setCurrentStep(2)}
                      >
                        Team Members
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="tab-content" id="editProjectTabContent">
                  {/* Tab 1: Basic Information */}
                  <div
                    className={`tab-pane fade ${currentStep === 1 ? "show active" : ""}`}
                    id="basic-info-tab-pane"
                    role="tabpanel"
                    aria-labelledby="basic-info-tab"
                    tabIndex={0}
                  >
                    <div className="modal-body pb-0">
                      {formError && (
                        <div className="alert alert-danger mb-3" role="alert">
                          {formError}
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Project Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                              value={formData.name}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, name: e.target.value }));
                                clearFieldError("name");
                              }}
                              onBlur={(e) => handleEditFieldBlur("name", e.target.value)}
                              placeholder="Enter project name"
                            />
                            {fieldErrors.name && (
                              <div className="invalid-feedback d-block">{fieldErrors.name}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Client <span className="text-danger">*</span></label>
                            <div data-field="client">
                              <CommonSelect
                                className={`select ${fieldErrors.client ? "is-invalid" : ""}`}
                                options={[{ value: "", label: "Select Client" }, ...clients]}
                                value={clients.find(c => c.label === formData.client) || { value: "", label: "Select Client" }}
                                onChange={(option) => {
                                  setFormData(prev => ({ ...prev, client: option?.label || "" }));
                                  clearFieldError("client");
                                  handleEditFieldBlur("client", option?.label || "");
                                }}
                              />
                            </div>
                            {fieldErrors.client && (
                              <div className="invalid-feedback d-block">{fieldErrors.client}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Status</label>
                                <CommonSelect
                                  className="select"
                                  options={[
                                    { value: "Active", label: "Active" },
                                    { value: "Completed", label: "Completed" },
                                    { value: "On Hold", label: "On Hold" },
                                  ]}
                                  value={{ value: formData.status, label: formData.status }}
                                  onChange={(option) => setFormData(prev => ({ ...prev, status: option?.value || "Active" }))}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Priority <span className="text-danger">*</span></label>
                                <div data-field="priority">
                                  <CommonSelect
                                    className={`select ${fieldErrors.priority ? "is-invalid" : ""}`}
                                    options={[
                                      { value: "High", label: "High" },
                                      { value: "Medium", label: "Medium" },
                                      { value: "Low", label: "Low" },
                                    ]}
                                    value={{ value: formData.priority, label: formData.priority }}
                                    onChange={(option) => {
                                      setFormData(prev => ({ ...prev, priority: option?.value || "Medium" }));
                                      clearFieldError("priority");
                                      handleEditFieldBlur("priority", option?.value || "Medium");
                                    }}
                                  />
                                </div>
                                {fieldErrors.priority && (
                                  <div className="invalid-feedback d-block">{fieldErrors.priority}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Project Value <span className="text-danger">*</span></label>
                                <input
                                  type="number"
                                  name="projectValue"
                                  className={`form-control ${fieldErrors.projectValue ? "is-invalid" : ""}`}
                                  value={formData.projectValue}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, projectValue: e.target.value }));
                                    clearFieldError("projectValue");
                                  }}
                                  onBlur={(e) => handleEditFieldBlur("projectValue", e.target.value)}
                                  placeholder="Enter project value"
                                />
                                {fieldErrors.projectValue && (
                                  <div className="invalid-feedback d-block">{fieldErrors.projectValue}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Start Date <span className="text-danger">*</span>
                                </label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format="DD-MM-YYYY"
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    value={formData.startDate ? dayjs(formData.startDate, "DD-MM-YYYY") : null}
                                    onChange={(date, dateString) => {
                                      const dateStr = Array.isArray(dateString) ? dateString[0] : dateString;
                                      setFormData(prev => ({ ...prev, startDate: dateStr }));
                                      clearFieldError("startDate");
                                      handleEditFieldBlur("startDate", dateStr);
                                    }}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
                                {fieldErrors.startDate && (
                                  <div className="invalid-feedback d-block">{fieldErrors.startDate}</div>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">End Date <span className="text-danger">*</span></label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format="DD-MM-YYYY"
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    value={formData.endDate ? dayjs(formData.endDate, "DD-MM-YYYY") : null}
                                    onChange={(date, dateString: any) => {
                                      const dateStr = typeof dateString === "string" ? dateString : (Array.isArray(dateString) ? dateString[0] : "");
                                      setFormData(prev => ({ ...prev, endDate: dateStr }));
                                      clearFieldError("endDate");
                                      handleEditFieldBlur("endDate", dateStr);
                                    }}
                                    disabledDate={(current) => {
                                      if (!formData.startDate) return false;
                                      const startDate = dayjs(formData.startDate, "DD-MM-YYYY");
                                      return current && (current.isSame(startDate, "day") || current.isBefore(startDate, "day"));
                                    }}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
                                {fieldErrors.endDate && (
                                  <div className="invalid-feedback d-block">{fieldErrors.endDate}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Description <span className="text-danger">*</span></label>
                            <textarea
                              name="description"
                              className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
                              rows={4}
                              value={formData.description}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, description: e.target.value }));
                                clearFieldError("description");
                              }}
                              onBlur={(e) => handleEditFieldBlur("description", e.target.value)}
                              placeholder="Enter project description"
                            ></textarea>
                            {fieldErrors.description && (
                              <div className="invalid-feedback d-block">{fieldErrors.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-light border me-2"
                        onClick={() => {
                          setShowEditModal(false);
                          setCurrentStep(1);
                          setFieldErrors({});
                          setFormError(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleEditBasicInfoSave}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tab 2: Team Members */}
                  <div
                    className={`tab-pane fade ${currentStep === 2 ? "show active" : ""}`}
                    id="members-tab-pane"
                    role="tabpanel"
                    aria-labelledby="members-tab"
                    tabIndex={0}
                  >
                    <div className="modal-body pb-0">
                      {formError && (
                        <div className="alert alert-danger mb-3" role="alert">
                          {formError}
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Project Manager <span className="text-danger">*</span></label>
                            <div data-field="projectManager">
                              <Select
                                isMulti
                                options={employees}
                                value={formData.projectManager}
                                onChange={(selectedOptions: any) => {
                                  const updated = selectedOptions || [];
                                  setFormData(prev => ({ ...prev, projectManager: updated }));
                                  clearFieldError("projectManager");
                                  handleEditFieldBlur("projectManager", updated);
                                }}
                                placeholder="Select project managers"
                                className={`basic-multi-select ${fieldErrors.projectManager ? "is-invalid" : ""}`}
                                classNamePrefix="select"
                                getOptionLabel={(option: any) => `${option.employeeId} - ${option.label}`}
                                getOptionValue={(option: any) => option.value}
                              />
                            </div>
                            <small className="form-text text-muted">
                              Select multiple employees as project managers
                            </small>
                            {fieldErrors.projectManager && (
                              <div className="invalid-feedback d-block">{fieldErrors.projectManager}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Team Leader <span className="text-danger">*</span></label>
                            <div data-field="teamLeader">
                              <Select
                                isMulti
                                options={employees}
                                value={formData.teamLeader}
                                onChange={(selectedOptions: any) => {
                                  const updated = selectedOptions || [];
                                  setFormData(prev => ({ ...prev, teamLeader: updated }));
                                  clearFieldError("teamLeader");
                                  handleEditFieldBlur("teamLeader", updated);
                                }}
                                placeholder="Select team leaders"
                                className={`basic-multi-select ${fieldErrors.teamLeader ? "is-invalid" : ""}`}
                                classNamePrefix="select"
                                getOptionLabel={(option: any) => `${option.employeeId} - ${option.label}`}
                                getOptionValue={(option: any) => option.value}
                              />
                            </div>
                            <small className="form-text text-muted">
                              Select multiple employees as team leaders
                            </small>
                            {fieldErrors.teamLeader && (
                              <div className="invalid-feedback d-block">{fieldErrors.teamLeader}</div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Team Members <span className="text-danger">*</span></label>
                            <div data-field="teamMembers">
                              <Select
                                isMulti
                                options={employees}
                                value={formData.teamMembers}
                                onChange={(selectedOptions: any) => {
                                  const updated = selectedOptions || [];
                                  setFormData(prev => ({ ...prev, teamMembers: updated }));
                                  clearFieldError("teamMembers");
                                  handleEditFieldBlur("teamMembers", updated);
                                }}
                                placeholder="Select team members"
                                className={`basic-multi-select ${fieldErrors.teamMembers ? "is-invalid" : ""}`}
                                classNamePrefix="select"
                                getOptionLabel={(option: any) => `${option.employeeId} - ${option.label}`}
                                getOptionValue={(option: any) => option.value}
                              />
                            </div>
                            <small className="form-text text-muted">
                              Select multiple employees for the project team
                            </small>
                            {fieldErrors.teamMembers && (
                              <div className="invalid-feedback d-block">{fieldErrors.teamMembers}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setCurrentStep(1)}
                      >
                        Previous
                      </button>
                      <div className="d-flex align-items-center">
                        <button
                          type="button"
                          className="btn btn-outline-light border me-2"
                          onClick={() => {
                            setShowEditModal(false);
                            setCurrentStep(1);
                            setFieldErrors({});
                            setFormError(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleEditProjectSubmit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Saving...
                            </>
                          ) : (
                            "Update Project"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {showDeleteModal && deletingProject && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
            <div className="modal-content">
              <div className="modal-body">
                <div className="text-center p-3">
                  <span className="avatar avatar-lg avatar-rounded bg-danger-transparent mb-3">
                    <i className="ti ti-trash text-danger fs-24" />
                  </span>
                  <h5 className="mb-2">Delete Project</h5>
                  <p className="mb-3">
                    Are you sure you want to delete <strong>{deletingProject.name}</strong>?
                    This action cannot be undone.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-light border"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletingProject(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        socket?.emit("project:delete", { projectId: deletingProject._id });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectList;
