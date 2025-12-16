import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../../SocketContext';
import { Socket } from 'socket.io-client';
import { DatePicker } from 'antd';
import { toast } from 'react-toastify';
import { all_routes } from '../../router/all_routes';
import dayjs, { Dayjs } from 'dayjs';
import AddStage from '../../../core/modals/add_stage';
import Footer from '../../../core/common/footer';

const DEFAULT_STAGE_OPTIONS = [
  'Won',
  'In Pipeline',
  'Conversation',
  'Follow Up',
];

const EditPipeline = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const socket = useSocket() as Socket | null;
  const companyId = window.localStorage.getItem('companyId') || 'demoCompanyId';

  // Form state
  const [pipelineName, setPipelineName] = useState('');
  const [stage, setStage] = useState('');
  const [stageOptions, setStageOptions] = useState<string[]>([...DEFAULT_STAGE_OPTIONS]);
  const [totalDealValue, setTotalDealValue] = useState<number | ''>('');
  const [noOfDeals, setNoOfDeals] = useState<number | ''>('');
  const [createdDate, setCreatedDate] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditStagesModal, setShowEditStagesModal] = useState(false);

  // Fetch pipeline data on mount
  useEffect(() => {
    if (!pipelineId || !socket) {
      setError('Invalid pipeline ID or no socket connection');
      setLoading(false);
      return;
    }

    // Fetch all pipelines to find the one we need
    socket.emit('pipeline:getAll');
    socket.once('pipeline:getAll-response', (res: any) => {
      if (res.done && Array.isArray(res.data)) {
        const pipeline = res.data.find((p: any) => p._id === pipelineId);
        if (pipeline) {
          // Pre-fill form with pipeline data
          setPipelineName(pipeline.pipelineName || '');
          setStage(pipeline.stage || '');
          setTotalDealValue(pipeline.totalDealValue ?? '');
          setNoOfDeals(pipeline.noOfDeals ?? '');
          setCreatedDate(pipeline.createdDate ? dayjs(pipeline.createdDate) : null);
          setStatus(pipeline.status || 'Active');
          setError(null);
        } else {
          setError('Pipeline not found');
        }
      } else {
        setError('Failed to load pipeline data');
      }
      setLoading(false);
    });
  }, [pipelineId, socket]);

  // Fetch stages on mount and when stages change
  useEffect(() => {
    if (socket && companyId) {
      const fetchStages = () => {
        socket.emit('stage:getAll');
        socket.once('stage:getAll-response', (res: any) => {
          if (res.done && Array.isArray(res.data)) {
            const customStages = res.data.map((s: any) => s.name);
            const merged = [...DEFAULT_STAGE_OPTIONS, ...customStages.filter((s: string) => !DEFAULT_STAGE_OPTIONS.includes(s))];
            setStageOptions(merged);
          } else {
            setStageOptions([...DEFAULT_STAGE_OPTIONS]);
          }
        });
      };
      fetchStages();
      // Listen for custom event from AddStage
      window.addEventListener('stage-added', fetchStages);
      return () => {
        window.removeEventListener('stage-added', fetchStages);
      };
    }
  }, [socket, companyId]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !pipelineId) {
      setError('No socket connection or invalid pipeline ID');
      return;
    }

    // Validation
    if (!pipelineName.trim()) {
      setError('Pipeline name is required');
      return;
    }
    if (!stage.trim()) {
      setError('Pipeline stage is required');
      return;
    }

    setError(null);
    setSaving(true);

    const update = {
      pipelineName: pipelineName.trim(),
      stage: stage.trim(),
      totalDealValue: totalDealValue === '' ? 0 : Number(totalDealValue),
      noOfDeals: noOfDeals === '' ? 0 : Number(noOfDeals),
      createdDate: createdDate ? createdDate.toISOString() : new Date().toISOString(),
      status,
    };

    console.log('Emitting pipeline:update', { pipelineId, update });
    socket.emit('pipeline:update', { pipelineId, update });

    socket.once('pipeline:update-response', (res: any) => {
      setSaving(false);
      if (res.done) {
        toast.success('Pipeline updated successfully!');
        // Navigate back to pipeline list
        navigate(routes.pipeline);
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-pipelines'));
      } else {
        console.error('Pipeline update failed:', res.error);
        setError(res.error || 'Failed to update pipeline');
        toast.error(res.error || 'Failed to update pipeline');
      }
    });
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
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
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div>
              <h6 className="fw-medium d-inline-flex align-items-center mb-3 mb-sm-0">
                <Link to={routes.pipeline}>
                  <i className="ti ti-arrow-left me-2" />
                  Pipeline
                </Link>
                <span className="text-gray d-inline-flex ms-2">/ Edit Pipeline</span>
              </h6>
            </div>
          </div>

          {/* Edit Pipeline Form */}
          <div className="card">
            <div className="card-body">
              <div className="page-header">
                <div className="row align-items-center">
                  <div className="col">
                    <h3 className="page-title">Edit Pipeline</h3>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger text-center mb-3">
                  <i className="ti ti-alert-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Pipeline Name <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={pipelineName}
                        onChange={e => setPipelineName(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-block mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <label className="form-label">
                          Pipeline Stages <span className="text-danger"> *</span>
                        </label>
                        <div>
                          <Link
                            to="#"
                            className="add-new text-primary me-3"
                            data-bs-toggle="modal"
                            data-bs-target="#add_stage"
                            onClick={e => { e.preventDefault(); }}
                          >
                            <i className="ti ti-plus text-primary me-1" />
                            Add New
                          </Link>
                          <a
                            href="#"
                            className="add-new text-primary"
                            onClick={e => { e.preventDefault(); setShowEditStagesModal(true); }}
                          >
                            <i className="ti ti-edit text-primary me-1" />
                            Edit
                          </a>
                        </div>
                      </div>
                      <select
                        className="form-select mt-2"
                        value={stage}
                        onChange={e => setStage(e.target.value)}
                        required
                        disabled={saving}
                      >
                        <option value="" disabled>Select Stage</option>
                        {stageOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Total Deal Value <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={totalDealValue}
                        onChange={e => setTotalDealValue(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        min={0}
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">No of Deals <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={noOfDeals}
                        onChange={e => setNoOfDeals(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        min={0}
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Created Date <span className="text-danger">*</span></label>
                      <DatePicker
                        className="form-control"
                        value={createdDate}
                        onChange={value => setCreatedDate(value)}
                        format="YYYY-MM-DD"
                        required
                        picker="date"
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        required
                        disabled={saving}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                  <Link
                    to={routes.pipeline}
                    className="btn btn-light me-2"
                    //disabled={saving}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Modals */}
      <AddStage />
      {showEditStagesModal && (
        <EditStagesModal
          key={stageOptions.join(',')}
          stages={stageOptions}
          companyId={companyId}
          onSave={updatedStages => {
            if (socket) {
              socket.emit('stage:overwrite', { stages: updatedStages });
              socket.once('stage:overwrite-response', (res: any) => {
                if (res.done && Array.isArray(res.data)) {
                  const merged = [...DEFAULT_STAGE_OPTIONS, ...res.data.map((s: any) => s.name).filter((s: string) => !DEFAULT_STAGE_OPTIONS.includes(s))];
                  setStageOptions(merged);
                  if (!merged.includes(stage)) {
                    setStage(merged[0] || '');
                  }

                  // Show detailed success message about stage update
                  if (res.updatedPipelinesCount > 0) {
                    toast.success(`Stages updated successfully! ${res.updatedPipelinesCount} pipeline(s) using deleted stages have been automatically updated to use "${res.defaultStage}".`);
                  } else {
                    toast.success('Stages updated successfully!');
                  }

                  // Dispatch refresh event to update pipeline list
                  window.dispatchEvent(new CustomEvent('refresh-pipelines'));
                }
              });
            }
            setShowEditStagesModal(false);
          }}
          onClose={() => setShowEditStagesModal(false)}
        />
      )}
    </>
  );
};

// EditStagesModal component
const EditStagesModal = ({ stages, companyId, onSave, onClose }: { stages: string[]; companyId: string; onSave: (updatedStages: string[]) => void; onClose: () => void }) => {
  const [localStages, setLocalStages] = useState<string[]>([...stages]);

  // Sync localStages with stages prop when it changes
  useEffect(() => {
    setLocalStages([...stages]);
  }, [stages]);

  // Cleanup: remove backdrop and restore body scroll when component unmounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
    };
  }, []);

  const handleStageChange = (idx: number, value: string) => {
    const updated = [...localStages];
    updated[idx] = value;
    setLocalStages(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = localStages.filter((_, i) => i !== idx);
    setLocalStages(updated);
  };

  const handleSave = () => {
    // Remove empty or duplicate names
    const filtered = localStages.filter((s, i, arr) => s.trim() && arr.indexOf(s) === i);
    onSave(filtered);
  };

  return (
    <>
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />
      <div 
        className="modal fade show" 
        style={{ display: 'block', zIndex: 1050 }} 
        tabIndex={-1}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Pipeline Stages</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              {localStages.map((stage, idx) => (
                <div key={idx} className="d-flex align-items-center mb-2">
                  <input
                    type="text"
                    className="form-control me-2"
                    value={stage}
                    onChange={e => handleStageChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-link text-danger p-0"
                    title="Delete Stage"
                    onClick={() => handleDelete(idx)}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              ))}
              {localStages.length === 0 && <div className="text-muted">No stages. Add at least one stage.</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light me-2" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditPipeline;


