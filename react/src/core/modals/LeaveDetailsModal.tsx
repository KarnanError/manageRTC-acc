import React from "react";
import dayjs from "dayjs";
import { statusDisplayMap, type LeaveStatus } from "../../hooks/useLeaveREST";

interface AuditTrailEntry {
  status: LeaveStatus;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: string;
  comments?: string;
  rejectionReason?: string;
}

interface Leave {
  _id: string;
  leaveId: string;
  employeeId?: string;
  employeeName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  totalDays?: number;
  workingDays?: number;
  reason: string;
  detailedReason?: string;
  status: LeaveStatus;
  employeeStatus?: LeaveStatus;
  managerStatus?: LeaveStatus;
  hrStatus?: LeaveStatus;
  finalStatus?: LeaveStatus;
  reportingManagerId?: string;
  reportingManagerName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalComments?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  balanceAtRequest?: number;
  handoverToId?: string;
  handoverToName?: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface LeaveDetailsModalProps {
  leave: Leave | null;
  modalId?: string;
  leaveTypeDisplayMap?: Record<string, string>;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  leave,
  modalId = "view_leave_details",
  leaveTypeDisplayMap = {}
}) => {
  // Build audit trail from leave data
  const buildAuditTrail = (): AuditTrailEntry[] => {
    if (!leave) return [];

    const trail: AuditTrailEntry[] = [];

    // Initial request
    trail.push({
      status: 'pending',
      updatedByName: leave.employeeName || 'Employee',
      updatedAt: leave.createdAt,
      comments: 'Leave request submitted',
    });

    // Manager action
    if (leave.managerStatus && leave.managerStatus !== 'pending') {
      trail.push({
        status: leave.managerStatus,
        updatedByName: leave.reportingManagerName || leave.approvedByName || 'Manager',
        updatedAt: leave.approvedAt || leave.updatedAt,
        comments: leave.approvalComments,
        rejectionReason: leave.managerStatus === 'rejected' ? leave.rejectionReason : undefined,
      });
    }

    // HR action
    if (leave.hrStatus && leave.hrStatus !== 'pending') {
      trail.push({
        status: leave.hrStatus,
        updatedByName: 'HR',
        updatedAt: leave.updatedAt,
        comments: leave.hrStatus === 'approved' ? 'HR approved' : 'HR rejected',
      });
    }

    // Final status (if different from manager/HR status)
    if (leave.finalStatus && leave.finalStatus !== leave.managerStatus && leave.finalStatus !== leave.hrStatus) {
      if (leave.finalStatus === 'cancelled') {
        trail.push({
          status: 'cancelled',
          updatedByName: leave.employeeName || 'Employee',
          updatedAt: leave.updatedAt,
          comments: 'Leave cancelled by employee',
        });
      }
    }

    return trail;
  };

  const auditTrail = buildAuditTrail();

  const getStatusBadge = (status: LeaveStatus) => {
    const config = statusDisplayMap[status] || statusDisplayMap.pending;
    return (
      <span className={`badge ${config.badgeClass} d-inline-flex align-items-center`}>
        <i className="ti ti-point-filled me-1" />
        {config.label}
      </span>
    );
  };

  if (!leave) {
    return (
      <div className="modal fade" id={modalId}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Leave Details</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body pb-0">
              <div className="text-center py-5">
                <p className="text-muted">No leave selected</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal fade" id={modalId}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Leave Request Details</h4>
            <button
              type="button"
              className="btn-close custom-btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body pb-0">
            <div className="row">
              {/* Employee & Leave Type Header */}
              <div className="col-md-12 mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-lg bg-primary-transparent rounded me-3">
                      <i className="ti ti-user fs-24 text-primary" />
                    </div>
                    <div>
                      <h5 className="mb-1">{leave.employeeName || 'Unknown Employee'}</h5>
                      <p className="text-muted mb-0">
                        {leaveTypeDisplayMap[leave.leaveType] || leave.leaveType}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(leave.finalStatus || leave.status)}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                {/* Leave Details Card */}
                <div className="card bg-light-300 border-0 mb-3">
                  <div className="card-header bg-transparent border-0 py-2">
                    <h6 className="mb-0">Leave Information</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {/* Leave Type */}
                      <div className="col-md-12 mb-3">
                        <label className="form-label text-muted mb-1">Leave Type</label>
                        <p className="fw-medium mb-0">
                          <span className="badge badge-soft-info d-inline-flex align-items-center">
                            <i className="ti ti-tag me-1" />
                            {leaveTypeDisplayMap[leave.leaveType] || leave.leaveType}
                          </span>
                        </p>
                      </div>

                      {/* Start Date */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted mb-1">Start Date</label>
                        <p className="fw-medium mb-0">
                          <i className="ti ti-calendar me-1 text-success" />
                          {dayjs(leave.startDate).format("DD MMMM YYYY")}
                        </p>
                      </div>

                      {/* End Date */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted mb-1">End Date</label>
                        <p className="fw-medium mb-0">
                          <i className="ti ti-calendar me-1 text-danger" />
                          {dayjs(leave.endDate).format("DD MMMM YYYY")}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted mb-1">Total Days</label>
                        <p className="fw-medium mb-0">
                          <i className="ti ti-clock me-1 text-warning" />
                          {leave.duration || leave.totalDays || leave.workingDays || 0} days
                        </p>
                      </div>

                      {/* Applied On */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted mb-1">Applied On</label>
                        <p className="fw-medium mb-0">
                          <i className="ti ti-calendar-event me-1 text-info" />
                          {dayjs(leave.createdAt).format("DD MMMM YYYY, HH:mm")}
                        </p>
                      </div>

                      {/* Reason */}
                      {leave.reason && (
                        <div className="col-md-12 mb-0">
                          <label className="form-label text-muted mb-1">Reason</label>
                          <p className="mb-0">{leave.reason}</p>
                        </div>
                      )}

                      {/* Detailed Reason */}
                      {leave.detailedReason && leave.detailedReason !== leave.reason && (
                        <div className="col-md-12 mb-0">
                          <label className="form-label text-muted mb-1">Detailed Reason</label>
                          <p className="mb-0 text-muted">{leave.detailedReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                {/* Status & Approval Card */}
                <div className="card bg-light-300 border-0 mb-3">
                  <div className="card-header bg-transparent border-0 py-2">
                    <h6 className="mb-0">Approval Status</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {/* Reporting Manager */}
                      {leave.reportingManagerName && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label text-muted mb-1">Reporting Manager</label>
                          <p className="fw-medium mb-0">
                            <i className="ti ti-user-check me-1 text-primary" />
                            {leave.reportingManagerName}
                          </p>
                        </div>
                      )}

                      {/* Manager Status */}
                      <div className="col-md-12 mb-3">
                        <label className="form-label text-muted mb-1">Manager Status</label>
                        <p className="mb-0">
                          {getStatusBadge(leave.managerStatus || 'pending')}
                        </p>
                      </div>

                      {/* HR Status */}
                      {leave.hrStatus && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label text-muted mb-1">HR Status</label>
                          <p className="mb-0">
                            {getStatusBadge(leave.hrStatus)}
                          </p>
                        </div>
                      )}

                      {/* Final Status */}
                      <div className="col-md-12 mb-3">
                        <label className="form-label text-muted mb-1">Final Status</label>
                        <p className="mb-0">
                          {getStatusBadge(leave.finalStatus || leave.status)}
                        </p>
                      </div>

                      {/* Approved By */}
                      {leave.approvedByName && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label text-muted mb-1">Approved By</label>
                          <p className="fw-medium mb-0">
                            <i className="ti ti-check me-1 text-success" />
                            {leave.approvedByName}
                          </p>
                          {leave.approvedAt && (
                            <p className="text-muted small mb-0">
                              {dayjs(leave.approvedAt).format("DD MMMM YYYY, HH:mm")}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Rejected By */}
                      {leave.rejectedByName && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label text-muted mb-1">Rejected By</label>
                          <p className="fw-medium mb-0">
                            <i className="ti ti-x me-1 text-danger" />
                            {leave.rejectedByName}
                          </p>
                          {leave.rejectedAt && (
                            <p className="text-muted small mb-0">
                              {dayjs(leave.rejectedAt).format("DD MMMM YYYY, HH:mm")}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Approval Comments */}
                      {leave.approvalComments && (
                        <div className="col-md-12 mb-3">
                          <label className="form-label text-muted mb-1">Approval Comments</label>
                          <p className="mb-0 text-success">
                            <i className="ti ti-message me-1" />
                            {leave.approvalComments}
                          </p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {leave.rejectionReason && (
                        <div className="col-md-12 mb-0">
                          <label className="form-label text-muted mb-1">Rejection Reason</label>
                          <p className="mb-0 text-danger">
                            <i className="ti ti-alert-circle me-1" />
                            {leave.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Trail Section */}
              <div className="col-md-12">
                <div className="card bg-light-300 border-0 mb-3">
                  <div className="card-header bg-transparent border-0 py-2">
                    <h6 className="mb-0">
                      <i className="ti ti-history me-2" />
                      Audit Trail
                    </h6>
                  </div>
                  <div className="card-body">
                    {auditTrail.length > 0 ? (
                      <div className="timeline">
                        {auditTrail.map((entry, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker">
                              <i className={`ti ti-point-filled ${
                                entry.status === 'approved' ? 'text-success' :
                                entry.status === 'rejected' ? 'text-danger' :
                                entry.status === 'cancelled' ? 'text-secondary' :
                                'text-warning'
                              }`} />
                            </div>
                            <div className="timeline-content">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <p className="mb-1 fw-medium">
                                    {entry.updatedByName}
                                  </p>
                                  {entry.comments && (
                                    <p className="text-muted mb-0 small">{entry.comments}</p>
                                  )}
                                  {entry.rejectionReason && (
                                    <p className="text-danger mb-0 small">
                                      Reason: {entry.rejectionReason}
                                    </p>
                                  )}
                                </div>
                                <div className="text-end">
                                  {getStatusBadge(entry.status)}
                                  <p className="text-muted small mb-0 mt-1">
                                    {dayjs(entry.updatedAt).format("DD MMM YYYY, HH:mm")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No audit trail available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments (if any) */}
              {leave.attachments && leave.attachments.length > 0 && (
                <div className="col-md-12">
                  <div className="card bg-light-300 border-0 mb-3">
                    <div className="card-header bg-transparent border-0 py-2">
                      <h6 className="mb-0">
                        <i className="ti ti-paperclip me-2" />
                        Attachments
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {leave.attachments.map((attachment, index) => (
                          <div key={index} className="col-md-6 mb-2">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="d-flex align-items-center p-2 bg-white rounded border"
                            >
                              <i className="ti ti-file me-2 text-primary" />
                              <span className="text-truncate">{attachment.originalName || attachment.filename}</span>
                              <i className="ti ti-external-link ms-auto text-muted small" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsModal;
