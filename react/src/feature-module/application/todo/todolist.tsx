import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TodoModal from "../../../core/modals/todoModal";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import { Socket } from "socket.io-client";
import Footer from "../../../core/common/footer";

const { RangePicker } = DatePicker;

interface Todo {
  _id: string;
  title: string;
  description?: string;
  priority: string;
  tag?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  assignedTo?: string;
}

interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

const Todo = () => {
  const socket = useSocket() as Socket | null;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoStats, setTodoStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    pending: 0,
    byPriority: { high: 0, medium: 0, low: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdDate");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([]);
  const [selectedTodoToDelete, setSelectedTodoToDelete] = useState<
    string | null
  >(null);
  const [selectedTodoToEdit, setSelectedTodoToEdit] = useState<Todo | null>(
    null
  );
  const [selectedTodoToView, setSelectedTodoToView] = useState<Todo | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const toggleTodo = async (todoId: string, currentCompleted: boolean) => {
    if (!socket) {
      console.error("Socket not available");
      return;
    }

    try {
      const updateData = {
        id: todoId,
        completed: !currentCompleted,
      };

      console.log("Updating todo completion status:", updateData);

      const handleResponse = (response: any) => {
        console.log("Update todo response received:", response);
        if (response.done) {
          console.log("Todo completion status updated successfully");
        } else {
          console.error("Failed to update todo:", response.error);
          setTodos((prevTodos) =>
            prevTodos.map((todo) =>
              todo._id === todoId
                ? { ...todo, completed: currentCompleted }
                : todo
            )
          );
        }
        if (socket) {
          socket.off("admin/dashboard/update-todo-response", handleResponse);
        }
      };

      // Optimistically update the UI
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo._id === todoId ? { ...todo, completed: !currentCompleted } : todo
        )
      );

      if (socket) {
        socket.on("admin/dashboard/update-todo-response", handleResponse);
        socket.emit("admin/dashboard/update-todo", updateData);
      }

      setTimeout(() => {
        console.error("Update todo request timed out");
        if (socket) {
          socket.off("admin/dashboard/update-todo-response", handleResponse);
        }
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo._id === todoId
              ? { ...todo, completed: currentCompleted }
              : todo
          )
        );
      }, 10000);
    } catch (error) {
      console.error("Error updating todo completion status:", error);
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo._id === todoId ? { ...todo, completed: currentCompleted } : todo
        )
      );
    }
  };

  // Fetch todos and statistics
  useEffect(() => {
    if (socket) {
      (socket as any).emit("admin/dashboard/get-todos", {
        filter: activeFilter,
      });
      (socket as any).on(
        "admin/dashboard/get-todos-response",
        (response: any) => {
          if (response.done) {
            const todosData = response.data || [];
            setTodos(todosData);

            // Extract unique tags
            const tags = Array.from(
              new Set(todosData.map((todo: Todo) => todo.tag).filter(Boolean))
            ) as string[];
            setAvailableTags(tags);

            // Extract unique assignees
            const assignees = Array.from(
              new Set(
                todosData
                  .map((todo: Todo) => todo.assignedTo || todo.userId)
                  .filter(Boolean)
              )
            ) as string[];
            setAvailableAssignees(assignees);
          }
          setLoading(false);
        }
      );

      // Fetch statistics
      (socket as any).emit("admin/dashboard/get-todo-statistics", {
        filter: activeFilter,
      });
      (socket as any).on(
        "admin/dashboard/get-todo-statistics-response",
        (response: any) => {
          console.log("Statistics response:", response);
          if (response.done) {
            setTodoStats(
              response.data || {
                total: 0,
                completed: 0,
                pending: 0,
                byPriority: { high: 0, medium: 0, low: 0 },
              }
            );
          } else {
            console.error("Statistics error:", response.error);
            setTodoStats({
              total: 0,
              completed: 0,
              pending: 0,
              byPriority: { high: 0, medium: 0, low: 0 },
            });
          }
        }
      );

      (socket as any).on(
        "admin/dashboard/delete-todo-response",
        (response: any) => {
          if (response.done) {
            console.log("Todo deleted successfully");
            (socket as any).emit("admin/dashboard/get-todos", {
              filter: activeFilter,
            });
            (socket as any).emit("admin/dashboard/get-todo-statistics", {
              filter: activeFilter,
            });
          } else {
            console.error("Delete failed:", response.error);
          }
        }
      );

      (socket as any).on(
        "admin/dashboard/add-todo-response",
        (response: any) => {
          if (response.done) {
            (socket as any).emit("admin/dashboard/get-todos", {
              filter: activeFilter,
            });
          }
        }
      );

      (socket as any).on(
        "admin/dashboard/update-todo-response",
        (response: any) => {
          if (response.done) {
            (socket as any).emit("admin/dashboard/get-todos", {
              filter: activeFilter,
            });
          }
        }
      );

      return () => {
        (socket as any).off("admin/dashboard/get-todos-response");
        (socket as any).off("admin/dashboard/get-todo-statistics-response");
        (socket as any).off("admin/dashboard/delete-todo-response");
        (socket as any).off("admin/dashboard/add-todo-response");
        (socket as any).off("admin/dashboard/update-todo-response");
      };
    }
  }, [socket, activeFilter]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setLoading(true);
  };

  const handlePriorityChange = (priority: string) => {
    setSelectedPriority(priority);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleAssigneeChange = (assignee: string) => {
    setSelectedAssignee(assignee);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRangeFilter(range);
  };

  const handleDueDateChange = (date: string | null) => {
    setDueDateFilter(date);
  };

  const handleCustomDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      const startDate = dates[0].format("YYYY-MM-DD");
      const endDate = dates[1].format("YYYY-MM-DD");
      console.log("Custom range changed:", { startDate, endDate });
      setCustomDateRange({ start: startDate, end: endDate });
      setDateRangeFilter("custom");
      setShowCustomRange(false);
    } else {
      setCustomDateRange(null);
      setDateRangeFilter("all");
    }
  };

  const handleCustomRangeClick = () => {
    setShowCustomRange(!showCustomRange);
  };

  const handleDeleteTodo = (todoId: string) => {
    if (socket && todoId) {
      console.log("Deleting todo:", todoId);
      (socket as any).emit("admin/dashboard/delete-todo", todoId);
      setSelectedTodoToDelete(null);
    } else {
      console.error("Cannot delete todo - socket or todoId missing");
    }
  };

  const handleDeleteClick = (todoId: string) => {
    console.log("Delete button clicked for todo:", todoId);
    const confirmed = window.confirm(
      "Are you sure you want to delete this todo? This action cannot be undone."
    );
    if (confirmed) {
      handleDeleteTodo(todoId);
    }
  };

  const handleEditClick = (todo: Todo) => {
    setSelectedTodoToEdit(todo);
    console.log("Edit todo clicked:", todo);
  };

  const handleViewClick = (todo: Todo) => {
    setSelectedTodoToView(todo);
    console.log("View todo clicked:", todo);
  };

  const handleTodoRefresh = () => {
    if (socket) {
      socket.emit("admin/dashboard/get-todos", { filter: activeFilter });
      socket.emit("admin/dashboard/get-todo-statistics", {
        filter: activeFilter,
      });
    }
  };

  // Helper function to get date range based on filter
  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: today,
        };
      case "last7days":
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "last30days":
        return {
          start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "thismonth":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
      case "lastmonth":
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 1),
        };
      case "thisyear":
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear() + 1, 0, 1),
        };
      case "custom":
        if (customDateRange && customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          endDate.setDate(endDate.getDate() + 1);
          console.log("Custom range applied:", {
            start: startDate,
            end: endDate,
          });
          return {
            start: startDate,
            end: endDate,
          };
        }
        return null;
      default:
        return null;
    }
  };

  // Get filtered todos based on current filters
  const getFilteredTodos = () => {
    let filteredTodos = todos.filter((todo) => {
      // Search filter
      const searchMatch =
        !searchQuery ||
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Priority filter
      const priorityMatch =
        selectedPriority === "all" ||
        todo.priority?.toLowerCase() === selectedPriority.toLowerCase();

      const tagMatch =
        selectedTag === "all" ||
        todo.tag?.toLowerCase() === selectedTag.toLowerCase();
      const assigneeMatch =
        selectedAssignee === "all" ||
        (todo.assignedTo || todo.userId) === selectedAssignee;

      let statusMatch = true;
      if (selectedStatus !== "all") {
        switch (selectedStatus.toLowerCase()) {
          case "completed":
            statusMatch = todo.completed === true;
            break;
          case "pending":
            statusMatch = todo.completed === false;
            break;
          case "inprogress":
            statusMatch = todo.completed === false;
            break;
          case "onhold":
            statusMatch = todo.completed === false;
            break;
        }
      }

      // Date range filter
      let dateRangeMatch = true;
      if (dateRangeFilter !== "all") {
        const dateRange = getDateRange(dateRangeFilter);
        if (dateRange) {
          const todoCreatedDate = new Date(todo.createdAt);
          dateRangeMatch =
            todoCreatedDate >= dateRange.start &&
            todoCreatedDate < dateRange.end;
          if (dateRangeFilter === "custom") {
            console.log("Custom filter check:", {
              todoCreatedDate,
              dateRange,
              dateRangeMatch,
              todoTitle: todo.title,
            });
          }
        }
      }

      // Due date filter
      let dueDateMatch = true;
      if (dueDateFilter) {
        if (todo.dueDate) {
          const todoDueDate = new Date(todo.dueDate);
          const filterDate = new Date(dueDateFilter);
          dueDateMatch =
            todoDueDate.toDateString() === filterDate.toDateString();
        } else {
          dueDateMatch = false;
        }
      }

      return (
        searchMatch &&
        priorityMatch &&
        tagMatch &&
        assigneeMatch &&
        statusMatch &&
        dateRangeMatch &&
        dueDateMatch
      );
    });

    // Sort todos
    filteredTodos.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[
              b.priority?.toLowerCase() as keyof typeof priorityOrder
            ] || 0) -
            (priorityOrder[
              a.priority?.toLowerCase() as keyof typeof priorityOrder
            ] || 0)
          );
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "createdDate":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return filteredTodos;
  };

  // Get todos by priority with additional filtering and sorting
  const getTodosByPriority = (priority: string) => {
    return getFilteredTodos().filter(
      (todo) => todo.priority?.toLowerCase() === priority.toLowerCase()
    );
  };

  // Calculate statistics from filtered todos
  const calculateStats = () => {
    const filteredTodos = getFilteredTodos();
    const total = filteredTodos.length;
    const completed = filteredTodos.filter((todo) => todo.completed).length;
    const pending = total - completed;

    const byPriority = {
      high: filteredTodos.filter(
        (todo) => todo.priority?.toLowerCase() === "high"
      ).length,
      medium: filteredTodos.filter(
        (todo) => todo.priority?.toLowerCase() === "medium"
      ).length,
      low: filteredTodos.filter(
        (todo) => todo.priority?.toLowerCase() === "low"
      ).length,
    };

    return { total, completed, pending, byPriority };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-purple";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-secondary";
    }
  };

  const getStatusBadgeClass = (completed: boolean) => {
    return completed
      ? "badge badge-soft-success d-inline-flex align-items-center"
      : "badge badge-soft-secondary d-inline-flex align-items-center";
  };

  const getTagBadgeClass = (tag: string) => {
    const tagColors: { [key: string]: string } = {
      projects: "badge-success",
      internal: "badge-danger",
      reminder: "badge-secondary",
      research: "bg-pink",
      meetings: "badge-purple",
      social: "badge-info",
      bugs: "badge-danger",
      animation: "badge-warning",
      security: "badge-danger",
      reports: "badge-info",
    };
    return tagColors[tag?.toLowerCase()] || "badge-secondary";
  };

  const getProgressPercentage = (todo: Todo) => {
    return todo.completed ? 100 : Math.floor(Math.random() * 90) + 10;
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return "bg-success";
    if (percentage >= 70) return "bg-purple";
    if (percentage >= 40) return "bg-warning";
    return "bg-danger";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "ti ti-alert-circle";
      case "medium":
        return "ti ti-alert-triangle";
      case "low":
        return "ti ti-info-circle";
      default:
        return "ti ti-circle";
    }
  };

  return (
    <>
      <>
        {/* Page Wrapper */}
        <div className="page-wrapper">
          <div className="content">
            {/* Breadcrumb */}
            <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
              <div className="my-auto mb-2">
                <h2 className="mb-1">Todo</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={all_routes.adminDashboard}>
                        <i className="ti ti-smart-home" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">Application</li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Todo
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                <div className="d-flex align-items-center border rounded p-1 me-2">
                  <button
                    className={`btn btn-icon btn-sm ${
                      viewMode === "list"
                        ? "active bg-primary text-white"
                        : ""
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    <i className="ti ti-list-tree" />
                  </button>
                  <button
                    className={`btn btn-icon btn-sm ${
                      viewMode === "grid"
                        ? "active bg-primary text-white"
                        : ""
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    <i className="ti ti-table" />
                  </button>
                </div>
                <div className="">
                  <Link
                    to="#"
                    className="btn btn-primary d-flex align-items-center"
                    data-bs-toggle="modal"
                    data-bs-target="#add_todo"
                    title="Create a new todo task"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Create New
                  </Link>
                </div>
                <div className="ms-2 mb-0 head-icons">
                  <CollapseHeader />
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row">
              <div className="col-xl-3 col-lg-6 col-md-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-fill">
                        <p className="text-muted mb-1">Total Tasks</p>
                        <h4 className="mb-0">{calculateStats().total}</h4>
                      </div>
                      <div className="avatar avatar-lg bg-primary-light rounded flex-shrink-0">
                        <i className="ti ti-checkbox fs-24 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-fill">
                        <p className="text-muted mb-1">Pending</p>
                        <h4 className="mb-0">{calculateStats().pending}</h4>
                      </div>
                      <div className="avatar avatar-lg bg-warning-light rounded flex-shrink-0">
                        <i className="ti ti-clock fs-24 text-warning" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-fill">
                        <p className="text-muted mb-1">Completed</p>
                        <h4 className="mb-0">{calculateStats().completed}</h4>
                      </div>
                      <div className="avatar avatar-lg bg-success-light rounded flex-shrink-0">
                        <i className="ti ti-check fs-24 text-success" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-fill">
                        <p className="text-muted mb-1">High Priority</p>
                        <h4 className="mb-0">{calculateStats().byPriority.high}</h4>
                      </div>
                      <div className="avatar avatar-lg bg-purple-light rounded flex-shrink-0">
                        <i className="ti ti-alert-circle fs-24 text-purple" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Card Structure for both Grid and List */}
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5 className="d-flex align-items-center">
                  Todo Lists{" "}
                  <span className="badge bg-soft-pink ms-2">
                    {getFilteredTodos().length} Todos
                  </span>
                </h5>
                
                {/* Searchbar */}
                <div className="input-icon-start position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Todo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="d-flex align-items-center flex-wrap row-gap-3">
                  {/* Date Range Filter */}
                  <div className="dropdown me-3">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {dateRangeFilter === "all"
                        ? "All Time"
                        : dateRangeFilter === "today"
                        ? "Today"
                        : dateRangeFilter === "yesterday"
                        ? "Yesterday"
                        : dateRangeFilter === "last7days"
                        ? "Last 7 Days"
                        : dateRangeFilter === "last30days"
                        ? "Last 30 Days"
                        : dateRangeFilter === "thismonth"
                        ? "This Month"
                        : dateRangeFilter === "lastmonth"
                        ? "Last Month"
                        : dateRangeFilter === "thisyear"
                        ? "This Year"
                        : dateRangeFilter === "custom"
                        ? customDateRange &&
                          customDateRange.start &&
                          customDateRange.end
                          ? `${customDateRange.start} to ${customDateRange.end}`
                          : "Custom Range"
                        : "All Time"}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "all" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("all");
                          }}
                        >
                          All Time
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "today" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("today");
                          }}
                        >
                          Today
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "yesterday" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("yesterday");
                          }}
                        >
                          Yesterday
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "last7days" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("last7days");
                          }}
                        >
                          Last 7 Days
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "last30days" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("last30days");
                          }}
                        >
                          Last 30 Days
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "thismonth" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("thismonth");
                          }}
                        >
                          This Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "lastmonth" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("lastmonth");
                          }}
                        >
                          Last Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "thisyear" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateRangeChange("thisyear");
                          }}
                        >
                          This Year
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            dateRangeFilter === "custom" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleCustomRangeClick();
                          }}
                        >
                          Custom Range
                        </Link>
                      </li>
                    </ul>
                  </div>
                  {showCustomRange && (
                    <div className="custom-range-picker p-2 border rounded bg-light me-3 d-inline-block">
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted">Select Range:</span>
                        <RangePicker
                          size="small"
                          format="DD-MM-YYYY"
                          placeholder={["Start Date", "End Date"]}
                          style={{ width: 200 }}
                          value={
                            customDateRange
                              ? [
                                  dayjs(customDateRange.start),
                                  dayjs(customDateRange.end),
                                ]
                              : null
                          }
                          onChange={handleCustomDateRangeChange}
                        />
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setShowCustomRange(false);
                            setCustomDateRange(null);
                            setDateRangeFilter("all");
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Due Date Filter */}
                  <div className="input-icon position-relative w-120 me-2 d-flex align-items-center">
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                    <DatePicker
                      className="form-control datetimepicker"
                      format="DD-MM-YYYY"
                      placeholder="Due Date"
                      value={dueDateFilter ? dayjs(dueDateFilter) : null}
                      onChange={(date: any) => {
                        if (date) {
                          const formattedDate = date.format("YYYY-MM-DD");
                          handleDueDateChange(formattedDate);
                        } else {
                          handleDueDateChange(null);
                        }
                      }}
                    />
                    {dueDateFilter && (
                      <button
                        type="button"
                        className="btn btn-sm btn-light border-0 ms-2 d-flex align-items-center justify-content-center"
                        onClick={() => handleDueDateChange(null)}
                        title="Clear due date filter"
                        style={{
                          fontSize: "14px",
                          width: "28px",
                          height: "28px",
                          padding: "0",
                          lineHeight: "1",
                          borderRadius: "50%",
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #dee2e6",
                          color: "#6c757d",
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLButtonElement;
                          target.style.backgroundColor = "#e9ecef";
                          target.style.color = "#495057";
                          target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLButtonElement;
                          target.style.backgroundColor = "#f8f9fa";
                          target.style.color = "#6c757d";
                          target.style.transform = "scale(1)";
                        }}
                      >
                        <i className="ti ti-x" style={{ fontSize: "12px" }}></i>
                      </button>
                    )}
                  </div>

                  {/* Priority Filter - Hidden in Grid View */}
                  {viewMode === "list" && (
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {selectedPriority === "all" ? "Priority" : selectedPriority}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedPriority === "all" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePriorityChange("all");
                          }}
                        >
                          All Priority
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedPriority === "high" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePriorityChange("high");
                          }}
                        >
                          High
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedPriority === "medium" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePriorityChange("medium");
                          }}
                        >
                          Medium
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedPriority === "low" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePriorityChange("low");
                          }}
                        >
                          Low
                        </Link>
                      </li>
                    </ul>
                  </div>
                  )}

                  {/* Tags Filter */}
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {selectedTag === "all" ? "Tags" : selectedTag}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedTag === "all" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleTagChange("all");
                          }}
                        >
                          All Tags
                        </Link>
                      </li>
                      {availableTags.map((tag) => (
                        <li key={tag}>
                          <Link
                            to="#"
                            className={`dropdown-item rounded-1 ${
                              selectedTag === tag ? "active" : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleTagChange(tag);
                            }}
                          >
                            {tag}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Assignee Filter */}
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {selectedAssignee === "all"
                        ? "Assignee"
                        : selectedAssignee}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedAssignee === "all" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleAssigneeChange("all");
                          }}
                        >
                          All Assignees
                        </Link>
                      </li>
                      {availableAssignees.map((assignee) => (
                        <li key={assignee}>
                          <Link
                            to="#"
                            className={`dropdown-item rounded-1 ${
                              selectedAssignee === assignee ? "active" : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleAssigneeChange(assignee);
                            }}
                          >
                            {assignee}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Status Filter */}
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {selectedStatus === "all"
                        ? "Select Status"
                        : selectedStatus}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedStatus === "all" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange("all");
                          }}
                        >
                          All Status
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedStatus === "completed" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange("completed");
                          }}
                        >
                          Completed
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedStatus === "pending" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange("pending");
                          }}
                        >
                          Pending
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedStatus === "inprogress" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange("inprogress");
                          }}
                        >
                          Inprogress
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            selectedStatus === "onhold" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange("onhold");
                          }}
                        >
                          Onhold
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Sort By */}
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center fs-12"
                      data-bs-toggle="dropdown"
                    >
                      <span className="fs-12 d-inline-flex me-1">
                        Sort By :{" "}
                      </span>
                      {sortBy === "createdDate"
                        ? "Date Created"
                        : sortBy === "dueDate"
                        ? "Due Date"
                        : sortBy === "priority"
                        ? "Priority"
                        : "Date Created"}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            sortBy === "createdDate" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSortChange("createdDate");
                          }}
                        >
                          Date Created
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            sortBy === "dueDate" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSortChange("dueDate");
                          }}
                        >
                          Due Date
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${
                            sortBy === "priority" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSortChange("priority");
                          }}
                        >
                          Priority
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card Body - Conditional Grid/List View */}
              <div className="card-body">
                {viewMode === "grid" ? (
                  // Grid View - 3 Columns by Priority
                  loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="row">
                      {["high", "medium", "low"].map((priority) => {
                        const priorityTodos = getTodosByPriority(priority);
                        return (
                          <div key={priority} className="col-lg-4 col-md-6">
                            <div className="mb-3">
                              <div className="d-flex align-items-center mb-3">
                                <span>
                                  <i
                                    className={`${getPriorityIcon(priority)} ${getPriorityColor(
                                      priority
                                    )} me-2 fs-20`}
                                  />
                                </span>
                                <h5 className="fw-semibold text-capitalize mb-0">
                                  {priority}
                                </h5>
                                <span className="badge bg-light rounded-pill ms-2">
                                  {priorityTodos.length}
                                </span>
                              </div>
                              <div className="todo-grid-list">
                                {priorityTodos.length === 0 ? (
                                  <div className="text-center py-4 text-muted">
                                    No {priority} priority todos
                                  </div>
                                ) : (
                                  priorityTodos.map((todo) => (
                                    <div
                                      key={todo._id}
                                      className="card shadow-sm mb-3"
                                    >
                                      <div className="card-body">
                                        <div className="d-flex align-items-start justify-content-between mb-2">
                                          <div className="d-flex align-items-center flex-grow-1">
                                            <div 
                                              className="form-check form-check-md me-2"
                                            >
                                              <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={todo.completed}
                                                onChange={() =>
                                                  toggleTodo(todo._id, todo.completed)
                                                }
                                              />
                                            </div>
                                            <i
                                              className={`${getPriorityIcon(
                                                todo.priority
                                              )} ${getPriorityColor(
                                                todo.priority
                                              )} me-2`}
                                            />
                                          </div>
                                          <div 
                                            className="dropdown"
                                          >
                                            <Link
                                              to="#"
                                              className="d-inline-flex align-items-center"
                                              data-bs-toggle="dropdown"
                                              onClick={(e) => e.preventDefault()}
                                            >
                                              <i className="ti ti-dots-vertical" />
                                            </Link>
                                            <ul className="dropdown-menu dropdown-menu-end p-3">
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-bs-target="#edit-note-units"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    handleEditClick(todo);
                                                  }}
                                                >
                                                  <i className="ti ti-edit me-2" />
                                                  Edit
                                                </Link>
                                              </li>
                                              <li>
                                                <button
                                                  type="button"
                                                  className="dropdown-item rounded-1 border-0 bg-transparent w-100 text-start"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDeleteClick(todo._id);
                                                  }}
                                                >
                                                  <i className="ti ti-trash me-2" />
                                                  Delete
                                                </button>
                                              </li>
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-bs-target="#view-note-units"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    handleViewClick(todo);
                                                  }}
                                                >
                                                  <i className="ti ti-eye me-2" />
                                                  View
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                        <h6 
                                          className={`mb-2 ${todo.completed ? "text-decoration-line-through text-muted" : ""}`}
                                          style={{ cursor: "pointer" }}
                                          data-bs-toggle="modal"
                                          data-bs-target="#view-note-units"
                                          onClick={() => handleViewClick(todo)}
                                        >
                                          {todo.title}
                                        </h6>
                                        {todo.description && (
                                          <p className="text-muted small mb-2">
                                            {todo.description.length > 100
                                              ? todo.description.substring(0, 100) + "..."
                                              : todo.description}
                                          </p>
                                        )}
                                        <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                                          {todo.tag && (
                                            <span
                                              className={`badge ${getTagBadgeClass(
                                                todo.tag
                                              )} me-2`}
                                            >
                                              {todo.tag}
                                            </span>
                                          )}
                                          {todo.dueDate && (
                                            <span className="badge bg-transparent-dark text-dark rounded-pill">
                                              <i className="ti ti-calendar me-1" />
                                              {formatDate(todo.dueDate)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between">
                                          <span
                                            className={`${getStatusBadgeClass(
                                              todo.completed
                                            )}`}
                                          >
                                            <i className="fas fa-circle fs-6 me-1" />
                                            {todo.completed ? "Completed" : "Pending"}
                                          </span>
                                          <div className="avatar-list-stacked avatar-group-sm">
                                            <span className="avatar avatar-rounded">
                                              <ImageWithBasePath
                                                className="border border-white"
                                                src="assets/img/profiles/avatar-13.jpg"
                                                alt="img"
                                              />
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  // List View - Table
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table datatable">
                      <thead className="thead-light">
                        <tr>
                          <th className="no-sort">
                            <div className="form-check form-check-md">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="select-all"
                              />
                            </div>
                          </th>
                          <th style={{ width: "250px" }}>To Do</th>
                          <th>Tags</th>
                          <th>Assignee</th>
                          <th>Created On</th>
                          <th>Progress</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th className="no-sort">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={9} className="text-center py-4">
                              <div className="spinner-border" role="status">
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : getFilteredTodos().length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="text-center py-4 text-muted"
                            >
                              No todos found.
                            </td>
                          </tr>
                        ) : (
                          getFilteredTodos().map((todo: Todo, index: number) => {
                            const progressPercentage =
                              getProgressPercentage(todo);
                            return (
                              <tr 
                                key={todo._id}
                              >
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="form-check form-check-md">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() =>
                                          toggleTodo(todo._id, todo.completed)
                                        }
                                      />
                                    </div>
                                    <span className="mx-2 d-flex align-items-center">
                                      <i
                                        className={`${getPriorityIcon(
                                          todo.priority
                                        )} ${getPriorityColor(
                                          todo.priority
                                        )}`}
                                      />
                                    </span>
                                  </div>
                                </td>
                                <td style={{ maxWidth: "250px" }}>
                                  <p 
                                    className="fw-medium text-dark text-truncate mb-0" 
                                    style={{ maxWidth: "250px", cursor: "pointer" }}
                                    data-bs-toggle="modal"
                                    data-bs-target="#view-note-units"
                                    onClick={() => handleViewClick(todo)}
                                  >
                                    {todo.title}
                                  </p>
                                </td>
                                <td>
                                  {todo.tag && (
                                    <span
                                      className={`badge ${getTagBadgeClass(
                                        todo.tag
                                      )}`}
                                    >
                                      {todo.tag}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div className="avatar-list-stacked avatar-group-sm">
                                    <span className="avatar avatar-rounded">
                                      <ImageWithBasePath
                                        className="border border-white"
                                        src="assets/img/profiles/avatar-19.jpg"
                                        alt="img"
                                      />
                                    </span>
                                  </div>
                                </td>
                                <td>{formatDate(todo.createdAt)}</td>
                                <td>
                                  <span className="d-block mb-1">
                                    Progress : {progressPercentage}%
                                  </span>
                                  <div
                                    className="progress progress-xs flex-grow-1 mb-2"
                                    style={{ width: 190 }}
                                  >
                                    <div
                                      className={`progress-bar ${getProgressBarColor(
                                        progressPercentage
                                      )} rounded`}
                                      role="progressbar"
                                      style={{ width: `${progressPercentage}%` }}
                                      aria-valuenow={progressPercentage}
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                    />
                                  </div>
                                </td>
                                <td>
                                  {todo.dueDate ? formatDate(todo.dueDate) : "-"}
                                </td>
                                <td>
                                  <span
                                    className={`${getStatusBadgeClass(
                                      todo.completed
                                    )}`}
                                  >
                                    <i className="ti ti-circle-filled fs-5 me-1" />
                                    {todo.completed ? "Completed" : "Pending"}
                                  </span>
                                </td>
                                <td>
                                  <div className="dropdown">
                                    <Link
                                      to="#"
                                      className="d-inline-flex align-items-center"
                                      data-bs-toggle="dropdown"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <i className="ti ti-dots-vertical" />
                                    </Link>
                                    <ul className="dropdown-menu dropdown-menu-end p-3">
                                      <li>
                                        <Link
                                          to="#"
                                          className="dropdown-item rounded-1"
                                          data-bs-toggle="modal"
                                          data-bs-target="#edit-note-units"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleEditClick(todo);
                                          }}
                                          title="Edit todo"
                                        >
                                          <i className="ti ti-edit me-2" />
                                          Edit
                                        </Link>
                                      </li>
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item rounded-1 border-0 bg-transparent w-100 text-start"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteClick(todo._id);
                                          }}
                                          title="Delete todo"
                                        >
                                          <i className="ti ti-trash me-2" />
                                          Delete
                                        </button>
                                      </li>
                                      <li>
                                        <Link
                                          to="#"
                                          className="dropdown-item rounded-1"
                                          data-bs-toggle="modal"
                                          data-bs-target="#view-note-units"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleViewClick(todo);
                                          }}
                                          title="View todo"
                                        >
                                          <i className="ti ti-eye me-2" />
                                          View
                                        </Link>
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Footer />
        </div>
        {/* /Page Wrapper */}
      </>

      <TodoModal
        onTodoAdded={handleTodoRefresh}
        selectedTodoToDelete={selectedTodoToDelete}
        onDeleteTodo={handleDeleteTodo}
        selectedTodoToEdit={selectedTodoToEdit}
        onTodoUpdated={handleTodoRefresh}
        selectedTodoToView={selectedTodoToView}
      />
    </>
  );
};

export default Todo;
