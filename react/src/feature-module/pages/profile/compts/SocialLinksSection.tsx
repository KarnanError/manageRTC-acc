/**
 * Social Links Section - Editable
 * Handles LinkedIn, Twitter, Facebook, Instagram
 */

import React, { useEffect } from 'react';
import { EditableSection } from './EditableSection';

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

interface SocialLinksSectionProps {
  data: SocialLinks;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onChange: (field: string, value: any) => void;
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  data,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving,
  onChange,
}) => {
  const [localData, setLocalData] = React.useState<SocialLinks>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = () => {
    Object.entries(localData).forEach(([key, value]) => {
      onChange(`socialLinks.${key}`, value);
    });
    onSave();
  };

  const handleCancel = () => {
    setLocalData(data);
    onCancel();
  };

  const viewContent = (
    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="text-muted small">
          <i className="ti ti-brand-linkedin text-primary me-1"></i>LinkedIn
        </label>
        <p className="mb-0 fw-medium text-break">
          {data.linkedin ? (
            <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary">
              {data.linkedin}
            </a>
          ) : '--'}
        </p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">
          <i className="ti ti-brand-twitter text-info me-1"></i>Twitter
        </label>
        <p className="mb-0 fw-medium text-break">
          {data.twitter ? (
            <a href={data.twitter} target="_blank" rel="noopener noreferrer" className="text-info">
              {data.twitter}
            </a>
          ) : '--'}
        </p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">
          <i className="ti ti-brand-facebook text-primary me-1"></i>Facebook
        </label>
        <p className="mb-0 fw-medium text-break">
          {data.facebook ? (
            <a href={data.facebook} target="_blank" rel="noopener noreferrer" className="text-primary">
              {data.facebook}
            </a>
          ) : '--'}
        </p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">
          <i className="ti ti-brand-instagram text-danger me-1"></i>Instagram
        </label>
        <p className="mb-0 fw-medium text-break">
          {data.instagram ? (
            <a href={data.instagram} target="_blank" rel="noopener noreferrer" className="text-danger">
              {data.instagram}
            </a>
          ) : '--'}
        </p>
      </div>
    </div>
  );

  const editContent = (
    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="form-label">
          <i className="ti ti-brand-linkedin text-primary me-1"></i>LinkedIn
        </label>
        <input
          type="url"
          className="form-control"
          value={localData.linkedin || ''}
          onChange={(e) => setLocalData({ ...localData, linkedin: e.target.value })}
          placeholder="https://linkedin.com/in/username"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">
          <i className="ti ti-brand-twitter text-info me-1"></i>Twitter
        </label>
        <input
          type="url"
          className="form-control"
          value={localData.twitter || ''}
          onChange={(e) => setLocalData({ ...localData, twitter: e.target.value })}
          placeholder="https://twitter.com/username"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">
          <i className="ti ti-brand-facebook text-primary me-1"></i>Facebook
        </label>
        <input
          type="url"
          className="form-control"
          value={localData.facebook || ''}
          onChange={(e) => setLocalData({ ...localData, facebook: e.target.value })}
          placeholder="https://facebook.com/username"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">
          <i className="ti ti-brand-instagram text-danger me-1"></i>Instagram
        </label>
        <input
          type="url"
          className="form-control"
          value={localData.instagram || ''}
          onChange={(e) => setLocalData({ ...localData, instagram: e.target.value })}
          placeholder="https://instagram.com/username"
        />
      </div>
    </div>
  );

  return (
    <EditableSection
      title="Social Links"
      isEditing={isEditing}
      onEdit={onEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
    >
      {viewContent}
    </EditableSection>
  );
};

export default SocialLinksSection;
