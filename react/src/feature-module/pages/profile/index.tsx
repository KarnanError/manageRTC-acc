import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import CommonSelect from '../../../core/common/commonSelect';
import Footer from '../../../core/common/footer';
import { useProfileExtendedREST } from '../../../hooks/useProfileExtendedREST';
import { Profile, useProfileRest } from '../../../hooks/useProfileRest';
import { resolveDesignation } from '../../../utils/designationUtils';
import { all_routes } from '../../router/all_routes';

type PasswordField = 'oldPassword' | 'newPassword' | 'confirmPassword' | 'currentPassword';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// INLINE SECTION COMPONENTS (NO SEPARATE FILES NEEDED)
// ============================================

// EditableSection Wrapper Component
interface EditableSectionProps {
  title: string;
  icon: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  children: React.ReactNode;
  customActions?: React.ReactNode;
}

const EditableSection: React.FC<EditableSectionProps> = ({
  title,
  icon,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
  children,
  customActions
}) => {
  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="mb-0">
          <i className={`ti ${icon} me-2`} />
          {title}
        </h5>
        <div className="d-flex gap-2">
          {customActions}
          {!isEditing && (
            <Link
              to="#"
              className="btn btn-light btn-sm"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
            >
              <i className="ti ti-edit me-1" />
              Edit
            </Link>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
};

// Basic Info Section Component
const BasicInfoSection: React.FC<{ profile: Profile | null; profilePhoto: string | null; imageUpload: boolean; fileInputRef: React.RefObject<HTMLInputElement>; onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemovePhoto: () => void; }> = ({
  profile,
  profilePhoto,
  imageUpload,
  fileInputRef,
  onImageUpload,
  onRemovePhoto
}) => {
  if (!profile) return null;

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="avatar avatar-xxl me-3 position-relative" style={{ width: '120px', height: '120px', flexShrink: 0 }}>
            {profilePhoto || profile.profilePhoto ? (
              <img
                src={profilePhoto || profile.profilePhoto}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="rounded-circle"
                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar-placeholder bg-primary text-white d-flex align-items-center justify-content-center rounded-circle" style={{ width: '120px', height: '120px', fontSize: '48px' }}>
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </div>
            )}
            <div className="avatar-edit-icon position-absolute bottom-0 end-0">
              <label htmlFor="profilePhotoInput" className="btn btn-primary btn-sm rounded-circle" style={{ cursor: 'pointer', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-camera"></i>
              </label>
              <input
                type="file"
                id="profilePhotoInput"
                ref={fileInputRef}
                accept="image/*"
                onChange={onImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            {imageUpload && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded-circle">
                <div className="spinner-border text-white" role="status">
                  <span className="visually-hidden">Uploading...</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-grow-1">
            <h3 className="mb-1">{profile.firstName} {profile.lastName}</h3>
            <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
              <span className="text-muted">
                <i className="ti ti-id me-1" />
                {profile.employeeId || '--'}
              </span>
              <span className="text-muted">
                <i className="ti ti-briefcase me-1" />
                {resolveDesignation(profile.designation, '--')}
              </span>
              <span className="text-muted">
                <i className="ti ti-building me-1" />
                {profile.department || '--'}
              </span>
            </div>
            <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
              <span className="text-muted">
                <i className="ti ti-mail me-1" />
                {profile.email}
              </span>
              {profile.phone && (
                <span className="text-muted">
                  <i className="ti ti-phone me-1" />
                  {profile.phone}
                </span>
              )}
            </div>
            {profile.joiningDate && (
              <div className="mb-2">
                <span className="text-muted">
                  <i className="ti ti-calendar me-1" />
                  Joined: {new Date(profile.joiningDate).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
            {profile.status && (
              <span className={`badge ${profile.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                {profile.status}
              </span>
            )}
            {(profilePhoto || profile.profilePhoto) && (
              <button
                type="button"
                className="btn btn-sm btn-light text-danger ms-2"
                onClick={onRemovePhoto}
              >
                <i className="ti ti-trash me-1" />
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Personal Info Section
const PersonalInfoSection: React.FC<{ formData: any; isEditing: boolean; onChange: (field: string, value: any) => void; onSelect: (name: string, value: string) => void; genderOptions: any[]; countryOptions: any[]; }> = ({
  formData,
  isEditing,
  onChange,
  onSelect,
  genderOptions,
  countryOptions
}) => {
  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="row mb-3">
      <div className="col-md-4">
        <p className="text-muted mb-0">{label}</p>
      </div>
      <div className="col-md-8">
        <p className="fw-medium mb-0">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <>
      {!isEditing ? (
        <>
          <InfoRow
            label="Date of Birth"
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-GB') : undefined}
          />
          <InfoRow label="Gender" value={formData.gender} />
          <InfoRow label="Marital Status" value={formData.personal?.maritalStatus} />
          <InfoRow label="Nationality" value={formData.personal?.nationality} />
          <InfoRow label="Religion" value={formData.personal?.religion} />
          <InfoRow label="Passport No." value={formData.personal?.passport?.number} />
          <InfoRow
            label="Passport Expiry"
            value={formData.personal?.passport?.expiryDate ? new Date(formData.personal.passport.expiryDate).toLocaleDateString('en-GB') : undefined}
          />
          <InfoRow label="Number of Children" value={formData.personal?.noOfChildren?.toString()} />
        </>
      ) : (
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-control"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Gender</label>
            <CommonSelect
              className="select"
              options={genderOptions}
              value={formData.gender || 'Select'}
              onChange={(option: any) => onSelect('gender', option.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Marital Status</label>
            <select
              className="form-control"
              value={formData.personal?.maritalStatus || ''}
              onChange={(e) => onChange('personal.maritalStatus', e.target.value)}
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Nationality</label>
            <input
              type="text"
              className="form-control"
              value={formData.personal?.nationality || ''}
              onChange={(e) => onChange('personal.nationality', e.target.value)}
              placeholder="Enter nationality"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Religion</label>
            <input
              type="text"
              className="form-control"
              value={formData.personal?.religion || ''}
              onChange={(e) => onChange('personal.religion', e.target.value)}
              placeholder="Enter religion"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Passport No.</label>
            <input
              type="text"
              className="form-control"
              value={formData.personal?.passport?.number || ''}
              onChange={(e) => onChange('personal.passport.number', e.target.value)}
              placeholder="Enter passport number"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Passport Expiry</label>
            <input
              type="date"
              className="form-control"
              value={formData.personal?.passport?.expiryDate ? new Date(formData.personal.passport.expiryDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onChange('personal.passport.expiryDate', e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Passport Country</label>
            <CommonSelect
              className="select"
              options={countryOptions}
              value={formData.personal?.passport?.country || 'Select'}
              onChange={(option: any) => onSelect('personal.passport.country', option.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Number of Children</label>
            <input
              type="number"
              className="form-control"
              value={formData.personal?.noOfChildren || 0}
              onChange={(e) => onChange('personal.noOfChildren', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Address Info Section
const AddressInfoSection: React.FC<{ formData: any; isEditing: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; onSelect: (name: string, value: string) => void; countryOptions: any[]; stateOptions: any[]; cityOptions: any[]; }> = ({
  formData,
  isEditing,
  onChange,
  onSelect,
  countryOptions,
  stateOptions,
  cityOptions
}) => {
  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="row mb-3">
      <div className="col-md-4">
        <p className="text-muted mb-0">{label}</p>
      </div>
      <div className="col-md-8">
        <p className="fw-medium mb-0">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <>
      {!isEditing ? (
        <>
          <InfoRow label="Street" value={formData.address?.street} />
          <InfoRow label="City" value={formData.address?.city} />
          <InfoRow label="State" value={formData.address?.state} />
          <InfoRow label="Country" value={formData.address?.country} />
          <InfoRow label="Postal Code" value={formData.address?.postalCode} />
        </>
      ) : (
        <div className="row">
          <div className="col-md-12 mb-3">
            <label className="form-label">Street Address</label>
            <textarea
              className="form-control"
              name="address.street"
              value={formData.address?.street || ''}
              onChange={onChange}
              rows={2}
              placeholder="Enter street address"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">City</label>
            <CommonSelect
              className="select"
              options={cityOptions}
              value={formData.address?.city || 'Select'}
              onChange={(option: any) => onSelect('address.city', option.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">State</label>
            <CommonSelect
              className="select"
              options={stateOptions}
              value={formData.address?.state || 'Select'}
              onChange={(option: any) => onSelect('address.state', option.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Country</label>
            <CommonSelect
              className="select"
              options={countryOptions}
              value={formData.address?.country || 'Select'}
              onChange={(option: any) => onSelect('address.country', option.value)}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Postal Code</label>
            <input
              type="text"
              className="form-control"
              name="address.postalCode"
              value={formData.address?.postalCode || ''}
              onChange={onChange}
              placeholder="Enter postal code"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Bank Info Section
const BankInfoSection: React.FC<{ formData: any; isEditing: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; }> = ({
  formData,
  isEditing,
  onChange
}) => {
  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="row mb-3">
      <div className="col-md-4">
        <p className="text-muted mb-0">{label}</p>
      </div>
      <div className="col-md-8">
        <p className="fw-medium mb-0">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <>
      {!isEditing ? (
        <>
          <InfoRow label="Bank Name" value={formData.bankDetails?.bankName} />
          <InfoRow label="Account Number" value={formData.bankDetails?.accountNumber ? `****${formData.bankDetails.accountNumber.slice(-4)}` : undefined} />
          <InfoRow label="IFSC Code" value={formData.bankDetails?.ifscCode} />
          <InfoRow label="Branch" value={formData.bankDetails?.branch} />
          <InfoRow label="Account Type" value={formData.bankDetails?.accountType} />
        </>
      ) : (
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Bank Name</label>
            <input
              type="text"
              className="form-control"
              name="bankDetails.bankName"
              value={formData.bankDetails?.bankName || ''}
              onChange={onChange}
              placeholder="Enter bank name"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              className="form-control"
              name="bankDetails.accountNumber"
              value={formData.bankDetails?.accountNumber || ''}
              onChange={onChange}
              placeholder="Enter account number"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">IFSC Code</label>
            <input
              type="text"
              className="form-control"
              name="bankDetails.ifscCode"
              value={formData.bankDetails?.ifscCode || ''}
              onChange={onChange}
              placeholder="Enter IFSC code"
              maxLength={11}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Branch</label>
            <input
              type="text"
              className="form-control"
              name="bankDetails.branch"
              value={formData.bankDetails?.branch || ''}
              onChange={onChange}
              placeholder="Enter branch name"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Account Type</label>
            <select
              className="form-control"
              name="bankDetails.accountType"
              value={formData.bankDetails?.accountType || 'Savings'}
              onChange={onChange}
            >
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
              <option value="Salary">Salary</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};

// Emergency Contact Section
const EmergencyContactSection: React.FC<{ formData: any; isEditing: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({
  formData,
  isEditing,
  onChange
}) => {
  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="row mb-3">
      <div className="col-md-4">
        <p className="text-muted mb-0">{label}</p>
      </div>
      <div className="col-md-8">
        <p className="fw-medium mb-0">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <>
      {!isEditing ? (
        <>
          <InfoRow label="Contact Name" value={formData.emergencyContact?.name} />
          <InfoRow label="Relationship" value={formData.emergencyContact?.relationship} />
          <InfoRow label="Phone Number" value={formData.emergencyContact?.phone} />
        </>
      ) : (
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Contact Name</label>
            <input
              type="text"
              className="form-control"
              name="emergencyContact.name"
              value={formData.emergencyContact?.name || ''}
              onChange={onChange}
              placeholder="Enter contact name"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Relationship</label>
            <select
              className="form-control"
              name="emergencyContact.relationship"
              value={formData.emergencyContact?.relationship || ''}
              onChange={onChange as any}
            >
              <option value="">Select</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              name="emergencyContact.phone"
              value={formData.emergencyContact?.phone || ''}
              onChange={onChange}
              placeholder="Enter phone number"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Skills & Social Links Section
const SkillsSocialSection: React.FC<{ formData: any; isEditing: boolean; onSkillsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({
  formData,
  isEditing,
  onSkillsChange,
  onChange
}) => {
  return (
    <>
      <div className="mb-4">
        <h6 className="text-primary mb-3">Skills</h6>
        {!isEditing ? (
          <div className="d-flex flex-wrap gap-2">
            {formData.skills && formData.skills.length > 0 ? (
              formData.skills.map((skill: string, index: number) => (
                <span key={index} className="badge bg-light text-dark border py-2 px-3">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-muted mb-0">No skills added</p>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <label className="form-label">Skills (comma-separated)</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.skills?.join(', ') || ''}
              onChange={onSkillsChange}
              placeholder="e.g., JavaScript, React, Node.js"
            />
          </div>
        )}
      </div>

      <div>
        <h6 className="text-primary mb-3">Social Links</h6>
        {!isEditing ? (
          <div className="d-flex flex-wrap gap-2">
            {formData.socialLinks?.linkedin && (
              <Link to={formData.socialLinks.linkedin} target="_blank" className="btn btn-light">
                <i className="ti ti-brand-linkedin me-1" />LinkedIn
              </Link>
            )}
            {formData.socialLinks?.twitter && (
              <Link to={formData.socialLinks.twitter} target="_blank" className="btn btn-light">
                <i className="ti ti-brand-twitter me-1" />Twitter
              </Link>
            )}
            {formData.socialLinks?.facebook && (
              <Link to={formData.socialLinks.facebook} target="_blank" className="btn btn-light">
                <i className="ti ti-brand-facebook me-1" />Facebook
              </Link>
            )}
            {formData.socialLinks?.instagram && (
              <Link to={formData.socialLinks.instagram} target="_blank" className="btn btn-light">
                <i className="ti ti-brand-instagram me-1" />Instagram
              </Link>
            )}
            {!formData.socialLinks?.linkedin && !formData.socialLinks?.twitter && !formData.socialLinks?.facebook && !formData.socialLinks?.instagram && (
              <p className="text-muted mb-0">No social links added</p>
            )}
          </div>
        ) : (
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">LinkedIn</label>
              <input
                type="url"
                className="form-control"
                name="socialLinks.linkedin"
                value={formData.socialLinks?.linkedin || ''}
                onChange={onChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Twitter</label>
              <input
                type="url"
                className="form-control"
                name="socialLinks.twitter"
                value={formData.socialLinks?.twitter || ''}
                onChange={onChange}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Facebook</label>
              <input
                type="url"
                className="form-control"
                name="socialLinks.facebook"
                value={formData.socialLinks?.facebook || ''}
                onChange={onChange}
                placeholder="https://facebook.com/username"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Instagram</label>
              <input
                type="url"
                className="form-control"
                name="socialLinks.instagram"
                value={formData.socialLinks?.instagram || ''}
                onChange={onChange}
                placeholder="https://instagram.com/username"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Work Info Section
const WorkInfoSection: React.FC<{ workInfo: any; }> = ({ workInfo }) => {
  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="row mb-3">
      <div className="col-md-4">
        <p className="text-muted mb-0">{label}</p>
      </div>
      <div className="col-md-8">
        <p className="fw-medium mb-0">{value || '—'}</p>
      </div>
    </div>
  );

  if (!workInfo) {
    return <p className="text-muted">No work information available</p>;
  }

  return (
    <>
      <InfoRow label="Employee Type" value={workInfo.employeeType} />
      <InfoRow label="Work Mode" value={workInfo.workMode} />
      <InfoRow label="Work Location" value={workInfo.workLocation} />
      <InfoRow label="Reporting Manager" value={workInfo.reportingManager} />
      <InfoRow label="Shift Timing" value={workInfo.shiftTiming} />
      <InfoRow label="Weekly Off" value={workInfo.weeklyOff?.join(', ')} />
    </>
  );
};

// Career History Section
const CareerHistorySection: React.FC<{ careerHistory: any; }> = ({ careerHistory }) => {
  if (!careerHistory) {
    return <p className="text-muted">No career history available</p>;
  }

  // Transform career history into a flat array of timeline events
  const timelineEvents: any[] = [];

  // Add promotions
  if (careerHistory.promotions && careerHistory.promotions.length > 0) {
    careerHistory.promotions.forEach((promo: any) => {
      timelineEvents.push({
        type: `Promotion: ${promo.newDesignation || promo.promotionType}`,
        date: promo.effectiveDate,
        description: promo.previousDesignation
          ? `Promoted from ${promo.previousDesignation} to ${promo.newDesignation}`
          : promo.notes,
        icon: 'ti-arrow-up-circle',
        color: 'bg-success'
      });
    });
  }

  // Add resignation
  if (careerHistory.resignation) {
    timelineEvents.push({
      type: 'Resignation',
      date: careerHistory.resignation.resignationDate,
      description: careerHistory.resignation.reason || `Last working day: ${new Date(careerHistory.resignation.lastWorkingDay).toLocaleDateString('en-GB')}`,
      icon: 'ti-logout',
      color: 'bg-warning'
    });
  }

  // Add termination
  if (careerHistory.termination) {
    timelineEvents.push({
      type: 'Termination',
      date: careerHistory.termination.terminationDate,
      description: careerHistory.termination.reason || careerHistory.termination.type || 'Employment terminated',
      icon: 'ti-x-circle',
      color: 'bg-danger'
    });
  }

  // Add policies
  if (careerHistory.policies && careerHistory.policies.length > 0) {
    careerHistory.policies.forEach((policy: any) => {
      timelineEvents.push({
        type: `Policy: ${policy.name}`,
        date: policy.effectiveDate,
        description: policy.description || policy.category,
        icon: 'ti-file-text',
        color: 'bg-info'
      });
    });
  }

  // Sort by date (most recent first)
  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timelineEvents.length === 0) {
    return <p className="text-muted">No career history available</p>;
  }

  return (
    <div className="timeline">
      {timelineEvents.map((event, index) => (
        <div key={index} className="timeline-item mb-4 pb-4 border-bottom">
          <div className="d-flex">
            <div className={`timeline-marker ${event.color} me-3`} style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${event.icon} text-white`} />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <h6 className="mb-0">{event.type}</h6>
                <span className="text-muted fs-13">
                  <i className="ti ti-calendar me-1" />
                  {new Date(event.date).toLocaleDateString('en-GB')}
                </span>
              </div>
              {event.description && <p className="text-muted mb-0 fs-13">{event.description}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Assets & Policies Section
const AssetsPoliciesSection: React.FC<{ assets: any[]; }> = ({ assets }) => {
  if (!assets || assets.length === 0) {
    return <p className="text-muted">No assets assigned</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Type</th>
            <th>Serial Number</th>
            <th>Assigned Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => (
            <tr key={index}>
              <td className="fw-medium">{asset.name}</td>
              <td>{asset.type}</td>
              <td>
                {asset.serialNumber ? (
                  <code className="bg-light px-2 py-1 rounded">{asset.serialNumber}</code>
                ) : '—'}
              </td>
              <td>{new Date(asset.assignedDate).toLocaleDateString('en-GB')}</td>
              <td>
                <span className={`badge ${asset.status === 'Assigned' ? 'bg-success' : 'bg-secondary'}`}>
                  {asset.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// MAIN PROFILE PAGE COMPONENT
// ============================================

const ProfilePage = () => {
  const route = all_routes;
  const {
    currentUserProfile,
    fetchCurrentUserProfile,
    updateCurrentUserProfile,
    changePassword,
    loading
  } = useProfileRest();

  // Phase 4: Extended profile hook for new tabs
  const {
    workInfo,
    salaryInfo,
    statutoryInfo,
    myAssets,
    careerHistory,
  } = useProfileExtendedREST();

  // View/Edit mode states - separate for each section
  const [editingSections, setEditingSections] = useState({
    basic: false,
    personal: false,
    address: false,
    bank: false,
    emergency: false,
    skills: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Phase 4: Tab navigation state
  const [activeTab, setActiveTab] = useState<'personal' | 'work' | 'bank' | 'assets' | 'history'>('personal');

  // State for form data - main profile data from server
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password visibility states
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
    currentPassword: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility(prevState => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  // Country, state, city options
  const countryChoose = [
    { value: "Select", label: "Select" },
    { value: "USA", label: "USA" },
    { value: "Canada", label: "Canada" },
    { value: "UK", label: "UK" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
    { value: "India", label: "India" },
    { value: "Australia", label: "Australia" },
  ];

  const stateChoose = [
    { value: "Select", label: "Select" },
    { value: "california", label: "California" },
    { value: "Texas", label: "Texas" },
    { value: "New York", label: "New York" },
    { value: "Florida", label: "Florida" },
    { value: "Ontario", label: "Ontario" },
    { value: "London", label: "London" },
    { value: "Mumbai", label: "Mumbai" },
  ];

  const cityChoose = [
    { value: "Select", label: "Select" },
    { value: "Los Angeles", label: "Los Angeles" },
    { value: "San Francisco", label: "San Francisco" },
    { value: "San Diego", label: "San Diego" },
    { value: "Fresno", label: "Fresno" },
    { value: "Toronto", label: "Toronto" },
    { value: "Manchester", label: "Manchester" },
    { value: "Delhi", label: "Delhi" },
  ];

  const genderOptions = [
    { value: "Select", label: "Select" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  // Cloudinary image upload function
  const uploadImage = async (file: File) => {
    setProfilePhoto(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "amasqis");
    const res = await fetch("https://api.cloudinary.com/v1_1/dwc3b5zfe/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 4MB.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      event.target.value = "";
      return;
    }

    if (["image/jpeg", "image/png", "image/jpg", "image/ico"].includes(file.type)) {
      setImageUpload(true);
      try {
        const uploadedUrl = await uploadImage(file);
        setProfilePhoto(uploadedUrl);
        setFormData(prev => ({ ...prev, profilePhoto: uploadedUrl }));
        setImageUpload(false);
        // Auto-save profile photo
        await updateCurrentUserProfile({ profilePhoto: uploadedUrl });
        toast.success('Profile photo updated successfully!');
      } catch (error) {
        setImageUpload(false);
        toast.error("Failed to upload image. Please try again.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        event.target.value = "";
      }
    } else {
      toast.error("Please upload image file only.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      event.target.value = "";
    }
  };

  // Remove uploaded photo
  const removePhoto = async () => {
    setProfilePhoto(null);
    setFormData(prev => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Auto-save removal
    await updateCurrentUserProfile({ profilePhoto: '' });
    toast.success('Profile photo removed successfully!');
  };

  // Load current user profile on component mount
  useEffect(() => {
    fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]);

  // Update form data when profile is loaded
  useEffect(() => {
    if (currentUserProfile) {
      setFormData({
        firstName: currentUserProfile.firstName || '',
        lastName: currentUserProfile.lastName || '',
        email: currentUserProfile.email || '',
        phone: currentUserProfile.phone || '',
        dateOfBirth: currentUserProfile.dateOfBirth ? new Date(currentUserProfile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: currentUserProfile.gender || '',
        profilePhoto: currentUserProfile.profilePhoto || '',
        employeeId: currentUserProfile.employeeId || '',
        department: currentUserProfile.department || '',
        designation: resolveDesignation(currentUserProfile.designation),
        joiningDate: currentUserProfile.joiningDate ? new Date(currentUserProfile.joiningDate).toISOString().split('T')[0] : '',
        role: currentUserProfile.role || '',
        employmentType: currentUserProfile.employmentType || '',
        status: currentUserProfile.status || 'Active',
        about: currentUserProfile.about || currentUserProfile.bio || '',
        bio: currentUserProfile.bio || '',
        skills: currentUserProfile.skills || [],
        address: {
          street: currentUserProfile.address?.street || '',
          city: currentUserProfile.address?.city || '',
          state: currentUserProfile.address?.state || '',
          country: currentUserProfile.address?.country || '',
          postalCode: currentUserProfile.address?.postalCode || ''
        },
        emergencyContact: {
          name: currentUserProfile.emergencyContact?.name || '',
          phone: currentUserProfile.emergencyContact?.phone || '',
          relationship: currentUserProfile.emergencyContact?.relationship || ''
        },
        socialLinks: {
          linkedin: currentUserProfile.socialLinks?.linkedin || '',
          twitter: currentUserProfile.socialLinks?.twitter || '',
          facebook: currentUserProfile.socialLinks?.facebook || '',
          instagram: currentUserProfile.socialLinks?.instagram || ''
        },
        personal: {
          passport: {
            number: currentUserProfile.personal?.passport?.number || '',
            expiryDate: currentUserProfile.personal?.passport?.expiryDate || null,
            country: currentUserProfile.personal?.passport?.country || ''
          },
          nationality: currentUserProfile.personal?.nationality || '',
          religion: currentUserProfile.personal?.religion || '',
          maritalStatus: currentUserProfile.personal?.maritalStatus || '',
          noOfChildren: currentUserProfile.personal?.noOfChildren || 0
        },
        bankDetails: {
          bankName: currentUserProfile.bankDetails?.bankName || '',
          accountNumber: currentUserProfile.bankDetails?.accountNumber || '',
          ifscCode: currentUserProfile.bankDetails?.ifscCode || '',
          branch: currentUserProfile.bankDetails?.branch || '',
          accountType: currentUserProfile.bankDetails?.accountType || 'Savings'
        }
      });
      setProfilePhoto(currentUserProfile.profilePhoto || null);
    }
  }, [currentUserProfile]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const parts = name.split('.');
      // Handle nested fields like personal.passport.number
      if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof Profile] as any),
            [child]: {
              ...((prev[parent as keyof Profile] as any)?.[child] || {}),
              [grandchild]: value
            }
          }
        }));
      } else if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof Profile] as any),
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle nested field changes for PersonalInfoSection
  const handleNestedFieldChange = (field: string, value: any) => {
    const parts = field.split('.');
    if (parts.length === 3) {
      const [parent, child, grandchild] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Profile] as any),
          [child]: {
            ...((prev[parent as keyof Profile] as any)?.[child] || {}),
            [grandchild]: value
          }
        }
      }));
    } else if (parts.length === 2) {
      const [parent, child] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Profile] as any),
          [child]: value
        }
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    const parts = name.split('.');
    // Handle nested fields like personal.passport.country
    if (parts.length === 3) {
      const [parent, child, grandchild] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Profile] as any),
          [child]: {
            ...((prev[parent as keyof Profile] as any)?.[child] || {}),
            [grandchild]: value
          }
        }
      }));
    } else if (parts.length === 2) {
      const [parent, child] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Profile] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle skills input
  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Per-section edit handlers
  const handleEditSection = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const handleCancelSection = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    // Reset form data to current profile when canceling
    if (currentUserProfile) {
      setFormData({
        firstName: currentUserProfile.firstName || '',
        lastName: currentUserProfile.lastName || '',
        email: currentUserProfile.email || '',
        phone: currentUserProfile.phone || '',
        dateOfBirth: currentUserProfile.dateOfBirth ? new Date(currentUserProfile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: currentUserProfile.gender || '',
        profilePhoto: currentUserProfile.profilePhoto || '',
        employeeId: currentUserProfile.employeeId || '',
        department: currentUserProfile.department || '',
        designation: resolveDesignation(currentUserProfile.designation),
        joiningDate: currentUserProfile.joiningDate ? new Date(currentUserProfile.joiningDate).toISOString().split('T')[0] : '',
        role: currentUserProfile.role || '',
        employmentType: currentUserProfile.employmentType || '',
        status: currentUserProfile.status || 'Active',
        about: currentUserProfile.about || currentUserProfile.bio || '',
        bio: currentUserProfile.bio || '',
        skills: currentUserProfile.skills || [],
        address: {
          street: currentUserProfile.address?.street || '',
          city: currentUserProfile.address?.city || '',
          state: currentUserProfile.address?.state || '',
          country: currentUserProfile.address?.country || '',
          postalCode: currentUserProfile.address?.postalCode || ''
        },
        emergencyContact: {
          name: currentUserProfile.emergencyContact?.name || '',
          phone: currentUserProfile.emergencyContact?.phone || '',
          relationship: currentUserProfile.emergencyContact?.relationship || ''
        },
        socialLinks: {
          linkedin: currentUserProfile.socialLinks?.linkedin || '',
          twitter: currentUserProfile.socialLinks?.twitter || '',
          facebook: currentUserProfile.socialLinks?.facebook || '',
          instagram: currentUserProfile.socialLinks?.instagram || ''
        },
        personal: {
          passport: {
            number: currentUserProfile.personal?.passport?.number || '',
            expiryDate: currentUserProfile.personal?.passport?.expiryDate || null,
            country: currentUserProfile.personal?.passport?.country || ''
          },
          nationality: currentUserProfile.personal?.nationality || '',
          religion: currentUserProfile.personal?.religion || '',
          maritalStatus: currentUserProfile.personal?.maritalStatus || '',
          noOfChildren: currentUserProfile.personal?.noOfChildren || 0
        },
        bankDetails: {
          bankName: currentUserProfile.bankDetails?.bankName || '',
          accountNumber: currentUserProfile.bankDetails?.accountNumber || '',
          ifscCode: currentUserProfile.bankDetails?.ifscCode || '',
          branch: currentUserProfile.bankDetails?.branch || '',
          accountType: currentUserProfile.bankDetails?.accountType || 'Savings'
        }
      });
    }
  };

  // Handle save for a specific section
  const handleSaveSection = async (section: keyof typeof editingSections) => {
    setSaving(true);
    try {
      const success = await updateCurrentUserProfile(formData);
      if (success) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
        setEditingSections(prev => ({ ...prev, [section]: false }));
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    try {
      const success = await changePassword(passwordData);
      if (success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing the password');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !currentUserProfile) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <ToastContainer />

          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">My Profile</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={route.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Profile
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>

          {/* Basic Info Header */}
          <BasicInfoSection
            profile={currentUserProfile}
            profilePhoto={profilePhoto}
            imageUpload={imageUpload}
            fileInputRef={fileInputRef}
            onImageUpload={handleImageUpload}
            onRemovePhoto={removePhoto}
          />

          {/* Tab Navigation */}
          <ul className="nav nav-tabs nav-tabs-bottom-solid mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <i className="ti ti-user me-1"></i>Personal
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'work' ? 'active' : ''}`}
                onClick={() => setActiveTab('work')}
              >
                <i className="ti ti-briefcase me-1"></i>Work Info
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'bank' ? 'active' : ''}`}
                onClick={() => setActiveTab('bank')}
              >
                <i className="ti ti-building-bank me-1"></i>Bank Details
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => setActiveTab('assets')}
              >
                <i className="ti ti-package me-1"></i>My Assets
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <i className="ti ti-timeline me-1"></i>Career History
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'personal' && (
              <div className="row">
                <div className="col-lg-6">
                  <EditableSection
                    title="Personal Information"
                    icon="ti-id-badge"
                    isEditing={editingSections.personal}
                    onEdit={() => handleEditSection('personal')}
                    onSave={() => handleSaveSection('personal')}
                    onCancel={() => handleCancelSection('personal')}
                    isSaving={saving}
                  >
                    <PersonalInfoSection
                      formData={formData}
                      isEditing={editingSections.personal}
                      onChange={handleNestedFieldChange}
                      onSelect={handleSelectChange}
                      genderOptions={genderOptions}
                      countryOptions={countryChoose}
                    />
                  </EditableSection>
                </div>

                <div className="col-lg-6">
                  <EditableSection
                    title="Address Information"
                    icon="ti-map-pin"
                    isEditing={editingSections.address}
                    onEdit={() => handleEditSection('address')}
                    onSave={() => handleSaveSection('address')}
                    onCancel={() => handleCancelSection('address')}
                    isSaving={saving}
                  >
                    <AddressInfoSection
                      formData={formData}
                      isEditing={editingSections.address}
                      onChange={handleInputChange}
                      onSelect={handleSelectChange}
                      countryOptions={countryChoose}
                      stateOptions={stateChoose}
                      cityOptions={cityChoose}
                    />
                  </EditableSection>
                </div>

                <div className="col-lg-6">
                  <EditableSection
                    title="Emergency Contact"
                    icon="ti-phone-call"
                    isEditing={editingSections.emergency}
                    onEdit={() => handleEditSection('emergency')}
                    onSave={() => handleSaveSection('emergency')}
                    onCancel={() => handleCancelSection('emergency')}
                    isSaving={saving}
                  >
                    <EmergencyContactSection
                      formData={formData}
                      isEditing={editingSections.emergency}
                      onChange={handleInputChange}
                    />
                  </EditableSection>
                </div>

                <div className="col-lg-6">
                  <EditableSection
                    title="Skills & Social Links"
                    icon="ti-link"
                    isEditing={editingSections.skills}
                    onEdit={() => handleEditSection('skills')}
                    onSave={() => handleSaveSection('skills')}
                    onCancel={() => handleCancelSection('skills')}
                    isSaving={saving}
                  >
                    <SkillsSocialSection
                      formData={formData}
                      isEditing={editingSections.skills}
                      onSkillsChange={handleSkillsChange}
                      onChange={handleInputChange}
                    />
                  </EditableSection>
                </div>

                <div className="col-lg-12">
                  <div className="card mb-3">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">
                        <i className="ti ti-lock me-2" />
                        Change Password
                      </h5>
                      {!isChangingPassword && (
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setIsChangingPassword(true)}
                        >
                          <i className="ti ti-key me-1" />
                          Change Password
                        </button>
                      )}
                    </div>
                    {isChangingPassword && (
                      <div className="card-body">
                        <form onSubmit={handlePasswordSubmit}>
                          <div className="row">
                            <div className="col-md-4 mb-3">
                              <label className="form-label">Current Password</label>
                              <div className="input-group">
                                <input
                                  type={passwordVisibility.currentPassword ? 'text' : 'password'}
                                  className="form-control"
                                  name="currentPassword"
                                  value={passwordData.currentPassword}
                                  onChange={handlePasswordChange}
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => togglePasswordVisibility('currentPassword')}
                                >
                                  <i className={`ti ${passwordVisibility.currentPassword ? 'ti-eye-off' : 'ti-eye'}`} />
                                </button>
                              </div>
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label">New Password</label>
                              <div className="input-group">
                                <input
                                  type={passwordVisibility.newPassword ? 'text' : 'password'}
                                  className="form-control"
                                  name="newPassword"
                                  value={passwordData.newPassword}
                                  onChange={handlePasswordChange}
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => togglePasswordVisibility('newPassword')}
                                >
                                  <i className={`ti ${passwordVisibility.newPassword ? 'ti-eye-off' : 'ti-eye'}`} />
                                </button>
                              </div>
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label">Confirm Password</label>
                              <div className="input-group">
                                <input
                                  type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                                  className="form-control"
                                  name="confirmPassword"
                                  value={passwordData.confirmPassword}
                                  onChange={handlePasswordChange}
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => togglePasswordVisibility('confirmPassword')}
                                >
                                  <i className={`ti ${passwordVisibility.confirmPassword ? 'ti-eye-off' : 'ti-eye'}`} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                              {saving ? 'Changing...' : 'Change Password'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={() => {
                                setIsChangingPassword(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'work' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="ti ti-briefcase me-2" />
                    Work Information
                  </h5>
                </div>
                <div className="card-body">
                  <WorkInfoSection workInfo={workInfo} />
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="card">
                <EditableSection
                  title="Bank Account Information"
                  icon="ti-building-bank"
                  isEditing={editingSections.bank}
                  onEdit={() => handleEditSection('bank')}
                  onSave={() => handleSaveSection('bank')}
                  onCancel={() => handleCancelSection('bank')}
                  isSaving={saving}
                >
                  <BankInfoSection
                    formData={formData}
                    isEditing={editingSections.bank}
                    onChange={handleInputChange}
                  />
                </EditableSection>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="ti ti-device-laptop me-2" />
                    Assigned Assets
                  </h5>
                </div>
                <div className="card-body">
                  <AssetsPoliciesSection assets={myAssets || []} />
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="ti ti-timeline me-2" />
                    Career History
                  </h5>
                </div>
                <div className="card-body">
                  <CareerHistorySection careerHistory={careerHistory} />
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ProfilePage;
