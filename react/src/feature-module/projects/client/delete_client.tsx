import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useClientsREST } from '../../../hooks/useClientsREST';

interface Client {
  _id: string;
  name: string;
  company: string;
  email: string;
}

const DeleteClient = () => {
  const { deleteClient } = useClientsREST();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const nameMatches = client
    ? confirmName.trim().toLowerCase() === client.name.trim().toLowerCase()
    : false;

  useEffect(() => {
    const handleDeleteClient = (event: any) => {
      const clientData = event.detail.client;
      console.log('[DeleteClient] Received client data:', clientData);
      setClient({
        _id: clientData._id || '',
        name: clientData.name || '',
        company: clientData.company || '',
        email: clientData.email || '',
      });
      setConfirmName('');
    };

    window.addEventListener('delete-client', handleDeleteClient);
    return () => window.removeEventListener('delete-client', handleDeleteClient);
  }, []);

  const handleConfirmDelete = async () => {
    if (!client) {
      message.error('No client selected');
      return;
    }

    setLoading(true);
    try {
      console.log('Deleting client:', client._id);

      // Call REST API to delete client
      const success = await deleteClient(client._id);

      if (success) {
        console.log('Client deleted successfully');

        // Show success message briefly, then close modal
        setTimeout(() => {
          closeModal();

          // Reset states after modal closes
          setTimeout(() => {
            setClient(null);
            setConfirmName('');
          }, 300);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error deleting client:', error);

      // Check if error message contains project conflict information
      const errMsg =
        error?.response?.data?.error?.message ||
        error?.message ||
        'An error occurred while deleting the client';

      if (errMsg.includes('active project')) {
        // Close delete modal and show error modal
        closeModal();
        setErrorMessage(errMsg);
        setShowError(true);

        // Open error modal after delete modal closes
        setTimeout(() => {
          openErrorModal();
        }, 400);
      } else {
        message.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    const modal = document.getElementById('delete_client');
    if (!modal) return;

    try {
      // Method 1: Try Bootstrap Modal API
      if ((window as any).bootstrap && (window as any).bootstrap.Modal) {
        const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
          bootstrapModal.hide();
          return;
        }
      }

      // Method 2: Try jQuery Bootstrap Modal
      if ((window as any).$ && (window as any).$.fn && (window as any).$.fn.modal) {
        (window as any).$('#delete_client').modal('hide');
        return;
      }

      // Method 3: Manual modal closing (fallback)
      modal.style.display = 'none';
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      modal.removeAttribute('aria-modal');

      // Remove backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => backdrop.remove());

      // Remove modal-open class from body
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    } catch (error) {
      console.error('Error closing delete client modal:', error);

      // Final fallback: just hide the modal
      modal.style.display = 'none';
      modal.classList.remove('show');
    }

    // Reset state after modal closes
    setClient(null);
    setConfirmName('');
  };

  const handleCancel = () => {
    setConfirmName('');
    closeModal();
  };

  const openErrorModal = () => {
    const modal = document.getElementById('delete_error_modal');
    if (!modal) return;

    try {
      // Method 1: Try Bootstrap Modal API
      if ((window as any).bootstrap && (window as any).bootstrap.Modal) {
        const bootstrapModal = new (window as any).bootstrap.Modal(modal);
        bootstrapModal.show();
        return;
      }

      // Method 2: Try jQuery Bootstrap Modal
      if ((window as any).$ && (window as any).$.fn && (window as any).$.fn.modal) {
        (window as any).$('#delete_error_modal').modal('show');
        return;
      }

      // Method 3: Manual modal opening (fallback)
      modal.style.display = 'block';
      modal.classList.add('show');
      modal.setAttribute('aria-modal', 'true');
      modal.removeAttribute('aria-hidden');

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);

      // Add modal-open class to body
      document.body.classList.add('modal-open');
    } catch (error) {
      console.error('Error opening error modal:', error);
    }
  };

  const closeErrorModal = () => {
    const modal = document.getElementById('delete_error_modal');
    if (!modal) return;

    try {
      // Method 1: Try Bootstrap Modal API
      if ((window as any).bootstrap && (window as any).bootstrap.Modal) {
        const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
      }

      // Method 2: Try jQuery Bootstrap Modal
      if ((window as any).$ && (window as any).$.fn && (window as any).$.fn.modal) {
        (window as any).$('#delete_error_modal').modal('hide');
      }

      // Method 3: Manual modal closing (fallback)
      modal.style.display = 'none';
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      modal.removeAttribute('aria-modal');

      // Remove backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((backdrop) => backdrop.remove());

      // Remove modal-open class from body
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    } catch (error) {
      console.error('Error closing error modal:', error);
    }

    // Reset error state
    setShowError(false);
    setErrorMessage('');
    setClient(null);
    setConfirmName('');
  };

  return (
    <>
      {/* Error Modal */}
      <div className="modal fade" id="delete_error_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <div className="text-center p-3">
                <span className="avatar avatar-lg avatar-rounded bg-warning mb-3">
                  <i className="ti ti-alert-triangle fs-24" />
                </span>
                <h5 className="mb-2">Cannot Delete Client</h5>
                <div className="alert alert-warning text-start mb-3" role="alert">
                  <p className="mb-0">{errorMessage}</p>
                </div>
                <div className="d-flex gap-2 justify-content-center">
                  <button type="button" className="btn btn-primary" onClick={closeErrorModal}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_client">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body">
              <div className="text-center p-3">
                <span className="avatar avatar-lg avatar-rounded bg-danger mb-3">
                  <i className="ti ti-trash fs-24" />
                </span>
                <h5 className="mb-2">Delete Client</h5>
                <p className="mb-3">
                  Are you sure you want to delete this client? This action cannot be undone.
                </p>
                {client && (
                  <>
                    <div className="bg-light p-3 rounded mb-3">
                      <h6 className="mb-1">{client.name}</h6>
                      <p className="mb-1 text-muted">{client.company}</p>
                      <p className="mb-0 text-muted">{client.email}</p>
                    </div>
                    <div className="text-start mb-3">
                      <p className="text-danger fw-medium mb-2" style={{ fontSize: '13px' }}>
                        This action is permanent. All data associated with this client will be
                        removed.
                      </p>
                      <label className="form-label text-muted" style={{ fontSize: '13px' }}>
                        Type <strong>{client.name}</strong> to confirm deletion:
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${confirmName && !nameMatches ? 'is-invalid' : ''} ${nameMatches ? 'is-valid' : ''}`}
                        placeholder={`Type "${client.name}" to confirm`}
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        autoComplete="off"
                      />
                      {confirmName && !nameMatches && (
                        <div className="invalid-feedback">Name does not match</div>
                      )}
                    </div>
                  </>
                )}
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmDelete}
                    disabled={loading || !nameMatches}
                  >
                    {loading ? 'Deleting...' : 'Delete Client'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteClient;
