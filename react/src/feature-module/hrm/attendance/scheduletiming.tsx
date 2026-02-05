import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import PredefinedDateRanges from "../../../core/common/datePicker";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CommonSelect from "../../../core/common/commonSelect";
import { DatePicker, TimePicker, message, Spin, Tag } from "antd";
import { useShiftsREST, type Shift, type BulkAssignShiftRequest } from "../../../hooks/useShiftsREST";
import { useEmployeesREST } from "../../../hooks/useEmployeesREST";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import Footer from "../../../core/common/footer";

// Loading spinner component
const LoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" />
  </div>
);

const ScheduleTiming = () => {
  // API hooks
  const { shifts, loading, assignShiftToEmployee, bulkAssignShifts } = useShiftsREST();
  const { employees, fetchEmployees } = useEmployeesREST();

  // Form state for Add Schedule modal
  const [formData, setFormData] = useState({
    department: '',
    employeeId: '',
    date: null as any,
    shiftId: '',
    minStartTime: null as any,
    startTime: null as any,
    maxStartTime: null as any,
    minEndTime: null as any,
    endTime: null as any,
    maxEndTime: null as any,
    breakTime: null as any,
    acceptExtraHours: true,
    publish: true,
  });

  // Bulk assignment state
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    selectedEmployees: [] as string[],
    shiftId: '',
    effectiveDate: null as any,
  });

  // Local state for employee shift assignments
  const [assignments, setAssignments] = useState<Map<string, Shift>>(new Map());

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees({ status: 'Active' });
  }, []);

  // Calculate shift coverage
  const calculateShiftCoverage = () => {
    const coverage: Record<string, { name: string; count: number; color: string }> = {};
    shifts.forEach(shift => {
      coverage[shift._id] = {
        name: shift.name,
        count: 0,
        color: shift.color,
      };
    });
    employees.forEach(emp => {
      if (emp.shiftId) {
        const shift = shifts.find(s => s._id === emp.shiftId);
        if (shift && coverage[shift._id]) {
          coverage[shift._id].count++;
        }
      }
    });
    return coverage;
  };

  const shiftCoverage = calculateShiftCoverage();

  // Transform shifts for dropdown
  const shiftOptions = shifts.map(shift => ({
    value: shift._id,
    label: `${shift.name} (${shift.startTime} - ${shift.endTime})`,
  }));

  // Get shift by ID helper
  const getShiftById = (shiftId: string): Shift | undefined => {
    return shifts.find(s => s._id === shiftId);
  };

  // Transform employees for dropdown - group by department
  const employeeOptions = [
    { value: "", label: "Select Employee" },
    ...employees.map(emp => ({
      value: emp._id,
      label: `${emp.firstName} ${emp.lastName}`.trim(),
    }))
  ];

  // Mock department options - would come from departments API
  const departmentChoose = [
    { value: "", label: "Select Department" },
    { value: "Development", label: "Development" },
    { value: "Finance", label: "Finance" },
    { value: "HR", label: "HR" },
    { value: "IT", label: "IT" },
    { value: "Sales", label: "Sales" },
  ];

  const columns = [
    {
      title: "Name",
      dataIndex: "Name",
      render: (text: String, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath
              src={`assets/img/users/${record.Image}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{record.Name}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Name.length - b.Name.length,
    },
    {
      title: "Job Title",
      dataIndex: "JobTitle",
      sorter: (a: any, b: any) => a.JobTitle.length - b.JobTitle.length,
    },
    {
      title: "Current Shift",
      dataIndex: "shiftId",
      render: (shiftId: string, record: any) => {
        const shift = getShiftById(shiftId);
        if (!shift) {
          return <Tag color="default">Not Assigned</Tag>;
        }
        return (
          <div>
            <Tag color={shift.color}>{shift.name}</Tag>
            <div className="small text-muted">
              {shift.startTime} - {shift.endTime}
            </div>
          </div>
        );
      },
      sorter: (a: any, b: any) => {
        const aShift = getShiftById(a.shiftId);
        const bShift = getShiftById(b.shiftId);
        return (aShift?.name || '').localeCompare(bShift?.name || '');
      },
    },
    {
      title: "Shift Type",
      dataIndex: "shiftId",
      render: (shiftId: string) => {
        const shift = getShiftById(shiftId);
        if (!shift) return <span className="text-muted">-</span>;
        return (
          <Tag color={shift.type === 'night' ? 'purple' : shift.type === 'flexible' ? 'green' : 'blue'}>
            {shift.type.charAt(0).toUpperCase() + shift.type.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#schedule_timing"
            onClick={() => handleScheduleClick(record)}
            className="btn btn-dark btn-sm"
          >
            Schedule Timing
          </Link>
        </div>
      ),
    },
  ];

  // Handler for schedule button click
  const handleScheduleClick = (employee: any) => {
    setFormData({
      ...formData,
      employeeId: employee._id || employee.employeeId,
      shiftId: employee.shiftId || '',
    });
  };

  // Handler for bulk assignment
  const handleBulkAssign = async () => {
    if (bulkFormData.selectedEmployees.length === 0) {
      message.error('Please select at least one employee');
      return;
    }
    if (!bulkFormData.shiftId) {
      message.error('Please select a shift');
      return;
    }

    const success = await bulkAssignShifts({
      employeeIds: bulkFormData.selectedEmployees,
      shiftId: bulkFormData.shiftId,
      effectiveDate: bulkFormData.effectiveDate?.format('YYYY-MM-DD'),
    });

    if (success) {
      setBulkFormData({
        selectedEmployees: [],
        shiftId: '',
        effectiveDate: null,
      });
      setBulkAssignModalOpen(false);
      // Refresh employees
      fetchEmployees({ status: 'Active' });
    }
  };

  // Get shift name by ID helper
  const getShiftNameById = (shiftId: string): string => {
    const shift = getShiftById(shiftId);
    return shift?.name || 'Not Assigned';
  };

  // Handler for form submission
  const handleSubmit = async () => {
    if (!formData.employeeId) {
      message.error('Please select an employee');
      return;
    }
    if (!formData.shiftId) {
      message.error('Please select a shift');
      return;
    }
    if (!formData.date) {
      message.error('Please select a date');
      return;
    }

    const success = await assignShiftToEmployee({
      employeeId: formData.employeeId,
      shiftId: formData.shiftId,
      effectiveDate: formData.date.format('YYYY-MM-DD'),
    });

    if (success) {
      // Reset form and close modal
      setFormData({
        department: '',
        employeeId: '',
        date: null,
        shiftId: '',
        minStartTime: null,
        startTime: null,
        maxStartTime: null,
        minEndTime: null,
        endTime: null,
        maxEndTime: null,
        breakTime: null,
        acceptExtraHours: true,
        publish: true,
      });
      // Close modal using Bootstrap API
      const modalEl = document.getElementById('schedule_timing');
      if (modalEl) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    }
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };
  const getModalContainer2 = () => {
    const modalElement = document.getElementById("modal_datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Schedule Timing</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Administration</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Schedule Timing
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
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
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Shift Coverage Summary Cards */}
          <div className="row mb-3">
            <div className="col-md-3">
              <div className="card stats-card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Total Employees</p>
                      <h4 className="mb-0">{employees.length}</h4>
                    </div>
                    <div className="avatar avatar-md rounded-circle bg-primary bg-opacity-10">
                      <i className="ti ti-users text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {shifts.slice(0, 3).map(shift => (
              <div key={shift._id} className="col-md-3">
                <div className="card stats-card">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="mb-1 text-truncate" style={{ maxWidth: '120px' }}>{shift.name}</p>
                        <h4 className="mb-0">{shiftCoverage[shift._id]?.count || 0}</h4>
                      </div>
                      <div
                        className="avatar avatar-md rounded-circle d-flex align-items-center justify-content-center"
                        style={{ backgroundColor: shift.color + '20' }}
                      >
                        <i
                          className="ti ti-clock"
                          style={{ color: shift.color }}
                        />
                      </div>
                    </div>
                    <div className="small text-muted mt-2">
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Schedule Timing List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <button
                  type="button"
                  className="btn btn-primary me-2"
                  onClick={() => setBulkAssignModalOpen(true)}
                >
                  <i className="ti ti-users me-1" />
                  Bulk Assign Shift
                </button>
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                    <PredefinedDateRanges />
                    <span className="input-icon-addon">
                      <i className="ti ti-chevron-down" />
                    </span>
                  </div>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="custom-datatable-filter table-responsive">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Table
                    dataSource={employees.map(emp => ({
                      key: emp._id,
                      _id: emp._id,
                      Name: `${emp.firstName} ${emp.lastName}`.trim(),
                      JobTitle: emp.jobTitle || 'Employee',
                      Image: 'user-32.jpg',
                      shiftId: emp.shiftId || null,
                    }))}
                    columns={columns}
                    Selection={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
      {/* /Page Wrapper */}
      {/* Add Schedule Modal */}
      <div
        id="schedule_timing"
        className="modal custom-modal fade"
        role="dialog"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Assign Shift to Employee</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setFormData({
                  department: '',
                  employeeId: '',
                  date: null,
                  shiftId: '',
                  minStartTime: null,
                  startTime: null,
                  maxStartTime: null,
                  minEndTime: null,
                  endTime: null,
                  maxEndTime: null,
                  breakTime: null,
                  acceptExtraHours: true,
                  publish: true,
                })}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Department <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={departmentChoose}
                        defaultValue={departmentChoose[0]}
                        onChange={(option: any) => setFormData({ ...formData, department: option.value })}
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Employee Name <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={employeeOptions}
                        defaultValue={employeeOptions[0]}
                        onChange={(option: any) => setFormData({ ...formData, employeeId: option.value })}
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">Effective Date</label>
                      <div className="cal-icon">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          value={formData.date}
                          onChange={(date) => setFormData({ ...formData, date })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Shifts <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={shiftOptions}
                        defaultValue={shiftOptions[0]}
                        onChange={(option: any) => setFormData({ ...formData, shiftId: option.value })}
                      />
                    </div>
                  </div>
                  <div className="col-sm-12">
                    <div className="input-block mb-3">
                      <label className="col-form-label">Accept Extra Hours</label>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="customSwitch1"
                          checked={formData.acceptExtraHours}
                          onChange={(e) => setFormData({ ...formData, acceptExtraHours: e.target.checked })}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="customSwitch1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-12">
                    <div className="input-block mb-3">
                      <label className="col-form-label">Publish </label>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="customSwitch2"
                          checked={formData.publish}
                          onChange={(e) => setFormData({ ...formData, publish: e.target.checked })}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="customSwitch2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="submit-section">
                  <button
                    type="button"
                    className="btn btn-primary submit-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Assigning...' : 'Assign Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Schedule Modal */}
      {/* Bulk Assign Shift Modal */}
      <div
        className={`modal custom-modal fade ${bulkAssignModalOpen ? 'show' : ''}`}
        style={{ display: bulkAssignModalOpen ? 'block' : 'none' }}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Bulk Assign Shift</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBulkAssignModalOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="row">
                  <div className="col-sm-12">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Select Employees <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        multiple
                        style={{ height: '150px' }}
                        value={bulkFormData.selectedEmployees}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                          setBulkFormData({ ...bulkFormData, selectedEmployees: selected });
                        }}
                      >
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} - {emp.jobTitle || 'Employee'}
                            {emp.shiftId && ` (Current: ${getShiftNameById(emp.shiftId)})`}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">Hold Ctrl/Cmd to select multiple employees</small>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">
                        Assign Shift <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={bulkFormData.shiftId}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, shiftId: e.target.value })}
                      >
                        <option value="">Select Shift</option>
                        {shifts.map(shift => (
                          <option key={shift._id} value={shift._id}>
                            {shift.name} ({shift.startTime} - {shift.endTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="input-block mb-3">
                      <label className="col-form-label">Effective Date</label>
                      <DatePicker
                        className="form-control"
                        format="DD-MM-YYYY"
                        placeholder="DD-MM-YYYY"
                        value={bulkFormData.effectiveDate}
                        onChange={(date) => setBulkFormData({ ...bulkFormData, effectiveDate: date })}
                      />
                    </div>
                  </div>
                </div>
                {bulkFormData.selectedEmployees.length > 0 && (
                  <div className="alert alert-info">
                    <strong>{bulkFormData.selectedEmployees.length} employee(s) selected</strong>
                    {bulkFormData.shiftId && (
                      <span className="ms-2">
                        will be assigned to <strong>{getShiftNameById(bulkFormData.shiftId)}</strong>
                      </span>
                    )}
                  </div>
                )}
                <div className="submit-section">
                  <button
                    type="button"
                    className="btn btn-primary submit-btn"
                    onClick={handleBulkAssign}
                    disabled={loading || bulkFormData.selectedEmployees.length === 0 || !bulkFormData.shiftId}
                  >
                    {loading ? 'Assigning...' : `Assign Shift to ${bulkFormData.selectedEmployees.length} Employee(s)`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Bulk Assign Shift Modal */}
    </>
  );
};

export default ScheduleTiming;
