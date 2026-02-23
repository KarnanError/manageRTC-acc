import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import Footer from '../../../core/common/footer';
import { get as apiGet } from '../../../services/api';
import { all_routes } from '../../router/all_routes';

interface ProjectDetail {
  _id: string;
  projectName: string;
  projectId?: string;
  status: string;
  startDate: string;
  deadline: string;
  endDate?: string;
  contractDate?: string;
  numberOfMembers?: number;
  totalWorkers?: number;
  totalAmount?: number;
  currency?: string;
  description?: string;
}

interface ContractWithProjects {
  _id: string;
  contractId?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  address?: string;
  projects: ProjectDetail[];
  projectCount: number;
}

const ContractList = () => {
  const routes = all_routes;
  const [contracts, setContracts] = useState<ContractWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalContracts, setTotalContracts] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [activeContracts, setActiveContracts] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchContractsWithProjects();
  }, []);

  const fetchContractsWithProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/subcontracts/with-projects');
      if (response.success && response.data) {
        const contractsData = Array.isArray(response.data) ? response.data : [];

        // Filter to only show contracts that have assigned projects
        const contractsWithAssignedProjects = contractsData.filter(
          (c: ContractWithProjects) => c.projectCount > 0 && c.projects.length > 0
        );

        setContracts(contractsWithAssignedProjects);

        // Calculate stats
        setTotalContracts(contractsWithAssignedProjects.length);
        setActiveContracts(
          contractsWithAssignedProjects.filter((c: ContractWithProjects) => c.status === 'Active')
            .length
        );
        setTotalProjects(
          contractsWithAssignedProjects.reduce(
            (sum: number, c: ContractWithProjects) => sum + c.projectCount,
            0
          )
        );
        setTotalMembers(
          contractsWithAssignedProjects.reduce(
            (sum: number, c: ContractWithProjects) =>
              sum +
              c.projects.reduce(
                (projectSum: number, p: ProjectDetail) =>
                  projectSum + (p.numberOfMembers || 0) + (p.totalWorkers || 0),
                0
              ),
            0
          )
        );
      } else {
        setError(response.error?.message || 'Failed to load contracts');
      }
    } catch (err: any) {
      console.error('Error fetching contracts with projects:', err);
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

  const getPriorityColor = (priority?: string) => {
    const priorityMap: { [key: string]: string } = {
      High: 'badge badge-soft-danger',
      Medium: 'badge badge-soft-warning',
      Low: 'badge badge-soft-success',
    };
    return priorityMap[priority || 'Medium'] || 'badge badge-soft-secondary';
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Active: 'badge badge-soft-success',
      Inactive: 'badge badge-soft-danger',
      'In Progress': 'badge badge-soft-warning',
      Completed: 'badge badge-soft-info',
      'On Hold': 'badge badge-soft-secondary',
    };
    return statusMap[status] || 'badge badge-soft-secondary';
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Not Set';
    return dayjs(date).format('DD MMM YYYY');
  };

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
                    <h4 className="page-title">
                      Contracts with Assigned Projects{' '}
                      <span className="count-title">{totalContracts}</span>
                    </h4>
                  </div>
                  <div className="col-4 text-end">
                    <div className="head-icons">
                      <CollapseHeader />
                    </div>
                  </div>
                </div>
              </div>
              {/* /Page Header */}

              {/* Stats Cards */}
              <div className="row">
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>{totalContracts}</h4>
                        <span className="text-muted">Contracts with Projects</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>{activeContracts}</h4>
                        <span className="text-muted">Active Contracts</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>{totalProjects}</h4>
                        <span className="text-muted">Total Projects</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="statistic-header">
                        <h4>{totalMembers}</h4>
                        <span className="text-muted">Total Members</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Stats Cards */}

              {/* Contracts List */}
              <div className="card">
                <div className="card-body">
                  {loading && (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}

                  {error && !loading && (
                    <div className="alert alert-danger" role="alert">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}

                  {!loading && !error && contracts.length === 0 && (
                    <div className="text-center py-5">
                      <i className="fa fa-folder-open fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No Contracts with Assigned Projects</h5>
                      <p className="text-muted">
                        Contracts will appear here once they are assigned to projects
                      </p>
                    </div>
                  )}

                  {!loading && !error && contracts.length > 0 && (
                    <div className="contracts-accordion">
                      {contracts.map((contract) => (
                        <div key={contract._id} className="contract-item mb-4">
                          {/* Contract Header */}
                          <div className="contract-header p-3 mb-3 bg-light border-bottom">
                            <div className="row align-items-center">
                              <div className="col-md-6">
                                <h5 className="mb-1">
                                  {contract.name}
                                  {contract.contractId && (
                                    <span className="badge badge-soft-primary ms-2">
                                      {contract.contractId}
                                    </span>
                                  )}
                                </h5>
                                <div className="text-muted small">
                                  {contract.company && (
                                    <span className="me-3">
                                      <i className="fa fa-building me-1"></i>
                                      {contract.company}
                                    </span>
                                  )}
                                  {contract.email && (
                                    <span className="me-3">
                                      <i className="fa fa-envelope me-1"></i>
                                      {contract.email}
                                    </span>
                                  )}
                                  {contract.phone && (
                                    <span>
                                      <i className="fa fa-phone me-1"></i>
                                      {contract.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="col-md-6 text-end">
                                <span
                                  className={`badge ${getStatusBadgeClass(contract.status)} me-2`}
                                >
                                  {contract.status}
                                </span>
                                <span className="badge badge-soft-info">
                                  {contract.projectCount} Project
                                  {contract.projectCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Projects */}
                          <div className="contract-projects p-3">
                            {contract.projects.length === 0 ? (
                              <div className="text-center py-3 text-muted">
                                <i className="fa fa-info-circle me-2"></i>
                                No projects assigned to this contract
                              </div>
                            ) : (
                              <div className="row">
                                {contract.projects.map((project) => (
                                  <div
                                    key={project._id}
                                    className="col-xxl-3 col-lg-4 col-md-6 mb-3"
                                  >
                                    <div className="card shadow-sm h-100">
                                      <div className="card-body">
                                        {/* Project Header */}
                                        <div className="d-flex align-items-start justify-content-between mb-3">
                                          <div className="flex-grow-1">
                                            <h6 className="mb-2">
                                              <Link
                                                to={`${routes.projectdetails.replace(':projectId', project._id)}`}
                                                className="text-dark text-decoration-none"
                                              >
                                                {project.projectName || 'Unnamed Project'}
                                              </Link>
                                            </h6>
                                            <div className="d-flex gap-2 flex-wrap mb-2">
                                              {project.projectId && (
                                                <span className="badge badge-soft-secondary">
                                                  {project.projectId}
                                                </span>
                                              )}
                                              <span className={getStatusColor(project.status)}>
                                                {project.status}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Description */}
                                        {project.description && (
                                          <div className="mb-3 pb-3 border-bottom">
                                            <p
                                              className="text-muted small mb-0 text-truncate"
                                              style={{ maxHeight: '60px', overflow: 'hidden' }}
                                            >
                                              {project.description}
                                            </p>
                                          </div>
                                        )}

                                        {/* Project Details Grid */}
                                        <div className="mb-3">
                                          <div className="row g-2">
                                            {/* Contract Date */}
                                            <div className="col-6">
                                              <div className="d-flex align-items-center">
                                                <i className="fa fa-file-signature text-primary me-2"></i>
                                                <div>
                                                  <small className="text-muted d-block">
                                                    Contract Date
                                                  </small>
                                                  <span className="small fw-medium">
                                                    {project.contractDate
                                                      ? dayjs(project.contractDate).format(
                                                          'DD MMM YYYY'
                                                        )
                                                      : '—'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Start Date */}
                                            <div className="col-6">
                                              <div className="d-flex align-items-center">
                                                <i className="fa fa-calendar-days text-success me-2"></i>
                                                <div>
                                                  <small className="text-muted d-block">
                                                    Start Date
                                                  </small>
                                                  <span className="small fw-medium">
                                                    {formatDate(project.startDate)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Deadline */}
                                            <div className="col-6">
                                              <div className="d-flex align-items-center">
                                                <i className="fa fa-calendar-check text-danger me-2"></i>
                                                <div>
                                                  <small className="text-muted d-block">
                                                    End Date
                                                  </small>
                                                  <span className="small fw-medium">
                                                    {formatDate(project.endDate)}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Team Members */}
                                            <div className="col-6">
                                              <div className="d-flex align-items-center">
                                                <i className="fa fa-users text-info me-2"></i>
                                                <div>
                                                  <small className="text-muted d-block">
                                                    Members
                                                  </small>
                                                  <span className="small fw-medium">
                                                    {(project.numberOfMembers || 0) +
                                                      (project.totalWorkers || 0) || '—'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Contract Amount */}
                                            {project.totalAmount && (
                                              <div className="col-12">
                                                <div className="d-flex align-items-center">
                                                  <i className="fa fa-dollar-sign text-warning me-2"></i>
                                                  <div>
                                                    <small className="text-muted d-block">
                                                      Contract Amount
                                                    </small>
                                                    <span className="small fw-medium">
                                                      {project.currency || '$'}
                                                      {project.totalAmount.toLocaleString()}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="d-grid">
                                          <Link
                                            to={routes.contractdetails
                                              .replace(':contractId', contract._id)
                                              .replace(':projectId', project._id)}
                                            className="btn btn-sm btn-primary"
                                          >
                                            <i className="fa fa-eye me-1"></i>
                                            View Details
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* /Contracts List */}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContractList;
