import React, { useState, useEffect, useCallback, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import Select from "react-select";
import { all_routes } from "../../router/all_routes";
import { Link, useParams } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CommonSelect from "../../../core/common/commonSelect";
import CommonTextEditor from "../../../core/common/textEditor";
import CommonTagsInput from "../../../core/common/Taginput";
import { DatePicker } from "antd";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import Footer from "../../../core/common/footer";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const socket = useSocket() as any;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
  const [clients, setClients] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);
  const [memberModalError, setMemberModalError] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isSavingLeads, setIsSavingLeads] = useState(false);
  const [leadModalError, setLeadModalError] = useState<string | null>(null);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [isSavingManagers, setIsSavingManagers] = useState(false);
  const [managerModalError, setManagerModalError] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteModalError, setNoteModalError] = useState<string | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editClient, setEditClient] = useState("");
  const [editStartDate, setEditStartDate] = useState<Dayjs | null>(null);
  const [editEndDate, setEditEndDate] = useState<Dayjs | null>(null);
  const [editPriority, setEditPriority] = useState("Medium");
  const [editValue, setEditValue] = useState("");
  const [editPriceType, setEditPriceType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const memberSelectOptions = useMemo(() => (
    (employeeOptions || []).map((emp) => ({
      value: emp.employeeId || emp.value,
      label: emp.employeeId
        ? `${emp.label || emp.name || "Unknown"} - ${emp.employeeId}`
        : (emp.label || emp.name || "Unknown"),
    }))
  ), [employeeOptions]);

  const loadProject = useCallback(() => {
    if (!projectId || !socket) return;

    setLoading(true);
    setError(null);

    socket.emit("project:getById", projectId);
  }, [projectId, socket]);

  const loadProjectTasks = useCallback(() => {
    if (!project?.projectId || !socket) return;
    socket.emit("task:getByProject", { projectId: project.projectId, filters: {} });
  }, [project?.projectId, socket]);

  const loadProjectNotes = useCallback(() => {
    if (!projectId || !socket) return;

    socket.emit("project/notes:getAll", { projectId, filters: {} });
  }, [projectId, socket]);

  const loadProjectInvoices = useCallback(() => {
    if (!projectId || !socket) return;

    socket.emit("admin/invoices/get", { projectId, filters: {} });
  }, [projectId, socket]);

  const parseDateValue = useCallback((value: any): Dayjs | null => {
    if (!value) return null;
    const primary = dayjs(value);
    if (primary.isValid()) return primary;
    const fallback = dayjs(value, "DD-MM-YYYY", true);
    return fallback.isValid() ? fallback : null;
  }, []);

  const handleProjectResponse = useCallback((response: any) => {
    setLoading(false);
    if (response.done && response.data) {
      setProject(response.data);
      // console.log(response.data);
    } else {
      setError(response.error || "Failed to load project details");
    }
  }, []);

  const handleTasksResponse = useCallback((response: any) => {
    if (response?.done) {
      const data = response?.data;
      const nextTasks = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
          ? data.tasks
          : [];
      setTasks(nextTasks);
    }
  }, []);

  const handleNotesResponse = useCallback((response: any) => {
    if (response.done && response.data) {
      setNotes(response.data || []);
    }
  }, []);

  const handleInvoicesResponse = useCallback((response: any) => {
    if (response.done && response.data) {
      setInvoices(response.data || []);
    }
  }, []);

  const handleGetAllDataResponse = useCallback((response: any) => {
    if (response.done && response.data?.employees) {
      setEmployeeOptions(response.data.employees || []);
    }
    if (response.done && response.data?.clients) {
      // Transform clients from string[] to { value, label }[] format
      const transformedClients = (response.data.clients || []).map((client: string) => ({
        value: client,
        label: client
      }));
      setClients(transformedClients);
    }
  }, []);

  const handleProjectUpdateResponse = useCallback((response: any) => {
    setIsSavingMembers(false);
    setIsSavingLeads(false);
    setIsSavingManagers(false);
    setIsSavingProject(false);
    if (response.done && response.data) {
      setProject(response.data);
      setError(null);
      setMemberModalError(null);
      setLeadModalError(null);
      setManagerModalError(null);
      setEditModalError(null);
      if (isSavingProject) {
        closeModalById("edit_project");
      }
      loadProject();
    } else if (response) {
      const message = response.error || "Failed to update project details";
      setError(message);
      setMemberModalError(message);
      setLeadModalError(message);
      setManagerModalError(message);
      if (isSavingProject) {
        setEditModalError(message);
      }
    }
  }, [loadProject, isSavingProject]);

  const handleSaveTeamMembers = useCallback(() => {
    if (!socket || !project?._id) return;

    setIsSavingMembers(true);
    setMemberModalError(null);

    socket.emit("project:update", {
      projectId: project._id,
      update: { teamMembers: selectedMembers },
    });
  }, [socket, project?._id, selectedMembers]);

  const handleSaveTeamLeads = useCallback(() => {
    if (!socket || !project?._id) return;

    setIsSavingLeads(true);
    setLeadModalError(null);

    socket.emit("project:update", {
      projectId: project._id,
      update: { teamLeader: selectedLeads },
    });
  }, [socket, project?._id, selectedLeads]);

  const handleSaveProjectManagers = useCallback(() => {
    if (!socket || !project?._id) return;

    setIsSavingManagers(true);
    setManagerModalError(null);

    socket.emit("project:update", {
      projectId: project._id,
      update: { projectManager: selectedManagers },
    });
  }, [socket, project?._id, selectedManagers]);

  const closeModalById = useCallback((modalId: string) => {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const modalInstance = (window as any)?.bootstrap?.Modal?.getInstance?.(modalElement)
      || (window as any)?.bootstrap?.Modal?.getOrCreateInstance?.(modalElement);
    if (modalInstance?.hide) {
      modalInstance.hide();
    }

    if (modalElement.classList.contains("show")) {
      modalElement.classList.remove("show");
      modalElement.setAttribute("aria-hidden", "true");
      modalElement.style.display = "none";
    }
    document.querySelectorAll(".modal-backdrop").forEach((node) => {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
  }, []);

  const handleupdatedresponse = useCallback((response: any) => {
    if (response.done && response.data) {
      closeModalById("add_team_members_modal");
      closeModalById("add_team_leads_modal");
      closeModalById("add_project_managers_modal");

      setError(null);
      loadProject();

    }
  }, [loadProject, closeModalById]);

  const handleSaveNote = useCallback(() => {
    if (!socket || !project?._id) return;

    setIsSavingNote(true);
    setNoteModalError(null);

    socket.emit("project/notes:create", {
      projectId: project._id,
      title: noteTitle,
      content: noteContent,
    });
  }, [socket, project?._id, noteTitle, noteContent]);

  const closeAddNotekModal = useCallback(() => {
    const modalElement = document.getElementById("add_note_modal");
    if (!modalElement) return;

    const modalInstance = (window as any)?.bootstrap?.Modal?.getInstance?.(modalElement)
      || (window as any)?.bootstrap?.Modal?.getOrCreateInstance?.(modalElement);
    if (modalInstance?.hide) {
      modalInstance.hide();
    }

    // Hard fallback in case bootstrap instance is not present or hide did not remove classes/backdrop
    if (modalElement.classList.contains("show")) {
      modalElement.classList.remove("show");
      modalElement.setAttribute("aria-hidden", "true");
      modalElement.style.display = "none";
    }
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop && backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
  }, []);
  
  const handleNoteCreateResponse = useCallback((response: any) => {
    setIsSavingNote(false);
    if (response.done) {
      setNoteTitle("");
      setNoteContent("");
      setNoteModalError(null);
      loadProjectNotes();
      closeAddNotekModal();
    } else {
      setNoteModalError(response.error || "Failed to create note");
    }
  }, [loadProjectNotes, closeAddNotekModal]);

  const handleSaveTask = useCallback(() => {
    if (!socket || !project?.projectId) return;

    setIsSavingTask(true);
    setTaskModalError(null);

    socket.emit("task:create", {
      projectId: project.projectId,
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      tags: taskTags,
      assignee: selectedAssignees,
      status: "Inprogress", // "Started" maps to "Inprogress" in backend
    });
  }, [socket, project?.projectId, taskTitle, taskDescription, taskPriority, taskTags, selectedAssignees]);

  const handleEditProjectSave = useCallback(() => {
    if (!socket || !project?._id) return;

    const trimmedName = editName.trim();
    const trimmedClient = editClient.trim();

    if (!trimmedName || !trimmedClient) {
      setEditModalError("Project name and client are required");
      return;
    }

    const update: any = {
      name: trimmedName,
      client: trimmedClient,
      priority: editPriority,
      projectValue: editValue,
      priceType: editPriceType,
      description: editDescription,
    };

    if (editStartDate) {
      update.startDate = editStartDate.toDate();
    } else {
      update.startDate = null;
    }

    if (editEndDate) {
      update.endDate = editEndDate.toDate();
    } else {
      update.endDate = null;
    }

    console.log("[ProjectDetails] Sending update:", update);
    setIsSavingProject(true);
    setEditModalError(null);
    socket.emit("project:update", { projectId: project._id, update });
  }, [socket, project?._id, editName, editClient, editPriority, editValue, editPriceType, editDescription, editStartDate, editEndDate]);

  const closeAddTaskModal = useCallback(() => {
    closeModalById("add_todo");
  }, [closeModalById]);

  const handleTaskCreateResponse = useCallback((response: any) => {
    setIsSavingTask(false);
    if (response.done) {
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskTags([]);
      setSelectedAssignees([]);
      setTaskModalError(null);
      loadProjectTasks();
      closeAddTaskModal();
    } else {
      setTaskModalError(response.error || "Failed to create task");
    }
  }, [loadProjectTasks, closeAddTaskModal]);

  const handlePriorityChange = useCallback((priority: string) => {
    if (!socket || !project?._id) return;

    socket.emit("project:update", {
      projectId: project._id,
      update: { priority },
    });
  }, [socket, project?._id]);

  useEffect(() => {
    if (Array.isArray(project?.teamMembers)) {
      setSelectedMembers(project.teamMembers);
    }
    if (Array.isArray(project?.teamLeader)) {
      setSelectedLeads(project.teamLeader);
    }
    if (Array.isArray(project?.projectManager)) {
      setSelectedManagers(project.projectManager);
    }
    if (project) {
      console.log("[ProjectDetails] Syncing project data:", { startDate: project.startDate, endDate: project.endDate });
      setEditName(project.name || "");
      setEditClient(project.client || "");
      setEditPriority(project.priority || "Medium");
      setEditValue(project.projectValue || "");
      setEditPriceType(project.priceType || "");
      setEditDescription(project.description || "");
      const parsedStart = parseDateValue(project.startDate);
      const parsedEnd = parseDateValue(project.endDate);
      setEditStartDate(parsedStart);
      setEditEndDate(parsedEnd);
      console.log("[ProjectDetails] After sync:", { editStartDate: parsedStart, editEndDate: parsedEnd });
    }
  }, [project]);

  useEffect(() => {
    if (socket) {
      socket.on("project:getById-response", handleProjectResponse);
      socket.on("task:getByProject-response", handleTasksResponse);
      socket.on("project/notes:getAll-response", handleNotesResponse);
      socket.on("admin/invoices/get-response", handleInvoicesResponse);
      socket.on("project:getAllData-response", handleGetAllDataResponse);
      socket.on("project:update-response", handleProjectUpdateResponse);
      socket.on("project/notes:create-response", handleNoteCreateResponse);
      socket.on("task:create-response", handleTaskCreateResponse);
      socket.on("project:project-updated", handleupdatedresponse);
      loadProject();
      loadProjectTasks();
      loadProjectNotes();
      loadProjectInvoices();
      socket.emit("project:getAllData");

      return () => {
        socket.off("project:getById-response", handleProjectResponse);
        socket.off("task:getByProject-response", handleTasksResponse);
        socket.off("project/notes:getAll-response", handleNotesResponse);
        socket.off("admin/invoices/get-response", handleInvoicesResponse);
        socket.off("project:getAllData-response", handleGetAllDataResponse);
        socket.off("project:update-response", handleProjectUpdateResponse);
        socket.off("project/notes:create-response", handleNoteCreateResponse);
        socket.off("task:create-response", handleTaskCreateResponse);
        socket.off("project:project-updated", handleupdatedresponse);
      };
    }
  }, [socket, handleProjectResponse, handleTasksResponse, handleNotesResponse, handleInvoicesResponse, handleGetAllDataResponse, handleProjectUpdateResponse, handleNoteCreateResponse, handleTaskCreateResponse, loadProject, loadProjectTasks, loadProjectNotes, loadProjectInvoices, handleupdatedresponse]);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };
  const clientChoose = useMemo(() => [
    { value: "Select", label: "Select" },
    ...clients.map(client => ({ value: client.label, label: client.label }))
  ], [clients]);
  const statusChoose = [
    { value: "Select", label: "Select" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];
  const priorityChoose = [
    { value: "Select", label: "Select" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];
  const tagChoose = [
    { value: "Select", label: "Select" },
    { value: "Internal", label: "Internal" },
    { value: "Projects", label: "Projects" },
    { value: "Meetings", label: "Meetings" },
    { value: "Reminder", label: "Reminder" },
  ];
  
  // Dynamic assignee options from project team members
  const assigneeChoose = useMemo(() => {
    const baseOption = [{ value: "Select", label: "Select" }];
    
    if (!project?.teamMembersdetail || project.teamMembersdetail.length === 0) {
      return baseOption;
    }
    
    const teamOptions = project.teamMembersdetail.map((member: any) => ({
      value: member.employeeId || member._id,
      label: `${member.firstName || ''} ${member.lastName || ''} - ${member.employeeId || ''}`
    }));
    
    return [...baseOption, ...teamOptions];
  }, [project?.teamMembersdetail]);
  const status1choose = [
    { value: "Select", label: "Select" },
    { value: "Completed", label: "Completed" },
    { value: "Pending", label: "Pending" },
    { value: "Onhold", label: "Onhold" },
    { value: "Inprogress", label: "Inprogress" },
  ];
  const [tags, setTags] = useState<string[]>([
    "Jerald",
    "Andrew",
    "Philip",
    "Davis",
  ]);
  const [tags1, setTags1] = useState<string[]>(["Hendry", "James"]);
  const [tags2, setTags2] = useState<string[]>(["Dwight"]);
  const [tags3, setTags3] = useState<string[]>([
    "Collab",
    "Promotion",
    "Rated",
  ]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <i className="ti ti-alert-circle fs-1 text-danger mb-3"></i>
            <h5 className="mb-2">Error Loading Project</h5>
            <p className="text-muted mb-3">{error}</p>
            <button
              className="btn btn-primary"
              onClick={loadProject}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <i className="ti ti-folder-x fs-1 text-muted mb-3"></i>
            <h5 className="mb-2">Project Not Found</h5>
            <p className="text-muted mb-3">The project you're looking for doesn't exist or has been deleted.</p>
            <Link to={all_routes.projectlist} className="btn btn-primary">
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row align-items-center mb-4">
            <div className="d-md-flex d-sm-block justify-content-between align-items-center flex-wrap">
              <h6 className="fw-medium d-inline-flex align-items-center mb-3 mb-sm-0">
                <Link to={all_routes.projectlist}>
                  <i className="ti ti-arrow-left me-2" />
                  Back to List
                </Link>
              </h6>
              <div className="d-flex">
                <div className="text-end">
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-inert={true}
                    data-bs-target="#edit_project"
                  >
                    <i className="ti ti-edit me-1" />
                    Edit Project
                  </Link>
                </div>
                <div className="head-icons ms-2 text-end">
                  <CollapseHeader />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xxl-3 col-xl-4 theiaStickySidebar">
              <div className="card">
                <div className="card-body">
                  <h5 className="mb-3">Project Details</h5>
                  <div className="list-group details-list-group mb-4">
                    <div className="list-group-item">
                      <span>Client</span>
                      <p className="text-gray-9">{project.client || 'N/A'}</p>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Project Total Cost</span>
                        <p className="text-gray-9">${project.projectValue || '0'}</p>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Hours of Work</span>
                        <p className="text-gray-9">{project.hoursOfWork || '0'} hrs</p>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Created on</span>
                        <p className="text-gray-9">
                          {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Started on</span>
                        <p className="text-gray-9">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Due Date</span>
                        <div className="d-flex align-items-center">
                          <p className="text-gray-9 mb-0">
                            {(() => {
                              const parsed = parseDateValue(project.endDate);
                              return parsed ? parsed.format("DD/MM/YYYY") : 'N/A';
                            })()}
                          </p>
                          {(() => {
                            const parsed = parseDateValue(project.endDate);
                            return parsed && parsed.isBefore(dayjs(), 'day');
                          })() && (
                            <span className="badge badge-danger d-inline-flex align-items-center ms-2">
                              <i className="ti ti-clock-stop" />Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Created by</span>
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-sm avatar-rounded me-2">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-02.jpg"
                              alt="Img"
                            />
                          </span>
                          <p className="text-gray-9 mb-0">{project.createdBy || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>Priority</span>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                            data-bs-toggle="dropdown"
                          >
                            <span className={`rounded-circle d-flex justify-content-center align-items-center me-2 ${project.priority === 'High' ? 'bg-transparent-danger' :
                              project.priority === 'Medium' ? 'bg-transparent-warning' :
                                'bg-transparent-success'
                              }`}>
                              <i className={`ti ti-point-filled ${project.priority === 'High' ? 'text-danger' :
                                project.priority === 'Medium' ? 'text-warning' :
                                  'text-success'
                                }`} />
                            </span>{" "}
                            {project.priority || 'N/A'}
                          </Link>
                          <ul className="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePriorityChange('High');
                                }}
                              >
                                <span className="rounded-circle bg-transparent-danger d-flex justify-content-center align-items-center me-2">
                                  <i className="ti ti-point-filled text-danger" />
                                </span>
                                High
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePriorityChange('Medium');
                                }}
                              >
                                <span className="rounded-circle bg-transparent-warning d-flex justify-content-center align-items-center me-2">
                                  <i className="ti ti-point-filled text-warning" />
                                </span>
                                Medium
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePriorityChange('Low');
                                }}
                              >
                                <span className="rounded-circle bg-transparent-success d-flex justify-content-center align-items-center me-2">
                                  <i className="ti ti-point-filled text-success" />
                                </span>
                                Low
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h5 className="mb-3">Tasks Details</h5>
                  <div className="bg-light p-2 rounded">
                    <span className="d-block mb-1">Tasks Done</span>
                    <h4 className="mb-2">{project.completedTasks || 0} / {project.totalTasks || 0}</h4>
                    <div className="progress progress-xs mb-2">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: project.totalTasks > 0 ? `${(project.completedTasks || 0) / project.totalTasks * 100}%` : '0%'
                        }}
                      />
                    </div>
                    <p>{project.totalTasks > 0 ? Math.round((project.completedTasks || 0) / project.totalTasks * 100) : 0}% Completed</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-9 col-xl-8">
              <div className="card">
                <div className="card-body">
                  <div className="bg-light rounded p-3 mb-3">
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.projectdetails.replace(':projectId', project._id)}
                        className="flex-shrink-0 me-2"
                      >
                        <ImageWithBasePath
                          src="assets/img/social/project-01.svg"
                          alt="Img"
                        />
                      </Link>
                      <div>
                        <h6 className="mb-1">
                          <Link to={all_routes.projectdetails.replace(':projectId',  project.projectId)}>
                            {project.name || 'Untitled Project'}
                          </Link>
                        </h6>
                        <p>
                          Project ID :{" "}
                          <span className="text-primary"> {project.projectId || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center">
                    <div className="col-sm-3">
                      <p className="d-flex align-items-center mb-3">
                        <i className="ti ti-square-rounded me-2" />
                        Status
                      </p>
                    </div>
                    <div className="col-sm-9">
                      <span className={`badge d-inline-flex align-items-center mb-3 ${project.status === 'Active' ? 'badge-soft-success' :
                        project.status === 'Completed' ? 'badge-soft-primary' :
                          project.status === 'On Hold' ? 'badge-soft-warning' :
                            'badge-soft-secondary'
                        }`}>
                        <i className="ti ti-point-filled me-1" />
                        {project.status || 'N/A'}
                      </span>
                    </div>
                    <div className="col-sm-3">
                      <p className="d-flex align-items-center mb-3">
                        <i className="ti ti-users-group me-2" />
                        Team
                      </p>
                    </div>
                    <div className="col-sm-9">
                      <div className="d-flex align-items-center mb-3">
                        {project.teamMembersdetail && project.teamMembersdetail.length > 0 ? (
                          project.teamMembersdetail.map((member: any, index: number) => (
                            <div key={member.employeeId || index} className="bg-gray-100 p-1 rounded d-flex align-items-center me-2">
                              <Link
                                to="#"
                                className="avatar avatar-sm avatar-rounded border border-white flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath
                                  src={`assets/img/users/user-${42 + index}.jpg`}
                                  alt="Img"
                                />
                              </Link>
                              <h6 className="fs-12">
                                <Link to="#">{member.firstName} {member.lastName} - {member.employeeId}</Link>
                              </h6>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted mb-0">No team members assigned</p>
                        )}
                        <div>
                          <Link
                            to="#"
                            className="d-flex align-items-center fs-12"
                            data-bs-toggle="modal"
                            data-bs-target="#add_team_members_modal"
                          >
                            <i className="ti ti-circle-plus me-1" />
                            Add New
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <p className="d-flex align-items-center mb-3">
                        <i className="ti ti-user-shield me-2" />
                        Team Lead
                      </p>
                    </div>
                    <div className="col-sm-9">
                      <div className="d-flex align-items-center mb-3">
                        {project.teamLeaderdetail && project.teamLeaderdetail.length > 0 ? (
                          project.teamLeaderdetail.map((lead: any, index: number) => (
                            <div key={lead.employeeId || index} className="bg-gray-100 p-1 rounded d-flex align-items-center me-2">
                              <Link
                                to="#"
                                className="avatar avatar-sm avatar-rounded border border-white flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath
                                  src={`assets/img/users/user-${42 + index}.jpg`}
                                  alt="Img"
                                />
                              </Link>
                              <h6 className="fs-12">
                                <Link to="#">{lead.firstName} {lead.lastName} - {lead.employeeId}</Link>
                              </h6>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted mb-0">No team lead assigned</p>
                        )}
                        <div>
                          <Link
                            to="#"
                            className="d-flex align-items-center fs-12"
                            data-bs-toggle="modal"
                            data-bs-target="#add_team_leads_modal"
                          >
                            <i className="ti ti-circle-plus me-1" />
                            Add New
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <p className="d-flex align-items-center mb-3">
                        <i className="ti ti-user-star me-2" />
                        Project Manager
                      </p>
                    </div>
                    <div className="col-sm-9">
                      <div className="d-flex align-items-center mb-3">
                        {project.projectManagerdetail && project.projectManagerdetail.length > 0 ? (
                          project.projectManagerdetail.map((manager: any, index: number) => (
                            <div key={manager.employeeId || index} className="bg-gray-100 p-1 rounded d-flex align-items-center me-2">
                              <Link
                                to="#"
                                className="avatar avatar-sm avatar-rounded border border-white flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath
                                  src={`assets/img/users/user-${45 + index}.jpg`}
                                  alt="Img"
                                />
                              </Link>
                              <h6 className="fs-12">
                                <Link to="#">{manager.firstName} {manager.lastName} - {manager.employeeId}</Link>
                              </h6>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted mb-0">No project manager assigned</p>
                        )}
                        <div>
                          <Link
                            to="#"
                            className="d-flex align-items-center fs-12"
                            data-bs-toggle="modal"
                            data-bs-target="#add_project_managers_modal"
                          >
                            <i className="ti ti-circle-plus me-1" />
                            Add New
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <p className="d-flex align-items-center mb-3">
                        <i className="ti ti-bookmark me-2" />
                        Tags
                      </p>
                    </div>
                    <div className="col-sm-9">
                      <div className="d-flex align-items-center mb-3">
                        {project.tags && project.tags.length > 0 ? (
                          project.tags.map((tag: string, index: number) => (
                            <Link
                              key={index}
                              to="#"
                              className={`badge task-tag rounded-pill me-2 ${index % 2 === 0 ? 'bg-pink' : 'badge-info'
                                }`}
                            >
                              {tag}
                            </Link>
                          ))
                        ) : (
                          <p className="text-muted mb-0">No tags assigned</p>
                        )}
                      </div>
                    </div>
                    <div className="col-sm-12">
                      <div className="mb-3">
                        <h6 className="mb-1">Description</h6>
                        <p>
                          {project.description || 'No description available for this project.'}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="bg-soft-secondary p-3 rounded d-flex align-items-center justify-content-between">
                        <p className="text-secondary mb-0">
                          Time Spent on this project
                        </p>
                        <h3 className="text-secondary">
                          {project.timeSpent || '0'}/{project.totalHours || '0'} <span className="fs-16">Hrs</span>
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="custom-accordion-items">
                <div
                  className="accordion accordions-items-seperate"
                  id="accordionExample"
                >
                  <div className="accordion-item">
                    <div className="accordion-header" id="headingTwo">
                      <div className="accordion-button">
                        <h5>Tasks</h5>
                        <div className=" ms-auto">
                          <Link
                            to="#"
                            className="d-flex align-items-center collapsed collapse-arrow"
                            data-bs-toggle="collapse"
                            data-bs-target="#primaryBorderTwo"
                            aria-expanded="false"
                            aria-controls="primaryBorderTwo"
                          >
                            <i className="ti ti-chevron-down fs-18" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div
                      id="primaryBorderTwo"
                      className="accordion-collapse collapse show border-top"
                      aria-labelledby="headingTwo"
                      data-bs-parent="#accordionExample"
                    >
                      <div className="accordion-body">
                        <div className="list-group list-group-flush">
                          {tasks.length === 0 ? (
                            <div className="text-center py-4">
                              <i className="ti ti-clipboard-x fs-1 text-muted mb-3"></i>
                              <h6 className="text-muted">No tasks found</h6>
                              <p className="text-muted small">Tasks for this project will appear here</p>
                            </div>
                          ) : (
                            tasks.slice(0, 5).map((task) => (
                              <>
                                <div key={task._id} className="list-group-item border rounded mb-2 p-2">
                                  <div className="row align-items-center row-gap-3">
                                    <div className="col-md-7">
                                      <div className="todo-inbox-check d-flex align-items-center flex-wrap row-gap-3">
                                        <span>
                                          <i className="ti ti-grid-dots me-2" />
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
                                          <h4 className="fs-14">
                                            {task.title}
                                          </h4>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-md-5">
                                      <div className="d-flex align-items-center justify-content-md-end flex-wrap row-gap-3">
                                        <span className="badge bg-soft-pink d-inline-flex align-items-center me-3">
                                          <i className="fas fa-circle fs-6 me-1" />
                                          Onhold
                                        </span>
                                        <div className="d-flex align-items-center">
                                          <div className="avatar-list-stacked avatar-group-sm">
                                            <span className="avatar avatar-rounded">
                                              <ImageWithBasePath
                                                className="border border-white"
                                                src="assets/img/profiles/avatar-13.jpg"
                                                alt="img"
                                              />
                                            </span>
                                            <span className="avatar avatar-rounded">
                                              <ImageWithBasePath
                                                className="border border-white"
                                                src="assets/img/profiles/avatar-14.jpg"
                                                alt="img"
                                              />
                                            </span>
                                            <span className="avatar avatar-rounded">
                                              <ImageWithBasePath
                                                className="border border-white"
                                                src="assets/img/profiles/avatar-15.jpg"
                                                alt="img"
                                              />
                                            </span>
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
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-inert={true}
                                                  data-bs-target="#edit_todo"
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
                                                  data-inert={true}
                                                  data-bs-target="#delete_modal"
                                                >
                                                  <i className="ti ti-trash me-2" />
                                                  Delete
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-inert={true}
                                                  data-bs-target="#view_todo"
                                                >
                                                  <i className="ti ti-eye me-2" />
                                                  View
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ))
                          )}
                          <button
                            className="btn bg-primary-transparent border-dashed border-primary w-100 text-start"
                            data-bs-toggle="modal"
                            data-inert={true}
                            data-bs-target="#add_todo"
                          >
                            <i className="ti ti-plus me-2" />
                            New task
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row" >
                    <div className="col-xl-6 d-flex">
                      <div className="accordion-item flex-fill">
                        <div className="accordion-header" id="headingFive">
                          <div className="accordion-button">
                            <div className="d-flex align-items-center flex-fill">
                              <h5>Notes</h5>
                              <div className=" ms-auto d-flex align-items-center">
                                <Link
                                  to="#"
                                  className="btn btn-primary btn-xs d-inline-flex align-items-center me-3"
                                  data-bs-toggle="modal"
                                  data-bs-target="#add_note_modal"
                                >
                                  <i className="ti ti-square-rounded-plus-filled me-1" />
                                  Add New
                                </Link>
                                <Link
                                  to="#"
                                  className="d-flex align-items-center collapsed collapse-arrow"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#primaryBorderFive"
                                  aria-expanded="false"
                                  aria-controls="primaryBorderFive"
                                >
                                  <i className="ti ti-chevron-down fs-18" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          id="primaryBorderFive"
                          className="accordion-collapse collapse show border-top"
                          aria-labelledby="headingFive"
                          style={{ maxHeight: '60vh', overflowY: 'auto' }}
                        >
                          <div className="accordion-body">
                            {notes.length === 0 ? (
                              <div className="text-center py-4">
                                <i className="ti ti-note-off fs-1 text-muted mb-3"></i>
                                <h6 className="text-muted">No notes found</h6>
                                <p className="text-muted small">Notes for this project will appear here</p>
                              </div>
                            ) : (
                              notes.map((note) => (
                                <div key={note._id} className="card">
                                  <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                      <h6 className="text-gray-5 fw-medium">
                                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                                      </h6>
                                      <div className="dropdown">
                                        <Link
                                          to="#"
                                          className="d-inline-flex align-items-center"
                                          data-bs-toggle="dropdown"
                                          aria-expanded="false"
                                        >
                                          <i className="ti ti-dots-vertical" />
                                        </Link>
                                        <ul className="dropdown-menu dropdown-menu-end p-3">
                                          <li>
                                            <Link
                                              to="#"
                                              className="dropdown-item rounded-1"
                                            >
                                              <i className="ti ti-edit me-2" />
                                              Edit
                                            </Link>
                                          </li>
                                          <li>
                                            <Link
                                              to="#"
                                              className="dropdown-item rounded-1"
                                            >
                                              <i className="ti ti-trash me-1" />
                                              Delete
                                            </Link>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                    <h6 className="d-flex align-items-center mb-2">
                                      <i className="ti ti-point-filled text-primary me-1" />
                                      {note.title}
                                    </h6>
                                    <p className="text-truncate line-clamb-3">
                                      {note.content}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-6 d-flex">
                      <div className="accordion-item flex-fill">
                        <div className="accordion-header" id="headingSix">
                          <div className="accordion-button">
                            <div className="d-flex align-items-center flex-fill">
                              <h5>Activity</h5>
                              {/* <div className=" ms-auto d-flex align-items-center">
                                <Link
                                  to="#"
                                  className="btn btn-primary btn-xs d-inline-flex align-items-center me-3"
                                >
                                  <i className="ti ti-square-rounded-plus-filled me-1" />
                                  Add New
                                </Link>
                                <Link
                                  to="#"
                                  className="d-flex align-items-center collapsed collapse-arrow"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#primaryBorderSix"
                                  aria-expanded="false"
                                  aria-controls="primaryBorderSix"
                                >
                                  <i className="ti ti-chevron-down fs-18" />
                                </Link>
                              </div> */}
                            </div>
                          </div>
                        </div>
                        <div
                          id="primaryBorderSix"
                          className="accordion-collapse collapse show border-top"
                          aria-labelledby="headingSix"
                        >
                          <div className="accordion-body">
                            <div className="notice-widget">
                              <div className="d-flex align-items-center justify-content-between mb-4">
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div className="accordion-item">
                    <div className="accordion-header" id="headingSeven">
                      <div className="accordion-button">
                        <h5>Invoices</h5>
                        <div className=" ms-auto d-flex align-items-center">
                          <Link
                            to="#"
                            className="d-flex align-items-center collapsed collapse-arrow"
                            data-bs-toggle="collapse"
                            data-bs-target="#primaryBorderSeven"
                            aria-expanded="false"
                            aria-controls="primaryBorderSeven"
                          >
                            <i className="ti ti-chevron-down fs-18" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div
                      id="primaryBorderSeven"
                      className="accordion-collapse collapse show border-top"
                      aria-labelledby="headingSeven"
                      data-bs-parent="#accordionExample"
                    >
                      <div className="accordion-body">
                        <div className="list-group list-group-flush">
                          {invoices.length === 0 ? (
                            <div className="text-center py-4">
                              <i className="ti ti-file-invoice-off fs-1 text-muted mb-3"></i>
                              <h6 className="text-muted">No invoices found</h6>
                              <p className="text-muted small">Invoices for this project will appear here</p>
                            </div>
                          ) : (
                            invoices.map((invoice) => (
                              <div key={invoice._id} className="list-group-item border rounded mb-2 p-2">
                                <div className="row align-items-center g-3">
                                  <div className="col-sm-6">
                                    <div className="d-flex align-items-center">
                                      <span className="avatar avatar-lg bg-light flex-shrink-0 me-2">
                                        <i className="ti ti-file-invoice text-dark fs-24" />
                                      </span>
                                      <div>
                                        <h6 className="fw-medium mb-1">
                                          {invoice.title}
                                        </h6>
                                        <p>
                                          <Link to={`${all_routes.invoiceDetails}/${invoice._id}`} className="text-info">
                                            #{invoice.invoiceNumber}{" "}
                                          </Link>{" "}
                                          {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-sm-3">
                                    <div>
                                      <span>Amount</span>
                                      <p className="text-dark">${invoice.amount?.toFixed(2) || '0.00'}</p>
                                    </div>
                                  </div>
                                  <div className="col-sm-3">
                                    <div className="d-flex align-items-center justify-content-sm-end">
                                      <span className={`badge d-inline-flex align-items-center me-4 ${
                                        invoice.status === "Paid" ? "badge-soft-success" :
                                        invoice.status === "Unpaid" ? "badge-soft-danger" :
                                        invoice.status === "Pending" ? "badge-soft-warning" :
                                        invoice.status === "Overdue" ? "badge-soft-danger" :
                                        "badge-soft-secondary"
                                      }`}>
                                        <i className="ti ti-point-filled me-1" />
                                        {invoice.status || 'Draft'}
                                      </span>
                                      <Link to={`${all_routes.invoiceDetails}/${invoice._id}`} className="btn btn-icon btn-sm">
                                        <i className="ti ti-eye" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
                <div className="text-end mb-4">
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="d-inline-flex align-items-center avatar avatar-lg avatar-rounded bg-primary"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-plus fs-24 text-white" />
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end bg-gray-900 dropdown-menu-md dropdown-menu-dark p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1 d-flex align-items-center"
                        >
                          <span className="avatar avatar-md bg-gray-800 flex-shrink-0 me-2">
                            <i className="ti ti-basket-code" />
                          </span>
                          <div>
                            <h6 className="fw-medium text-white mb-1">
                              Add a Task
                            </h6>
                            <p className="text-white">
                              Create a new Priority tasks{" "}
                            </p>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1 d-flex align-items-center"
                        >
                          <span className="avatar avatar-md bg-gray-800 flex-shrink-0 me-2">
                            <i className="ti ti-file-invoice" />
                          </span>
                          <div>
                            <h6 className="fw-medium text-white mb-1">
                              Add Invoice
                            </h6>
                            <p className="text-white">Create a new Billing</p>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1 d-flex align-items-center"
                        >
                          <span className="avatar avatar-md bg-gray-800 flex-shrink-0 me-2">
                            <i className="ti ti-file-description" />
                          </span>
                          <div>
                            <h6 className="fw-medium text-white mb-1">Notes</h6>
                            <p className="text-white">
                              Create new note for you &amp; team
                            </p>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1 d-flex align-items-center"
                        >
                          <span className="avatar avatar-md bg-gray-800 flex-shrink-0 me-2">
                            <i className="ti ti-folder-open" />
                          </span>
                          <div>
                            <h6 className="fw-medium text-white mb-1">
                              Add Files
                            </h6>
                            <p className="text-white">
                              Upload New files for this Client
                            </p>
                          </div>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
      {/* /Page Wrapper */}
      {/* Add Team Members */}
      <div className="modal fade" id="add_team_members_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Team Members</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select Members</label>
                <Select
                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="select"
                  options={memberSelectOptions}
                  value={memberSelectOptions.filter(opt => selectedMembers.includes(opt.value))}
                  onChange={(opts) => setSelectedMembers((opts || []).map((opt) => opt.value))}
                  placeholder={employeeOptions.length === 0 ? "No employees available" : "Select members"}
                  isDisabled={employeeOptions.length === 0}
                />
              </div>
              {memberModalError && (
                <div className="alert alert-danger" role="alert">
                  {memberModalError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light border me-2"
                data-bs-dismiss="modal"
                disabled={isSavingMembers}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTeamMembers}
                disabled={isSavingMembers || selectedMembers.length === 0}
              >
                {isSavingMembers ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Team Members */}
      {/* Add Team Leads */}
      <div className="modal fade" id="add_team_leads_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Team Lead(s)</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select Team Lead(s)</label>
                <Select
                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="select"
                  options={memberSelectOptions}
                  value={memberSelectOptions.filter(opt => selectedLeads.includes(opt.value))}
                  onChange={(opts) => setSelectedLeads((opts || []).map((opt) => opt.value))}
                  placeholder={employeeOptions.length === 0 ? "No employees available" : "Select team lead(s)"}
                  isDisabled={employeeOptions.length === 0}
                />
              </div>
              {leadModalError && (
                <div className="alert alert-danger" role="alert">
                  {leadModalError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light border me-2"
                data-bs-dismiss="modal"
                disabled={isSavingLeads}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTeamLeads}
                disabled={isSavingLeads || selectedLeads.length === 0}
              >
                {isSavingLeads ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Team Leads */}
      {/* Add Project Managers */}
      <div className="modal fade" id="add_project_managers_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Project Manager(s)</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select Project Manager(s)</label>
                <Select
                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="select"
                  options={memberSelectOptions}
                  value={memberSelectOptions.filter(opt => selectedManagers.includes(opt.value))}
                  onChange={(opts) => setSelectedManagers((opts || []).map((opt) => opt.value))}
                  placeholder={employeeOptions.length === 0 ? "No employees available" : "Select project manager(s)"}
                  isDisabled={employeeOptions.length === 0}
                />
              </div>
              {managerModalError && (
                <div className="alert alert-danger" role="alert">
                  {managerModalError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light border me-2"
                data-bs-dismiss="modal"
                disabled={isSavingManagers}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveProjectManagers}
                disabled={isSavingManagers || selectedManagers.length === 0}
              >
                {isSavingManagers ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Project Managers */}
      {/* Add Note */}
      <div className="modal fade" id="add_note_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Note</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Content</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter note content"
                />
              </div>
              {noteModalError && (
                <div className="alert alert-danger" role="alert">
                  {noteModalError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light border me-2"
                data-bs-dismiss="modal"
                disabled={isSavingNote}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveNote}
                disabled={isSavingNote || !noteTitle.trim() || !noteContent.trim()}
              >
                {isSavingNote ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Note */}
      {/* Edit Project */}
      <div className="modal fade" id="edit_project" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header header-border align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h5 className="modal-title me-2">Edit Project </h5>
                <p className="text-dark">Project ID : {project.projectId || 'N/A'}</p>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="add-info-fieldset ">
              <div className="contact-grids-tab p-3 pb-0">
                <ul className="nav nav-underline" id="myTab1" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="basic-tab1"
                      data-bs-toggle="tab"
                      data-bs-target="#basic-info1"
                      type="button"
                      role="tab"
                      aria-selected="true"
                    >
                      Basic Information
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="member-tab1"
                      data-bs-toggle="tab"
                      data-bs-target="#member1"
                      type="button"
                      role="tab"
                      aria-selected="false"
                    >
                      Members
                    </button>
                  </li>
                </ul>
              </div>
              <div className="tab-content" id="myTabContent1">
                <div
                  className="tab-pane fade show active"
                  id="basic-info1"
                  role="tabpanel"
                  aria-labelledby="basic-tab1"
                  tabIndex={0}
                >
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="modal-body">
                      {editModalError && (
                        <div className="alert alert-danger" role="alert">
                          {editModalError}
                        </div>
                      )}
                      <div className="row">
                        <div className="col-md-12">
                          <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                            <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                              <i className="ti ti-photo text-gray-2 fs-16" />
                            </div>
                            <div className="profile-upload">
                              <div className="mb-2">
                                <h6 className="mb-1">Upload Project Logo</h6>
                                <p className="fs-12">
                                  Image should be below 4 mb
                                </p>
                              </div>
                              <div className="profile-uploader d-flex align-items-center">
                                <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                  Upload
                                  <input
                                    type="file"
                                    className="form-control image-sign"
                                    multiple
                                  />
                                </div>
                                <Link to="#" className="btn btn-light btn-sm">
                                  Cancel
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Project Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Client</label>
                            <CommonSelect
                              className="select"
                              options={clientChoose}
                              value={clientChoose.find(c => c.value === editClient) || null}
                              onChange={(opt: any) => setEditClient(opt?.value || "")}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Start Date</label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format={{
                                      format: "DD-MM-YYYY",
                                      type: "mask",
                                    }}
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    value={editStartDate}
                                    onChange={(val) => setEditStartDate(val)}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-3">
                                <label className="form-label">End Date</label>
                                <div className="input-icon-end position-relative">
                                  <DatePicker
                                    className="form-control datetimepicker"
                                    format={{
                                      format: "DD-MM-YYYY",
                                      type: "mask",
                                    }}
                                    getPopupContainer={getModalContainer}
                                    placeholder="DD-MM-YYYY"
                                    value={editEndDate}
                                    onChange={(val) => setEditEndDate(val)}
                                  />
                                  <span className="input-icon-addon">
                                    <i className="ti ti-calendar text-gray-7" />
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="mb-3">
                                <label className="form-label">Priority</label>
                                <CommonSelect
                                  className="select"
                                  options={priorityChoose}
                                  value={priorityChoose.find(p => p.value === editPriority) || null}
                                  onChange={(opt: any) => setEditPriority(opt?.value || "Medium")}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="mb-3">
                                <label className="form-label">
                                  Project Value
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="mb-3">
                                <label className="form-label">Price Type</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editPriceType}
                                  onChange={(e) => setEditPriceType(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Description</label>
                            <CommonTextEditor
                              defaultValue={editDescription}
                              onChange={(value) => setEditDescription(value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="input-block mb-0">
                            <label className="form-label">Upload Files</label>
                            <input className="form-control" type="file" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <div className="d-flex align-items-center justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-light border me-2"
                          data-bs-dismiss="modal"
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={handleEditProjectSave}
                          disabled={isSavingProject}
                        >
                          {isSavingProject ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div
                  className="tab-pane fade"
                  id="member1"
                  role="tabpanel"
                  aria-labelledby="member-tab1"
                  tabIndex={0}
                >
                  <form>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">
                              Team Members
                            </label>
                            <CommonTagsInput
                              value={tags}
                              onChange={setTags}
                              placeholder="Add new"
                              className="custom-input-class" // Optional custom class
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">
                              Team Leader
                            </label>
                            <CommonTagsInput
                              value={tags1}
                              onChange={setTags1}
                              placeholder="Add new"
                              className="custom-input-class" // Optional custom class
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label me-2">
                              Project Manager
                            </label>
                            <CommonTagsInput
                              value={tags2}
                              onChange={setTags2}
                              placeholder="Add new"
                              className="custom-input-class" // Optional custom class
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div>
                            <label className="form-label">Tags</label>
                            <CommonTagsInput
                              value={tags3}
                              onChange={setTags3}
                              placeholder="Add new"
                              className="custom-input-class" // Optional custom class
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <CommonSelect
                              className="select"
                              options={statusChoose}
                              defaultValue={statusChoose.find(s => s.value === project.status) || statusChoose[0]}
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
                          data-bs-dismiss="modal"
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          data-bs-toggle="modal"
                          data-inert={true}
                          data-bs-target="#success_modal"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Project */}
      {/* Add Project Success */}
      <div className="modal fade" id="success_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body">
              <div className="text-center p-3">
                <span className="avatar avatar-lg avatar-rounded bg-success mb-3">
                  <i className="ti ti-check fs-24" />
                </span>
                <h5 className="mb-2">Project Added Successfully</h5>
                <p className="mb-3">
                  Stephan Peralt has been added with Client ID :{" "}
                  <span className="text-primary">#pro - 0004</span>
                </p>
                <div>
                  <div className="row g-2">
                    <div className="col-6">
                      <Link
                        to={all_routes.projectlist}
                        className="btn btn-dark w-100"
                      >
                        Back to List
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link
                        to={all_routes.projectdetails}
                        className="btn btn-primary w-100"
                      >
                        Detail Page
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Project Success */}
      {/* Edit Todo */}
      <div className="modal fade" id="edit_todo">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Todo</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form action={all_routes.projectdetails}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Todo Title</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Update calendar and schedule"
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <label className="form-label">Tag</label>
                      <CommonSelect
                        className="select"
                        options={tagChoose}
                        defaultValue={tagChoose[0]}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={priorityChoose}
                        defaultValue={priorityChoose[0]}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Descriptions</label>
                      <CommonTextEditor />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Add Assignee</label>
                      <select className="select">
                        <option>Select</option>
                        <option>Sophie</option>
                        <option>Cameron</option>
                        <option>Doris</option>
                        <option>Rufana</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <select className="select">
                        <option>Select</option>
                        <option>Completed</option>
                        <option>Pending</option>
                        <option>Onhold</option>
                        <option>Inprogress</option>
                      </select>
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
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Todo */}
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
                aria-label="Close"
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
      {/* Add Todo */}
      <div className="modal fade" id="add_todo">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Task</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="modal-body">
                {taskModalError && (
                  <div className="alert alert-danger" role="alert">
                    {taskModalError}
                  </div>
                )}
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Task Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <label className="form-label">Tag</label>
                      <CommonSelect
                        className="select"
                        options={tagChoose}
                        defaultValue={tagChoose.find(t => t.value === (taskTags[0] || "Select")) || tagChoose[0]}
                        onChange={(option: any) => setTaskTags(option?.value && option.value !== "Select" ? [option.value] : [])}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={priorityChoose}
                        defaultValue={priorityChoose.find(p => p.value === taskPriority) || priorityChoose[2]}
                        onChange={(option: any) => setTaskPriority(option?.value || "Medium")}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Descriptions</label>
                      <CommonTextEditor
                        defaultValue={taskDescription}
                        onChange={(value) => setTaskDescription(value)}
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Add Assignee</label>
                      <Select
                        isMulti
                        className="basic-multi-select"
                        classNamePrefix="select"
                        options={assigneeChoose.filter(opt => opt.value !== "Select")}
                        value={assigneeChoose.filter(opt => selectedAssignees.includes(opt.value))}
                        onChange={(opts) => setSelectedAssignees((opts || []).map((opt) => opt.value))}
                        placeholder={assigneeChoose.length === 1 ? "No team members available" : "Select assignees"}
                        isDisabled={assigneeChoose.length === 1}
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <input
                        type="text"
                        className="form-control"
                        value="To do"
                        disabled
                        readOnly
                      />
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
                  onClick={handleSaveTask}
                  disabled={isSavingTask || !taskTitle.trim()}
                  className="btn btn-primary"
                >
                  {isSavingTask ? "Saving..." : "Add New Todo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Todo */}
    </>
  );
};

export default ProjectDetails;
