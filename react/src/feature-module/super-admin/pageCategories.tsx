import React, { useState, useEffect } from "react";
import IconPicker from "../../core/common/icon-picker/IconPicker";

// API Base URL
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface PageCategory {
  _id: string;
  identifier: string;
  displayName: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
  stats?: {
    totalPages: number;
    l1MenuGroups: number;
    directChildren: number;
  };
}

interface FormData {
  identifier: string;
  displayName: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
}

interface PageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange: () => void;
}

const PageCategoriesModal: React.FC<PageCategoriesModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChange
}) => {
  // State
  const [categories, setCategories] = useState<PageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<PageCategory | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    identifier: '',
    displayName: '',
    label: '',
    description: '',
    icon: 'ti ti-folder',
    sortOrder: 0,
  });

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/rbac/categories?includeCounts=true`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = mode === 'create'
        ? `${API_BASE}/api/rbac/categories`
        : `${API_BASE}/api/rbac/categories/${selectedCategory?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setShowFormModal(false);
        await fetchCategories();
        onCategoriesChange(); // Notify parent to refresh
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, displayName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${displayName}"?`)) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/rbac/categories/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        onCategoriesChange(); // Notify parent to refresh
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/rbac/categories/${id}/toggle-status`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        onCategoriesChange(); // Notify parent to refresh
      } else {
        alert(data.error || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to toggle status');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      identifier: '',
      displayName: '',
      label: '',
      description: '',
      icon: 'ti ti-folder',
      sortOrder: categories.length * 10 + 10,
    });
    setMode('create');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (category: PageCategory) => {
    setFormData({
      identifier: category.identifier,
      displayName: category.displayName,
      label: category.label,
      description: category.description || '',
      icon: category.icon,
      sortOrder: category.sortOrder,
    });
    setSelectedCategory(category);
    setMode('edit');
    setShowFormModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-folders me-2"></i> Manage Page Categories
            </h5>
            <button
              type="button"
              className="btn-close custom-btn-close"
              onClick={onClose}
            >
              <i className="ti ti-x" />
            </button>
          </div>

          <div className="modal-body">
            {/* Actions Bar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="text-muted">Total Categories: </span>
                <span className="badge bg-primary">{categories.length}</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleOpenCreateModal}
                disabled={saving}
              >
                <i className="ti ti-plus me-2"></i> Add Category
              </button>
            </div>

            {/* Categories Table */}
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">Loading...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '8%' }}>Identifier</th>
                      <th style={{ width: '18%' }}>Display Name</th>
                      <th style={{ width: '12%' }}>Label</th>
                      <th style={{ width: '22%' }}>Description</th>
                      <th style={{ width: '10%' }}>Pages</th>
                      <th style={{ width: '8%' }}>Icon</th>
                      <th style={{ width: '6%' }}>Sort</th>
                      <th style={{ width: '7%' }}>Status</th>
                      <th style={{ width: '11%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const hasPages = (category.stats?.totalPages || 0) > 0;
                      const cannotDelete = category.isSystem || hasPages;

                      return (
                        <tr key={category._id} className={category.isActive ? '' : 'table-light'}>
                          <td><span className="badge bg-primary">{category.identifier}</span></td>
                          <td className="fw-medium">{category.displayName}</td>
                          <td><code className="small">{category.label}</code></td>
                          <td>{category.description || '-'}</td>
                          <td>
                            <span className={`badge ${hasPages ? 'bg-info' : 'bg-secondary'}`}>
                              {category.stats?.totalPages || 0} pages
                            </span>
                          </td>
                          <td>
                            <i className={`${category.icon} me-1`}></i>
                            <small className="text-muted">{category.icon}</small>
                          </td>
                          <td>{category.sortOrder}</td>
                          <td>
                            <span className={`badge ${category.isActive ? 'bg-success' : 'bg-danger'}`}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleOpenEditModal(category)}
                                title="Edit"
                              >
                                <i className="ti ti-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleToggleStatus(category._id)}
                                title="Toggle Status"
                              >
                                <i className="ti ti-power-off"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(category._id, category.displayName)}
                                disabled={cannotDelete}
                                title={
                                  category.isSystem
                                    ? "Cannot delete system category"
                                    : hasPages
                                    ? `Cannot delete: ${category.stats?.totalPages} pages assigned`
                                    : "Delete"
                                }
                              >
                                <i className="ti ti-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-5">
                          <i className="ti ti-folders-off text-muted" style={{ fontSize: '48px' }}></i>
                          <p className="text-muted mt-2">No categories found</p>
                          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                            <i className="ti ti-plus me-2"></i> Add First Category
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {/* Category Form Modal (Nested) */}
          {showFormModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {mode === 'create' && 'Add New Category'}
                      {mode === 'edit' && 'Edit Category'}
                    </h5>
                    <button
                      type="button"
                      className="btn-close custom-btn-close"
                      onClick={() => setShowFormModal(false)}
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-4">
                          <label className="form-label">Identifier *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value.toUpperCase() })}
                            placeholder="e.g., I, II, III"
                            required
                            disabled={mode === 'edit'}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Display Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="e.g., Main Menu"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Label *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value.toLowerCase() })}
                            placeholder="e.g., main-menu"
                            required
                          />
                        </div>
                      </div>

                      <div className="row mt-3">
                        <div className="col-md-8">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description"
                          />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label">Icon</label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className={formData.icon || 'ti ti-folder'}></i>
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.icon ? formData.icon.replace('ti ti-', '').toUpperCase() : ''}
                              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                              placeholder="Choose an icon..."
                              readOnly
                              style={{ cursor: 'pointer' }}
                              onClick={() => setShowIconPicker(true)}
                            />
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={() => setShowIconPicker(true)}
                              title="Choose Icon"
                            >
                              <i className="ti ti-apps"></i>
                            </button>
                          </div>
                          <small className="text-muted">
                            {formData.icon && formData.icon !== 'ti ti-folder' ? (
                              <span className="text-success">
                                <i className="ti ti-check"></i> {formData.icon}
                              </span>
                            ) : (
                              'Click to browse icons'
                            )}
                          </small>
                        </div>
                        <div className="col-md-2">
                          <label className="form-label">Sort Order</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.sortOrder}
                            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-light me-2"
                        onClick={() => setShowFormModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                          </>
                        ) : (
                          mode === 'create' ? 'Create Category' : 'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Icon Picker Modal */}
          <IconPicker
            isOpen={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            onSelect={(icon) => setFormData({ ...formData, icon })}
            currentIcon={formData.icon}
          />
        </div>
      </div>
    </div>
  );
};

export default PageCategoriesModal;
