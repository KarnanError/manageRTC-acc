/**
 * Address Information Section - Editable
 * Handles street, city, state, country, postal code
 */

import React, { useEffect } from 'react';
import CommonSelect from '../../../../core/common/commonSelect';
import { EditableSection } from './EditableSection';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface AddressInfoSectionProps {
  data: Address;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onChange: (field: string, value: any) => void;
}

const countryOptions = [
  { value: "Select", label: "Select" },
  { value: "USA", label: "USA" },
  { value: "Canada", label: "Canada" },
  { value: "UK", label: "UK" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "India", label: "India" },
  { value: "Australia", label: "Australia" },
];

const stateOptions = [
  { value: "Select", label: "Select" },
  { value: "california", label: "California" },
  { value: "Texas", label: "Texas" },
  { value: "New York", label: "New York" },
  { value: "Florida", label: "Florida" },
  { value: "Ontario", label: "Ontario" },
  { value: "London", label: "London" },
  { value: "Mumbai", label: "Mumbai" },
];

const cityOptions = [
  { value: "Select", label: "Select" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "San Francisco", label: "San Francisco" },
  { value: "San Diego", label: "San Diego" },
  { value: "Fresno", label: "Fresno" },
  { value: "Toronto", label: "Toronto" },
  { value: "Manchester", label: "Manchester" },
  { value: "Delhi", label: "Delhi" },
];

export const AddressInfoSection: React.FC<AddressInfoSectionProps> = ({
  data,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving,
  onChange,
}) => {
  const [localData, setLocalData] = React.useState<Address>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSave = () => {
    Object.entries(localData).forEach(([key, value]) => {
      onChange(`address.${key}`, value);
    });
    onSave();
  };

  const handleCancel = () => {
    setLocalData(data);
    onCancel();
  };

  const viewContent = (
    <div className="row">
      <div className="col-md-12 mb-3">
        <label className="text-muted small">Address</label>
        <p className="mb-0 fw-medium">{data.street || '--'}</p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">City</label>
        <p className="mb-0 fw-medium">{data.city || '--'}</p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">State</label>
        <p className="mb-0 fw-medium">{data.state || '--'}</p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">Country</label>
        <p className="mb-0 fw-medium">{data.country || '--'}</p>
      </div>
      <div className="col-md-6 mb-3">
        <label className="text-muted small">Postal Code</label>
        <p className="mb-0 fw-medium">{data.postalCode || '--'}</p>
      </div>
    </div>
  );

  const editContent = (
    <div className="row">
      <div className="col-md-12 mb-3">
        <label className="form-label">Address</label>
        <input
          type="text"
          className="form-control"
          value={localData.street || ''}
          onChange={(e) => setLocalData({ ...localData, street: e.target.value })}
          placeholder="Street address"
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Country</label>
        <CommonSelect
          className="select"
          options={countryOptions}
          defaultValue={countryOptions.find(option => option.value === localData.country) || countryOptions[0]}
          onChange={(option: any) => setLocalData({ ...localData, country: option.value })}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">State</label>
        <CommonSelect
          className="select"
          options={stateOptions}
          defaultValue={stateOptions.find(option => option.value === localData.state) || stateOptions[0]}
          onChange={(option: any) => setLocalData({ ...localData, state: option.value })}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">City</label>
        <CommonSelect
          className="select"
          options={cityOptions}
          defaultValue={cityOptions.find(option => option.value === localData.city) || cityOptions[0]}
          onChange={(option: any) => setLocalData({ ...localData, city: option.value })}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Postal Code</label>
        <input
          type="text"
          className="form-control"
          value={localData.postalCode || ''}
          onChange={(e) => setLocalData({ ...localData, postalCode: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <EditableSection
      title="Address Information"
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

export default AddressInfoSection;
