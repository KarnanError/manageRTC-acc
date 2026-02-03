/**
 * Invoice REST Controller
 * Handles Invoice operations via REST API
 */

import {
  asyncHandler,
  buildNotFoundError,
  buildValidationError,
} from '../../middleware/errorHandler.js';
import {
  extractUser,
  sendCreated,
  sendSuccess,
} from '../../utils/apiResponse.js';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
} from '../../services/invoice/invoice.services.js';

/**
 * @desc    Get all invoices with optional filters
 * @route   GET /api/invoices
 * @access  Private (Admin, HR, Superadmin)
 */
export const getAll = asyncHandler(async (req, res) => {
  const { projectId, status, sortBy, createdDateFrom, createdDateTo, dueDateFrom, dueDateTo } = req.query;
  const user = extractUser(req);

  const filters = {};
  if (projectId) filters.projectId = projectId;
  if (status) filters.status = status;
  if (sortBy) filters.sortBy = sortBy;

  if (createdDateFrom || createdDateTo) {
    filters.createdDate = {};
    if (createdDateFrom) filters.createdDate.from = createdDateFrom;
    if (createdDateTo) filters.createdDate.to = createdDateTo;
  }

  if (dueDateFrom || dueDateTo) {
    filters.dueDate = {};
    if (dueDateFrom) filters.dueDate.from = dueDateFrom;
    if (dueDateTo) filters.dueDate.to = dueDateTo;
  }

  const invoices = await getInvoices(user.companyId, filters);

  return sendSuccess(res, invoices, 'Invoices retrieved successfully');
});

/**
 * @desc    Create a new invoice
 * @route   POST /api/invoices
 * @access  Private (Admin, Superadmin)
 */
export const create = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const payload = req.body;

  if (!payload.invoiceNumber || !payload.invoiceNumber.trim()) {
    throw buildValidationError('invoiceNumber', 'Invoice number is required');
  }
  if (!payload.title || !payload.title.trim()) {
    throw buildValidationError('title', 'Invoice title is required');
  }

  const invoice = await createInvoice(user.companyId, payload);

  return sendCreated(res, invoice, 'Invoice created successfully');
});

/**
 * @desc    Update an invoice
 * @route   PUT /api/invoices/:id
 * @access  Private (Admin, Superadmin)
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  if (!id) {
    throw buildValidationError('id', 'Invoice ID is required');
  }

  try {
    const result = await updateInvoice(user.companyId, id, updateData);
    return sendSuccess(res, result, 'Invoice updated successfully');
  } catch (error) {
    if (error.message === 'Invoice not found') {
      throw buildNotFoundError('Invoice', id);
    }
    throw error;
  }
});

/**
 * @desc    Delete an invoice (soft delete)
 * @route   DELETE /api/invoices/:id
 * @access  Private (Admin, Superadmin)
 */
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  if (!id) {
    throw buildValidationError('id', 'Invoice ID is required');
  }

  try {
    await deleteInvoice(user.companyId, id);
    return sendSuccess(res, { _id: id, isDeleted: true }, 'Invoice deleted successfully');
  } catch (error) {
    if (error.message === 'Invoice not found') {
      throw buildNotFoundError('Invoice', id);
    }
    throw error;
  }
});

/**
 * @desc    Get invoice statistics
 * @route   GET /api/invoices/stats
 * @access  Private (Admin, HR, Superadmin)
 */
export const stats = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  const invoiceStats = await getInvoiceStats(user.companyId);

  return sendSuccess(res, invoiceStats, 'Invoice statistics retrieved successfully');
});

export default {
  getAll,
  create,
  update,
  remove,
  stats,
};
