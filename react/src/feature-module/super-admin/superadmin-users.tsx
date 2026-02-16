/**
 * Super Admin Users Page
 * Page for managing Super Admin users
 * Create, edit, delete, and manage superadmin accounts
 */

import React, { useState } from 'react';
import Footer from '../../core/common/footer';
import AddSuperAdminModal from '../../core/modals/AddSuperAdminModal';
import EditSuperAdminModal from '../../core/modals/EditSuperAdminModal';
import { useSuperAdminUsers } from '../../hooks/useSuperAdminUsers';
import { all_routes } from '../router/all_routes';

const SuperAdminUsers: React.FC = () => {
  const {
    users,
    stats,
    loading,
    saving,
    error,
    fetchUsers,
    deleteUser,
    resetPassword,
    toggleStatus,
    resendInvite,
    refreshMetadata,
  } = useSuperAdminUsers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userForPassword, setUserForPassword] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-danger';
      case 'suspended':
        return 'bg-warning';
      case 'pending':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  // Handle delete
  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      const result = await deleteUser(userToDelete._id);
      if (result.success) {
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        alert(result.error);
      }
    }
  };

  // Handle password reset
  const handlePasswordReset = (user: any) => {
    setUserForPassword(user);
    setShowPasswordModal(true);
  };

  const handleSendPasswordReset = async () => {
    if (userForPassword) {
      const newPassword = generatePassword(16);
      const result = await resetPassword(userForPassword._id, newPassword);
      if (result.success) {
        setShowPasswordModal(false);
        setUserForPassword(null);
        alert('Password has been reset and email has been sent to the user.');
      } else {
        alert(result.error);
      }
    }
  };

  // Generate random password
  const generatePassword = (length: number = 16) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*()'[Math.floor(Math.random() * 10)];

    for (let i = password.length; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Handle status toggle
  const handleStatusToggle = async (user: any) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const result = await toggleStatus(user._id, newStatus);
    if (!result.success) {
      alert(result.error);
    }
  };

  // Handle resend invite
  const handleResendInvite = async (user: any) => {
    const result = await resendInvite(user._id);
    if (result.success) {
      alert('Invitation has been resent to the user.');
    } else {
      alert(result.error);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="page-wrapper">
        <div className="content container-fluid">
          {/* Page Header */}
          <div className="d-md-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="page-title mb-1">Super Admin Users</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href={all_routes.superAdminDashboard}>Home</a></li>
                  <li className="breadcrumb-item active" aria-current="page">Super Admin Users</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <i className="ti ti-plus me-1"></i>
                Add Super Admin
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="row mb-4">
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card stats-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="stats-label mb-1">Total Super Admins</p>
                        <h4 className="stats-value mb-0">{stats.total}</h4>
                      </div>
                      <div className="stats-icon bg-primary">
                        <i className="ti ti-shield"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card stats-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="stats-label mb-1">Active</p>
                        <h4 className="stats-value mb-0 text-success">{stats.active}</h4>
                      </div>
                      <div className="stats-icon bg-success">
                        <i className="ti ti-check"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card stats-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="stats-label mb-1">Inactive</p>
                        <h4 className="stats-value mb-0 text-danger">{stats.inactive}</h4>
                      </div>
                      <div className="stats-icon bg-danger">
                        <i className="ti ti-x"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 col-sm-6 mb-3">
                <div className="card stats-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="stats-label mb-1">Pending</p>
                        <h4 className="stats-value mb-0 text-warning">{stats.pending}</h4>
                      </div>
                      <div className="stats-icon bg-warning">
                        <i className="ti ti-time"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="col-md-5 text-end">
                  <button
                    className="btn btn-outline-secondary me-2"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      fetchUsers();
                    }}
                  >
                    <i className="ti ti-refresh me-1"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-users display-4 text-muted mb-3"></i>
                  <p className="text-muted">No Super Admin users found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-md me-2">
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.fullName}
                                    className="avatar-img rounded-circle"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                                    }}
                                  />
                                ) : null}
                                <span style={{ display: user.profileImage ? 'none' : 'block' }}>
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="fw-bold">{user.fullName}</div>
                                <small className="text-muted">Created by: {user.creatorName || 'System'}</small>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>
                            {user.gender === 'male' && <span className="badge bg-primary">Male</span>}
                            {user.gender === 'female' && <span className="badge bg-info">Female</span>}
                            {user.gender === 'other' && <span className="badge bg-secondary">Other</span>}
                            {user.gender === 'prefer_not_to_say' && <span className="badge bg-light text-dark">Prefer not to say</span>}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(user.status)}`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="text-end">
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                              >
                                <i className="ti ti-more"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedUser(user);
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <i className="ti ti-pencil me-2"></i>
                                    Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePasswordReset(user);
                                    }}
                                  >
                                    <i className="ti ti-key me-2"></i>
                                    Reset Password
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleStatusToggle(user);
                                    }}
                                  >
                                    <i className="ti ti-power-off me-2"></i>
                                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleResendInvite(user);
                                    }}
                                  >
                                    <i className="ti ti-mail me-2"></i>
                                    Resend Invite
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      const result = await refreshMetadata(user._id);
                                      if (result.success) {
                                        alert(result.message + (result.data?.note ? '\n\n' + result.data.note : ''));
                                      } else {
                                        alert(result.error);
                                      }
                                    }}
                                  >
                                    <i className="ti ti-refresh me-2"></i>
                                    Refresh Metadata
                                  </a>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <a
                                    href="#"
                                    className="dropdown-item text-danger"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteClick(user);
                                    }}
                                  >
                                    <i className="ti ti-trash me-2"></i>
                                    Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
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

      <Footer />

      {/* Add SuperAdmin Modal */}
      <AddSuperAdminModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchUsers();
        }}
      />

      {/* Edit SuperAdmin Modal */}
      <EditSuperAdminModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          fetchUsers();
        }}
        user={selectedUser}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" id="delete_superadmin" tabIndex={-1} style={{ display: 'block' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Super Admin</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-3">
                  <div className={`avatar avatar-lg me-3 ${userToDelete?.profileImage ? '' : 'bg-danger'}`}>
                    {userToDelete?.profileImage ? (
                      <img
                        src={userToDelete.profileImage}
                        alt={userToDelete.fullName}
                        className="avatar-img rounded-circle"
                      />
                    ) : (
                      <>{userToDelete?.firstName?.charAt(0)}{userToDelete?.lastName?.charAt(0)}</>
                    )}
                  </div>
                  <div>
                    <h5 className="mb-1">{userToDelete?.fullName}</h5>
                    <p className="text-muted mb-0">{userToDelete?.email}</p>
                  </div>
                </div>

                <div className="alert alert-warning" role="alert">
                  <strong>⚠️ Warning:</strong> You are about to delete this Super Admin user.
                  <ul className="mb-0 mt-2">
                    <li>This action cannot be undone</li>
                    <li>The user will lose access to the system</li>
                    <li>Make sure this is the intended action</li>
                  </ul>
                </div>

                <p className="mb-0">Are you sure you want to delete <strong>{userToDelete?.fullName}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Super Admin'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal fade show" id="reset_password" tabIndex={-1} style={{ display: 'block' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reset Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setUserForPassword(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Reset password for <strong>{userForPassword?.fullName}</strong> ({userForPassword?.email})</p>

                <div className="alert alert-info" role="alert">
                  <i className="ti ti-info-alt me-2"></i>
                  A new password will be generated and sent to the user's email address.
                </div>

                <p className="mb-0">Do you want to continue?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setUserForPassword(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendPasswordReset}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    'Reset & Send Email'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showAddModal || showEditModal || showDeleteModal || showPasswordModal) && (
        <div className="modal-backdrop fade show" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setShowDeleteModal(false);
          setShowPasswordModal(false);
        }}></div>
      )}
    </>
  );
};

export default SuperAdminUsers;
