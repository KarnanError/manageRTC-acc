import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface SubContract {
  _id: string;
  companyId: string;
  contractId?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  status: 'Active' | 'Inactive';
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ViewSubContract = () => {
  const [subcontract, setSubcontract] = useState<SubContract | null>(null);

  useEffect(() => {
    const handleViewSubContract = (event: any) => {
      const { subcontract } = event.detail;
      setSubcontract(subcontract);
    };

    window.addEventListener('view-subcontract', handleViewSubContract);

    return () => {
      window.removeEventListener('view-subcontract', handleViewSubContract);
    };
  }, []);

  if (!subcontract) {
    return null;
  }

  return (
    <>
      {/* View Sub-Contract Modal */}
      <div className="modal fade" id="view_subcontract">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Sub-Contract Details</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              {/* Logo Section */}
              {subcontract.logo && (
                <div className="text-center mb-4">
                  <img
                    src={subcontract.logo}
                    alt={subcontract.name}
                    className="avatar avatar-xxl rounded-circle"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Contract ID */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Contract ID</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">
                    {subcontract.contractId
                      ? subcontract.contractId.toUpperCase()
                      : subcontract._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <h5 className="mb-3 text-primary">Basic Information</h5>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Name</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">{subcontract.name}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Company</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">{subcontract.company}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Email</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">
                    <a href={`mailto:${subcontract.email}`}>{subcontract.email}</a>
                  </p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Phone</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">
                    {subcontract.phone ? (
                      <a href={`tel:${subcontract.phone}`}>{subcontract.phone}</a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Address</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">{subcontract.address || '-'}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Status</label>
                </div>
                <div className="col-md-8">
                  <span
                    className={`badge badge-${subcontract.status === 'Active' ? 'success' : 'danger'}`}
                  >
                    {subcontract.status}
                  </span>
                </div>
              </div>

              {/* Social Links */}
              {subcontract.socialLinks &&
                (subcontract.socialLinks.instagram ||
                  subcontract.socialLinks.facebook ||
                  subcontract.socialLinks.linkedin ||
                  subcontract.socialLinks.whatsapp) && (
                  <>
                    <h5 className="mb-3 text-primary mt-4">Social Links</h5>
                    <div className="d-flex align-items-center mb-3">
                      {subcontract.socialLinks.instagram && (
                        <Link
                          to={subcontract.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="me-2 btn btn-icon btn-sm btn-outline-danger rounded-circle"
                          title="Instagram"
                        >
                          <i className="ti ti-brand-instagram" />
                        </Link>
                      )}
                      {subcontract.socialLinks.facebook && (
                        <Link
                          to={subcontract.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="me-2 btn btn-icon btn-sm btn-outline-primary rounded-circle"
                          title="Facebook"
                        >
                          <i className="ti ti-brand-facebook" />
                        </Link>
                      )}
                      {subcontract.socialLinks.linkedin && (
                        <Link
                          to={subcontract.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="me-2 btn btn-icon btn-sm btn-outline-info rounded-circle"
                          title="LinkedIn"
                        >
                          <i className="ti ti-brand-linkedin" />
                        </Link>
                      )}
                      {subcontract.socialLinks.whatsapp && (
                        <Link
                          to={
                            subcontract.socialLinks.whatsapp.startsWith('http')
                              ? subcontract.socialLinks.whatsapp
                              : `https://wa.me/${subcontract.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="me-2 btn btn-icon btn-sm btn-outline-success rounded-circle"
                          title="WhatsApp"
                        >
                          <i className="ti ti-brand-whatsapp" />
                        </Link>
                      )}
                    </div>
                  </>
                )}

              {/* Timestamps */}
              <h5 className="mb-3 text-primary mt-4">Timestamps</h5>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Created At</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">
                    {new Date(subcontract.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Updated At</label>
                </div>
                <div className="col-md-8">
                  <p className="form-control-plaintext">
                    {new Date(subcontract.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /View Sub-Contract Modal */}
    </>
  );
};

export default ViewSubContract;
