import { DatePicker, message } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import Table from "../../../core/common/dataTable/index";
import Footer from "../../../core/common/footer";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useAuth } from "../../../hooks/useAuth";
import { useProjectsREST } from "../../../hooks/useProjectsREST";
import { TimeEntry, useTimeTrackingREST } from "../../../hooks/useTimeTrackingREST";

interface FormData {
  projectId: string;
  taskId?: string;
  description: string;
  duration: string;
  date: string;
  billable: boolean;
  billRate?: string;
}

const TimeSheet = () => {
  // Role-based access control
  const { role, employeeId, userId: clerkUserId } = useAuth();
  const isEmployeeOrManager = ['employee', 'manager'].includes(role);
  const canManageTimesheet = ['admin', 'hr', 'superadmin'].includes(role);

  // API Hooks
  const {
    timeEntries,
    loading,
    error,
    fetchTimeEntries,
    getTimeEntriesByUser,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    submitTimesheet,
    approveTimesheet,
    rejectTimesheet,
    stats,
    fetchStats
  } = useTimeTrackingREST();

  const { projects, fetchProjects, getMyProjects } = useProjectsREST();

  // State
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    projectId: "",
    taskId: "",
    description: "",
    duration: "",
    date: new Date().toISOString().split('T')[0],
    billable: false,
    billRate: ""
  });

  // Phase 2: Submit state
  const [submitting, setSubmitting] = useState(false);

  // Phase 3: Approve/Reject state
  const [rejectEntryId, setRejectEntryId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  // Phase 4: Status filter tab — HR/Admin defaults to "Submitted" so they see pending approvals immediately
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Auto-switch HR to "Submitted" tab once role is resolved and data is loaded
  useEffect(() => {
    if (canManageTimesheet && !loading) {
      setStatusFilter('Submitted');
    }
  // Only run once when the role is resolved (not on every loading change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageTimesheet]);

  // Helper to re-fetch entries
  const refetchEntries = useCallback(() => {
    const userIdForApi = clerkUserId || employeeId;
    if (isEmployeeOrManager && userIdForApi) {
      getTimeEntriesByUser(userIdForApi, { page: 1, limit: 50, ...dateRange });
    } else {
      fetchTimeEntries({ page: 1, limit: 50, ...dateRange });
    }
  }, [clerkUserId, employeeId, isEmployeeOrManager, dateRange, getTimeEntriesByUser, fetchTimeEntries]);

  // Fetch data on mount
  useEffect(() => {
    // Phase 1: Load only assigned projects for employees; all projects for HR/admin
    if (isEmployeeOrManager) {
      getMyProjects();
    } else {
      fetchProjects();
    }

    const userIdForApi = clerkUserId || employeeId;
    if (isEmployeeOrManager && userIdForApi) {
      getTimeEntriesByUser(userIdForApi, { page: 1, limit: 50, ...dateRange });
      fetchStats({ userId: userIdForApi });
    } else {
      fetchTimeEntries({ page: 1, limit: 50, ...dateRange });
      fetchStats();
    }
  }, [dateRange, isEmployeeOrManager, employeeId, clerkUserId, fetchStats, fetchTimeEntries, getTimeEntriesByUser, getMyProjects, fetchProjects]);

  // Build table columns — differs by role
  const buildActionsColumn = () => ({
    title: "Actions",
    dataIndex: "actions",
    render: (_: any, record: TimeEntry) => {
      if (canManageTimesheet) {
        // HR/Admin: Approve / Reject for Submitted; Edit/Delete for Draft
        return (
          <div className="action-icon d-inline-flex align-items-center gap-1">
            {record.status === 'Submitted' && (
              <>
                <button
                  className="btn btn-sm btn-success py-0 px-2"
                  title="Approve"
                  onClick={() => handleApprove(record._id, record.userId)}
                  disabled={approving === record._id}
                >
                  {approving === record._id
                    ? <span className="spinner-border spinner-border-sm" />
                    : <><i className="ti ti-check me-1" />Approve</>
                  }
                </button>
                <button
                  className="btn btn-sm btn-danger py-0 px-2"
                  title="Reject"
                  onClick={() => { setRejectEntryId(record._id); setRejectReason(''); }}
                  data-bs-toggle="modal"
                  data-bs-target="#reject_modal"
                >
                  <i className="ti ti-x me-1" />Reject
                </button>
              </>
            )}
            {record.status === 'Draft' && (
              <>
                <Link
                  to="#"
                  className="me-2"
                  onClick={() => handleEdit(record)}
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#edit_timesheet"
                  title="Edit"
                >
                  <i className="ti ti-edit" />
                </Link>
                <Link
                  to="#"
                  onClick={() => setDeleteEntryId(record._id)}
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#delete_modal"
                  title="Delete"
                >
                  <i className="ti ti-trash" />
                </Link>
              </>
            )}
            {(record.status === 'Approved' || record.status === 'Rejected') && (
              <span className="text-muted fs-12">—</span>
            )}
          </div>
        );
      }

      // Employee/Manager: Submit per row for Draft; Edit/Delete for Draft; nothing for others
      return (
        <div className="action-icon d-inline-flex align-items-center gap-1">
          {record.status === 'Draft' && (
            <>
              <Link
                to="#"
                className="me-2"
                onClick={() => handleSubmitSingle(record._id)}
                title="Submit for approval"
              >
                <i className="ti ti-send" />
              </Link>
              <Link
                to="#"
                className="me-2"
                onClick={() => handleEdit(record)}
                data-bs-toggle="modal"
                data-inert={true}
                data-bs-target="#edit_timesheet"
                title="Edit"
              >
                <i className="ti ti-edit" />
              </Link>
              <Link
                to="#"
                onClick={() => setDeleteEntryId(record._id)}
                data-bs-toggle="modal"
                data-inert={true}
                data-bs-target="#delete_modal"
                title="Delete"
              >
                <i className="ti ti-trash" />
              </Link>
            </>
          )}
          {record.status === 'Rejected' && (
            <Link
              to="#"
              className="me-2"
              onClick={() => handleEdit(record)}
              data-bs-toggle="modal"
              data-inert={true}
              data-bs-target="#edit_timesheet"
              title="Edit and re-submit"
            >
              <i className="ti ti-edit text-danger" />
            </Link>
          )}
          {(record.status === 'Submitted' || record.status === 'Approved') && (
            <span className="text-muted fs-12">—</span>
          )}
        </div>
      );
    }
  });

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (text: string, record: TimeEntry) => {
        const name = record.userDetails?.firstName && record.userDetails?.lastName
          ? `${record.userDetails.firstName} ${record.userDetails.lastName}`
          : null;
        const empId = record.userDetails?.employeeId;
        const avatarSrc = record.userDetails?.avatar || 'assets/img/users/user-default.jpg';
        return (
          <div className="d-flex align-items-center file-name-icon">
            <Link to="#" className="avatar avatar-md border avatar-rounded">
              <ImageWithBasePath
                src={avatarSrc}
                className="img-fluid"
                alt={name || 'Employee'}
              />
            </Link>
            <div className="ms-2">
              <h6 className="fw-medium">
                <Link to="#">{name || <span className="text-muted fst-italic">Unknown Employee</span>}</Link>
              </h6>
              <span className="fs-12 fw-normal">{empId || <span className="text-muted">N/A</span>}</span>
            </div>
          </div>
        );
      },
      sorter: (a: TimeEntry, b: TimeEntry) => (a.userDetails?.firstName || '').localeCompare(b.userDetails?.firstName || ''),
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a: TimeEntry, b: TimeEntry) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "Project",
      dataIndex: "projectDetails",
      render: (project: any) => (
        <p className="fs-14 fw-medium text-gray-9 d-flex align-items-center">
          {project?.name || 'Unknown Project'}
        </p>
      ),
      sorter: (a: TimeEntry, b: TimeEntry) => (a.projectDetails?.name || '').localeCompare(b.projectDetails?.name || ''),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string) => (
        <p className="fs-14 fw-medium text-gray-9" style={{ maxWidth: 250 }}>
          {text || '-'}
        </p>
      ),
    },
    {
      title: "Hours",
      dataIndex: "duration",
      render: (duration: number) => `${duration}h`,
      sorter: (a: TimeEntry, b: TimeEntry) => (a.duration || 0) - (b.duration || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string, record: TimeEntry) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          'Draft':     { color: 'bg-secondary', text: 'Draft' },
          'Submitted': { color: 'bg-info',      text: 'Submitted' },
          'Approved':  { color: 'bg-success',   text: 'Approved' },
          'Rejected':  { color: 'bg-danger',    text: 'Rejected' }
        };
        const config = statusConfig[status] || statusConfig['Draft'];
        return (
          <div>
            <span className={`badge ${config.color} rounded-1`}>{config.text}</span>
            {status === 'Rejected' && record.rejectionReason && (
              <small className="d-block text-danger mt-1" style={{ maxWidth: 180 }}>
                {record.rejectionReason}
              </small>
            )}
          </div>
        );
      },
      sorter: (a: TimeEntry, b: TimeEntry) => a.status.localeCompare(b.status),
    },
    buildActionsColumn(),
  ];

  // Build project options for dropdowns
  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return projects.map(p => ({ value: p._id, label: p.name }));
  }, [projects]);

  // Entries filtered by active tab
  const displayedEntries = useMemo(() => {
    if (statusFilter === 'all') return timeEntries;
    return timeEntries.filter(e => e.status === statusFilter);
  }, [timeEntries, statusFilter]);

  // Handle form input change
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
    }
  };

  // Handle project filter change
  const handleProjectFilter = (value: string) => {
    setSelectedProject(value);
    if (value) {
      fetchTimeEntries({ page: 1, limit: 50, projectId: value });
    } else {
      fetchTimeEntries({ page: 1, limit: 50 });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      projectId: selectedProject || "",
      taskId: "",
      description: "",
      duration: "",
      date: new Date().toISOString().split('T')[0],
      billable: false,
      billRate: ""
    });
    setEditingEntry(null);
  };

  // Handle edit click
  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      projectId: entry.projectId,
      taskId: entry.taskId || "",
      description: entry.description,
      duration: entry.duration.toString(),
      date: new Date(entry.date).toISOString().split('T')[0],
      billable: entry.billable,
      billRate: entry.billRate?.toString() || ""
    });
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      message.error('Please select a project');
      return;
    }
    if (!formData.description || formData.description.trim().length < 5) {
      message.error('Description must be at least 5 characters');
      return;
    }
    if (!formData.duration || parseFloat(formData.duration) < 0.25) {
      message.error('Duration must be at least 0.25 hours');
      return;
    }
    if (!formData.date) {
      message.error('Please select a date');
      return;
    }

    const entryData = {
      projectId: formData.projectId,
      taskId: formData.taskId || undefined,
      description: formData.description.trim(),
      duration: parseFloat(formData.duration),
      date: new Date(formData.date).toISOString(),
      billable: formData.billable,
      billRate: formData.billRate ? parseFloat(formData.billRate) : undefined
    };

    let success = false;
    if (editingEntry) {
      success = await updateTimeEntry(editingEntry._id, entryData);
    } else {
      success = await createTimeEntry(entryData);
    }

    if (success) {
      const modalId = editingEntry ? 'edit_timesheet' : 'add_timesheet';
      const modalElement = document.getElementById(modalId);
      const bootstrapModal = (window as any).bootstrap;
      if (bootstrapModal && modalElement) {
        const modal = bootstrapModal.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
      resetForm();
    }
  };

  // Phase 2: Submit all draft entries
  const handleSubmitAll = async () => {
    const draftIds = timeEntries.filter(e => e.status === 'Draft').map(e => e._id);
    if (draftIds.length === 0) {
      message.warning('No draft entries to submit');
      return;
    }
    setSubmitting(true);
    const success = await submitTimesheet(draftIds);
    setSubmitting(false);
    if (success) refetchEntries();
  };

  // Phase 2: Submit a single entry
  const handleSubmitSingle = async (entryId: string) => {
    const success = await submitTimesheet([entryId]);
    if (success) refetchEntries();
  };

  // Phase 3: Approve a single entry
  const handleApprove = async (entryId: string, userId: string) => {
    setApproving(entryId);
    const success = await approveTimesheet(userId, [entryId]);
    setApproving(null);
    if (success) refetchEntries();
  };

  // Phase 3: Confirm rejection
  const handleRejectConfirm = async () => {
    if (!rejectEntryId) return;
    if (!rejectReason.trim()) {
      message.error('Please enter a rejection reason');
      return;
    }
    const entry = timeEntries.find(e => e._id === rejectEntryId);
    const success = await rejectTimesheet(entry?.userId || '', [rejectEntryId], rejectReason);
    if (success) {
      setRejectEntryId(null);
      setRejectReason('');
      refetchEntries();
    }
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (deleteEntryId) {
      const success = await deleteTimeEntry(deleteEntryId);
      if (success) {
        setDeleteEntryId(null);
        const modalElement = document.getElementById('delete_modal');
        const bootstrapModal = (window as any).bootstrap;
        if (bootstrapModal && modalElement) {
          const modal = bootstrapModal.Modal.getInstance(modalElement);
          if (modal) modal.hide();
        }
      }
    }
  };

  // Calculate stats
  const totalHours = stats?.totalHours ?? timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableHours = stats?.billableHours ?? timeEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalEntriesCount = stats?.totalEntries ?? timeEntries.length;
  const draftCount = stats?.draftEntries ?? timeEntries.filter(e => e.status === 'Draft').length;
  const submittedCount = stats?.submittedEntries ?? timeEntries.filter(e => e.status === 'Submitted').length;
  const approvedCount = stats?.approvedEntries ?? timeEntries.filter(e => e.status === 'Approved').length;
  const rejectedCount = timeEntries.filter(e => e.status === 'Rejected').length;

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Timesheets</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="index.html">
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Timesheets
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
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
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Phase 2: Submit All Drafts button — visible to employees/managers when drafts exist */}
              {isEmployeeOrManager && draftCount > 0 && (
                <div className="me-2 mb-2">
                  <button
                    className="btn btn-warning d-flex align-items-center"
                    onClick={handleSubmitAll}
                    disabled={submitting}
                  >
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                      : <><i className="ti ti-send me-2" />Submit {draftCount} Draft{draftCount > 1 ? 's' : ''}</>
                    }
                  </button>
                </div>
              )}
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#add_timesheet"
                  className="btn btn-primary d-flex align-items-center"
                  onClick={() => resetForm()}
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Today's Work
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Stats Cards */}
          <div className="row g-3 mb-3">
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-1">Total Hours</h6>
                  <h4 className="mb-0">{totalHours.toFixed(1)}h</h4>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-1">Billable Hours</h6>
                  <h4 className="mb-0">{billableHours.toFixed(1)}h</h4>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-1">Total Entries</h6>
                  <h4 className="mb-0">{totalEntriesCount}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-1">Status Breakdown</h6>
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    <span className="badge bg-secondary rounded-1">{draftCount} Draft</span>
                    <span className="badge bg-info rounded-1">{submittedCount} Submitted</span>
                    <span className="badge bg-success rounded-1">{approvedCount} Approved</span>
                    <span className="badge bg-danger rounded-1">{rejectedCount} Rejected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HR/Admin: Pending Approvals Banner */}
          {canManageTimesheet && submittedCount > 0 && (
            <div
              className="alert alert-warning d-flex align-items-center justify-content-between mb-3 cursor-pointer"
              style={{ cursor: 'pointer' }}
              onClick={() => setStatusFilter('Submitted')}
            >
              <div>
                <i className="ti ti-clock-exclamation me-2 fs-5" />
                <strong>{submittedCount} timesheet entr{submittedCount > 1 ? 'ies' : 'y'} pending your approval.</strong>
                <span className="ms-2 text-muted">Click here or select the "Submitted" tab to review.</span>
              </div>
              <i className="ti ti-arrow-right fs-5" />
            </div>
          )}
          {canManageTimesheet && submittedCount === 0 && !loading && (
            <div className="alert alert-info d-flex align-items-center mb-3">
              <i className="ti ti-info-circle me-2 fs-5" />
              <span>No pending approvals. <strong>Approve / Reject</strong> buttons appear on rows with <strong>Submitted</strong> status once employees submit their drafts.</span>
            </div>
          )}

          {/* Timesheet Entries Table */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Timesheet Entries</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                {/* Project filter — visible to HR/Admin */}
                {canManageTimesheet && (
                  <div className="dropdown me-3">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {selectedProject
                        ? projectOptions.find(p => p.value === selectedProject)?.label || 'Select Project'
                        : 'Select Project'
                      }
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => handleProjectFilter('')}
                        >
                          All Projects
                        </Link>
                      </li>
                      {projectOptions.map(project => (
                        <li key={project.value}>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                            onClick={() => handleProjectFilter(project.value)}
                          >
                            {project.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-filter me-1" />
                    Filter by Date
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setDateRange({})}>
                        All Time
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setDateRange({
                        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0]
                      })}>
                        Last 7 Days
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => setDateRange({
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0]
                      })}>
                        Today
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => {
                        const now = new Date();
                        setDateRange({
                          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString().split('T')[0]
                        });
                      }}>
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => {
                        const now = new Date();
                        setDateRange({
                          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
                          endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString().split('T')[0]
                        });
                      }}>
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => {
                        const now = new Date();
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        setDateRange({
                          startDate: startOfWeek.toISOString().split('T')[0],
                          endDate: endOfWeek.toISOString().split('T')[0]
                        });
                      }}>
                        This Week
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Phase 4: Status filter tabs */}
            <div className="card-header border-top-0 pt-0 pb-0">
              <ul className="nav nav-tabs card-header-tabs">
                {[
                  { key: 'all',       label: 'All',       count: totalEntriesCount,  badge: '' },
                  { key: 'Draft',     label: 'Draft',     count: draftCount,         badge: 'bg-secondary' },
                  { key: 'Submitted', label: 'Submitted', count: submittedCount,     badge: 'bg-info' },
                  { key: 'Approved',  label: 'Approved',  count: approvedCount,      badge: 'bg-success' },
                  { key: 'Rejected',  label: 'Rejected',  count: rejectedCount,      badge: 'bg-danger' },
                ].map(tab => (
                  <li key={tab.key} className="nav-item">
                    <button
                      className={`nav-link ${statusFilter === tab.key ? 'active' : ''}`}
                      onClick={() => setStatusFilter(tab.key)}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`badge ms-1 ${statusFilter === tab.key ? 'bg-primary' : tab.badge || 'bg-secondary'} rounded-pill`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2">Loading timesheets...</p>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <p className="text-danger">{error}</p>
                </div>
              ) : displayedEntries.length === 0 ? (
                <div className="text-center py-5">
                  <i className={`ti fs-1 mb-2 d-block text-muted ${
                    statusFilter === 'Submitted' ? 'ti-clock' :
                    statusFilter === 'Approved'  ? 'ti-circle-check' :
                    statusFilter === 'Rejected'  ? 'ti-circle-x' :
                    statusFilter === 'Draft'     ? 'ti-file-text' : 'ti-list'
                  }`} />
                  <p className="text-muted mb-1">
                    {statusFilter === 'Submitted' && canManageTimesheet
                      ? 'No entries pending approval.'
                      : statusFilter === 'Submitted' && !canManageTimesheet
                      ? 'No submitted entries. Use the send icon (→) on a Draft row to submit for approval.'
                      : statusFilter === 'all'
                      ? 'No time entries found. Click "Add Today\'s Work" to create one.'
                      : `No ${statusFilter} entries found.`
                    }
                  </p>
                  {statusFilter === 'Submitted' && canManageTimesheet && (
                    <small className="text-muted">
                      Employees must submit their Draft entries first.<br />
                      <strong>Approve / Reject</strong> buttons will appear here once entries are submitted.
                    </small>
                  )}
                </div>
              ) : (
                <>
                  {canManageTimesheet && statusFilter === 'Submitted' && (
                    <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center gap-3">
                      <small className="text-muted">
                        <i className="ti ti-info-circle me-1" />
                        Actions for submitted entries:
                      </small>
                      <span className="badge bg-success rounded-1">✓ Approve</span>
                      <span className="text-muted">— accepts the entry</span>
                      <span className="badge bg-danger rounded-1">✕ Reject</span>
                      <span className="text-muted">— returns to employee with a reason</span>
                    </div>
                  )}
                  <Table dataSource={displayedEntries} columns={columns} Selection={false} />
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
      {/* /Page Wrapper */}

      {/* Add Timesheet Modal */}
      <div className="modal fade" id="add_timesheet">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Today's Work</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Project <span className="text-danger">*</span>
                        {isEmployeeOrManager && (
                          <span className="text-muted ms-2 fs-12">(Your assigned projects)</span>
                        )}
                      </label>
                      <select
                        className="form-control"
                        value={formData.projectId}
                        onChange={(e) => handleInputChange('projectId', e.target.value)}
                        required
                      >
                        <option value="">Select Project</option>
                        {projectOptions.length === 0 && (
                          <option disabled>No assigned projects found</option>
                        )}
                        {projectOptions.map(project => (
                          <option key={project.value} value={project.value}>{project.label}</option>
                        ))}
                      </select>
                      {isEmployeeOrManager && projectOptions.length === 0 && (
                        <small className="text-warning">You are not assigned to any active projects.</small>
                      )}
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe what you worked on..."
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Date <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="DD-MM-YYYY"
                        value={formData.date ? dayjs(formData.date) : null}
                        onChange={(date) => handleInputChange('date', date ? date.toISOString() : '')}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Hours <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        step="0.25"
                        min="0.25"
                        max="24"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        required
                      />
                      <small className="text-muted">Minimum 0.25 hours (15 minutes)</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Billable</label>
                      <select
                        className="form-control"
                        value={formData.billable ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('billable', e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Bill Rate ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={formData.billRate}
                        onChange={(e) => handleInputChange('billRate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Time Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Timesheet Modal */}
      <div className="modal fade" id="edit_timesheet">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Time Entry</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Project <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={formData.projectId}
                        onChange={(e) => handleInputChange('projectId', e.target.value)}
                        required
                      >
                        <option value="">Select Project</option>
                        {projectOptions.map(project => (
                          <option key={project.value} value={project.value}>{project.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe what you worked on..."
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Date <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="DD-MM-YYYY"
                        value={formData.date ? dayjs(formData.date) : null}
                        onChange={(date) => handleInputChange('date', date ? date.toISOString() : '')}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Hours <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        step="0.25"
                        min="0.25"
                        max="24"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        required
                      />
                      <small className="text-muted">Minimum 0.25 hours (15 minutes)</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Billable</label>
                      <select
                        className="form-control"
                        value={formData.billable ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('billable', e.target.value === 'true')}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Bill Rate ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={formData.billRate}
                        onChange={(e) => handleInputChange('billRate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Delete Time Entry</h4>
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
              <p>Are you sure you want to delete this time entry? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                data-bs-dismiss="modal"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3: Reject Modal */}
      <div className="modal fade" id="reject_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Reject Time Entry</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => { setRejectEntryId(null); setRejectReason(''); }}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <label className="form-label">
                Rejection Reason <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this entry is being rejected..."
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => { setRejectEntryId(null); setRejectReason(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRejectConfirm}
                data-bs-dismiss="modal"
              >
                Reject Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeSheet;
