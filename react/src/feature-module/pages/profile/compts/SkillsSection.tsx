/**
 * Skills & Additional Information Section - Editable
 * Handles skills array and bio/about text
 */

import React, { useEffect } from 'react';
import { EditableSection } from './EditableSection';

interface SkillsData {
  skills?: string[];
  bio?: string;
  about?: string;
}

interface SkillsSectionProps {
  data: SkillsData;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onChange: (field: string, value: any) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  data,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving,
  onChange,
}) => {
  const [localData, setLocalData] = React.useState<SkillsData>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setLocalData({ ...localData, skills: skillsArray });
  };

  const handleSave = () => {
    // Update skills
    onChange('skills', localData.skills || []);
    // Update bio (prefer bio over about, but set both for compatibility)
    onChange('bio', localData.bio || localData.about || '');
    onChange('about', localData.bio || localData.about || '');
    onSave();
  };

  const handleCancel = () => {
    setLocalData(data);
    onCancel();
  };

  const skillsString = (localData.skills || []).join(', ');

  const viewContent = (
    <div className="row">
      <div className="col-md-12 mb-3">
        <label className="text-muted small">Skills</label>
        {data.skills && data.skills.length > 0 ? (
          <div className="d-flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span key={index} className="badge bg-light text-dark border">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mb-0 fw-medium">--</p>
        )}
      </div>
      <div className="col-md-12">
        <label className="text-muted small">Bio</label>
        <p className="mb-0 fw-medium">{data.bio || data.about || '--'}</p>
      </div>
    </div>
  );

  const editContent = (
    <div className="row">
      <div className="col-md-12 mb-3">
        <label className="form-label">Skills</label>
        <textarea
          className="form-control"
          rows={3}
          value={skillsString}
          onChange={handleSkillsChange}
          placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
        />
        <small className="form-text text-muted">
          Separate multiple skills with commas
        </small>
      </div>
      <div className="col-md-12">
        <label className="form-label">Bio</label>
        <textarea
          className="form-control"
          rows={4}
          value={localData.bio || localData.about || ''}
          onChange={(e) => setLocalData({ ...localData, bio: e.target.value, about: e.target.value })}
          placeholder="Write a brief description about yourself..."
        />
      </div>
    </div>
  );

  return (
    <EditableSection
      title="Additional Information"
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

export default SkillsSection;
