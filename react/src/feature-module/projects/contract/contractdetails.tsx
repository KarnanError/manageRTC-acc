import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Footer from '../../../core/common/footer';
import { get as apiGet, post as apiPost } from '../../../services/api';
import { all_routes } from '../../router/all_routes';

interface ProjectMember {
  _id: string;
  name: string;
  employeeId?: string;
  position?: string;
  department?: string;
}

interface ProjectDetail {
  _id: string;
  name: string;
  projectId?: string;
  status: string;
  startDate: string;
  deadline: string;
  contractDate?: string;
  numberOfMembers?: number;
  title?: string;
  workedDate?: string;
  // Legacy fields
  workerPayRate?: number;
  paymentDate?: string;
  totalAmount?: number;
  currency?: string;
  description?: string;
  teamMembers?: ProjectMember[];
  teamLeader?: ProjectMember[];
  projectManager?: ProjectMember[];
  subContracts?: any[];
}

interface ContractDetail {
  _id: string;
  contractId?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  address?: string;
  project: ProjectDetail;
}

const ContractDetails = () => {
  const { contractId, projectId } = useParams<{ contractId: string; projectId: string }>();
  const routes = all_routes;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [workerContracts, setWorkerContracts] = useState<any[]>([]);
  const [subContractDetailId, setSubContractDetailId] = useState<string | null>(null);

  // Form state for adding workers
  const [title, setTitle] = useState<string>('');
  const [numberOfWorkers, setNumberOfWorkers] = useState<number>(1);
  const [workedDate, setWorkedDate] = useState<Dayjs | null>(dayjs());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contractId && projectId) {
      fetchContractDetails();
    }
  }, [contractId, projectId]);

  const fetchContractDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch contract with its project
      const response = await apiGet(`/subcontracts/${contractId}`);

      if (response.success && response.data) {
        // Fetch the specific project details
        const projectResponse = await apiGet(`/projects/${projectId}`);

        if (projectResponse.success && projectResponse.data) {
          const projectData = projectResponse.data;

          // Find the subContractDetail in project's subContracts array
          const subContractDetail = projectData.subContracts?.find(
            (sc: any) => sc.subContractId?._id === contractId || sc.subContractId === contractId
          );

          if (subContractDetail && subContractDetail._id) {
            const detailId = subContractDetail._id;
            setSubContractDetailId(detailId);

            // Merge subContractDetail dates with projectData if they exist
            if (subContractDetail.contractDate) {
              projectData.contractDate = subContractDetail.contractDate;
            }
            if (subContractDetail.endDate) {
              projectData.deadline = subContractDetail.endDate;
            }
            if (subContractDetail.startDate) {
              projectData.startDate = subContractDetail.startDate;
            }

            // Fetch worker contracts from projectcontracts collection using subContractDetailId
            const workerContractsResponse = await apiGet(`/projectcontracts/detail/${detailId}`);
            if (workerContractsResponse.success && workerContractsResponse.data) {
              setWorkerContracts(workerContractsResponse.data);

              // If there are worker contracts, use the most recent one for display
              if (workerContractsResponse.data.length > 0) {
                const latestContract = workerContractsResponse.data[0]; // Already sorted by date in backend
                projectData.title = latestContract.title;
                projectData.numberOfMembers = latestContract.numberOfWorkers;
                projectData.workedDate = latestContract.workedDate;
              }
            }
          }

          setContract({
            ...response.data,
            project: projectData,
          });
        } else {
          setError('Failed to load project details');
        }
      } else {
        setError(response.error?.message || 'Failed to load contract details');
      }
    } catch (err: any) {
      console.error('Error fetching contract details:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Active: 'badge-soft-success',
      Inactive: 'badge-soft-danger',
      'In Progress': 'badge-soft-warning',
      Completed: 'badge-soft-info',
      'On Hold': 'badge-soft-secondary',
    };
    return statusMap[status] || 'badge-soft-secondary';
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Not Set';
    return dayjs(date).format('DD MMM YYYY');
  };

  const handleAddWorkers = async () => {
    if (!contract || !contractId || !projectId || !subContractDetailId) {
      toast.error('Missing contract or project information');
      return;
    }

    // Validation
    if (!title || !title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (numberOfWorkers < 1) {
      toast.error('Number of workers must be at least 1');
      return;
    }
    if (!workedDate) {
      toast.error('Worked date is required');
      return;
    }

    setSubmitting(true);
    try {
      // Save worker information to projectcontracts collection
      const response = await apiPost('/projectcontracts', {
        subContractDetailId,
        title,
        numberOfWorkers,
        workedDate: workedDate?.toISOString(),
      });

      if (response.success) {
        toast.success('Worker information saved successfully!');
        setShowAddMemberModal(false);
        // Reset form
        setTitle('');
        setNumberOfWorkers(1);
        setWorkedDate(dayjs());
        // Refresh contract details
        fetchContractDetails();
      } else {
        toast.error(response.error?.message || 'Failed to save worker information');
      }
    } catch (err: any) {
      console.error('Error adding workers:', err);
      toast.error(err.message || 'An error occurred while saving worker information');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            <i className="fa fa-exclamation-triangle me-2"></i>
            {error || 'Contract not found'}
          </div>
          <Link to={routes.contractlist} className="btn btn-primary">
            <i className="fa fa-arrow-left me-2"></i>
            Back to Contracts
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-md-12">
              {/* Page Header */}
              <div className="page-header">
                <div className="row align-items-center">
                  <div className="col-8">
                    <h4 className="page-title">Contract Details</h4>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <Link to={routes.contractlist}>Contracts</Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                          {contract.contractId || 'Contract Details'}
                        </li>
                      </ol>
                    </nav>
                  </div>
                  <div className="col-4 text-end">
                    <Link to={routes.contractlist} className="btn btn-secondary">
                      <i className="fa fa-arrow-left me-2"></i>
                      Back
                    </Link>
                  </div>
                </div>
              </div>
              {/* /Page Header */}

              {/* Contract Information Card */}
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="fa fa-file-contract me-2"></i>
                    Contract Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Contract Name</h6>
                      <p className="mb-0">
                        {contract.name}
                        {contract.contractId && (
                          <span className="badge badge-soft-primary ms-2">
                            {contract.contractId}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Status</h6>
                      <span className={`badge ${getStatusBadgeClass(contract.status)}`}>
                        {contract.status}
                      </span>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Company</h6>
                      <p className="mb-0">
                        <i className="fa fa-building me-2"></i>
                        {contract.company}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Email</h6>
                      <p className="mb-0">
                        <i className="fa fa-envelope me-2"></i>
                        {contract.email}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Phone</h6>
                      <p className="mb-0">
                        <i className="fa fa-phone me-2"></i>
                        {contract.phone}
                      </p>
                    </div>
                    {contract.address && (
                      <div className="col-md-6 mb-3">
                        <h6 className="text-muted mb-2">Address</h6>
                        <p className="mb-0">
                          <i className="fa fa-map-marker-alt me-2"></i>
                          {contract.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Information Card */}
              <div className="card mb-4">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fa fa-project-diagram me-2"></i>
                    Project Information
                  </h5>
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <i className="fa fa-user-plus me-2"></i>
                    Add Workers
                  </button>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Project Name</h6>
                      <p className="mb-0">
                        {contract.project.name}
                        {contract.project.projectId && (
                          <span className="badge badge-soft-secondary ms-2">
                            {contract.project.projectId}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Status</h6>
                      <span className={`badge ${getStatusBadgeClass(contract.project.status)}`}>
                        {contract.project.status}
                      </span>
                    </div>
                    {contract.project.description && (
                      <div className="col-12 mb-3">
                        <h6 className="text-muted mb-2">Description</h6>
                        <p className="mb-0">{contract.project.description}</p>
                      </div>
                    )}
                    <div className="col-md-4 mb-3">
                      <h6 className="text-muted mb-2">Contract Date</h6>
                      <p className="mb-0">
                        <i className="fa fa-calendar text-primary me-2"></i>
                        {formatDate(contract.project.contractDate)}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <h6 className="text-muted mb-2">Start Date</h6>
                      <p className="mb-0">
                        <i className="fa fa-calendar-check text-success me-2"></i>
                        {formatDate(contract.project.startDate)}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <h6 className="text-muted mb-2">Deadline</h6>
                      <p className="mb-0">
                        <i className="fa fa-calendar-times text-danger me-2"></i>
                        {formatDate(contract.project.deadline)}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <h6 className="text-muted mb-2">Total Workers</h6>
                      <p className="mb-0">
                        <i className="fa fa-hard-hat text-info me-2"></i>
                        {contract.project.numberOfMembers || 0} Worker
                        {(contract.project.numberOfMembers || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {contract.project.totalAmount && (
                      <div className="col-md-6 mb-3">
                        <h6 className="text-muted mb-2">Contract Amount</h6>
                        <p className="mb-0">
                          <i className="fa fa-dollar-sign text-warning me-2"></i>
                          {contract.project.currency || '$'}
                          {contract.project.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Workers Details Card */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fa fa-hard-hat me-2"></i>
                    Workers Details ({workerContracts.length})
                  </h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <i className="fa fa-plus me-2"></i>
                    Add Workers
                  </button>
                </div>
                <div className="card-body">
                  {workerContracts.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fa fa-hard-hat fa-3x text-muted mb-3"></i>
                      <p className="text-muted">No workers assigned yet</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowAddMemberModal(true)}
                      >
                        <i className="fa fa-plus me-2"></i>
                        Add Workers
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Title</th>
                            <th>Number of Workers</th>
                            <th>Worked Date</th>
                            <th>Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerContracts.map((wc: any) => (
                            <tr key={wc._id}>
                              <td>
                                <strong>{wc.title}</strong>
                              </td>
                              <td>
                                <span className="badge badge-soft-primary">
                                  <i className="fa fa-users me-1"></i>
                                  {wc.numberOfWorkers} Worker{wc.numberOfWorkers !== 1 ? 's' : ''}
                                </span>
                              </td>
                              <td>
                                <i className="fa fa-calendar-check text-info me-2"></i>
                                {formatDate(wc.workedDate)}
                              </td>
                              <td>
                                <i className="fa fa-clock text-muted me-2"></i>
                                {formatDate(wc.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          className="modal fade show d-block"
          id="add_workers_modal"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Workers</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddMemberModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted mb-3">
                    <strong>Project:</strong> {contract?.project.name || '—'}
                    {contract?.project.projectId && (
                      <span className="badge badge-soft-secondary ms-2">
                        {contract.project.projectId}
                      </span>
                    )}
                  </p>
                  <p className="text-muted mb-4">
                    <strong>Contract:</strong> {contract?.name || '—'}
                    {contract?.contractId && (
                      <span className="badge badge-soft-primary ms-2">{contract.contractId}</span>
                    )}
                  </p>
                </div>

                <form>
                  {/* Title */}
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter title"
                      required
                    />
                    <small className="text-muted">
                      Enter a title or description for this worker assignment
                    </small>
                  </div>

                  {/* Number of Workers */}
                  <div className="mb-3">
                    <label htmlFor="numberOfWorkers" className="form-label">
                      Total Workers <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="numberOfWorkers"
                      min="1"
                      value={numberOfWorkers}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === '0') {
                          setNumberOfWorkers(1);
                        } else {
                          setNumberOfWorkers(parseInt(value, 10) || 1);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="Enter number of workers"
                      required
                    />
                    <small className="text-muted">
                      Specify how many workers will be assigned to this project
                    </small>
                  </div>

                  {/* Worked Date */}
                  <div className="mb-3">
                    <label htmlFor="workedDate" className="form-label">
                      Worked Date <span className="text-danger">*</span>
                    </label>
                    <div className="input-icon position-relative">
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        value={workedDate}
                        onChange={(date) => setWorkedDate(date)}
                        getPopupContainer={() =>
                          document.getElementById('add_workers_modal') || document.body
                        }
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                    </div>
                    <small className="text-muted">
                      Select the date when workers worked on this project
                    </small>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddMemberModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddWorkers}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-plus me-2"></i>
                      Add Workers
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ContractDetails;
