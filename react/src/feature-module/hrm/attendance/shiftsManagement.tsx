/**
 * Shifts Management Component
 * Allows admin/HR to manage work shifts for employees
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../../core/common/dataTable/index';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import CommonSelect from '../../../core/common/commonSelect';
import { DatePicker, TimePicker, message } from 'antd';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import dayjs from 'dayjs';
import { useShiftsREST, Shift, CreateShiftRequest } from '../../../hooks/useShiftsREST';

interface ShiftsManagementProps {}

export const ShiftsManagement: React.FC<ShiftsManagementProps> = () => {
  const { shifts, defaultShift, loading, fetchShifts, createShift, updateShift, deleteShift, setAsDefault } = useShiftsREST();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    startTime: null,
    endTime: null,
    duration: 8,
    timezone: 'UTC',
    gracePeriod: 15,
    earlyDepartureAllowance: 15,
    minHoursForFullDay: 8,
    halfDayThreshold: 4,
    overtimeEnabled: true,
    overtimeThreshold: 8,
    overtimeMultiplier: 1.5,
    breakEnabled: true,
    breakMandatory: false,
    breakDuration: 60,
    breakMaxDuration: 90,
    flexibleEnabled: false,
    flexibleWindowStart: null,
    flexibleWindowEnd: null,
    flexibleMinHours: 8,
    type: 'regular',
    workingDays: [1, 2, 3, 4, 5],
    color: '#1890ff',
    description: '',
    isActive: true,
    isDefault: false
  });

  // Form validation errors
  const [errors, setErrors] = useState<any>({});

  // Working days options
  const workingDaysOptions = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  // Shift type options
  const shiftTypeOptions = [
    { value: 'regular', label: 'Regular' },
    { value: 'night', label: 'Night' },
    { value: 'rotating', label: 'Rotating' },
    { value: 'flexible', label: 'Flexible' },
    { value: 'custom', label: 'Custom' }
  ];

  // Validate form
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Shift name is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle create/update shift
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      message.error('Please fill in all required fields');
      return;
    }

    try {
      const shiftData: CreateShiftRequest = {
        name: formData.name,
        code: formData.code?.toUpperCase(),
        startTime: formData.startTime.format('HH:mm'),
        endTime: formData.endTime.format('HH:mm'),
        duration: formData.duration,
        timezone: formData.timezone || 'UTC',
        gracePeriod: formData.gracePeriod || 15,
        earlyDepartureAllowance: formData.earlyDepartureAllowance || 15,
        minHoursForFullDay: formData.minHoursForFullDay || 8,
        halfDayThreshold: formData.halfDayThreshold || 4,
        overtime: {
          enabled: formData.overtimeEnabled ?? true,
          threshold: formData.overtimeThreshold || 8,
          multiplier: formData.overtimeMultiplier || 1.5
        },
        breakSettings: {
          enabled: formData.breakEnabled ?? true,
          mandatory: formData.breakMandatory ?? false,
          duration: formData.breakDuration || 60,
          maxDuration: formData.breakMaxDuration || 90
        },
        flexibleHours: {
          enabled: formData.flexibleEnabled ?? false,
          windowStart: formData.flexibleWindowStart?.format('HH:mm'),
          windowEnd: formData.flexibleWindowEnd?.format('HH:mm'),
          minHoursInOffice: formData.flexibleMinHours || 8
        },
        type: formData.type || 'regular',
        workingDays: formData.workingDays || [1, 2, 3, 4, 5],
        color: formData.color || '#1890ff',
        description: formData.description,
        isActive: formData.isActive ?? true,
        isDefault: formData.isDefault ?? false
      };

      if (editingShift) {
        await updateShift(editingShift._id, shiftData);
        message.success('Shift updated successfully!');
      } else {
        await createShift(shiftData);
        message.success('Shift created successfully!');
      }

      handleCloseModal();
    } catch (error) {
      console.error('Form submission failed:', error);
      message.error('Failed to save shift');
    }
  };

  // Handle edit
  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      code: shift.code,
      startTime: dayjs(shift.startTime, 'HH:mm'),
      endTime: dayjs(shift.endTime, 'HH:mm'),
      duration: shift.duration,
      timezone: shift.timezone,
      gracePeriod: shift.gracePeriod,
      earlyDepartureAllowance: shift.earlyDepartureAllowance,
      minHoursForFullDay: shift.minHoursForFullDay,
      halfDayThreshold: shift.halfDayThreshold,
      overtimeEnabled: shift.overtime?.enabled,
      overtimeThreshold: shift.overtime?.threshold,
      overtimeMultiplier: shift.overtime?.multiplier,
      breakEnabled: shift.breakSettings?.enabled,
      breakMandatory: shift.breakSettings?.mandatory,
      breakDuration: shift.breakSettings?.duration,
      breakMaxDuration: shift.breakSettings?.maxDuration,
      flexibleEnabled: shift.flexibleHours?.enabled,
      flexibleWindowStart: shift.flexibleHours?.windowStart ? dayjs(shift.flexibleHours.windowStart, 'HH:mm') : null,
      flexibleWindowEnd: shift.flexibleHours?.windowEnd ? dayjs(shift.flexibleHours.windowEnd, 'HH:mm') : null,
      flexibleMinHours: shift.flexibleHours?.minHoursInOffice,
      type: shift.type,
      workingDays: shift.workingDays,
      color: shift.color,
      description: shift.description,
      isActive: shift.isActive,
      isDefault: shift.isDefault
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (shiftId: string) => {
    const success = await deleteShift(shiftId);
    if (success) {
      message.success('Shift deleted successfully!');
      setDeleteShiftId(null);
    }
  };

  // Handle set as default
  const handleSetDefault = async (shiftId: string) => {
    const success = await setAsDefault(shiftId);
    if (success) {
      message.success('Default shift updated successfully!');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingShift(null);
    setFormData({
      name: '',
      code: '',
      startTime: null,
      endTime: null,
      duration: 8,
      timezone: 'UTC',
      gracePeriod: 15,
      earlyDepartureAllowance: 15,
      minHoursForFullDay: 8,
      halfDayThreshold: 4,
      overtimeEnabled: true,
      overtimeThreshold: 8,
      overtimeMultiplier: 1.5,
      breakEnabled: true,
      breakMandatory: false,
      breakDuration: 60,
      breakMaxDuration: 90,
      flexibleEnabled: false,
      flexibleWindowStart: null,
      flexibleWindowEnd: null,
      flexibleMinHours: 8,
      type: 'regular',
      workingDays: [1, 2, 3, 4, 5],
      color: '#1890ff',
      description: '',
      isActive: true,
      isDefault: false
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShift(null);
    setFormData({
      name: '',
      code: '',
      startTime: null,
      endTime: null,
      duration: 8,
      timezone: 'UTC',
      gracePeriod: 15,
      earlyDepartureAllowance: 15,
      minHoursForFullDay: 8,
      halfDayThreshold: 4,
      overtimeEnabled: true,
      overtimeThreshold: 8,
      overtimeMultiplier: 1.5,
      breakEnabled: true,
      breakMandatory: false,
      breakDuration: 60,
      breakMaxDuration: 90,
      flexibleEnabled: false,
      flexibleWindowStart: null,
      flexibleWindowEnd: null,
      flexibleMinHours: 8,
      type: 'regular',
      workingDays: [1, 2, 3, 4, 5],
      color: '#1890ff',
      description: '',
      isActive: true,
      isDefault: false
    });
    setErrors({});
  };

  // Handle form input change
  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Shift Name',
      dataIndex: 'name',
      render: (text: string, record: Shift) => (
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
        </div>
      ),
      sorter: (a: Shift, b: Shift) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      render: (code: string) => code ? <span className="badge bg-light text-dark">{code}</span> : '-',
      sorter: (a: Shift, b: Shift) => (a.code || '').localeCompare(b.code || ''),
    },
    {
      title: 'Time',
      dataIndex: 'startTime',
      render: (_: string, record: Shift) => (
        <div className="d-flex align-items-center">
          <i className="ti ti-clock me-1" />
          <span>{record.startTime} - {record.endTime}</span>
        </div>
      ),
      sorter: (a: Shift, b: Shift) => a.startTime.localeCompare(b.startTime),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      render: (duration: number) => `${duration}h`,
      sorter: (a: Shift, b: Shift) => a.duration - b.duration,
    },
    {
      title: 'Grace Period',
      dataIndex: 'gracePeriod',
      render: (gracePeriod: number) => `${gracePeriod} min`,
      sorter: (a: Shift, b: Shift) => a.gracePeriod - b.gracePeriod,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (type: string) => {
        const typeColors: any = {
          night: 'badge-purple-transparent',
          flexible: 'badge-success-transparent',
          rotating: 'badge-info-transparent',
          regular: 'badge-primary-transparent',
          custom: 'badge-warning-transparent'
        };
        return (
          <span className={`badge ${typeColors[type] || 'badge-secondary-transparent'}`}>
            {type?.charAt(0).toUpperCase() + type?.slice(1)}
          </span>
        );
      },
      sorter: (a: Shift, b: Shift) => a.type.localeCompare(b.type),
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
      sorter: (a: Shift, b: Shift) => Number(a.isActive) - Number(b.isActive),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_: any, record: Shift) => (
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
              data-bs-target="#edit_shift"
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
                setDeleteShiftId(record._id);
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
      {/* Shifts Table Card */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h5 className="fw-semibold mb-0">All Shifts</h5>
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
              data-bs-target="#add_shift"
            >
              <i className="ti ti-square-rounded-plus me-2" />
              Add Shift
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          <Table
            columns={columns}
            dataSource={shifts}
            loading={loading}
            Selection={false}
          />
        </div>
      </div>

      {/* Add/Edit Shift Modal */}
      <div className="modal fade" id={editingShift ? "edit_shift" : "add_shift"}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">{editingShift ? 'Edit Shift' : 'Add New Shift'}</h4>
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
                        Shift Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g., Morning Shift"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Shift Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., MS"
                        maxLength={20}
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Start Time <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <TimePicker
                          format="HH:mm"
                          className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                          value={formData.startTime}
                          onChange={(time) => handleInputChange('startTime', time)}
                          placeholder="Select start time"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-clock" />
                        </span>
                      </div>
                      {errors.startTime && <div className="invalid-feedback d-block">{errors.startTime}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        End Time <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <TimePicker
                          format="HH:mm"
                          className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                          value={formData.endTime}
                          onChange={(time) => handleInputChange('endTime', time)}
                          placeholder="Select end time"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-clock" />
                        </span>
                      </div>
                      {errors.endTime && <div className="invalid-feedback d-block">{errors.endTime}</div>}
                    </div>
                  </div>

                  {/* Timing Configuration */}
                  <div className="col-md-12 mt-3">
                    <h6 className="fw-semibold mb-3">Timing Configuration</h6>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Grace Period (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        max={60}
                        value={formData.gracePeriod}
                        onChange={(e) => handleInputChange('gracePeriod', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Early Departure (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        max={60}
                        value={formData.earlyDepartureAllowance}
                        onChange={(e) => handleInputChange('earlyDepartureAllowance', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Duration (hours)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        max={24}
                        step={0.5}
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 8)}
                      />
                    </div>
                  </div>

                  {/* Overtime Settings */}
                  <div className="col-md-12 mt-3">
                    <h6 className="fw-semibold mb-3">Overtime Settings</h6>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="overtimeEnabled"
                          checked={formData.overtimeEnabled}
                          onChange={(e) => handleInputChange('overtimeEnabled', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="overtimeEnabled">
                          Enable Overtime
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Overtime Threshold (hrs)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        max={12}
                        step={0.5}
                        value={formData.overtimeThreshold}
                        onChange={(e) => handleInputChange('overtimeThreshold', parseFloat(e.target.value) || 8)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Overtime Multiplier</label>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        max={3}
                        step={0.1}
                        value={formData.overtimeMultiplier}
                        onChange={(e) => handleInputChange('overtimeMultiplier', parseFloat(e.target.value) || 1.5)}
                      />
                    </div>
                  </div>

                  {/* Break Settings */}
                  <div className="col-md-12 mt-3">
                    <h6 className="fw-semibold mb-3">Break Settings</h6>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="breakEnabled"
                          checked={formData.breakEnabled}
                          onChange={(e) => handleInputChange('breakEnabled', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="breakEnabled">
                          Enable Break
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Break Duration (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        max={180}
                        value={formData.breakDuration}
                        onChange={(e) => handleInputChange('breakDuration', parseInt(e.target.value) || 60)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Break (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        max={240}
                        value={formData.breakMaxDuration}
                        onChange={(e) => handleInputChange('breakMaxDuration', parseInt(e.target.value) || 90)}
                      />
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="col-md-12 mt-3">
                    <h6 className="fw-semibold mb-3">Additional Settings</h6>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Shift Type</label>
                      <CommonSelect
                        className="select"
                        options={shiftTypeOptions}
                        value={formData.type}
                        onChange={(option: any) => handleInputChange('type', option?.value || 'regular')}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <input
                        type="color"
                        className="form-control form-control-color w-100"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Enter shift description (optional)"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Is Active
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="isDefault">
                          Set as Default
                        </label>
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
                    editingShift ? 'Update Shift' : 'Create Shift'
                  )}
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
                <h3>Delete Shift?</h3>
                <p className="del-info">
                  Are you sure you want to delete this shift?
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
                    onClick={() => deleteShiftId && handleDelete(deleteShiftId)}
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

export default ShiftsManagement;
