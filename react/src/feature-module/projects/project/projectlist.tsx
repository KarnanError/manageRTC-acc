import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import { toast } from "react-toastify";
import CommonSelect, { Option } from "../../../core/common/commonSelect";
import CommonTextEditor from "../../../core/common/textEditor";
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
  teamLeader: { value: string; label: string } | null;
  projectManager: { value: string; label: string } | null;
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
  teamLeader: null,
  projectManager: null,
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
  const [employees, setEmployees] = useState<Array<{ value: string; label: string; position: string; department: string }>>([]);
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

  const handleNext = () => {
    if (!formData.name) {
      setFormError("Project name is required");
      return;
    }
    if (!formData.client) {
      setFormError("Client name is required");
      return;
    }
    if (!formData.startDate) {
      setFormError("Start date is required");
      return;
    }
    if (!formData.endDate) {
      setFormError("End date is required");
      return;
    }
    if (formData.startDate && formData.endDate) {
      const startDate = dayjs(formData.startDate, "DD-MM-YYYY");
      const endDate = dayjs(formData.endDate, "DD-MM-YYYY");
      if (!endDate.isAfter(startDate)) {
        setFormError("End date must be after start date");
        return;
      }
    }
    setFormError(null);
    setCurrentStep(2);
  };

  const handlePrevious = () => {
    setCurrentStep(1);
    setFormError(null);
  };

  const handleModalSubmit = () => {
    if (!formData.teamLeader) {
      setFormError("Team leader is required");
      return;
    }
    if (!formData.projectManager) {
      setFormError("Project manager is required");
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
      teamMembers: formData.teamMembers,
      teamLeader: formData.teamLeader,
      projectManager: formData.projectManager,
      status: formData.status,
      tags: formData.tags,
      logo: logo,
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
          {record._id.substring(0, 8).toUpperCase()}
        </Link>
      ),
      sorter: (a: Project, b: Project) => a._id.localeCompare(b._id),
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
              
              setFormData({
                name: record.name,
                client: record.client || "",
                startDate: record.startDate ? new Date(record.startDate).toISOString().split('T')[0] : "",
                endDate: record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : "",
                priority: record.priority || "Medium",
                projectValue: "",
                totalWorkingHours: "",
                extraTime: "",
                description: record.description || "",
                teamMembers: teamMembersData,
                teamLeader: null,
                projectManager: null,
                status: record.status || "Active",
                tags: [],
              });
              setFormError(null);
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
                ></button>
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
                              className="form-control"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter project name"
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Client</label>
                            <CommonSelect
                              className="select"
                              options={[{ value: "", label: "Select Client" }, ...clients]}
                              value={clients.find(c => c.label === formData.client) || { value: "", label: "Select Client" }}
                              onChange={(option) => setFormData(prev => ({ ...prev, client: option?.label || "" }))}
                            />
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
                                    onChange={(date, dateString) => {
                                      const dateStr = Array.isArray(dateString) ? dateString[0] : dateString;
                                      setFormData(prev => ({ ...prev, startDate: dateStr }))
                                    }}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
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
                                    onChange={(date, dateString: any) => {
                                      const dateStr = typeof dateString === 'string' ? dateString : (Array.isArray(dateString) ? dateString[0] : '');
                                      setFormData(prev => ({ ...prev, endDate: dateStr }))
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
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Priority</label>
                                <CommonSelect
                                  className="select"
                                  options={[
                                    { value: "High", label: "High" },
                                    { value: "Medium", label: "Medium" },
                                    { value: "Low", label: "Low" },
                                  ]}
                                  value={{ value: formData.priority, label: formData.priority }}
                                  onChange={(option) => setFormData(prev => ({ ...prev, priority: option?.value || "Medium" }))}
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Project Value</label>
                                <div className="input-group">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={formData.projectValue}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setFormData(prev => ({ ...prev, projectValue: value }));
                                      }
                                    }}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-0">
                            <label className="form-label">Description</label>
                            <CommonTextEditor
                              defaultValue={formData.description}
                              onChange={(content) =>
                                setFormData(prev => ({ ...prev, description: content }))
                              }
                            />
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
                            <label className="form-label me-2">Team Members <span className="text-danger">*</span></label>
                            <Select
                              isMulti
                              options={employees}
                              value={formData.teamMembers}
                              onChange={(selectedOptions: any) => setFormData(prev => ({ ...prev, teamMembers: selectedOptions || [] }))}
                              placeholder="Select team members"
                              className="basic-multi-select"
                              classNamePrefix="select"
                              getOptionLabel={(option: any) => `${option.label} - ${option.position}`}
                              getOptionValue={(option: any) => option.value}
                            />
                            <small className="form-text text-muted">
                              Select multiple employees for the project team
                            </small>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Team Leader <span className="text-danger">*</span></label>
                            <CommonSelect
                              className="select"
                              options={employees.map(emp => ({
                                value: emp.value,
                                label: `${emp.label} - ${emp.position}`
                              }))}
                              value={formData.teamLeader ? {
                                value: formData.teamLeader.value,
                                label: formData.teamLeader.label
                              } : undefined}
                              onChange={(selectedOption) => setFormData(prev => ({ ...prev, teamLeader: selectedOption }))}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">Project Manager <span className="text-danger">*</span></label>
                            <CommonSelect
                              className="select"
                              options={employees.map(emp => ({
                                value: emp.value,
                                label: `${emp.label} - ${emp.position}`
                              }))}
                              value={formData.projectManager ? {
                                value: formData.projectManager.value,
                                label: formData.projectManager.label
                              } : undefined}
                              onChange={(selectedOption) => setFormData(prev => ({ ...prev, projectManager: selectedOption }))}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
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
                            disabled={isSubmitting}
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

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Project</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                <form>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Project Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Client</label>
                        <CommonSelect
                          className="select"
                          options={[{ value: "", label: "Select Client" }, ...clients]}
                          value={clients.find(c => c.label === formData.client) || { value: "", label: "Select Client" }}
                          onChange={(option) => setFormData(prev => ({ ...prev, client: option?.label || "" }))}
                        />
                      </div>
                    </div>
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
                        <label className="form-label">Priority</label>
                        <CommonSelect
                          className="select"
                          options={[
                            { value: "High", label: "High" },
                            { value: "Medium", label: "Medium" },
                            { value: "Low", label: "Low" },
                          ]}
                          value={{ value: formData.priority, label: formData.priority }}
                          onChange={(option) => setFormData(prev => ({ ...prev, priority: option?.value || "Medium" }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Project Value</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.projectValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectValue: e.target.value }))}
                          placeholder="Enter project value"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter project description"
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label me-2">Team Members</label>
                        <Select
                          isMulti
                          options={employees}
                          value={formData.teamMembers}
                          onChange={(selectedOptions: any) => setFormData(prev => ({ ...prev, teamMembers: selectedOptions || [] }))}
                          placeholder="Select team members"
                          className="basic-multi-select"
                          classNamePrefix="select"
                          getOptionLabel={(option: any) => `${option.label} - ${option.position}`}
                          getOptionValue={(option: any) => option.value}
                        />
                        <small className="form-text text-muted">
                          Select multiple employees for the project team
                        </small>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label me-2">Team Leader</label>
                        <CommonSelect
                          className="select"
                          options={employees.map(emp => ({
                            value: emp.value,
                            label: `${emp.label} - ${emp.position}`
                          }))}
                          value={formData.teamLeader ? {
                            value: formData.teamLeader.value,
                            label: formData.teamLeader.label
                          } : undefined}
                          onChange={(selectedOption) => setFormData(prev => ({ ...prev, teamLeader: selectedOption }))}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label me-2">Project Manager</label>
                        <CommonSelect
                          className="select"
                          options={employees.map(emp => ({
                            value: emp.value,
                            label: `${emp.label} - ${emp.position}`
                          }))}
                          value={formData.projectManager ? {
                            value: formData.projectManager.value,
                            label: formData.projectManager.label
                          } : undefined}
                          onChange={(selectedOption) => setFormData(prev => ({ ...prev, projectManager: selectedOption }))}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!formData.name || !formData.client) {
                      setFormError("Project name and client are required");
                      return;
                    }
                    setIsSubmitting(true);
                    setFormError(null);
                    socket?.emit("project:update", {
                      projectId: editingProject._id,
                      update: {
                        name: formData.name,
                        client: formData.client,
                        status: formData.status,
                        priority: formData.priority,
                        projectValue: formData.projectValue,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        description: formData.description,
                        teamMembers: formData.teamMembers,
                        teamLeader: formData.teamLeader,
                        projectManager: formData.projectManager,
                        tags: formData.tags,
                      }
                    });
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Update Project"}
                </button>
              </div>
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
