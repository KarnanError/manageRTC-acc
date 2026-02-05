/**
 * Batches Management Component
 * Allows admin/HR to manage employee batches for shift assignment
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../../core/common/dataTable/index';
import { DatePicker, message } from 'antd';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import dayjs from 'dayjs';
import { useBatchesREST, Batch, CreateBatchRequest } from '../../../hooks/useBatchesREST';
import { useShiftsREST } from '../../../hooks/useShiftsREST';

interface BatchesManagementProps {}

export const BatchesManagement: React.FC<BatchesManagementProps> = () => {
  const { batches, defaultBatch, loading, fetchBatches, createBatch, updateBatch, deleteBatch, setAsDefault, getBatchSchedule, getBatchHistory } = useBatchesREST();
  const { shifts: availableShifts } = useShiftsREST();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [showRotationConfig, setShowRotationConfig] = useState(false);
  const [rotationPreview, setRotationPreview] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    description: '',
    shiftId: '',
    rotationEnabled: false,
    rotationMode: 'cyclic',
    rotationShifts: [],
    daysPerShift: 7,
    rotationStartDate: dayjs(),
    capacity: null,
    departmentId: '',
    color: '#1890ff',
    isActive: true,
    isDefault: false
  });

  // Form validation errors
  const [errors, setErrors] = useState<any>({});

  // Shift options for dropdown
  const shiftOptions = availableShifts?.map(shift => ({
    value: shift._id,
    label: `${shift.name} (${shift.startTime} - ${shift.endTime})`,
    color: shift.color,
    data: shift
  })) || [];

  // Validate form
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Batch name is required';
    }

    if (!formData.shiftId) {
      newErrors.shiftId = 'Shift assignment is required';
    }

    if (formData.rotationEnabled && (!formData.rotationShifts || formData.rotationShifts.length === 0)) {
      newErrors.rotationShifts = 'At least one shift is required for rotation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle create/update batch
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      message.error('Please fill in all required fields');
      return;
    }

    try {
      const batchData: CreateBatchRequest = {
        name: formData.name,
        code: formData.code?.toUpperCase(),
        description: formData.description,
        shiftId: formData.shiftId,
        rotationEnabled: formData.rotationEnabled,
        rotationPattern: formData.rotationEnabled ? {
          mode: formData.rotationMode as 'cyclic' | 'sequential',
          shiftSequence: formData.rotationShifts,
          daysPerShift: formData.daysPerShift || 7,
          startDate: formData.rotationStartDate?.format('YYYY-MM-DD'),
          currentIndex: 0
        } : undefined,
        capacity: formData.capacity || undefined,
        departmentId: formData.departmentId || undefined,
        color: formData.color || '#1890ff'
      };

      if (editingBatch) {
        await updateBatch(editingBatch._id, batchData);
        message.success('Batch updated successfully!');
      } else {
        const result = await createBatch(batchData);
        if (result.success) {
          message.success('Batch created successfully!');
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('Form submission failed:', error);
      message.error('Failed to save batch');
    }
  };

  // Handle edit
  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      code: batch.code || '',
      description: batch.description || '',
      shiftId: batch.shiftId,
      rotationEnabled: batch.rotationEnabled || false,
      rotationMode: batch.rotationPattern?.mode || 'cyclic',
      rotationShifts: batch.rotationPattern?.shiftSequence || [],
      daysPerShift: batch.rotationPattern?.daysPerShift || 7,
      rotationStartDate: batch.rotationPattern?.startDate ? dayjs(batch.rotationPattern.startDate) : dayjs(),
      capacity: batch.capacity || null,
      departmentId: batch.departmentId || '',
      color: batch.color,
      isActive: batch.isActive,
      isDefault: batch.isDefault
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (batchId: string) => {
    const success = await deleteBatch(batchId);
    if (success) {
      message.success('Batch deleted successfully!');
      setDeleteBatchId(null);
    }
  };

  // Handle set as default
  const handleSetDefault = async (batchId: string) => {
    const success = await setAsDefault(batchId);
    if (success) {
      message.success('Default batch updated successfully!');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      shiftId: '',
      rotationEnabled: false,
      rotationMode: 'cyclic',
      rotationShifts: [],
      daysPerShift: 7,
      rotationStartDate: dayjs(),
      capacity: null,
      departmentId: '',
      color: '#1890ff',
      isActive: true,
      isDefault: false
    });
    setErrors({});
    setRotationPreview([]);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBatch(null);
    setShowRotationConfig(false);
    setRotationPreview([]);
  };

  // Handle form input change
  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Preview rotation schedule
  const handlePreviewRotation = async () => {
    if (!formData.shiftId || !formData.rotationEnabled) {
      message.warning('Please select a shift and enable rotation first');
      return;
    }

    // Generate preview for next 30 days
    const preview = [];
    const startDate = formData.rotationStartDate || dayjs();
    const shiftSequence = [...formData.rotationShifts];
    if (!formData.shiftId) shiftSequence.unshift(formData.shiftId);

    const daysPerShift = formData.daysPerShift || 7;

    for (let week = 0; week < 4; week++) {
      for (let i = 0; i < shiftSequence.length; i++) {
        const shiftId = shiftSequence[i];
        const shift = availableShifts?.find(s => s._id === shiftId);
        const periodStart = startDate.add(week * 7 + i * daysPerShift, 'day');
        const periodEnd = startDate.add(week * 7 + (i + 1) * daysPerShift - 1, 'day');

        preview.push({
          shiftId,
          shiftName: shift?.name || 'Unknown',
          startTime: shift?.startTime || '--:--',
          endTime: shift?.endTime || '--:--',
          color: shift?.color || '#ccc',
          startDate: periodStart.format('MMM D, YYYY'),
          endDate: periodEnd.format('MMM D, YYYY')
        });
      }
    }

    setRotationPreview(preview);
    setShowRotationConfig(true);

    // Trigger modal
    const modalEl = document.getElementById('rotation_preview_modal');
    if (modalEl) {
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Batch Name',
      dataIndex: 'name',
      render: (text: string, record: Batch) => (
        <div className="d-flex align-items-center">
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: record.color,
              marginRight: 8
            }}
          />
          <span className="fw-medium">{text}</span>
          {record.isDefault && (
            <span className="badge badge-success-transparent ms-2">
              <i className="ti ti-check me-1" />
              Default
            </span>
          )}
          {record.rotationEnabled && (
            <Tooltip title="Rotation enabled">
              <span className="badge badge-info-transparent ms-2">
                <i className="ti ti-refresh me-1" />
                {record.rotationPattern?.daysPerShift}d
              </span>
            </Tooltip>
          )}
        </div>
      ),
      sorter: (a: Batch, b: Batch) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      render: (code: string) => code ? <span className="badge bg-light text-dark">{code}</span> : '-',
      sorter: (a: Batch, b: Batch) => (a.code || '').localeCompare(b.code || ''),
    },
    {
      title: 'Current Shift',
      dataIndex: 'shiftName',
      render: (shiftName: string, record: Batch) => (
        <div className="d-flex align-items-center">
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: record.shiftColor,
              marginRight: 6
            }}
          />
          <span>{shiftName || 'Not assigned'}</span>
          {record.shiftTiming && (
            <small className="text-muted ms-2">({record.shiftTiming})</small>
          )}
        </div>
      ),
      sorter: (a: Batch, b: Batch) => (a.shiftName || '').localeCompare(b.shiftName || ''),
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      render: (count: number) => (
        <span className="badge bg-primary-transparent text-primary">
          {count || 0} employees
        </span>
      ),
      sorter: (a: Batch, b: Batch) => (a.employeeCount || 0) - (b.employeeCount || 0),
    },
    {
      title: 'Rotation',
      dataIndex: 'rotationEnabled',
      render: (enabled: boolean, record: Batch) => {
        if (!enabled) {
          return <span className="text-muted">No rotation</span>;
        }
        const shifts = record.rotationPattern?.shiftSequence || [];
        return (
          <Tooltip title={`${shifts.length} shifts, ${record.rotationPattern?.daysPerShift} days each`}>
            <span className="badge badge-info-transparent">
              <i className="ti ti-refresh me-1" />
              {shifts.length} shifts
            </span>
          </Tooltip>
        );
      },
      sorter: (a: Batch, b: Batch) => Number(a.rotationEnabled) - Number(b.rotationEnabled),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (isActive: boolean) => (
        <span className={`badge ${isActive ? 'badge-success-transparent' : 'badge-danger-transparent'} d-inline-flex align-items-center`}>
          <i className="ti ti-point-filled me-1" />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
      sorter: (a: Batch, b: Batch) => Number(a.isActive) - Number(b.isActive),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_: any, record: Batch) => (
        <div className="action-icon d-inline-flex">
          {!record.isDefault && (
            <OverlayTrigger placement="top" overlay={<Tooltip>Set as Default</Tooltip>}>
              <Link
                to="#"
                className="me-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleSetDefault(record._id);
                }}
              >
                <i className="ti ti-check" />
              </Link>
            </OverlayTrigger>
          )}
          <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
            <Link
              to="#"
              className="me-2"
              onClick={(e) => {
                e.preventDefault();
                handleEdit(record);
              }}
              data-bs-toggle="modal"
              data-inert={true}
              data-bs-target="#edit_batch"
            >
              <i className="ti ti-edit" />
            </Link>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
            <Link
              to="#"
              className="me-2"
              onClick={(e) => {
                e.preventDefault();
                setDeleteBatchId(record._id);
              }}
              data-bs-toggle="modal"
              data-inert={true}
              data-bs-target="#delete_modal"
            >
              <i className="ti ti-trash" />
            </Link>
          </OverlayTrigger>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Batches Table Card */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h5 className="fw-semibold mb-0">All Batches</h5>
          <div className="d-flex align-items-center flex-wrap row-gap-2">
            <Link
              to="#"
              className="btn btn-primary d-flex align-items-center"
              onClick={(e) => {
                e.preventDefault();
                openCreateModal();
              }}
              data-bs-toggle="modal"
              data-inert={true}
              data-bs-target="#add_batch"
            >
              <i className="ti ti-square-rounded-plus me-2" />
              Add Shift Batch
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          <Table
            columns={columns}
            dataSource={batches}
            loading={loading}
            Selection={false}
          />
        </div>
      </div>

      {/* Add/Edit Shift Batch Modal */}
      <div className="modal fade" id={editingBatch ? "edit_batch" : "add_batch"}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">{editingBatch ? 'Edit Shift Batch' : 'Create New Shift Batch'}</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseModal}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  {/* Basic Information */}
                  <div className="col-md-12">
                    <h6 className="fw-semibold mb-3">Basic Information</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Batch Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g., Batch A - Production Line 1"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Batch Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., BATCH-A"
                        maxLength={20}
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Optional description for this batch"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Shift Assignment */}
                  <div className="col-md-12 mt-3">
                    <h6 className="fw-semibold mb-3">Shift Assignment</h6>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Current Shift <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${errors.shiftId ? 'is-invalid' : ''}`}
                        value={formData.shiftId}
                        onChange={(e) => handleInputChange('shiftId', e.target.value)}
                      >
                        <option value="">Select a shift...</option>
                        {shiftOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.shiftId && <div className="invalid-feedback d-block">{errors.shiftId}</div>}
                    </div>
                  </div>

                  {/* Rotation Configuration */}
                  <div className="col-md-12 mt-3">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.rotationEnabled}
                        onChange={(e) => handleInputChange('rotationEnabled', e.target.checked)}
                      />
                      <label className="form-check-label fw-semibold">Enable Rotation for this Batch</label>
                    </div>
                  </div>

                  {formData.rotationEnabled && (
                    <>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Rotation Pattern</label>
                          <select
                            className="form-select"
                            value={formData.rotationMode}
                            onChange={(e) => handleInputChange('rotationMode', e.target.value)}
                          >
                            <option value="cyclic">Cyclic (A → B → C → A...)</option>
                            <option value="sequential">Sequential (A → B → C)</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Days Per Shift</label>
                          <input
                            type="number"
                            className="form-control"
                            min={1}
                            max={30}
                            value={formData.daysPerShift}
                            onChange={(e) => handleInputChange('daysPerShift', parseInt(e.target.value) || 7)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Rotation Start Date</label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format={{
                                format: "DD-MM-YYYY",
                                type: "mask",
                              }}
                              placeholder="DD-MM-YYYY"
                              value={formData.rotationStartDate}
                              onChange={(date) => handleInputChange('rotationStartDate', date)}
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Shift Sequence (Drag to reorder) <span className="text-danger">*</span>
                          </label>
                          <small className="text-muted d-block mb-2">
                            Select the shifts that will rotate in sequence
                          </small>
                          <div className="border rounded p-2">
                            {availableShifts?.map(shift => (
                              <div
                                key={shift._id}
                                className="d-flex align-items-center justify-content-between py-2 border-bottom"
                              >
                                <div className="d-flex align-items-center">
                                  <span
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      backgroundColor: shift.color,
                                      marginRight: 8
                                    }}
                                  />
                                  <span>{shift.name}</span>
                                  <small className="text-muted ms-2">({shift.startTime} - {shift.endTime})</small>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={formData.rotationShifts.includes(shift._id)}
                                  onChange={(e) => {
                                    const newShifts = e.target.checked
                                      ? [...formData.rotationShifts, shift._id]
                                      : formData.rotationShifts.filter(id => id !== shift._id);
                                    handleInputChange('rotationShifts', newShifts);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {errors.rotationShifts && <div className="invalid-feedback d-block">{errors.rotationShifts}</div>}
                        </div>
                      </div>
                      <div className="col-md-12">
                        <button
                          type="button"
                          className="btn btn-outline-primary me-2"
                          onClick={handlePreviewRotation}
                        >
                          <i className="ti ti-calendar me-1" />
                          Preview Rotation
                        </button>
                      </div>
                    </>
                  )}

                  {/* Additional Settings */}
                  <div className="col-md-12 mt-3">
                    <h6 className="fw-semibold mb-3">Additional Settings</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      />
                      <label className="form-check-label">Is Active</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                      />
                      <label className="form-check-label">Set as Default</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    editingBatch ? 'Update Batch' : 'Create Batch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Rotation Preview Modal */}
      <div className="modal fade" id="rotation_preview_modal" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Rotation Schedule Preview</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setShowRotationConfig(false)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="rotation-preview">
                {rotationPreview.length > 0 ? (
                  <div className="timeline">
                    {rotationPreview.map((item, index) => (
                      <div key={index} className="timeline-item mb-3">
                        <div className="d-flex align-items-center">
                          <span
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: item.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 'bold',
                              marginRight: 12
                            }}
                          >
                            {index + 1}
                          </span>
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{item.shiftName}</div>
                            <small className="text-muted">
                              {item.startDate} - {item.endDate} • {item.startTime} - {item.endTime}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center">Enable rotation and select shifts to see preview</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => setShowRotationConfig(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 m-0 justify-content-end">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
              </button>
            </div>
            <div className="modal-body">
              <div className="success-message text-center">
                <div className="success-popup-icon bg-light-blue">
                  <i className="ti ti-trash" />
                </div>
                <h3>Delete Batch?</h3>
                <p className="del-info">
                  Do you really want to delete this batch? Any employees in this batch will become unassigned.
                </p>
                <div className="col-lg-12 text-center modal-btn">
                  <button
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                    onClick={() => deleteBatchId && handleDelete(deleteBatchId)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BatchesManagement;
