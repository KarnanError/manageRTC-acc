/**
 * Batch REST Controller
 * Handles batch CRUD operations and shift assignment
 */

import { ObjectId } from 'mongodb';
import { getTenantCollections } from '../../config/db.js';
import {
    asyncHandler,
    buildBadRequestError,
    buildNotFoundError,
    buildValidationError
} from '../../middleware/errorHandler.js';
import {
    extractUser,
    sendSuccess
} from '../../utils/apiResponse.js';

// Import Batch schema to register with Mongoose for ID generation
import '../../models/shift/batch.schema.js';

/**
 * Safely convert string to ObjectId
 * Returns null if invalid
 */
function toObjectId(id) {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * @desc    Get all batches for company
 * @route   GET /api/batches
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBatches = asyncHandler(async (req, res) => {
  const { departmentId, includeEmployeeCount = 'true' } = req.query;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  // Build query filter
  const filter = {
    companyId: user.companyId,
    isDeleted: { $ne: true }
  };

  if (departmentId) {
    const deptObjectId = toObjectId(departmentId);
    if (deptObjectId) {
      filter.$or = [
        { departmentId: null },
        { departmentId: deptObjectId }
      ];
    }
  }

  const batches = await collections.batches.find(filter).toArray();

  // Populate shift details
  const shiftIds = batches.map(b => b.shiftId);
  const shifts = shiftIds.length > 0 ? await collections.shifts.find({
    _id: { $in: shiftIds }
  }).toArray() : [];
  const shiftMap = new Map(shifts.map(s => [s._id.toString(), s]));

  // Get employee counts if requested
  let employeeCounts = new Map();
  if (includeEmployeeCount === 'true') {
    const batchIds = batches.map(b => b._id);
    const employees = await collections.employees.find({
      batchId: { $in: batchIds },
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    for (const emp of employees) {
      const batchId = emp.batchId?.toString();
      if (batchId) {
        employeeCounts.set(batchId, (employeeCounts.get(batchId) || 0) + 1);
      }
    }
  }

  const result = batches.map(batch => {
    const shift = shiftMap.get(batch.shiftId?.toString());
    return {
      ...batch,
      _id: batch._id.toString(),
      shiftId: batch.shiftId?.toString(),
      shiftName: shift?.name,
      shiftCode: shift?.code,
      shiftTiming: shift ? `${shift.startTime} - ${shift.endTime}` : null,
      shiftColor: shift?.color,
      employeeCount: employeeCounts.get(batch._id.toString()) || 0
    };
  });

  return sendSuccess(res, result, 'Batches retrieved successfully');
});

/**
 * @desc    Get single batch by ID
 * @route   GET /api/batches/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  const batch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Batch');
  }

  // Get shift details
  const shift = await collections.shifts.findOne({
    _id: batch.shiftId
  });

  // Get employees in batch
  const employees = await collections.employees.find({
    batchId: batch._id,
    isActive: true,
    isDeleted: { $ne: true }
  }).toArray();

  // Get department if set
  let department = null;
  if (batch.departmentId) {
    department = await collections.departments.findOne({
      _id: batch.departmentId
    });
  }

  const result = {
    ...batch,
    _id: batch._id.toString(),
    shiftId: batch.shiftId?.toString(),
    shiftDetails: shift ? {
      _id: shift._id.toString(),
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      duration: shift.duration,
      color: shift.color
    } : null,
    departmentDetails: department ? {
      _id: department._id.toString(),
      name: department.name
    } : null,
    employeeCount: employees.length,
    employees: employees.map(emp => ({
      _id: emp._id.toString(),
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      departmentId: emp.departmentId?.toString()
    }))
  };

  return sendSuccess(res, result, 'Batch retrieved successfully');
});

/**
 * @desc    Create new batch
 * @route   POST /api/batches
 * @access  Private (Admin, HR, Superadmin)
 */
export const createBatch = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    description,
    shiftId,
    rotationEnabled,
    rotationPattern,
    capacity,
    departmentId,
    color
  } = req.body;

  const user = extractUser(req);

  // Validation
  if (!name?.trim()) {
    throw buildValidationError('name', 'Batch name is required');
  }

  if (!shiftId) {
    throw buildValidationError('shiftId', 'Shift assignment is required');
  }

  const collections = getTenantCollections(user.companyId);

  // Verify shift exists
  const shift = await collections.shifts.findOne({
    _id: new ObjectId(shiftId),
    companyId: user.companyId,
    isActive: true,
    isDeleted: { $ne: true }
  });

  if (!shift) {
    throw buildNotFoundError('Shift');
  }

  // If rotation enabled, validate rotation pattern
  if (rotationEnabled) {
    if (!rotationPattern?.shiftSequence || rotationPattern.shiftSequence.length === 0) {
      throw buildValidationError('rotationPattern', 'Shift sequence is required when rotation is enabled');
    }
    if (!rotationPattern.daysPerShift || rotationPattern.daysPerShift < 1) {
      throw buildValidationError('daysPerShift', 'Valid days per shift is required');
    }

    // Verify all shifts in sequence exist
    const shiftIds = rotationPattern.shiftSequence.map(id => new ObjectId(id));
    const shiftsInSequence = await collections.shifts.find({
      _id: { $in: shiftIds },
      companyId: user.companyId,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    if (shiftsInSequence.length !== rotationPattern.shiftSequence.length) {
      throw buildValidationError('shiftSequence', 'One or more shifts in sequence are invalid');
    }
  }

  // Create batch
  const batchData = {
    companyId: user.companyId,
    name: name.trim(),
    code: code?.trim().toUpperCase(),
    description: description?.trim(),
    shiftId: new ObjectId(shiftId),
    shiftEffectiveFrom: new Date(),
    rotationEnabled: rotationEnabled || false,
    rotationPattern: rotationEnabled ? {
      mode: rotationPattern.mode || 'cyclic',
      shiftSequence: rotationPattern.shiftSequence.map(id => new ObjectId(id)),
      daysPerShift: rotationPattern.daysPerShift || 7,
      startDate: rotationPattern.startDate ? new Date(rotationPattern.startDate) : new Date(),
      currentIndex: rotationPattern.currentIndex || 0
    } : undefined,
    capacity: capacity || null,
    departmentId: departmentId ? toObjectId(departmentId) : null,
    color: color || '#1890ff',
    isActive: true,
    isDefault: false,
    isDeleted: false,
    createdBy: toObjectId(user.userId) || user.userId,
    updatedBy: toObjectId(user.userId) || user.userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collections.batches.insertOne(batchData);

  // Create assignment history record
  await collections.batchAssignmentHistory.insertOne({
    companyId: user.companyId,
    batchId: result.insertedId,
    shiftId: new ObjectId(shiftId),
    effectiveStartDate: new Date(),
    effectiveEndDate: null,
    rotationSnapshot: rotationEnabled ? {
      enabled: true,
      mode: rotationPattern.mode || 'cyclic',
      shiftSequence: rotationPattern.shiftSequence.map(id => new ObjectId(id)),
      daysPerShift: rotationPattern.daysPerShift || 7,
      startDate: rotationPattern.startDate ? new Date(rotationPattern.startDate) : new Date(),
      currentIndex: rotationPattern.currentIndex || 0
    } : undefined,
    assignedBy: toObjectId(user.userId) || user.userId,
    changeType: 'batch_created'
  });

  const createdBatch = await collections.batches.findOne({
    _id: result.insertedId
  });

  return sendSuccess(res, {
    ...createdBatch,
    _id: createdBatch._id.toString()
  }, 'Batch created successfully');
});

/**
 * @desc    Update batch
 * @route   PUT /api/batches/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    description,
    shiftId,
    rotationEnabled,
    rotationPattern,
    capacity,
    departmentId,
    color,
    isActive
  } = req.body;

  const user = extractUser(req);
  const collections = getTenantCollections(user.companyId);

  // Get existing batch
  const existingBatch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!existingBatch) {
    throw buildNotFoundError('Batch');
  }

  // Build update object
  const updates = { $set: {}, $unset: {} };
  const updateFields = {
    updatedAt: new Date(),
    updatedBy: toObjectId(user.userId) || user.userId
  };

  if (name !== undefined) {
    updateFields.name = name.trim();
  }

  if (code !== undefined) {
    updateFields.code = code?.trim().toUpperCase();
  }

  if (description !== undefined) {
    updateFields.description = description?.trim();
  }

  if (shiftId !== undefined) {
    // Verify shift exists
    const shift = await collections.shifts.findOne({
      _id: new ObjectId(shiftId),
      companyId: user.companyId,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (!shift) {
      throw buildNotFoundError('Shift');
    }

    // If shift changed, create history record
    if (existingBatch.shiftId.toString() !== shiftId) {
      await collections.batchAssignmentHistory.insertOne({
        companyId: user.companyId,
        batchId: existingBatch._id,
        shiftId: new ObjectId(shiftId),
        effectiveStartDate: new Date(),
        effectiveEndDate: null,
        rotationSnapshot: rotationEnabled ? rotationPattern : undefined,
        assignedBy: toObjectId(user.userId) || user.userId,
        changeType: 'manual'
      });

      // Close previous assignment
      await collections.batchAssignmentHistory.updateMany(
        {
          batchId: existingBatch._id,
          effectiveEndDate: null
        },
        {
          $set: { effectiveEndDate: new Date() }
        }
      );
    }

    updateFields.shiftId = new ObjectId(shiftId);
    updateFields.shiftEffectiveFrom = new Date();
  }

  if (rotationEnabled !== undefined) {
    updateFields.rotationEnabled = rotationEnabled;

    if (rotationEnabled) {
      if (!rotationPattern?.shiftSequence || rotationPattern.shiftSequence.length === 0) {
        throw buildValidationError('rotationPattern', 'Shift sequence is required when rotation is enabled');
      }

      updateFields.rotationPattern = {
        mode: rotationPattern.mode || 'cyclic',
        shiftSequence: rotationPattern.shiftSequence.map(id => new ObjectId(id)),
        daysPerShift: rotationPattern.daysPerShift || 7,
        startDate: rotationPattern.startDate ? new Date(rotationPattern.startDate) : new Date(),
        currentIndex: rotationPattern.currentIndex || 0
      };
    } else {
      updates.$unset.rotationPattern = '';
    }
  } else if (rotationPattern && existingBatch.rotationEnabled) {
    // Update rotation pattern if rotation is enabled
    updateFields.rotationPattern = {
      mode: rotationPattern.mode || existingBatch.rotationPattern?.mode || 'cyclic',
      shiftSequence: rotationPattern.shiftSequence.map(id => new ObjectId(id)),
      daysPerShift: rotationPattern.daysPerShift || 7,
      startDate: rotationPattern.startDate ? new Date(rotationPattern.startDate) : existingBatch.rotationPattern?.startDate || new Date(),
      currentIndex: rotationPattern.currentIndex || 0
    };
  }

  if (capacity !== undefined) {
    updateFields.capacity = capacity || null;
  }

  if (departmentId !== undefined) {
    updateFields.departmentId = departmentId ? toObjectId(departmentId) : null;
  }

  if (color !== undefined) {
    updateFields.color = color;
  }

  if (isActive !== undefined) {
    updateFields.isActive = isActive;
  }

  updates.$set = updateFields;

  await collections.batches.updateOne(
    { _id: new ObjectId(id) },
    updates
  );

  const updatedBatch = await collections.batches.findOne({
    _id: new ObjectId(id)
  });

  return sendSuccess(res, {
    ...updatedBatch,
    _id: updatedBatch._id.toString()
  }, 'Batch updated successfully');
});

/**
 * @desc    Delete (soft delete) batch
 * @route   DELETE /api/batches/:id
 * @access  Private (Admin, HR, Superadmin)
 */
export const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  // Check if batch exists
  const batch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Batch');
  }

  // Check if batch has employees
  const employeeCount = await collections.employees.countDocuments({
    batchId: batch._id,
    isActive: true,
    isDeleted: { $ne: true }
  });

  if (employeeCount > 0) {
    throw buildBadRequestError(
      `Cannot delete batch with ${employeeCount} employee(s). Please reassign employees first.`
    );
  }

  // Soft delete
  await collections.batches.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        isDeleted: true,
        isActive: false,
        deletedBy: toObjectId(user.userId) || user.userId,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  return sendSuccess(res, { id }, 'Batch deleted successfully');
});

/**
 * @desc    Get employees in a batch
 * @route   GET /api/batches/:id/employees
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBatchEmployees = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50, search } = req.query;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  // Check if batch exists
  const batch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Batch');
  }

  // Build filter
  const filter = {
    batchId: batch._id,
    isActive: true,
    isDeleted: { $ne: true }
  };

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Get total count
  const total = await collections.employees.countDocuments(filter);

  // Get employees with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const employees = await collections.employees
    .find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ firstName: 1, lastName: 1 })
    .toArray();

  // Get department details
  const departmentIds = employees.map(e => e.departmentId).filter(Boolean);
  const departments = departmentIds.length > 0 ? await collections.departments.find({
    _id: { $in: departmentIds }
  }).toArray() : [];
  const departmentMap = new Map(departments.map(d => [d._id.toString(), d]));

  const result = employees.map(emp => ({
    _id: emp._id.toString(),
    employeeId: emp.employeeId,
    firstName: emp.firstName,
    lastName: emp.lastName,
    fullName: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    phone: emp.phone,
    departmentId: emp.departmentId?.toString(),
    departmentName: departmentMap.get(emp.departmentId?.toString())?.name,
    designationId: emp.designation?.toString(),
    workLocation: emp.workLocation,
    employmentStatus: emp.employmentStatus,
    profileImage: emp.profileImage
  }));

  return sendSuccess(res, {
    employees: result,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Batch employees retrieved successfully');
});

/**
 * @desc    Get batch rotation schedule
 * @route   GET /api/batches/:id/schedule
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBatchSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, months = 3 } = req.query;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  const batch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Batch');
  }

  // Calculate date range
  const start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : new Date();

  if (!endDate) {
    end.setMonth(end.getMonth() + parseInt(months));
  }

  // Get schedule (this will use the schema method)
  const Batch = mongoose.model('Batch');
  const batchInstance = new Batch(batch);

  const schedule = batchInstance.getRotationSchedule(start, end);

  // Populate shift details for each schedule entry
  const shiftIds = schedule.map(s => s.shiftId?.toString()).filter(Boolean);
  const shifts = shiftIds.length > 0 ? await collections.shifts.find({
    _id: { $in: shiftIds.map(id => new ObjectId(id)) }
  }).toArray() : [];
  const shiftMap = new Map(shifts.map(s => [s._id.toString(), s]));

  const scheduleWithDetails = schedule.map(entry => {
    const shift = shiftMap.get(entry.shiftId?.toString());
    return {
      startDate: entry.startDate,
      endDate: entry.endDate,
      isRotation: entry.isRotation,
      shiftIndex: entry.shiftIndex,
      shift: shift ? {
        _id: shift._id.toString(),
        name: shift.name,
        code: shift.code,
        startTime: shift.startTime,
        endTime: shift.endTime,
        color: shift.color
      } : null
    };
  });

  // Get next rotation date
  const nextRotation = batchInstance.getNextRotationDate();

  return sendSuccess(res, {
    batchId: batch._id.toString(),
    batchName: batch.name,
    rotationEnabled: batch.rotationEnabled,
    nextRotationDate: nextRotation,
    schedule: scheduleWithDetails
  }, 'Batch schedule retrieved successfully');
});

/**
 * @desc    Get batch assignment history
 * @route   GET /api/batches/:id/history
 * @access  Private (Admin, HR, Superadmin)
 */
export const getBatchHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 20 } = req.query;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  // Check if batch exists
  const batch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Batch');
  }

  const history = await collections.batchAssignmentHistory
    .find({ batchId: batch._id })
    .sort({ effectiveStartDate: -1 })
    .limit(parseInt(limit))
    .toArray();

  // Populate shift and assigned by details
  const shiftIds = history.map(h => h.shiftId?.toString()).filter(Boolean);
  const shifts = shiftIds.length > 0 ? await collections.shifts.find({
    _id: { $in: shiftIds.map(id => new ObjectId(id)) }
  }).toArray() : [];
  const shiftMap = new Map(shifts.map(s => [s._id.toString(), s]));

  const userIds = history.map(h => h.assignedBy?.toString()).filter(Boolean);
  const users = userIds.length > 0 ? await collections.employees.find({
    _id: { $in: userIds.map(id => new ObjectId(id)) }
  }).toArray() : [];
  const userMap = new Map(users.map(u => [u._id.toString(), `${u.firstName} ${u.lastName}`]));

  const result = history.map(entry => ({
    _id: entry._id.toString(),
    shiftId: entry.shiftId?.toString(),
    shiftName: shiftMap.get(entry.shiftId?.toString())?.name,
    shiftCode: shiftMap.get(entry.shiftId?.toString())?.code,
    shiftTiming: shiftMap.get(entry.shiftId?.toString()) ?
      `${shiftMap.get(entry.shiftId?.toString()).startTime} - ${shiftMap.get(entry.shiftId?.toString()).endTime}` : null,
    shiftColor: shiftMap.get(entry.shiftId?.toString())?.color,
    effectiveStartDate: entry.effectiveStartDate,
    effectiveEndDate: entry.effectiveEndDate,
    assignedBy: userMap.get(entry.assignedBy?.toString()),
    reason: entry.reason,
    changeType: entry.changeType,
    rotationSnapshot: entry.rotationSnapshot
  }));

  return sendSuccess(res, result, 'Batch history retrieved successfully');
});

/**
 * @desc    Set batch as default
 * @route   POST /api/batches/:id/set-default
 * @access  Private (Admin, HR, Superadmin)
 */
export const setAsDefault = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  // Check if batch exists
  const batch = await collections.batches.findOne({
    _id: new ObjectId(id),
    companyId: user.companyId,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Batch');
  }

  // Remove default from all other batches
  await collections.batches.updateMany(
    {
      companyId: user.companyId,
      _id: { $ne: new ObjectId(id) }
    },
    { $set: { isDefault: false } }
  );

  // Set this batch as default
  await collections.batches.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        isDefault: true,
        updatedAt: new Date(),
        updatedBy: toObjectId(user.userId) || user.userId
      }
    }
  );

  return sendSuccess(res, { id }, 'Default batch updated successfully');
});

/**
 * @desc    Get default batch for company
 * @route   GET /api/batches/default
 * @access  Private
 */
export const getDefaultBatch = asyncHandler(async (req, res) => {
  const user = extractUser(req);

  const collections = getTenantCollections(user.companyId);

  const batch = await collections.batches.findOne({
    companyId: user.companyId,
    isDefault: true,
    isActive: true,
    isDeleted: { $ne: true }
  });

  if (!batch) {
    throw buildNotFoundError('Default batch not found for company');
  }

  // Populate shift details
  const shift = await collections.shifts.findOne({
    _id: batch.shiftId,
    isActive: true,
    isDeleted: { $ne: true }
  });

  const result = {
    ...batch,
    _id: batch._id.toString(),
    shiftId: batch.shiftId?.toString(),
    shiftName: shift?.name,
    shiftCode: shift?.code,
    shiftTiming: shift ? `${shift.startTime} - ${shift.endTime}` : null,
    shiftColor: shift?.color
  };

  return sendSuccess(res, result, 'Default batch retrieved successfully');
});

export default {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchEmployees,
  getBatchSchedule,
  getBatchHistory,
  setAsDefault,
  getDefaultBatch
};
