/**
 * Promotion REST Controller
 * Handles all Promotion CRUD operations via REST API
 * Uses multi-tenant database architecture with getTenantCollections()
 */

import { ObjectId } from 'mongodb';
import { getTenantCollections } from '../../config/db.js';
import {
  buildNotFoundError,
  buildConflictError,
  buildValidationError,
  asyncHandler
} from '../../middleware/errorHandler.js';
import {
  sendSuccess,
  sendCreated,
  buildPagination,
  extractUser
} from '../../utils/apiResponse.js';

/**
 * @desc    Get all promotions
 * @route   GET /api/promotions
 * @access  Private
 */
export const getPromotions = asyncHandler(async (req, res) => {
  const { page, limit, status, type, departmentId, employeeId, sortBy, order } = req.query;
  const user = extractUser(req);

  console.log('[Promotion Controller] getPromotions - companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Build filter
  const filter = {
    isDeleted: { $ne: true }
  };

  // Apply status filter
  if (status) {
    filter.status = status;
  }

  // Apply type filter
  if (type) {
    filter.promotionType = type;
  }

  // Apply department filter
  if (departmentId) {
    filter['promotionTo.departmentId'] = departmentId;
  }

  // Apply employee filter
  if (employeeId) {
    filter.employeeId = employeeId;
  }

  // Get total count
  const total = await collections.promotions.countDocuments(filter);

  // Build sort option
  const sort = {};
  if (sortBy) {
    sort[sortBy] = order === 'asc' ? 1 : -1;
  } else {
    sort.promotionDate = -1;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const promotions = await collections.promotions
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const pagination = buildPagination(pageNum, limitNum, total);

  return sendSuccess(res, promotions, 'Promotions retrieved successfully', 200, pagination);
});

/**
 * @desc    Get single promotion by ID
 * @route   GET /api/promotions/:id
 * @access  Private
 */
export const getPromotionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid promotion ID format');
  }

  console.log('[Promotion Controller] getPromotionById - id:', id, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const promotion = await collections.promotions.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!promotion) {
    throw buildNotFoundError('Promotion', id);
  }

  return sendSuccess(res, promotion);
});

/**
 * @desc    Create new promotion
 * @route   POST /api/promotions
 * @access  Private (Admin, HR)
 */
export const createPromotion = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const promotionData = req.body;

  console.log('[Promotion Controller] createPromotion - companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Validate required fields
  if (!promotionData.employeeId || !promotionData.promotionTo?.departmentId || !promotionData.promotionTo?.designationId) {
    throw buildValidationError('fields', 'Employee ID and target department/designation are required');
  }

  if (!promotionData.promotionDate) {
    throw buildValidationError('promotionDate', 'Promotion date is required');
  }

  // Check for overlapping pending promotions
  const existingPromotion = await collections.promotions.findOne({
    employeeId: promotionData.employeeId,
    status: 'pending',
    isDeleted: { $ne: true }
  });

  if (existingPromotion) {
    throw buildConflictError('Employee already has a pending promotion');
  }

  // Prepare promotion data
  const promotionToInsert = {
    ...promotionData,
    status: 'pending',
    isDue: new Date(promotionData.promotionDate) <= new Date(),
    isDeleted: false,
    createdBy: {
      userId: user.userId,
      userName: user.userName || user.fullName || user.name || ''
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collections.promotions.insertOne(promotionToInsert);

  if (!result.insertedId) {
    throw new Error('Failed to create promotion');
  }

  // Check if promotion should be applied immediately
  let promotion = await collections.promotions.findOne({ _id: result.insertedId });

  if (promotion.isDue) {
    // Apply promotion immediately - update employee record
    await collections.employees.updateOne(
      { employeeId: promotionData.employeeId },
      {
        $set: {
          departmentId: promotionData.promotionTo.departmentId,
          designationId: promotionData.promotionTo.designationId,
          updatedAt: new Date()
        }
      }
    );

    // Update promotion status
    await collections.promotions.updateOne(
      { _id: result.insertedId },
      {
        $set: {
          status: 'applied',
          appliedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    promotion = await collections.promotions.findOne({ _id: result.insertedId });
  }

  return sendCreated(res, promotion, 'Promotion created successfully');
});

/**
 * @desc    Update promotion
 * @route   PUT /api/promotions/:id
 * @access  Private (Admin, HR)
 */
export const updatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);
  const updateData = req.body;

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid promotion ID format');
  }

  console.log('[Promotion Controller] updatePromotion - id:', id, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const promotion = await collections.promotions.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!promotion) {
    throw buildNotFoundError('Promotion', id);
  }

  // Cannot update applied promotions
  if (promotion.status === 'applied') {
    throw buildConflictError('Cannot update an applied promotion');
  }

  // Build update object
  const updateObj = {
    ...updateData,
    updatedBy: {
      userId: user.userId,
      userName: user.userName || user.fullName || user.name || ''
    },
    updatedAt: new Date()
  };

  const result = await collections.promotions.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Promotion', id);
  }

  // Get updated promotion
  const updatedPromotion = await collections.promotions.findOne({ _id: new ObjectId(id) });

  return sendSuccess(res, updatedPromotion, 'Promotion updated successfully');
});

/**
 * @desc    Delete promotion (soft delete)
 * @route   DELETE /api/promotions/:id
 * @access  Private (Admin)
 */
export const deletePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid promotion ID format');
  }

  console.log('[Promotion Controller] deletePromotion - id:', id, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const promotion = await collections.promotions.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!promotion) {
    throw buildNotFoundError('Promotion', id);
  }

  // Soft delete
  const result = await collections.promotions.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: {
          userId: user.userId,
          userName: user.userName || user.fullName || user.name || ''
        }
      }
    }
  );

  if (result.matchedCount === 0) {
    throw buildNotFoundError('Promotion', id);
  }

  return sendSuccess(res, {
    _id: promotion._id,
    isDeleted: true
  }, 'Promotion deleted successfully');
});

/**
 * @desc    Apply promotion
 * @route   PUT /api/promotions/:id/apply
 * @access  Private (Admin, HR)
 */
export const applyPromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid promotion ID format');
  }

  console.log('[Promotion Controller] applyPromotion - id:', id, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const promotion = await collections.promotions.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!promotion) {
    throw buildNotFoundError('Promotion', id);
  }

  // Apply promotion - update employee record
  await collections.employees.updateOne(
    { employeeId: promotion.employeeId },
    {
      $set: {
        departmentId: promotion.promotionTo.departmentId,
        designationId: promotion.promotionTo.designationId,
        updatedAt: new Date()
      }
    }
  );

  // Update promotion status
  await collections.promotions.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'applied',
        appliedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  // Get updated promotion
  const updatedPromotion = await collections.promotions.findOne({ _id: new ObjectId(id) });

  return sendSuccess(res, updatedPromotion, 'Promotion applied successfully');
});

/**
 * @desc    Cancel promotion
 * @route   PUT /api/promotions/:id/cancel
 * @access  Private (Admin, HR)
 */
export const cancelPromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = extractUser(req);

  if (!ObjectId.isValid(id)) {
    throw buildValidationError('id', 'Invalid promotion ID format');
  }

  console.log('[Promotion Controller] cancelPromotion - id:', id, 'companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const promotion = await collections.promotions.findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true }
  });

  if (!promotion) {
    throw buildNotFoundError('Promotion', id);
  }

  // Update promotion status
  const updateObj = {
    status: 'cancelled',
    cancellationReason: reason || '',
    updatedAt: new Date()
  };

  await collections.promotions.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  // Get updated promotion
  const updatedPromotion = await collections.promotions.findOne({ _id: new ObjectId(id) });

  return sendSuccess(res, updatedPromotion, 'Promotion cancelled successfully');
});

/**
 * @desc    Get departments for promotion selection
 * @route   GET /api/promotions/departments
 * @access  Private
 */
export const getDepartments = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  console.log('[Promotion Controller] getDepartments - companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  // Get unique department IDs from employees
  const employees = await collections.employees.find({
    status: 'Active',
    isDeleted: { $ne: true }
  }).toArray();

  const departmentIds = [...new Set(employees
    .map(e => e.departmentId)
    .filter(id => id)
  )];

  // Get department details
  const departments = await collections.departments.find({
    _id: { $in: departmentIds.map(id => new ObjectId(id)) }
  }).toArray();

  return sendSuccess(res, departments, 'Departments retrieved successfully');
});

/**
 * @desc    Get designations for promotion selection
 * @route   GET /api/promotions/designations
 * @access  Private
 */
export const getDesignationsForPromotion = asyncHandler(async (req, res) => {
  const user = extractUser(req);
  const { departmentId } = req.query;

  console.log('[Promotion Controller] getDesignationsForPromotion - companyId:', user.companyId);

  // Get tenant collections
  const collections = getTenantCollections(user.companyId);

  const filter = {
    status: 'Active',
    isDeleted: { $ne: true }
  };

  if (departmentId) {
    filter.departmentId = departmentId;
  }

  const employees = await collections.employees.find(filter).toArray();

  const designationIds = [...new Set(employees
    .map(e => e.designationId)
    .filter(id => id)
  )];

  // Get designation details
  const designations = await collections.designations.find({
    _id: { $in: designationIds.map(id => new ObjectId(id)) }
  }).toArray();

  return sendSuccess(res, designations, 'Designations retrieved successfully');
});

export default {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  applyPromotion,
  cancelPromotion,
  getDepartments,
  getDesignationsForPromotion
};
