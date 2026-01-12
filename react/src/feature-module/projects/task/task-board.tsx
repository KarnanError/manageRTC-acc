import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes'
import CommonSelect from '../../../core/common/commonSelect'
import { label } from 'yet-another-react-lightbox/*'
import { DatePicker } from 'antd'
import CommonTagsInput from '../../../core/common/Taginput'
import CommonTextEditor from '../../../core/common/textEditor'
import dragula, { Drake } from "dragula";
import "dragula/dist/dragula.css";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header'
import { useSocket } from '../../../SocketContext'
import { toast } from 'react-toastify'

const TaskBoard = () => {
    const socket = useSocket();
    const [selectedProject, setSelectedProject] = useState("Select");
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [taskStatuses, setTaskStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [newBoardColor, setNewBoardColor] = useState("purple");
    const [savingBoard, setSavingBoard] = useState(false);
    const addBoardModalRef = useRef<any>(null);
    const addBoardCloseButtonRef = useRef<HTMLButtonElement>(null);
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        taskId: string;
        newStatus: string;
        taskTitle: string;
        progress?: number;
    } | null>(null);

    // Fallback statuses in case API fails or returns empty
    const defaultTaskStatuses = useMemo(() => ([
        { key: 'todo', name: 'To Do', colorName: 'purple', order: 1 },
        { key: 'pending', name: 'Pending', colorName: 'pink', order: 2 },
        { key: 'inprogress', name: 'Inprogress', colorName: 'blue', order: 3 },
        { key: 'onhold', name: 'Onhold', colorName: 'yellow', order: 4 },
        { key: 'review', name: 'Review', colorName: 'orange', order: 5 },
        { key: 'completed', name: 'Completed', colorName: 'green', order: 6 },
        { key: 'cancelled', name: 'Canceled', colorName: 'red', order: 7 },
    ]), []);

    const getModalContainer = () => {
        const modalElement = document.getElementById('modal-datepicker');
        return modalElement ? modalElement : document.body;
    };

    const loadProjects = useCallback(() => {
        if (!socket) return;
        setLoading(true);
        socket.emit("project:getAllData", {});
    }, [socket]);

    const loadTaskStatuses = useCallback(() => {
        if (!socket) return;
        socket.emit("task:getStatuses");
    }, [socket]);

    const loadprojecttasks = useCallback((projectId: string) => {
        if (!socket) return;
        setTasksLoading(true);
        setTasks([]);
        socket.emit("task:getByProject", { projectId });
    }, [socket]);
    
    const projectChoose = [
        { value: "Select", label: "Select" },
        ...projects.map(project => ({
            value: project.projectId || project._id,
            label: project.projectId ? `${project.name} (${project.projectId})` : project.name
        }))
    ];
    const statusChoose = [
        { value: "Select", label: "Select" },
        { value: "Inprogress", label: "Inprogress" },
        { value: "Completed", label: "Completed" },
        { value: "Pending", label: "Pending" },
        { value: "Onhold", label: "Onhold" },

    ];
    const priorityChoose = [
        { value: "Select", label: "Select" },
        { value: "Medium", label: "Medium" },
        { value: "High", label: "High" },
        { value: "Low", label: "Low" },

    ];
    const [tags, setTags] = useState<string[]>(["Jerald", "Andrew", "Philip", "Davis"]);
    const [tags1, setTags1] = useState<string[]>(["Collab", "Rated"]);

    const normalizeStatus = (status?: string) => (status || "Pending").toLowerCase();

    // Normalize status keys across cases, spaces, hyphens, and underscores
    const normalizeKey = useCallback((value?: string) => {
        return (value || "")
            .toLowerCase()
            .replace(/[\s_-]+/g, "");
    }, []);

    // Color hex map for saving to backend
    const colorHexMap = useMemo(() => ({
        purple: "#6f42c1",
        pink: "#d63384",
        blue: "#0d6efd",
        yellow: "#ffc107",
        green: "#198754",
        orange: "#fd7e14",
        red: "#dc3545",
    }), []);

    // Dynamic status count helper
    const getStatusCount = useCallback((statusKey: string) => {
        const target = normalizeKey(statusKey);
        return tasks.filter((task) => {
            const taskStatus = normalizeKey(task.status);
            return taskStatus === target;
        }).length;
    }, [tasks, normalizeKey]);

    const totalTasks = tasks.length;
    const totalpendingCount = tasks.filter((task) => {
        const s = normalizeStatus(task.status);
        return s === "pending" || s === "to do" || s === "todo" || s === "inprogress" || s === "in progress";
    }).length;
    const totalcompletedCount = tasks.filter((task) => {
        const s = normalizeStatus(task.status);
        return s === "completed" || s === "review";
    }).length;

    // Dynamic counts per status from taskStatuses collection
    const todoingCount = getStatusCount("todo");
    const canceledCount = getStatusCount("cancelled");
    const reviewCount = getStatusCount("review");
    const onholdCount = getStatusCount("onhold");
    const pendingCount = getStatusCount("pending");
    const inprogressCount = getStatusCount("inprogress");
    const completedCount = getStatusCount("completed");

    // Helper to get color classes for status badges
    const getColorClass = useCallback((colorName?: string) => {
        const colorMap: Record<string, { bg: string; soft: string }> = {
            purple: { bg: 'bg-purple', soft: 'bg-transparent-purple' },
            pink: { bg: 'bg-pink', soft: 'bg-soft-pink' },
            blue: { bg: 'bg-skyblue', soft: 'bg-soft-skyblue' },
            yellow: { bg: 'bg-warning', soft: 'bg-soft-warning' },
            green: { bg: 'bg-success', soft: 'bg-soft-success' },
            orange: { bg: 'bg-orange', soft: 'bg-soft-orange' },
            red: { bg: 'bg-danger', soft: 'bg-soft-danger' },
        };
        return colorMap[colorName?.toLowerCase() || 'purple'] || colorMap.purple;
    }, []);

    const updateTaskStatus = useCallback((taskId: string, newStatus: string, progressOverride?: number) => {
        if (!socket) return;

        // Map status to progress percentage
        const progressByStatus: Record<string, number> = {
            "To Do": 0,
            "Pending": 20,
            "Inprogress": 50,
            "Completed": 100,
        };
        const progress =
            typeof progressOverride === "number"
                ? progressOverride
                : (progressByStatus[newStatus] ?? 0);

        socket.emit("task:update", {
            taskId,
            update: {
                status: newStatus,
                progress,
            }
        });

        socket.once("task:update-response", (response: any) => {
            if (response.done) {
                toast.success("Task status updated successfully");
                // Reload tasks to reflect the change
                if (selectedProject !== "Select") {
                    loadprojecttasks(selectedProject);
                }
            } else {
                toast.error(response.error || "Failed to update task status");
            }
        });
    }, [socket, selectedProject, loadprojecttasks]);

    const handleConfirmStatusChange = () => {
        if (pendingStatusChange) {
            updateTaskStatus(
                pendingStatusChange.taskId,
                pendingStatusChange.newStatus,
                pendingStatusChange.progress
            );
        }
        setShowStatusModal(false);
        setPendingStatusChange(null);
    };

    const handleCancelStatusChange = () => {
        // Reload tasks to reset the UI
        if (selectedProject !== "Select") {
            loadprojecttasks(selectedProject);
        }
        setShowStatusModal(false);
        setPendingStatusChange(null);
    };

    const handleAddBoardSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!socket) return;
        if (!newBoardName.trim()) {
            toast.error("Board name is required");
            return;
        }

        setSavingBoard(true);
        socket.emit("task:addStatus", {
            name: newBoardName.trim(),
            colorName: newBoardColor,
            colorHex: colorHexMap[newBoardColor] || "",
        });
    }, [socket, newBoardName, newBoardColor, colorHexMap]);

    // Dynamically create container refs based on taskStatuses count
    const containerRefs = useMemo(
        () => Array.from({ length: taskStatuses.length }, () => React.createRef<HTMLDivElement>()),
        [taskStatuses.length]
    );

    useEffect(() => {
        // Skip if no taskStatuses or containerRefs
        if (taskStatuses.length === 0 || containerRefs.length === 0) return;

        // Get all non-null container elements from dynamic refs
        const containers = containerRefs
            .map(ref => ref.current)
            .filter((container): container is HTMLDivElement => container !== null);

        // Skip if no containers are ready
        if (containers.length === 0) return;

        const drake: Drake = dragula(containers);
        
        drake.on('drop', (el, target, source) => {
            if (target && source && target !== source) {
                // Get the task ID from the element
                const taskId = el.getAttribute('data-task-id');
                const taskTitle = el.getAttribute('data-task-title');
                
                if (taskId && target) {
                    // Determine new status based on target container - dynamically from taskStatuses
                    let newStatus = "";
                    let sourceStatus = "";
                    
                    // Find target container index
                    const targetIndex = containerRefs.findIndex(ref => ref.current === target);
                    if (targetIndex !== -1 && taskStatuses[targetIndex]) {
                        newStatus = taskStatuses[targetIndex].name;
                    }

                    // Find source container index
                    const sourceIndex = containerRefs.findIndex(ref => ref.current === source);
                    if (sourceIndex !== -1 && taskStatuses[sourceIndex]) {
                        sourceStatus = taskStatuses[sourceIndex].name;
                    }
                    
                    if (newStatus) {
                        // Cancel the drop temporarily
                        drake.cancel(true);
                        
                        // Compute progress: use fixed mapping when available; otherwise preserve from source status
                        const progressByStatus: Record<string, number> = {
                            "To Do": 0,
                            "Pending": 20,
                            "Inprogress": 50,
                            "Completed": 100,
                        };
                        let proposedProgress: number | undefined = progressByStatus[newStatus];
                        if (typeof proposedProgress === "undefined") {
                            proposedProgress = progressByStatus[sourceStatus] ?? 0;
                        }

                        // Show confirmation modal
                        setPendingStatusChange({
                            taskId,
                            newStatus,
                            taskTitle: taskTitle || 'this task',
                            progress: proposedProgress,
                        });
                        setShowStatusModal(true);
                    }
                }
            }
        });
        
        return () => {
            drake.destroy();
        };
    }, [taskStatuses]);

    useEffect(() => {
        if (!socket) return;

        const handleProjectsResponse = (response: any) => {
            setLoading(false);
            if (response.done) {
                setProjects(response.data.projects || []);
            } else {
                toast.error(response.error || "Failed to load projects");
            }
        };

        socket.on("project:getAllData-response", handleProjectsResponse);
        loadProjects();

        return () => {
            socket.off("project:getAllData-response", handleProjectsResponse);
        };
    }, [socket, loadProjects]);

    useEffect(() => {
        if (!socket) return;

        const handleTasksResponse = (response: any) => {
            setTasksLoading(false);
            if (response?.done) {
                setTasks(response.data?.tasks || []);
            } else {
                toast.error(response?.error || "Failed to load tasks");
            }
        };

        socket.on("task:getByProject-response", handleTasksResponse);

        return () => {
            socket.off("task:getByProject-response", handleTasksResponse);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleTaskStatusesResponse = (response: any) => {
            console.log("Task statuses response:", response);
            if (response.done) {
                const incoming = Array.isArray(response.data) ? response.data : [];
                const ordered = incoming.sort((a, b) => (a.order || 0) - (b.order || 0));
                const toSet = ordered.length ? ordered : defaultTaskStatuses;
                console.log("Setting task statuses:", toSet);
                setTaskStatuses(toSet);
            } else {
                console.error("Failed to load task statuses:", response.error);
                setTaskStatuses(defaultTaskStatuses);
                toast.error(response.error || "Failed to load task statuses. Using defaults.");
            }
        };

        socket.on("task:getStatuses-response", handleTaskStatusesResponse);
        loadTaskStatuses();

        return () => {
            socket.off("task:getStatuses-response", handleTaskStatusesResponse);
        };
    }, [socket, loadTaskStatuses]);

    useEffect(() => {
        if (!socket) return;

        const handleAddStatusResponse = (response: any) => {
            setSavingBoard(false);
            if (response?.done) {
                toast.success("Board added successfully");
                setNewBoardName("");
                setNewBoardColor("purple");
                loadTaskStatuses();
                
                // Close modal by clicking the close button
                if (addBoardCloseButtonRef.current) {
                    addBoardCloseButtonRef.current.click();
                }
            } else {
                toast.error(response?.error || "Failed to add board");
            }
        };

        socket.on("task:addStatus-response", handleAddStatusResponse);

        return () => {
            socket.off("task:addStatus-response", handleAddStatusResponse);
        };
    }, [socket, loadTaskStatuses]);

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Task Board</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to="index.html">
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Projects</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Task Board
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                            <div className="dropdown me-2">
                                <button
                                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    onClick={() => console.log("Export clicked")}
                                >
                                    <i className="ti ti-file-export me-2" /> Export
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end p-3">
                                    <li>
                                        <a
                                            href="#"
                                            className="dropdown-item rounded-1"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log("Export as PDF clicked");
                                            }}
                                        >
                                            <i className="ti ti-file-type-pdf me-1" />
                                            Export as PDF
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="dropdown-item rounded-1"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log("Export as Excel clicked");
                                            }}
                                        >
                                            <i className="ti ti-file-type-xls me-1" />
                                            Export as Excel{" "}
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <Link
                                to="#"
                                className="btn btn-primary d-inline-flex align-items-center"
                                data-bs-toggle="modal" 
                                data-inert={true}
                                data-bs-target="#add_board"
                            >
                                <i className="ti ti-circle-plus me-1" />
                                Add Board
                            </Link>
                            <div className="head-icons ms-2 mb-0">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* Project Selection */}
                    <div className="card mb-3">
                        <div className="card-body">
                            <div className="row align-items-end">
                                <div className="col-md-6">
                                    <label className="form-label d-block mb-2">Select Project</label>
                                    {loading ? (
                                        <div className="text-center py-2">
                                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <span className="ms-2">Loading projects...</span>
                                        </div>
                                    ) : (
                                        <CommonSelect
                                            className="select"
                                            options={projectChoose}
                                            defaultValue={projectChoose[0]}
                                            onChange={(selected: any) => {
                                                const value = selected?.value || "Select";
                                                setSelectedProject(value);
                                                console.log("Selected project:", value);
                                                if (value !== "Select") {
                                                    loadprojecttasks(value);
                                                } else {
                                                    setTasks([]);
                                                    setTasksLoading(false);
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <div className="alert alert-info mb-0">
                                        <strong>Selected Project:</strong> {
                                            selectedProject !== "Select"
                                                ? (() => {
                                                    const proj = projects.find(p => p.projectId === selectedProject || p._id === selectedProject);
                                                    if (!proj) return selectedProject;
                                                    const id = proj.projectId || proj._id;
                                                    return `${proj.name} (${id})`;
                                                })()
                                                : "No project selected"
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h4>{
                                selectedProject !== "Select"
                                    ? (() => {
                                        const proj = projects.find(p => p.projectId === selectedProject || p._id === selectedProject);
                                        if (!proj) return "Select a Project to View Tasks";
                                        const id = proj.projectId || proj._id;
                                        return `${proj.name} (${id})`;
                                    })()
                                    : "Select a Project to View Tasks"
                            }</h4>
                            <div className="d-flex align-items-center flex-wrap row-gap-3">
                                {/* <div className="avatar-list-stacked avatar-group-sm me-3">
                                    <span className="avatar avatar-rounded">
                                        <ImageWithBasePath
                                            className="border border-white"
                                            src="assets/img/profiles/avatar-19.jpg"
                                            alt="img"
                                        />
                                    </span>
                                    <span className="avatar avatar-rounded">
                                        <ImageWithBasePath
                                            className="border border-white"
                                            src="assets/img/profiles/avatar-29.jpg"
                                            alt="img"
                                        />
                                    </span>
                                    <span className="avatar avatar-rounded">
                                        <ImageWithBasePath
                                            className="border border-white"
                                            src="assets/img/profiles/avatar-16.jpg"
                                            alt="img"
                                        />
                                    </span>
                                    <span className="avatar avatar-rounded bg-primary fs-12">1+</span>
                                </div> */}
                                <div className="d-flex align-items-center me-3">
                                    <p className="mb-0 me-3 pe-3 border-end fs-14">
                                        Total Task : <span className="text-dark"> {totalTasks} </span>
                                    </p>
                                    <p className="mb-0 me-3 pe-3 border-end fs-14">
                                        Pending : <span className="text-dark"> {totalpendingCount} </span>
                                    </p>
                                    <p className="mb-0 fs-14">
                                        Completed : <span className="text-dark"> {totalcompletedCount} </span>
                                    </p>
                                </div>
                                {/* <div className="input-icon-start position-relative">
                                    <span className="input-icon-addon">
                                        <i className="ti ti-search" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search Project"
                                    />
                                </div> */}
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-lg-4">
                                    <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                                        <h6 className="me-2">Priority</h6>
                                        <ul
                                            className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                                            id="pills-tab"
                                            role="tablist"
                                        >
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto active"
                                                    data-bs-toggle="pill"
                                                    data-bs-target="#pills-home"
                                                    type="button"
                                                    role="tab"
                                                    aria-selected="true"
                                                >
                                                    All
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto"
                                                    data-bs-toggle="pill"
                                                    data-bs-target="#pills-contact"
                                                    type="button"
                                                    role="tab"
                                                    aria-selected="false"
                                                >
                                                    High
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto"
                                                    data-bs-toggle="pill"
                                                    data-bs-target="#pills-medium"
                                                    type="button"
                                                    role="tab"
                                                    aria-selected="false"
                                                >
                                                    Medium
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto"
                                                    data-bs-toggle="pill"
                                                    data-bs-target="#pills-low"
                                                    type="button"
                                                    role="tab"
                                                    aria-selected="false"
                                                >
                                                    Low
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="col-lg-8">
                                    <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                                        <div className="dropdown me-2">
                                            <Link
                                                to="#"
                                                className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                                                data-bs-toggle="dropdown"
                                            >
                                                Clients
                                            </Link>
                                            <ul className="dropdown-menu  dropdown-menu-end p-3">
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Clients
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Sophie
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Cameron
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Doris
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
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
                                                placeholder="Created Date"
                                            />
                                        </div>
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
                                                Select Status
                                            </Link>
                                            <ul className="dropdown-menu  dropdown-menu-end p-3">
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Inprogress
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        On-hold
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        to="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Completed
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="d-flex align-items-center border rounded p-2">
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
                                                        <Link
                                                            to="#"
                                                            className="dropdown-item rounded-1"
                                                        >
                                                            Created Date
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            className="dropdown-item rounded-1"
                                                        >
                                                            High
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link
                                                            to="#"
                                                            className="dropdown-item rounded-1"
                                                        >
                                                            Medium
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="tab-content" id="pills-tabContent">
                                <div
                                    className="tab-pane fade show active"
                                    id="pills-home"
                                    role="tabpanel"
                                >
                                    <div className="d-flex align-items-start overflow-auto project-status pb-4">
                                        {/* Dynamic task status columns */}
                                        {taskStatuses.length === 0 ? (
                                            <div className="text-center p-4 w-100">
                                                <p className="text-muted">Loading task statuses...</p>
                                            </div>
                                        ) : (
                                            taskStatuses.map((status, index) => {
                                                const statusKey = status.key?.toLowerCase() || '';
                                            const count = getStatusCount(statusKey);
                                            const colorClasses = getColorClass(status.colorName);
                                            const containerRef = containerRefs[index];

                                            return (
                                                <div key={status._id || status.key} className="p-3 rounded bg-transparent-secondary w-100 me-3">
                                                    <div className="bg-white p-2 rounded mb-2">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <span className={`${colorClasses.soft} p-1 d-flex rounded-circle me-2`}>
                                                                    <span className={`${colorClasses.bg} rounded-circle d-block p-1`} />
                                                                </span>
                                                                <h5 className="me-2">{status.name}</h5>
                                                                <span className="badge bg-light rounded-pill">{count}</span>
                                                            </div>
                                                            <div className="dropdown">
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
                                                                            data-bs-toggle="modal" data-inert={true}
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
                                                                            data-bs-toggle="modal" data-inert={true}
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
                                                    <div className="kanban-drag-wrap" ref={containerRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                        {tasks
                                                            .filter(t => {
                                                                const taskStatus = normalizeKey(t.status);
                                                                const targetKey = normalizeKey(statusKey);
                                                                return taskStatus === targetKey;
                                                            })
                                                            .map((t, idx) => (
                                                                <div key={(t as any)._id || idx} data-task-id={(t as any)._id} data-task-title={(t as any).title}>
                                                                    <div className="card kanban-card mb-2">
                                                                        <div className="card-body">
                                                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                                                <div className="d-flex align-items-center">
                                                                                    <span className={`badge ${((t as any).priority === 'High') ? 'bg-danger' : ((t as any).priority === 'Low') ? 'bg-success' : 'bg-warning'} badge-xs d-flex align-items-center justify-content-center`}>
                                                                                        <i className="fas fa-circle fs-6 me-1" />
                                                                                        {(t as any).priority || 'Medium'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="dropdown">
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
                                                                                                data-bs-toggle="modal" data-inert={true}
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
                                                                                                data-bs-toggle="modal" data-inert={true}
                                                                                                data-bs-target="#delete_modal"
                                                                                            >
                                                                                                <i className="ti ti-trash me-2" />
                                                                                                Delete
                                                                                            </Link>
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mb-2">
                                                                                <h6 className="d-flex align-items-center">
                                                                                    {(t as any).title || 'Untitled Task'}
                                                                                </h6>
                                                                            </div>
                                                                            <div className="d-flex align-items-center mb-2">
                                                                                <div
                                                                                    className="progress progress-sm flex-fill"
                                                                                    role="progressbar"
                                                                                    aria-label="Basic example"
                                                                                    aria-valuenow={status.key === 'completed' ? 100 : status.key === 'inprogress' ? 50 : status.key === 'pending' ? 20 : 0}
                                                                                    aria-valuemin={0}
                                                                                    aria-valuemax={100}
                                                                                >
                                                                                    <div
                                                                                        className={`progress-bar ${status.key === 'completed' ? 'bg-success' : status.key === 'inprogress' ? 'bg-warning' : 'bg-danger'}`}
                                                                                        style={{ width: `${status.key === 'completed' ? 100 : status.key === 'inprogress' ? 50 : status.key === 'pending' ? 20 : 0}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span className="d-block ms-2 text-gray-9 fw-medium">
                                                                                    {status.key === 'completed' ? '100' : status.key === 'inprogress' ? '50' : status.key === 'pending' ? '20' : '0'}%
                                                                                </span>
                                                                            </div>
                                                                            <p className="fw-medium mb-0">
                                                                                Due on :{" "}
                                                                                <span className="text-gray-9">
                                                                                    {(t as any).dueDate ? new Date((t as any).dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }
                                                                                </span>
                                                                            </p>
                                                                            <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                                                                                <div className="me-3">
                                                                                    <span className="badge bg-light text-dark">
                                                                                        {Array.isArray((t as any).assignee) ? (t as any).assignee.length : 0} Assignees
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                    <div className="pt-2">
                                                        <Link
                                                            to="#"
                                                            className="btn btn-white border border-dashed d-flex align-items-center justify-content-center"
                                                            data-bs-toggle="modal" data-inert={true}
                                                            data-bs-target="#add_task"
                                                        >
                                                            <i className="ti ti-plus me-2" /> New Task
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
                    <p className="mb-0">2014 - 2025 © SmartHR.</p>
                    <p>
                        Designed &amp; Developed By{" "}
                        <Link to="#" className="text-primary">
                            Dreams
                        </Link>
                    </p>
                </div>
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
                                aria-label="Close"
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
                                            <input type="text" className="form-control" />
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
                                                className='select'
                                                options={projectChoose}
                                                defaultValue={projectChoose[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label me-2">Team Members</label>
                                            <CommonTagsInput
                                                value={tags}
                                                onChange={setTags}
                                                placeholder="Add new"
                                                className="custom-input-class" // Optional custom class
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Tag</label>
                                            <CommonTagsInput
                                                value={tags1}
                                                onChange={setTags1}
                                                placeholder="Add new"
                                                className="custom-input-class" // Optional custom class
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Status</label>
                                            <CommonSelect
                                                className='select'
                                                options={statusChoose}
                                                defaultValue={statusChoose[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Priority</label>
                                            <CommonSelect
                                                className='select'
                                                options={priorityChoose}
                                                defaultValue={priorityChoose[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Who Can See this Task?</label>
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="form-check me-3">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault1"
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault1"
                                                >
                                                    Public
                                                </label>
                                            </div>
                                            <div className="form-check me-3">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault2"
                                                    defaultChecked
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault2"
                                                >
                                                    Private
                                                </label>
                                            </div>
                                            <div className="form-check ">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault3"
                                                    defaultChecked
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault3"
                                                >
                                                    Admin Only
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="form-label">Descriptions</label>
                                            <CommonTextEditor />
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
                                                    />
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                <div className="d-flex align-items-center">
                                                    <h6 className="fs-12 fw-medium me-1">Logo.zip</h6>
                                                    <span className="badge badge-soft-info">21MB </span>
                                                </div>
                                                <Link to="#" className="btn btn-sm btn-icon">
                                                    <i className="ti ti-trash" />
                                                </Link>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <h6 className="fs-12 fw-medium me-1">Files.zip</h6>
                                                    <span className="badge badge-soft-info">25MB </span>
                                                </div>
                                                <Link to="#" className="btn btn-sm btn-icon">
                                                    <i className="ti ti-trash" />
                                                </Link>
                                            </div>
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
                                <button type="button" data-bs-dismiss="modal" className="btn btn-primary">
                                    Add New Task
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
                                aria-label="Close"
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
                                            <input type="text" className="form-control" />
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
                                                className='select'
                                                options={projectChoose}
                                                defaultValue={projectChoose[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label me-2">Team Members</label>
                                            <CommonTagsInput
                                                value={tags}
                                                onChange={setTags}
                                                placeholder="Add new"
                                                className="custom-input-class" // Optional custom class
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Tag</label>
                                            <CommonTagsInput
                                                value={tags1}
                                                onChange={setTags1}
                                                placeholder="Add new"
                                                className="custom-input-class" // Optional custom class
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Status</label>
                                            <CommonSelect
                                                className='select'
                                                options={statusChoose}
                                                defaultValue={statusChoose[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Priority</label>
                                            <CommonSelect
                                                className='select'
                                                options={priorityChoose}
                                                defaultValue={priorityChoose[1]}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Who Can See this Task?</label>
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="form-check me-3">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault1"
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault1"
                                                >
                                                    Public
                                                </label>
                                            </div>
                                            <div className="form-check me-3">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault2"
                                                    defaultChecked
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault2"
                                                >
                                                    Private
                                                </label>
                                            </div>
                                            <div className="form-check ">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="flexRadioDefault"
                                                    id="flexRadioDefault3"
                                                    defaultChecked
                                                />
                                                <label
                                                    className="form-check-label text-dark"
                                                    htmlFor="flexRadioDefault3"
                                                >
                                                    Admin Only
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="form-label">Descriptions</label>
                                            <div className="summernote" />
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
                                                    />
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between border-bottom mb-2 pb-2">
                                                <div className="d-flex align-items-center">
                                                    <h6 className="fs-12 fw-medium me-1">Logo.zip</h6>
                                                    <span className="badge badge-soft-info">21MB </span>
                                                </div>
                                                <Link to="#" className="btn btn-sm btn-icon">
                                                    <i className="ti ti-trash" />
                                                </Link>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <h6 className="fs-12 fw-medium me-1">Files.zip</h6>
                                                    <span className="badge badge-soft-info">25MB </span>
                                                </div>
                                                <Link to="#" className="btn btn-sm btn-icon">
                                                    <i className="ti ti-trash" />
                                                </Link>
                                            </div>
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
                                <button type="button" data-bs-dismiss="modal" className="btn btn-primary">
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
                                    Hiking is a long, vigorous walk, usually on trails or footpaths in
                                    the countryside. Walking for pleasure developed in Europe during
                                    the eighteenth century. Religious pilgrimages have existed much
                                    longer but they involve walking long distances for a spiritual
                                    purpose associated with specific religions and also we achieve
                                    inner peace while we hike at a local park.
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

            {/* Add Board */}
            <div className="modal fade" id="add_board" ref={addBoardModalRef}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add New Board</h4>
                            <button
                                ref={addBoardCloseButtonRef}
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleAddBoardSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Board Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                    />
                                </div>
                                <label className="form-label">Board Color</label>
                                <div className="d-flex align-items-center flex-wrap row-gap-3">
                                    <div className="theme-colors mb-4">
                                        <ul className="d-flex align-items-center">
                                            {[
                                                { key: "purple", className: "bg-purple" },
                                                { key: "pink", className: "bg-pink" },
                                                { key: "blue", className: "bg-info" },
                                                { key: "yellow", className: "bg-warning" },
                                                { key: "green", className: "bg-success" },
                                                { key: "orange", className: "bg-orange" },
                                                { key: "red", className: "bg-danger" },
                                            ].map((c) => {
                                                const selected = newBoardColor === c.key;
                                                return (
                                                    <li key={c.key} className="text-center">
                                                        <button
                                                            type="button"
                                                            className="themecolorset border-0 bg-transparent p-0"
                                                            onClick={() => setNewBoardColor(c.key)}
                                                            title={c.key}
                                                            aria-pressed={selected}
                                                        >
                                                            <span
                                                                className={`primecolor ${c.className} d-inline-flex align-items-center justify-content-center`}
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '8px',
                                                                    border: selected ? '2px solid #111' : '1px solid #e0e0e0',
                                                                    boxShadow: selected ? '0 0 0 2px rgba(0,0,0,0.08)' : 'none',
                                                                }}
                                                            >
                                                                {selected && (
                                                                    <i className="ti ti-check text-white fs-14" />
                                                                )}
                                                            </span>
                                                        </button>
                                                        <small className="d-block mt-1 text-muted text-capitalize" style={{ fontSize: '11px' }}>
                                                            {c.key}
                                                        </small>
                                                    </li>
                                                );
                                            })}
                                        </ul>
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
                                <button type="submit" className="btn btn-primary" disabled={savingBoard}>
                                    {savingBoard ? "Saving..." : "Add New Board"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Add Board */}

            {/* Status Change Confirmation Modal */}
            {showStatusModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">Confirm Status Change</h4>
                                <button
                                    type="button"
                                    className="btn-close custom-btn-close"
                                    onClick={handleCancelStatusChange}
                                    aria-label="Close"
                                >
                                    <i className="ti ti-x" />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to change the status of <strong>{pendingStatusChange?.taskTitle}</strong> to <strong>{pendingStatusChange?.newStatus}</strong>?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light me-2"
                                    onClick={handleCancelStatusChange}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handleConfirmStatusChange}
                                >
                                    Confirm Change
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* /Status Change Confirmation Modal */}
        </>

    )
}

export default TaskBoard
