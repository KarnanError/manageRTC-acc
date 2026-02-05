/**
 * Shift Scheduling Engine Service
 * Provides automated scheduling capabilities based on rules and patterns
 */

import { getTenantCollections } from '../../config/db.js';

/**
 * @desc    Get shift assignments for a date range
 * @param   {string} companyId - Company ID
 * @param   {Date} startDate - Start date
 * @param   {Date} endDate - End date
 * @returns {Promise<{done: boolean, data?: any[], error?: string}>}
 */
export const getShiftSchedule = async (companyId, startDate, endDate) => {
  try {
    const collections = getTenantCollections(companyId);

    const employees = await collections.employees.find({
      companyId,
      isDeleted: { $ne: true }
    }).toArray();

    const shifts = await collections.shifts.find({
      companyId,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    // Build schedule data
    const schedule = employees.map(emp => {
      const assignedShift = shifts.find(s => s._id.toString() === emp.shiftId?.toString());
      return {
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        shiftId: emp.shiftId || null,
        shiftName: assignedShift?.name || null,
        shiftCode: assignedShift?.code || null,
        shiftTiming: assignedShift ? `${assignedShift.startTime} - ${assignedShift.endTime}` : null,
        effectiveDate: emp.shiftEffectiveDate || null,
      };
    });

    return { done: true, data: schedule };
  } catch (error) {
    console.error('[ScheduleEngine] getShiftSchedule error:', error);
    return { done: false, error: error.message };
  }
};

/**
 * @desc    Auto-assign default shift to employees without shifts
 * @param   {string} companyId - Company ID
 * @param   {string} userId - User performing the action
 * @returns {Promise<{done: boolean, data?: any, error?: string}>}
 */
export const autoAssignDefaultShift = async (companyId, userId) => {
  try {
    const collections = getTenantCollections(companyId);

    // Get default shift
    const defaultShift = await collections.shifts.findOne({
      companyId,
      isDefault: true,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (!defaultShift) {
      return { done: false, error: 'No default shift found for company' };
    }

    // Find employees without shift assignment
    const employeesWithoutShift = await collections.employees.find({
      companyId,
      $or: [
        { shiftId: { $exists: false } },
        { shiftId: null }
      ],
      isDeleted: { $ne: true }
    }).toArray();

    if (employeesWithoutShift.length === 0) {
      return { done: true, data: { assigned: 0, message: 'All employees already have shifts assigned' } };
    }

    // Bulk assign default shift
    const employeeIds = employeesWithoutShift.map(emp => emp.employeeId);
    const effectiveDate = new Date();

    const result = await collections.employees.updateMany(
      {
        companyId,
        employeeId: { $in: employeeIds },
        isDeleted: { $ne: true }
      },
      {
        $set: {
          shiftId: defaultShift._id,
          shiftEffectiveDate: effectiveDate,
          updatedAt: new Date(),
          updatedBy: userId
        }
      }
    );

    return {
      done: true,
      data: {
        assigned: result.modifiedCount,
        shiftName: defaultShift.name,
        shiftId: defaultShift._id,
        message: `Assigned default shift (${defaultShift.name}) to ${result.modifiedCount} employee(s)`
      }
    };
  } catch (error) {
    console.error('[ScheduleEngine] autoAssignDefaultShift error:', error);
    return { done: false, error: error.message };
  }
};

/**
 * @desc    Apply rotating shift pattern to employees
 * @param   {string} companyId - Company ID
 * @param   {string[]} employeeIds - Employee IDs to apply rotation
 * @param   {string[]} shiftIds - Shift IDs in rotation order
 * @param   {number} rotateAfterDays - Days before rotating to next shift
 * @param   {Date} startDate - Start date for rotation
 * @param   {string} userId - User performing the action
 * @returns {Promise<{done: boolean, data?: any, error?: string}>}
 */
export const applyRotationPattern = async (companyId, employeeIds, shiftIds, rotateAfterDays, startDate, userId) => {
  try {
    const collections = getTenantCollections(companyId);

    // Validate shifts exist
    const shifts = await collections.shifts.find({
      companyId,
      _id: { $in: shiftIds.map(id => ({ $oid: id })) },
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    if (shifts.length !== shiftIds.length) {
      return { done: false, error: 'One or more shifts not found or inactive' };
    }

    // Validate employees exist
    const employees = await collections.employees.find({
      companyId,
      employeeId: { $in: employeeIds },
      isDeleted: { $ne: true }
    }).toArray();

    if (employees.length !== employeeIds.length) {
      return { done: false, error: 'One or more employees not found' };
    }

    // Calculate initial shift assignment based on date
    const rotationIndex = Math.floor(Date.now() / (rotateAfterDays * 24 * 60 * 60 * 1000)) % shiftIds.length;
    const initialShiftId = shiftIds[rotationIndex];

    // Assign initial shift
    const result = await collections.employees.updateMany(
      {
        companyId,
        employeeId: { $in: employeeIds },
        isDeleted: { $ne: true }
      },
      {
        $set: {
          shiftId: { $oid: initialShiftId },
          shiftEffectiveDate: startDate || new Date(),
          rotationPattern: {
            enabled: true,
            shiftIds,
            rotateAfterDays,
            startDate: startDate || new Date()
          },
          updatedAt: new Date(),
          updatedBy: userId
        }
      }
    );

    return {
      done: true,
      data: {
        assigned: result.modifiedCount,
        rotationPattern: {
          shiftIds,
          rotateAfterDays,
          currentShiftIndex: rotationIndex
        },
        message: `Applied rotation pattern to ${result.modifiedCount} employee(s)`
      }
    };
  } catch (error) {
    console.error('[ScheduleEngine] applyRotationPattern error:', error);
    return { done: false, error: error.message };
  }
};

/**
 * @desc    Get shift coverage report
 * @param   {string} companyId - Company ID
 * @param   {object} filters - Optional filters (department, date)
 * @returns {Promise<{done: boolean, data?: any, error?: string}>}
 */
export const getShiftCoverageReport = async (companyId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    // Get all active shifts
    const shifts = await collections.shifts.find({
      companyId,
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    // Get all employees
    const employees = await collections.employees.find({
      companyId,
      isDeleted: { $ne: true }
    }).toArray();

    // Calculate coverage
    const coverage = shifts.map(shift => {
      const employeeCount = employees.filter(
        emp => emp.shiftId && emp.shiftId.toString() === shift._id.toString()
      ).length;

      return {
        shiftId: shift._id,
        shiftName: shift.name,
        shiftCode: shift.code,
        shiftTiming: `${shift.startTime} - ${shift.endTime}`,
        type: shift.type,
        color: shift.color,
        employeeCount,
        isDefault: shift.isDefault
      };
    });

    // Summary stats
    const totalEmployees = employees.length;
    const unassignedCount = employees.filter(emp => !emp.shiftId).length;
    const assignedCount = totalEmployees - unassignedCount;

    return {
      done: true,
      data: {
        summary: {
          totalEmployees,
          assignedCount,
          unassignedCount,
          totalShifts: shifts.length
        },
        coverage
      }
    };
  } catch (error) {
    console.error('[ScheduleEngine] getShiftCoverageReport error:', error);
    return { done: false, error: error.message };
  }
};

/**
 * @desc    Preview auto-schedule without applying
 * @param   {string} companyId - Company ID
 * @param   {object} options - Scheduling options
 * @returns {Promise<{done: boolean, data?: any, error?: string}>}
 */
export const previewAutoSchedule = async (companyId, options) => {
  try {
    const { employeeIds, shiftId, effectiveDate, pattern } = options;
    const collections = getTenantCollections(companyId);

    // Get shift details
    const shift = await collections.shifts.findOne({
      _id: { $oid: shiftId },
      companyId,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (!shift) {
      return { done: false, error: 'Shift not found or inactive' };
    }

    // Get employee details
    const employees = await collections.employees.find({
      companyId,
      employeeId: { $in: employeeIds },
      isDeleted: { $ne: true }
    }).toArray();

    // Build preview without applying
    const preview = employees.map(emp => ({
      employeeId: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      currentShiftId: emp.shiftId || null,
      newShiftId: shiftId,
      newShiftName: shift.name,
      newShiftTiming: `${shift.startTime} - ${shift.endTime}`,
      effectiveDate: effectiveDate || new Date()
    }));

    return {
      done: true,
      data: {
        pattern,
        preview,
        summary: {
          totalEmployees: employees.length,
          shiftName: shift.name,
          effectiveDate: effectiveDate || new Date()
        }
      }
    };
  } catch (error) {
    console.error('[ScheduleEngine] previewAutoSchedule error:', error);
    return { done: false, error: error.message };
  }
};

export default {
  getShiftSchedule,
  autoAssignDefaultShift,
  applyRotationPattern,
  getShiftCoverageReport,
  previewAutoSchedule
};
