/**
 * Emergency Contact Section - Editable
 * Handles name, phone, relationship
 */

import React, { useEffect } from 'react';
import { EditableSection } from './EditableSection';

interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

interface EmergencyContactSectionProps {
  data: EmergencyContact;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onChange: (field: string, value: any) => void;
}

export const EmergencyContactSection: React.FC<EmergencyContactSectionProps> = ({
  data,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving,
  onChange,
}) => {
  const [localData, setLocalData] = React.useState<EmergencyContact>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = () => {
    Object.entries(localData).forEach(([key, value]) => {
      onChange(`emergencyContact.${key}`, value);
    });
    onSave();
  };

  const handleCancel = () => {
    setLocalData(data);
    onCancel();
  };

  const viewContent = (
    <div className="row">
      <div className="col-md-4 mb-3">
        <label className="text-muted small">Contact Name</label>
        <p className="mb-0 fw-medium">{data.name || '--'}</p>
      </div>
      <div className="col-md-4 mb-3">
        <label className="text-muted small">Contact Phone</label>
        <p className="mb-0 fw-medium">{data.phone || '--'}</p>
      </div>
      <div className="col-md-4 mb-3">
        <label className="text-muted small">Relationship</label>
        <p className="mb-0 fw-medium">{data.relationship || '--'}</p>
      </div>
    </div>
  );

  const editContent = (
    <div className="row">
      <div className="col-md-4 mb-3">
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-control"
          value={localData.name || ''}
          onChange={(e) => setLocalData({ ...localData, name: e.target.value })}
          placeholder="Emergency contact name"
        />
      </div>
      <div className="col-md-4 mb-3">
        <label className="form-label">Phone</label>
        <input
          type="tel"
          className="form-control"
          value={localData.phone || ''}
          onChange={(e) => setLocalData({ ...localData, phone: e.target.value })}
          placeholder="Emergency contact phone"
        />
      </div>
      <div className="col-md-4 mb-3">
        <label className="form-label">Relationship</label>
        <input
          type="text"
          className="form-control"
          value={localData.relationship || ''}
          onChange={(e) => setLocalData({ ...localData, relationship: e.target.value })}
          placeholder="e.g., Father, Mother, Spouse"
        />
      </div>
    </div>
  );

  return (
    <EditableSection
      title="Emergency Contact"
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

export default EmergencyContactSection;
