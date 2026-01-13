import React, { useState, useEffect, useCallback } from "react";
import { Dayjs } from "dayjs";
import { DatePicker, message } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import CommonSelect from "../../../core/common/commonSelect";
import CommonTagsInput from "../../../core/common/Taginput";
import CommonTextEditor from "../../../core/common/textEditor";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useSocket } from "../../../SocketContext";
import { all_routes } from "../../router/all_routes";
import Footer from "../../../core/common/footer";
import { emit } from "process";

const Task = () => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const socket = useSocket() as any;
  const { userId } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    project: 'all',
    search: ''
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState<any[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [addAttachments, setAddAttachments] = useState<File[]>([]);
  const [editAttachments, setEditAttachments] = useState<File[]>([]);
  const [addForm, setAddForm] = useState({
    title: "",
    projectId: "",
    assignees: [] as string[],
    dueDate: null as Dayjs | null,
    status: "To do",
    priority: "Medium",
    description: "",
    tags: [] as string[],
  });
  const [editForm, setEditForm] = useState({
    title: "",
    projectId: "",
    assignees: [] as string[],
    dueDate: null as Dayjs | null,
    status: "To do",
    priority: "Medium",
    description: "",
    tags: [] as string[],
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Derived counts: total and completed tasks per project
  const projectTaskCounts = React.useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((t: any) => {
      const pid = t.projectId;
      if (!pid) return;
      if (!counts[pid]) counts[pid] = { total: 0, completed: 0 };
      counts[pid].total += 1;
      if ((t.status || "").toLowerCase() === "completed") counts[pid].completed += 1;
    });
    return counts;
  }, [tasks]);

  const getProjectCounts = React.useCallback((projectId: string) => {
    const total = projectTaskCounts[projectId]?.total || 0;
    const completed = projectTaskCounts[projectId]?.completed || 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [projectTaskCounts]);

  // Dynamic project options from loaded projects
  const projectChoose = React.useMemo(() => [
    { value: "Select", label: "Select" },
    ...projects
      .filter(project => project.status !== 'Completed')
      .map(project => ({
        value: project.projectId,
        label: project.name || 'Untitled Project'
      }))
  ], [projects]);

  // Dynamic employee options for team members (from selected project)
  const employeeOptions = React.useMemo(() => 
    projectTeamMembers.map(emp => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      return {
        value: emp._id,
        label: name ? `${name} (${emp.employeeId || ''})` : emp.employeeId || 'Unknown'
      };
    })
  , [projectTeamMembers]);

  const statusChoose = [
    { value: "To do", label: "To do" },
    { value: "Pending", label: "Pending" },
    { value: "Inprogress", label: "Inprogress" },
    { value: "Completed", label: "Completed" },
    { value: "Onhold", label: "Onhold" },
    { value: "Review", label: "Review" },
    { value: "Cancelled", label: "Cancelled" },
  ];
  const priorityChoose = [
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Low", label: "Low" },
  ];

  const loadTasks = useCallback(() => {
    if (!socket) return;

    setError(null);
    socket.emit("task:getAllData", filters);
  }, [socket, filters]);

  const loadProjects = useCallback(() => {
    if (!socket) return;

    // Load all projects and filter non-completed ones in frontend
    socket.emit("project:getAll", {});
  }, [socket]);

  const handleProjectSelection = useCallback((projectId: string) => {
    if (!projectId || projectId === "Select") {
      setSelectedProject(null);
      setProjectTeamMembers([]);
      setAddForm(prev => ({ ...prev, projectId: "", assignees: [] }));
      return;
    }

    setSelectedProject(projectId);
    setAddForm(prev => ({ ...prev, projectId, assignees: [] }));
    if (!socket) return;
    setLoadingTeamMembers(true);
    setProjectTeamMembers([]);
    socket.emit("project:getTeamMembers", { projectId });
  }, [socket]);

  const handleProjectResponse = useCallback((response: any) => {
    if (response.done && response.data) {
      setProjects(response.data || []);
      console.log('Loaded projects:', response.data); 
    }
  }, []);

  const handleEmployeeResponse = useCallback((response: any) => {
    setLoadingTeamMembers(false);
    if (response.done && response.data) {
      setProjectTeamMembers(response.data.teamMembers || response.data || []);
    } else {
      console.error('Failed to load team members:', response.error);
      setProjectTeamMembers([]);
    }
  }, []);

  const handlePriorityFilter = useCallback((priority: string) => {
    setFilters(prev => ({ ...prev, priority }));
  }, []);

  const handleProjectTasksClick = useCallback((projectId: string) => {
    console.log('Filtering tasks for project:', projectId);
    if (!projectId) return;
    if (socket) {
      socket.emit("task:getByProject", { projectId });
    }
  }, [socket]);

  const formatFileSize = useCallback((bytes: number) => {
    if (!bytes && bytes !== 0) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes || 1) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }, []);

  const handleAddFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setAddAttachments(Array.from(files));
  }, []);

  const handleEditFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setEditAttachments(Array.from(files));
  }, []);

  const resetAddForm = useCallback(() => {
    setAddForm({
      title: "",
      projectId: "",
      assignees: [],
      dueDate: null,
      status: "To do",
      priority: "Medium",
      description: "",
      tags: [],
    });
    setSelectedProject(null);
    setProjectTeamMembers([]);
    setLoadingTeamMembers(false);
    setAddAttachments([]);
    setFormError(null);
  }, []);

  const closeAddModal = useCallback(() => {
    const modalElement = document.getElementById("add_task");
    const bootstrapAny = (window as any)?.bootstrap;
    try {
      const modalInstance = bootstrapAny?.Modal?.getInstance?.(modalElement)
        || bootstrapAny?.Modal?.getOrCreateInstance?.(modalElement);
      if (modalInstance) {
        modalInstance.hide();
        return;
      }
      const closeBtn = modalElement?.querySelector('[data-bs-dismiss="modal"]') as HTMLElement | null;
      closeBtn?.click?.();
    } catch {
      const closeBtn = modalElement?.querySelector('[data-bs-dismiss="modal"]') as HTMLElement | null;
      closeBtn?.click?.();
    }
  }, []);

  const handleTaskCreateResponse = useCallback((response: any) => {
    setCreatingTask(false);
    if (response?.done) {
      message.success("Task created successfully");
      // Close modal first, then reset form state
      closeAddModal();
      resetAddForm();
      // Reload tasks and projects to refresh all counts and lists
      loadTasks();
      loadProjects();
      return;
    }

    const errorMsg = response?.error || "Failed to create task";
    setFormError(errorMsg);
    message.error(errorMsg);
  }, [closeAddModal, loadTasks, loadProjects, resetAddForm]);

  const handleTaskCreatedBroadcast = useCallback((response: any) => {
    if (response?.done) {
      loadTasks();
    }
  }, [loadTasks]);

  const handleAddTaskSubmit = useCallback(() => {
    if (!socket) {
      message.error("Unable to create task: socket not connected");
      return;
    }

    const { title, projectId, assignees, dueDate, status, priority, description, tags } = addForm;

    if (!title.trim() || !projectId) {
      const errorMsg = "Title and project are required";
      setFormError(errorMsg);
      message.error(errorMsg);
      return;
    }

    const payload: any = {
      title: title.trim(),
      projectId,
      assignee: assignees,
      status,
      priority,
      description,
      tags,
      createdBy: userId || "unknown",
      attachments: addAttachments.map(file => ({ filename: file.name, url: "" })),
    };

    if (dueDate) {
      payload.dueDate = dueDate.toDate();
    }

    setCreatingTask(true);
    setFormError(null);
    socket.emit("task:create", payload);
  }, [socket, addForm, userId, addAttachments]);

  const getEmployeeById = useCallback((employeeId: string) => {
    if (!employeeId || !employees.length) return null;
    const employee = employees.find(emp => emp._id === employeeId);
    if (employee) {
      return {
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        employeeId: employee.employeeId || ''
      };
    }
    return null;
  }, [employees]);

  const handleTaskByProject = useCallback((response: any) => {
    if (response.done && response.data) {
      setTasks(response.data.tasks || []);
    } else {
      setError(response.error || "Failed to load tasks for the project");
    }
  }, []);
  useEffect(() => {
    if (socket) {
      socket.on("task:create-response", handleTaskCreateResponse);
      socket.on("task:task-created", handleTaskCreatedBroadcast);
      socket.on("project:getAll-response", handleProjectResponse);
      socket.on("project:getTeamMembers-response", handleEmployeeResponse);
      loadTasks();
      loadProjects();
      socket.on("task:getByProject-response", handleTaskByProject);

      return () => {
        socket.off("task:create-response", handleTaskCreateResponse);
        socket.off("task:task-created", handleTaskCreatedBroadcast);
        socket.off("project:getAll-response", handleProjectResponse);
        socket.off("project:getTeamMembers-response", handleEmployeeResponse);
        socket.off("task:getByProject-response", handleTaskByProject);
      };
    }
  }, [socket, handleTaskByProject, handleProjectResponse, handleEmployeeResponse, loadTasks, loadProjects, handleTaskCreateResponse, handleTaskCreatedBroadcast]);

  useEffect(() => {
    loadTasks();
  }, [filters, loadTasks]);

  // Reset modal state when modals open
  useEffect(() => {
    const addTaskModal = document.getElementById('add_task');
    const editTaskModal = document.getElementById('edit_task');

    const resetModalState = () => {
      resetAddForm();
      setEditForm({
        title: "",
        projectId: "",
        assignees: [],
        dueDate: null,
        status: "To do",
        priority: "Medium",
        description: "",
        tags: [],
      });
      setEditAttachments([]);
    };

    if (addTaskModal) {
      addTaskModal.addEventListener('show.bs.modal', resetModalState);
    }
    if (editTaskModal) {
      editTaskModal.addEventListener('show.bs.modal', resetModalState);
    }

    return () => {
      if (addTaskModal) {
        addTaskModal.removeEventListener('show.bs.modal', resetModalState);
      }
      if (editTaskModal) {
        editTaskModal.removeEventListener('show.bs.modal', resetModalState);
      }
    };
  }, [resetAddForm]);

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Tasks</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active">Tasks</li>
                </ol>
              </nav>
            </div>
            <div className="my-xl-auto right-content d-flex">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_task"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Task
                </Link>
              </div>
              <div className="head-icons ms-2 mb-0">
                <CollapseHeader />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4">
              <div>
                {error ? (
                  <div className="text-center py-5">
                    <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
                    <h6 className="text-danger">Error loading projects</h6>
                    <p className="text-muted small">{error}</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-folder-x fs-1 text-muted mb-3"></i>
                    <h6 className="text-muted">No projects found</h6>
                    <p className="text-muted small">Create your first project to see tasks</p>
                  </div>
                ) : (
                  projects.slice(0, 5).map((project: any, index: number) => (
                    <div key={project._id} className="card">
                      <div className="card-body">
                        <div className="d-flex align-items-center pb-3 mb-3 border-bottom">
                          <Link
                            to={`${all_routes.projectdetails}/${project._id}`}
                            className="flex-shrink-0 me-2"
                          >
                            <ImageWithBasePath
                              src={`assets/img/social/project-0${(index % 5) + 1}.svg`}
                              alt="Img"
                            />
                          </Link>
                          <div>
                            <h6 className="mb-1">
                              <span
                                className={`text-dark text-truncate d-inline-block ${hoveredProjectId === project._id ? "text-primary" : ""}`}
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => setHoveredProjectId(project._id)}
                                onMouseLeave={() => setHoveredProjectId(null)}
                                onClick={() => handleProjectTasksClick(project.projectId)}
                              >
                                {project.name || 'Untitled Project'}
                              </span>
                            </h6>
                            <div className="d-flex align-items-center">
                              <span
                                className="mx-1"
                                
                                title="Show tasks for this project"
                              >
                               {project.taskCount} tasks
                                
                              </span>
                              <span className="mx-1">
                                <i className="ti ti-point-filled text-primary" />
                              </span>
                              <span>{project.completedtaskCount} Completed</span>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-sm-4">
                            <div className="mb-3">
                              <span className="mb-1 d-block">Deadline</span>
                              <p className="text-dark">
                                {project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'No deadline'}
                              </p>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <div className="mb-3">
                              <span className="mb-1 d-block">Value</span>
                              <p className="text-dark">${project.projectValue || '0'}</p>
                            </div>
                          </div>
                          <div className="col-sm-4">
                            <div className="mb-3">
                              <span className="mb-1 d-block">Project Lead</span>
                              <h6 className="fw-normal d-flex align-items-center">
                                {(() => {
                                  const teamLead = Array.isArray(project.teamleadName) && project.teamleadName.length > 0
                                    ? project.teamleadName[0]
                                    : null;
                                  
                                  if (teamLead && teamLead.name) {
                                    return (
                                      <>
                                        <span className="text-truncate" title={`${teamLead.name} (${teamLead.employeeId || "N/A"})`}>
                                          {teamLead.name}
                                          <small className="text-muted ms-1">({teamLead.employeeId || "N/A"})</small>
                                        </span>
                                      </>
                                    );
                                  }
                                  
                                  return (
                                    <>
                                      <ImageWithBasePath
                                        className="avatar avatar-xs rounded-circle me-1"
                                        src={`assets/img/profiles/avatar-0${(index % 10) + 1}.jpg`}
                                        alt="Unassigned"
                                      />
                                      <span className="text-muted">Unassigned</span>
                                    </>
                                  );
                                })()}
                              </h6>
                            </div>
                          </div>
                        </div>
                        <div className="bg-light p-2">
                          <div className="row align-items-center">
                            <div className="col-6">
                              <span className="fw-medium d-flex align-items-center">
                                <i className="ti ti-clock text-primary me-2" />
                                Total {project.totalHours || project.hoursOfWork || '0'} Hrs
                              </span>
                            </div>
                            <div className="col-6">
                              <div>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <small className="text-dark">
                                    {getProjectCounts(project._id).percent}% Completed
                                  </small>
                                </div>
                                <div className="progress progress-xs">
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{
                                      width: `${getProjectCounts(project._id).percent}%`,
                                      backgroundColor: (() => {
                                        const pc = getProjectCounts(project._id).percent;
                                        return pc > 80 ? '#28a745' : pc > 50 ? '#17a2b8' : '#dc3545';
                                      })()
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="col-xl-8">
              <div className="row">
                <div className="col-lg-5">
                  <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                    <h6 className="me-2">Priority</h6>
                    <ul
                      className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                      id="pills-tab"
                      role="tablist"
                    >
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${filters.priority === 'all' ? 'active' : ''}`}
                          onClick={() => handlePriorityFilter('all')}
                          type="button"
                          role="tab"
                        >
                          All
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${filters.priority === 'High' ? 'active' : ''}`}
                          onClick={() => handlePriorityFilter('High')}
                          type="button"
                          role="tab"
                        >
                          High
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${filters.priority === 'Medium' ? 'active' : ''}`}
                          onClick={() => handlePriorityFilter('Medium')}
                          type="button"
                          role="tab"
                        >
                          Medium
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${filters.priority === 'Low' ? 'active' : ''}`}
                          onClick={() => handlePriorityFilter('Low')}
                          type="button"
                          role="tab"
                        >
                          Low
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                    <div className="input-icon w-120 position-relative me-2">
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                      <DatePicker
                        className="form-control datetimepicker"
                        format={{
                          format: "DD-MM-YYYY",
                          type: "mask",
                        }}
                        getPopupContainer={getModalContainer}
                        placeholder="Due Date"
                      />
                    </div>
                    <div className="dropdown me-2">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        All Tags
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            All Tags
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Internal
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Projects
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Meetings
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Reminder
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Research
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="d-inline-flex me-2">Sort By : </span>
                      <div className="dropdown">
                        <Link
                          to="#"
                          className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                          data-bs-toggle="dropdown"
                        >
                          Created Date
                        </Link>
                        <ul className="dropdown-menu  dropdown-menu-end p-3">
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Created Date
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Priority
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Due Date
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dynamic Task List */}
              <div className="list-group list-group-flush mb-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ti ti-clipboard-x fs-1 text-muted mb-3"></i>
                    <h6 className="text-muted">No tasks found</h6>
                    <p className="text-muted small">Tasks will appear here once created</p>
                  </div>
                ) : (
                  tasks.map((task: any) => (
                    <div key={task._id} className="list-group-item list-item-hover shadow-sm rounded mb-2 p-3">
                      <div className="row align-items-center row-gap-3">
                        <div className="col-lg-6 col-md-7">
                          <div className="todo-inbox-check d-flex align-items-center flex-wrap row-gap-3">
                            <span className="me-2 d-flex align-items-center">
                              <i className="ti ti-grid-dots text-dark" />
                            </span>
                            <div className="form-check form-check-md me-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={task.status === 'Completed'}
                                readOnly
                              />
                            </div>
                            <span className="me-2 d-flex align-items-center rating-select">
                              <i className={`ti ti-star${task.priority === 'High' ? '-filled filled' : ''}`} />
                            </span>
                            <div className="strike-info">
                              <h4 className="fs-14 text-truncate">
                                <Link to={`${all_routes.tasksdetails.replace(':taskId', task._id)}`}>
                                  {task.title}
                                </Link>
                              </h4>
                            </div>
                            {task.dueDate && (
                              <span className="badge bg-transparent-dark text-dark rounded-pill ms-2">
                                <i className="ti ti-calendar me-1" />
                                {new Date(task.dueDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-5">
                          <div className="d-flex align-items-center justify-content-md-end flex-wrap row-gap-3">
                            {task.tags && task.tags.length > 0 && (
                              <span className="badge badge-skyblue me-3">
                                {task.tags[0]}
                              </span>
                            )}
                            <span className={`badge d-inline-flex align-items-center me-3 ${
                              task.status === 'Completed' ? 'badge-soft-success' :
                              task.status === 'Inprogress' ? 'badge-soft-purple' :
                              task.status === 'Pending' ? 'badge-soft-warning' :
                              task.status === 'Onhold' ? 'badge-soft-pink' :
                              'badge-soft-secondary'
                            }`}>
                              <i className="fas fa-circle fs-6 me-1" />
                              {task.status || 'Pending'}
                            </span>
                            <div className="d-flex align-items-center">
                              <div className="avatar-list-stacked avatar-group-sm">
                                {task.assignee && task.assignee.slice(0, 3).map((assignee: string, idx: number) => (
                                  <span key={idx} className="avatar avatar-rounded">
                                    <ImageWithBasePath
                                      className="border border-white"
                                      src={`assets/img/profiles/avatar-${(idx % 10) + 1}.jpg`}
                                      alt="img"
                                    />
                                  </span>
                                ))}
                              </div>
                              <div className="dropdown ms-2">
                                <Link
                                  to="#"
                                  className="d-inline-flex align-items-center"
                                  data-bs-toggle="dropdown"
                                >
                                  <i className="ti ti-dots-vertical" />
                                </Link>
                                <ul className="dropdown-menu dropdown-menu-end p-3">
                                  <li>
                                    <Link
                                      to={`${all_routes.tasksdetails.replace(':taskId', task._id)}`}
                                      className="dropdown-item rounded-1"
                                    >
                                      <i className="ti ti-eye me-2" />
                                      View
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="#"
                                      className="dropdown-item rounded-1"
                                      data-bs-toggle="modal"
                                      data-bs-target="#edit_task"
                                    >
                                      <i className="ti ti-edit me-2" />
                                      Edit
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="#"
                                      className="dropdown-item rounded-1"
                                      data-bs-toggle="modal"
                                      data-bs-target="#delete_modal"
                                    >
                                      <i className="ti ti-trash me-2" />
                                      Delete
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-center mb-4">
                <Link to="#" className="btn btn-primary">
                  <i className="ti ti-loader me-1" />
                  Load More
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
      {/* /Page Wrapper */}
      {/* Add Task */}
      <div className="modal fade" id="add_task">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Task</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.title}
                        onChange={(e) => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Task title"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Due Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          value={addForm.dueDate}
                          onChange={(value) => setAddForm(prev => ({ ...prev, dueDate: value }))}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Project</label>
                      <CommonSelect
                        className="select"
                        options={projectChoose}
                        value={projectChoose.find(opt => opt.value === addForm.projectId) || null}
                        onChange={(option: any) => handleProjectSelection(option?.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label me-2">
                        Team Members
                        {loadingTeamMembers && (
                          <span className="spinner-border spinner-border-sm ms-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </span>
                        )}
                      </label>
                      <CommonSelect
                        className="select"
                        options={[{ value: "Select", label: "Select" }, ...employeeOptions]}
                        isSearchable
                        disabled={!selectedProject || loadingTeamMembers}
                        value={employeeOptions.find(opt => opt.value === addForm.assignees[0]) || null}
                        onChange={(option: any) => setAddForm(prev => ({ ...prev, assignees: option?.value ? [option.value] : [] }))}
                      />
                      {!selectedProject && (
                        <small className="text-muted mt-1 d-block">Please select a project first</small>
                      )}
                      {loadingTeamMembers && (
                        <small className="text-info mt-1 d-block">Loading team members...</small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tag</label>
                      <CommonTagsInput
                        value={addForm.tags}
                        onChange={(value) => setAddForm(prev => ({ ...prev, tags: value }))}
                        placeholder="Add new"
                        className="custom-input-class" // Optional custom class
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <input
                        type="text"
                        className="form-control"
                        value="To do"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={priorityChoose}
                        value={priorityChoose.find(opt => opt.value === addForm.priority) || null}
                        onChange={(option: any) => setAddForm(prev => ({ ...prev, priority: option?.value || "Medium" }))}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Descriptions</label>
                      <CommonTextEditor
                        defaultValue={addForm.description}
                        onChange={(value) => setAddForm(prev => ({ ...prev, description: value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Upload Attachment</label>
                    <div className="bg-light rounded p-2">
                      <div className="profile-uploader border-bottom mb-2 pb-2">
                        <div className="drag-upload-btn btn btn-sm btn-white border px-3">
                          Select File
                          <input
                            type="file"
                            className="form-control image-sign"
                            multiple
                            onChange={(e) => handleAddFiles(e.target.files)}
                          />
                        </div>
                      </div>
                      {addAttachments.length === 0 ? (
                        <p className="text-muted small mb-0">No files selected</p>
                      ) : (
                        addAttachments.map((file, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                            <div className="d-flex align-items-center">
                              <h6 className="fs-12 fw-medium me-1 text-truncate" style={{ maxWidth: '200px' }} title={file.name}>{file.name}</h6>
                              <span className="badge badge-soft-info">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-icon"
                              onClick={() => setAddAttachments(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddTaskSubmit}
                  disabled={creatingTask}
                >
                  {creatingTask ? "Saving..." : "Add New Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Task */}
      {/* Edit Task */}
      <div className="modal fade" id="edit_task">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Task</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Task title"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Due Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          value={editForm.dueDate}
                          onChange={(value) => setEditForm(prev => ({ ...prev, dueDate: value }))}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Project</label>
                      <CommonSelect
                        className="select"
                        options={projectChoose}
                        value={projectChoose.find(opt => opt.value === editForm.projectId) || null}
                        onChange={(option: any) => {
                          handleProjectSelection(option?.value);
                          setEditForm(prev => ({ ...prev, projectId: option?.value || "", assignees: [] }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label me-2">
                        Team Members
                        {loadingTeamMembers && (
                          <span className="spinner-border spinner-border-sm ms-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </span>
                        )}
                      </label>
                      <CommonSelect
                        className="select"
                        options={[{ value: "Select", label: "Select" }, ...employeeOptions]}
                        isSearchable
                        disabled={!selectedProject || loadingTeamMembers}
                        value={employeeOptions.find(opt => opt.value === editForm.assignees[0]) || null}
                        onChange={(option: any) => setEditForm(prev => ({ ...prev, assignees: option?.value ? [option.value] : [] }))}
                      />
                      {!selectedProject && (
                        <small className="text-muted mt-1 d-block">Please select a project first</small>
                      )}
                      {loadingTeamMembers && (
                        <small className="text-info mt-1 d-block">Loading team members...</small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tag</label>
                      <CommonTagsInput
                        value={editForm.tags}
                        onChange={(value) => setEditForm(prev => ({ ...prev, tags: value }))}
                        placeholder="Add new"
                        className="custom-input-class" // Optional custom class
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <input
                        type="text"
                        className="form-control"
                        value="To do"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={priorityChoose}
                        value={priorityChoose.find(opt => opt.value === editForm.priority) || null}
                        onChange={(option: any) => setEditForm(prev => ({ ...prev, priority: option?.value || "Medium" }))}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Descriptions</label>
                      <CommonTextEditor
                        defaultValue={editForm.description}
                        onChange={(value) => setEditForm(prev => ({ ...prev, description: value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Upload Attachment</label>
                    <div className="bg-light rounded p-2">
                      <div className="profile-uploader border-bottom mb-2 pb-2">
                        <div className="drag-upload-btn btn btn-sm btn-white border px-3">
                          Select File
                          <input
                            type="file"
                            className="form-control image-sign"
                            multiple
                            onChange={(e) => handleEditFiles(e.target.files)}
                          />
                        </div>
                      </div>
                      {editAttachments.length === 0 ? (
                        <p className="text-muted small mb-0">No files selected</p>
                      ) : (
                        editAttachments.map((file, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                            <div className="d-flex align-items-center">
                              <h6 className="fs-12 fw-medium me-1 text-truncate" style={{ maxWidth: '200px' }} title={file.name}>{file.name}</h6>
                              <span className="badge badge-soft-info">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-icon"
                              onClick={() => setEditAttachments(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Task */}
      {/* Todo Details */}
      <div className="modal fade" id="view_todo">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-dark">
              <h4 className="modal-title text-white">
                Respond to any pending messages
              </h4>
              <span className="badge badge-danger d-inline-flex align-items-center">
                <i className="ti ti-square me-1" />
                Urgent
              </span>
              <span>
                <i className="ti ti-star-filled text-warning" />
              </span>
              <Link to="#">
                <i className="ti ti-trash text-white" />
              </Link>
              <button
                type="button"
                className="btn-close custom-btn-close bg-transparent fs-16 text-white position-static"
                data-bs-dismiss="modal"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <h5 className="mb-2">Task Details</h5>
              <div className="border rounded mb-3 p-2">
                <div className="row row-gap-3">
                  <div className="col-md-4">
                    <div className="text-center">
                      <span className="d-block mb-1">Created On</span>
                      <p className="text-dark">22 July 2025</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <span className="d-block mb-1">Due Date</span>
                      <p className="text-dark">22 July 2025</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <span className="d-block mb-1">Status</span>
                      <span className="badge badge-soft-success d-inline-flex align-items-center">
                        <i className="fas fa-circle fs-6 me-1" />
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <h5 className="mb-2">Description</h5>
                <p>
                  Hiking is a long, vigorous walk, usually on trails or
                  footpaths in the countryside. Walking for pleasure developed
                  in Europe during the eighteenth century. Religious pilgrimages
                  have existed much longer but they involve walking long
                  distances for a spiritual purpose associated with specific
                  religions and also we achieve inner peace while we hike at a
                  local park.
                </p>
              </div>
              <div className="mb-3">
                <h5 className="mb-2">Tags</h5>
                <div className="d-flex align-items-center">
                  <span className="badge badge-danger me-2">Internal</span>
                  <span className="badge badge-success me-2">Projects</span>
                  <span className="badge badge-secondary">Reminder</span>
                </div>
              </div>
              <div>
                <h5 className="mb-2">Assignee</h5>
                <div className="avatar-list-stacked avatar-group-sm">
                  <span className="avatar avatar-rounded">
                    <ImageWithBasePath
                      className="border border-white"
                      src="assets/img/profiles/avatar-23.jpg"
                      alt="img"
                    />
                  </span>
                  <span className="avatar avatar-rounded">
                    <ImageWithBasePath
                      className="border border-white"
                      src="assets/img/profiles/avatar-24.jpg"
                      alt="img"
                    />
                  </span>
                  <span className="avatar avatar-rounded">
                    <ImageWithBasePath
                      className="border border-white"
                      src="assets/img/profiles/avatar-25.jpg"
                      alt="img"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Todo Details */}
    </>
  );
};

export default Task;
