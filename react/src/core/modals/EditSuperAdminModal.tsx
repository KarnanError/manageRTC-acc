/**
 * Edit SuperAdmin Modal Component
 * Modal for editing an existing Super Admin user
 */

import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useSuperAdminUsers } from '../../hooks/useSuperAdminUsers';

const DEFAULT_AVATAR = 'assets/img/profiles/profile.png';

interface SuperAdminUser {
  _id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  profileImage?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
}

interface EditSuperAdminModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: SuperAdminUser | null;
}

const EditSuperAdminModal: React.FC<EditSuperAdminModalProps> = ({ show, onClose, onSuccess, user }) => {
  const { updateUser, saving } = useSuperAdminUsers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    address: '',
    avatarUrl: DEFAULT_AVATAR,
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'pending',
  });

  const [errors, setErrors] = useState<any>({});
  const [imageUpload, setImageUpload] = useState(false);

  // Populate form when user changes
  useEffect(() => {
    if (show && user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        gender: user.gender || '',
        address: user.address || '',
        avatarUrl: user.profileImage || DEFAULT_AVATAR,
        status: user.status,
      });
      setErrors({});
      setImageUpload(false);
    }
  }, [show, user]);

  const validate = () => {
    const newErrors: any = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedFormats.includes(file.type)) {
      toast.error("Please upload image file only (JPG, JPEG, PNG).");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB.");
      return;
    }

    setImageUpload(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", "amasqis");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dwc3b5zfe/image/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, avatarUrl: data.secure_url }));
        toast.success("Image uploaded successfully!");
      }
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
      console.error("Image upload error:", error);
    } finally {
      setImageUpload(false);
    }
  };

  const handleResetImage = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: DEFAULT_AVATAR }));
    toast.info("Profile image reset to default.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      gender: formData.gender,
      address: formData.address.trim() || undefined,
      profileImage: formData.avatarUrl !== DEFAULT_AVATAR ? formData.avatarUrl : undefined,
      status: formData.status,
    };

    const result = await updateUser(user!._id, submitData);

    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrors({ submit: result.error });
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!show || !user) return null;

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} id="edit_superadmin" tabIndex={-1} aria-labelledby="edit_superadmin" aria-hidden="true" style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Super Admin</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleClose} disabled={saving}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger" role="alert">
                  {errors.submit}
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={saving}
                  />
                  {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={saving}
                  />
                  {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Email <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={saving}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                <small className="form-text text-muted">
                  ⚠️ Changing email will update the Clerk user's email
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={saving}
                  placeholder="+1 234 567 8900"
                />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Gender <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={saving}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Address (Optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={saving}
                  placeholder="Enter full address"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Profile Image (Optional)</label>
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar avatar-xl">
                    <img
                      src={formData.avatarUrl}
                      alt="Profile"
                      className="avatar-img rounded-circle"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      disabled={saving || imageUpload}
                    />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving || imageUpload}
                      >
                        {imageUpload ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-upload me-1"></i>
                            Upload Image
                          </>
                        )}
                      </button>
                      {formData.avatarUrl !== DEFAULT_AVATAR && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={handleResetImage}
                          disabled={saving || imageUpload}
                        >
                          <i className="ti ti-refresh me-1"></i>
                          Reset
                        </button>
                      )}
                    </div>
                    <small className="form-text text-muted d-block mt-1">
                      Allowed formats: JPG, JPEG, PNG (Max 2MB)
                    </small>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Status <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  disabled={saving}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                {errors.status && <div className="invalid-feedback">{errors.status}</div>}
              </div>

              <div className="alert alert-warning mb-0" role="alert">
                <strong>Important:</strong>
                <ul className="mb-0 mt-2">
                  <li>Status changes will immediately affect the user's access</li>
                  <li>Suspended users cannot access the system</li>
                  <li>Email updates will sync with Clerk</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={handleClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : (
                  'Update Super Admin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSuperAdminModal;
