import { getTenantCollections } from '../../config/db.js';
import { ObjectId } from 'mongodb';

// Helper function to generate next allocation ID
const generateNextAllocationId = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    const lastAllocation = await collections.resourceAllocations.findOne(
      {},
      { sort: { createdAt: -1 } }
    );

    let nextId = 1;
    if (lastAllocation && lastAllocation.allocationId) {
      const lastIdNumber = parseInt(lastAllocation.allocationId.replace('RSC-', ''));
      nextId = lastIdNumber + 1;
    }

    const allocationId = `RSC-${String(nextId).padStart(4, '0')}`;
    return allocationId;
  } catch (error) {
    console.error('Error generating allocation ID:', error);
    throw error;
  }
};

// Helper function to parse date strings
const parseDateFromString = (dateString) => {
  if (!dateString) return undefined;
  try {
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  } catch (error) {
    console.error('[ResourceService] Error parsing date:', { dateString, error });
    return undefined;
  }
};

/**
 * Allocate resource to project/task
 */
export const allocateResource = async (companyId, allocationData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[ResourceService] allocateResource', { companyId, allocationData });

    // Generate allocation ID
    const allocationId = await generateNextAllocationId(companyId);

    const newAllocation = {
      ...allocationData,
      allocationId,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: allocationData.status || 'Active',
      allocationPercentage: allocationData.allocationPercentage || 100,
      hourlyRate: allocationData.hourlyRate || 0,
      skills: Array.isArray(allocationData.skills) ? allocationData.skills : [],
      isDeleted: false,
      startDate: parseDateFromString(allocationData.startDate),
      endDate: parseDateFromString(allocationData.endDate),
    };

    // Convert projectId to ObjectId
    if (allocationData.projectId) {
      if (!ObjectId.isValid(allocationData.projectId)) {
        return { done: false, error: 'Invalid projectId format' };
      }
      newAllocation.projectId = new ObjectId(allocationData.projectId);
    }

    // Convert taskId to ObjectId if provided
    if (allocationData.taskId) {
      if (!ObjectId.isValid(allocationData.taskId)) {
        return { done: false, error: 'Invalid taskId format' };
      }
      newAllocation.taskId = new ObjectId(allocationData.taskId);
    }

    // Convert resourceId to ObjectId
    if (allocationData.resourceId) {
      if (!ObjectId.isValid(allocationData.resourceId)) {
        return { done: false, error: 'Invalid resourceId format' };
      }
      newAllocation.resourceId = new ObjectId(allocationData.resourceId);
    }

    // Check for conflicts
    const conflictCheck = await checkResourceConflict(
      companyId,
      allocationData.resourceId,
      allocationData.startDate,
      allocationData.endDate
    );

    if (conflictCheck.done && conflictCheck.hasConflict) {
      return { done: false, error: 'Resource has a scheduling conflict during the specified period' };
    }

    const result = await collections.resourceAllocations.insertOne(newAllocation);
    console.log('[ResourceService] insertOne result', { result });

    if (result.insertedId) {
      const inserted = await collections.resourceAllocations.findOne({
        _id: result.insertedId,
      });
      console.log('[ResourceService] inserted allocation', { inserted });
      return { done: true, data: inserted };
    } else {
      console.error('[ResourceService] Failed to insert allocation');
      return { done: false, error: 'Failed to insert allocation' };
    }
  } catch (error) {
    console.error('[ResourceService] Error in allocateResource', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get resource allocations
 */
export const getResourceAllocations = async (companyId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    const query = { isDeleted: { $ne: true } };

    // Apply project filter
    if (filters.projectId && ObjectId.isValid(filters.projectId)) {
      query.projectId = new ObjectId(filters.projectId);
    }

    // Apply task filter
    if (filters.taskId && ObjectId.isValid(filters.taskId)) {
      query.taskId = new ObjectId(filters.taskId);
    }

    // Apply resource filter
    if (filters.resourceId && ObjectId.isValid(filters.resourceId)) {
      query.resourceId = new ObjectId(filters.resourceId);
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Apply skills filter
    if (filters.skills && Array.isArray(filters.skills)) {
      query.skills = { $in: filters.skills };
    }

    const sort = filters.sortBy ? { [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 } : { startDate: -1 };

    const allocations = await collections.resourceAllocations
      .find(query)
      .sort(sort)
      .toArray();

    return { done: true, data: allocations };
  } catch (error) {
    console.error('[ResourceService] Error in getResourceAllocations', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get allocations by project
 */
export const getResourceByProject = async (companyId, projectId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(projectId)) {
      return { done: false, error: 'Invalid project ID format' };
    }

    const query = {
      projectId: new ObjectId(projectId),
      isDeleted: { $ne: true }
    };

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    const sort = { startDate: -1 };

    const allocations = await collections.resourceAllocations
      .find(query)
      .sort(sort)
      .toArray();

    return { done: true, data: allocations };
  } catch (error) {
    console.error('[ResourceService] Error in getResourceByProject', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get allocation by ID
 */
export const getAllocationById = async (companyId, allocationId) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(allocationId)) {
      return { done: false, error: 'Invalid allocation ID format' };
    }

    const allocation = await collections.resourceAllocations.findOne({
      _id: new ObjectId(allocationId),
      isDeleted: { $ne: true }
    });

    if (!allocation) {
      return { done: false, error: 'Resource allocation not found' };
    }

    // Populate project details
    if (allocation.projectId) {
      const project = await collections.projects.findOne({
        _id: allocation.projectId,
        isDeleted: { $ne: true }
      });
      if (project) {
        allocation.projectDetails = {
          projectId: project.projectId,
          name: project.name
        };
      }
    }

    // Populate task details
    if (allocation.taskId) {
      const task = await collections.tasks.findOne({
        _id: allocation.taskId,
        isDeleted: { $ne: true }
      });
      if (task) {
        allocation.taskDetails = {
          title: task.title,
          status: task.status
        };
      }
    }

    // Populate resource details
    if (allocation.resourceId) {
      const employee = await collections.employees.findOne({
        _id: allocation.resourceId,
        status: 'Active'
      });
      if (employee) {
        allocation.resourceDetails = {
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName || `${employee.firstName} ${employee.lastName}`,
          email: employee.email
        };
      }
    }

    return { done: true, data: allocation };
  } catch (error) {
    console.error('[ResourceService] Error in getAllocationById', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Update allocation
 */
export const updateAllocation = async (companyId, allocationId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(allocationId)) {
      return { done: false, error: 'Invalid allocation ID format' };
    }

    const existingAllocation = await collections.resourceAllocations.findOne({
      _id: new ObjectId(allocationId),
    });

    if (!existingAllocation) {
      return { done: false, error: 'Resource allocation not found' };
    }

    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Parse dates if provided
    if (updateData.startDate) {
      updateFields.startDate = parseDateFromString(updateData.startDate);
    }
    if (updateData.endDate) {
      updateFields.endDate = parseDateFromString(updateData.endDate);
    }

    // Convert references to ObjectId if provided
    if (updateData.projectId && ObjectId.isValid(updateData.projectId)) {
      updateFields.projectId = new ObjectId(updateData.projectId);
    }
    if (updateData.taskId && ObjectId.isValid(updateData.taskId)) {
      updateFields.taskId = new ObjectId(updateData.taskId);
    }
    if (updateData.resourceId && ObjectId.isValid(updateData.resourceId)) {
      updateFields.resourceId = new ObjectId(updateData.resourceId);
    }

    // Ensure skills is an array
    if (updateData.skills !== undefined) {
      updateFields.skills = Array.isArray(updateData.skills) ? updateData.skills : [];
    }

    const result = await collections.resourceAllocations.updateOne(
      { _id: new ObjectId(allocationId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: 'Resource allocation not found' };
    }

    const updatedAllocation = await collections.resourceAllocations.findOne({
      _id: new ObjectId(allocationId),
    });

    return { done: true, data: updatedAllocation };
  } catch (error) {
    console.error('[ResourceService] Error in updateAllocation', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Deallocate resource (cancel allocation)
 */
export const deallocateResource = async (companyId, allocationId, reason = '') => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(allocationId)) {
      return { done: false, error: 'Invalid allocation ID format' };
    }

    const existingAllocation = await collections.resourceAllocations.findOne({
      _id: new ObjectId(allocationId),
      companyId,
      isDeleted: { $ne: true },
    });

    if (!existingAllocation) {
      return { done: false, error: 'Resource allocation not found' };
    }

    // Soft delete
    const result = await collections.resourceAllocations.updateOne(
      { _id: new ObjectId(allocationId), companyId },
      {
        $set: {
          status: 'Cancelled',
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: 'Resource allocation not found' };
    }

    return { done: true, data: existingAllocation };
  } catch (error) {
    console.error('[ResourceService] Error in deallocateResource', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Check for resource conflicts
 */
export const checkResourceConflict = async (companyId, resourceId, startDate, endDate) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(resourceId)) {
      return { done: false, error: 'Invalid resource ID format' };
    }

    const start = parseDateFromString(startDate);
    const end = parseDateFromString(endDate);

    // Find overlapping allocations for the same resource
    const query = {
      resourceId: new ObjectId(resourceId),
      status: 'Active',
      isDeleted: { $ne: true },
      $or: [
        // Existing allocation starts during new period
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        },
        // Existing allocation completely covers new period
        {
          startDate: { $lte: start },
          endDate: { $gte: end }
        },
        // New allocation completely covers existing period
        {
          startDate: { $gte: start },
          endDate: { $lte: end }
        }
      ]
    };

    const conflicts = await collections.resourceAllocations.find(query).toArray();

    return {
      done: true,
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        allocationId: c.allocationId,
        projectId: c.projectId,
        taskId: c.taskId,
        startDate: c.startDate,
        endDate: c.endDate
      }))
    };
  } catch (error) {
    console.error('[ResourceService] Error in checkResourceConflict', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get resource utilization
 */
export const getResourceUtilization = async (companyId, resourceId, startDate, endDate) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(resourceId)) {
      return { done: false, error: 'Invalid resource ID format' };
    }

    const start = parseDateFromString(startDate);
    const end = parseDateFromString(endDate);

    // Find all active allocations within date range
    const query = {
      resourceId: new ObjectId(resourceId),
      status: 'Active',
      isDeleted: { $ne: true },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    };

    const allocations = await collections.resourceAllocations.find(query).toArray();

    // Calculate utilization
    let totalAllocationHours = 0;
    const utilizations = [];

    for (const allocation of allocations) {
      const allocStart = new Date(allocation.startDate);
      const allocEnd = new Date(allocation.endDate);

      // Calculate overlap days
      const overlapStart = allocStart > start ? allocStart : start;
      const overlapEnd = allocEnd < end ? allocEnd : end;

      if (overlapStart <= overlapEnd) {
        const daysDiff = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        const hours = daysDiff * 8 * (allocation.allocationPercentage / 100); // Assuming 8-hour workday

        totalAllocationHours += hours;

        utilizations.push({
          allocationId: allocation.allocationId,
          projectId: allocation.projectId,
          taskId: allocation.taskId,
          allocationPercentage: allocation.allocationPercentage,
          startDate: allocation.startDate,
          endDate: allocation.endDate,
          days: daysDiff,
          hours: hours
        });
      }
    }

    // Calculate total available hours in range
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalAvailableHours = totalDays * 8; // Assuming 8-hour workday

    const utilizationPercentage = totalAvailableHours > 0
      ? Math.round((totalAllocationHours / totalAvailableHours) * 100)
      : 0;

    return {
      done: true,
      data: {
        resourceId,
        startDate: start,
        endDate: end,
        totalDays,
        totalAvailableHours,
        totalAllocationHours,
        utilizationPercentage,
        allocations: utilizations,
        isOverUtilized: utilizationPercentage > 100,
        availableHours: totalAvailableHours - totalAllocationHours
      }
    };
  } catch (error) {
    console.error('[ResourceService] Error in getResourceUtilization', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get available resources (not allocated during period)
 */
export const getAvailableResources = async (companyId, startDate, endDate, skills = []) => {
  try {
    const collections = getTenantCollections(companyId);

    const start = parseDateFromString(startDate);
    const end = parseDateFromString(endDate);

    // Get all active employees
    const employeeQuery = { status: 'Active' };
    if (skills && skills.length > 0) {
      employeeQuery.skills = { $in: skills };
    }

    const allEmployees = await collections.employees.find(employeeQuery).toArray();

    // Get allocated resource IDs during the period
    const allocations = await collections.resourceAllocations.find({
      status: 'Active',
      isDeleted: { $ne: true },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    }).toArray();

    const allocatedResourceIds = new Set(
      allocations.map(a => a.resourceId.toString())
    );

    // Filter out allocated resources
    const availableResources = allEmployees.filter(
      emp => !allocatedResourceIds.has(emp._id.toString())
    );

    return {
      done: true,
      data: availableResources.map(emp => ({
        _id: emp._id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        skills: emp.skills || []
      }))
    };
  } catch (error) {
    console.error('[ResourceService] Error in getAvailableResources', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};
