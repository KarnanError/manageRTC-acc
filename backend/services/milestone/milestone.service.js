import { getTenantCollections } from '../../config/db.js';
import { ObjectId } from 'mongodb';

// Helper function to generate next milestone ID
const generateNextMilestoneId = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    const lastMilestone = await collections.milestones.findOne(
      {},
      { sort: { createdAt: -1 } }
    );

    let nextId = 1;
    if (lastMilestone && lastMilestone.milestoneId) {
      const lastIdNumber = parseInt(lastMilestone.milestoneId.replace('MLS-', ''));
      nextId = lastIdNumber + 1;
    }

    const milestoneId = `MLS-${String(nextId).padStart(4, '0')}`;
    return milestoneId;
  } catch (error) {
    console.error('Error generating milestone ID:', error);
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
    console.error('[MilestoneService] Error parsing date:', { dateString, error });
    return undefined;
  }
};

/**
 * Create a new milestone
 */
export const createMilestone = async (companyId, milestoneData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[MilestoneService] createMilestone', { companyId, milestoneData });

    // Generate milestone ID
    const milestoneId = await generateNextMilestoneId(companyId);

    const newMilestone = {
      ...milestoneData,
      milestoneId,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: milestoneData.status || 'Pending',
      priority: milestoneData.priority || 'Medium',
      progress: milestoneData.progress || 0,
      isDeleted: false,
      startDate: parseDateFromString(milestoneData.startDate),
      dueDate: parseDateFromString(milestoneData.dueDate),
      completedDate: milestoneData.completedDate ? parseDateFromString(milestoneData.completedDate) : null,
    };

    // Convert projectId to ObjectId
    if (milestoneData.projectId) {
      if (!ObjectId.isValid(milestoneData.projectId)) {
        return { done: false, error: 'Invalid projectId format' };
      }
      newMilestone.projectId = new ObjectId(milestoneData.projectId);
    }

    // Convert dependencies to ObjectId array if provided
    if (milestoneData.dependencies && Array.isArray(milestoneData.dependencies)) {
      newMilestone.dependencies = milestoneData.dependencies
        .filter(dep => dep && ObjectId.isValid(dep))
        .map(dep => new ObjectId(dep));
    } else {
      newMilestone.dependencies = [];
    }

    // Ensure deliverables is an array
    newMilestone.deliverables = Array.isArray(milestoneData.deliverables) ? milestoneData.deliverables : [];

    // Ensure attachments is an array
    newMilestone.attachments = Array.isArray(milestoneData.attachments) ? milestoneData.attachments : [];

    const result = await collections.milestones.insertOne(newMilestone);
    console.log('[MilestoneService] insertOne result', { result });

    if (result.insertedId) {
      const inserted = await collections.milestones.findOne({
        _id: result.insertedId,
      });
      console.log('[MilestoneService] inserted milestone', { inserted });
      return { done: true, data: inserted };
    } else {
      console.error('[MilestoneService] Failed to insert milestone');
      return { done: false, error: 'Failed to insert milestone' };
    }
  } catch (error) {
    console.error('[MilestoneService] Error in createMilestone', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get milestones by project
 */
export const getMilestonesByProject = async (companyId, projectId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[MilestoneService] getMilestonesByProject', { companyId, projectId, filters });

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

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }

    const sort = { startDate: 1 };

    const milestones = await collections.milestones
      .find(query)
      .sort(sort)
      .toArray();

    return { done: true, data: milestones };
  } catch (error) {
    console.error('[MilestoneService] Error in getMilestonesByProject', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get all milestones with filters
 */
export const getMilestones = async (companyId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    const query = { isDeleted: { $ne: true } };

    // Apply project filter
    if (filters.projectId && ObjectId.isValid(filters.projectId)) {
      query.projectId = new ObjectId(filters.projectId);
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }

    // Apply search filter
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) {
        query.startDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.startDate.$lte = new Date(filters.endDate);
      }
    }

    const sort = filters.sortBy ? { [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 };

    const milestones = await collections.milestones
      .find(query)
      .sort(sort)
      .toArray();

    return { done: true, data: milestones };
  } catch (error) {
    console.error('[MilestoneService] Error in getMilestones', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get milestone by ID
 */
export const getMilestoneById = async (companyId, milestoneId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[MilestoneService] getMilestoneById', { companyId, milestoneId });

    if (!ObjectId.isValid(milestoneId)) {
      return { done: false, error: 'Invalid milestone ID format' };
    }

    const milestone = await collections.milestones.findOne({
      _id: new ObjectId(milestoneId),
      isDeleted: { $ne: true }
    });

    if (!milestone) {
      return { done: false, error: 'Milestone not found' };
    }

    // Populate project details
    if (milestone.projectId) {
      const project = await collections.projects.findOne({
        _id: milestone.projectId,
        isDeleted: { $ne: true }
      });
      if (project) {
        milestone.projectDetails = {
          projectId: project.projectId,
          name: project.name,
          status: project.status
        };
      }
    }

    return { done: true, data: milestone };
  } catch (error) {
    console.error('[MilestoneService] Error in getMilestoneById', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Update milestone
 */
export const updateMilestone = async (companyId, milestoneId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[MilestoneService] updateMilestone', {
      companyId,
      milestoneId,
      updateData,
    });

    if (!ObjectId.isValid(milestoneId)) {
      return { done: false, error: 'Invalid milestone ID format' };
    }

    const existingMilestone = await collections.milestones.findOne({
      _id: new ObjectId(milestoneId),
    });

    if (!existingMilestone) {
      return { done: false, error: 'Milestone not found' };
    }

    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Parse dates if provided
    if (updateData.startDate) {
      updateFields.startDate = parseDateFromString(updateData.startDate);
    }
    if (updateData.dueDate) {
      updateFields.dueDate = parseDateFromString(updateData.dueDate);
    }
    if (updateData.completedDate) {
      updateFields.completedDate = parseDateFromString(updateData.completedDate);
    }

    // Convert dependencies to ObjectId array if provided
    if (updateData.dependencies && Array.isArray(updateData.dependencies)) {
      updateFields.dependencies = updateData.dependencies
        .filter(dep => dep && ObjectId.isValid(dep))
        .map(dep => new ObjectId(dep));
    }

    // Ensure deliverables is an array
    if (updateData.deliverables !== undefined) {
      updateFields.deliverables = Array.isArray(updateData.deliverables) ? updateData.deliverables : [];
    }

    // Ensure attachments is an array
    if (updateData.attachments !== undefined) {
      updateFields.attachments = Array.isArray(updateData.attachments) ? updateData.attachments : [];
    }

    const result = await collections.milestones.updateOne(
      { _id: new ObjectId(milestoneId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: 'Milestone not found' };
    }

    const updatedMilestone = await collections.milestones.findOne({
      _id: new ObjectId(milestoneId),
    });

    return { done: true, data: updatedMilestone };
  } catch (error) {
    console.error('[MilestoneService] Error in updateMilestone', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Delete milestone (soft delete)
 */
export const deleteMilestone = async (companyId, milestoneId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[MilestoneService] deleteMilestone', { companyId, milestoneId });

    if (!ObjectId.isValid(milestoneId)) {
      return { done: false, error: 'Invalid milestone ID format' };
    }

    const existingMilestone = await collections.milestones.findOne({
      _id: new ObjectId(milestoneId),
      companyId,
      isDeleted: { $ne: true },
    });

    if (!existingMilestone) {
      return { done: false, error: 'Milestone not found' };
    }

    const result = await collections.milestones.updateOne(
      { _id: new ObjectId(milestoneId), companyId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: 'Milestone not found' };
    }

    return { done: true, data: existingMilestone };
  } catch (error) {
    console.error('[MilestoneService] Error in deleteMilestone', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get milestone statistics
 */
export const getMilestoneStats = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[MilestoneService] getMilestoneStats', { companyId });

    const pipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'Completed'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const stats = await collections.milestones.aggregate(pipeline).toArray();
    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    };

    // Priority distribution
    const priorityPipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const priorityStats = await collections.milestones
      .aggregate(priorityPipeline)
      .toArray();

    return {
      done: true,
      data: {
        ...result,
        priorityDistribution: priorityStats,
      },
    };
  } catch (error) {
    console.error('[MilestoneService] Error in getMilestoneStats', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Check milestone dependencies (circular dependency detection)
 */
export const checkMilestoneDependencies = async (companyId, milestoneId, dependencies = []) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!dependencies || dependencies.length === 0) {
      return { done: true, hasCircular: false };
    }

    // Check for circular dependencies
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = async (currentId) => {
      if (recursionStack.has(currentId)) {
        return true; // Cycle detected
      }
      if (visited.has(currentId)) {
        return false; // Already checked
      }

      visited.add(currentId);
      recursionStack.add(currentId);

      const milestone = await collections.milestones.findOne({
        _id: new ObjectId(currentId),
        isDeleted: { $ne: true }
      });

      if (milestone && milestone.dependencies && milestone.dependencies.length > 0) {
        for (const depId of milestone.dependencies) {
          if (await hasCycle(depId.toString())) {
            return true;
          }
        }
      }

      recursionStack.delete(currentId);
      return false;
    };

    // Check if any of the dependencies would create a cycle
    for (const depId of dependencies) {
      if (await hasCycle(depId)) {
        return {
          done: true,
          hasCircular: true,
          error: `Circular dependency detected involving milestone ${depId}`
        };
      }
    }

    return { done: true, hasCircular: false };
  } catch (error) {
    console.error('[MilestoneService] Error in checkMilestoneDependencies', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Mark milestone as complete
 */
export const markMilestoneComplete = async (companyId, milestoneId) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(milestoneId)) {
      return { done: false, error: 'Invalid milestone ID format' };
    }

    const milestone = await collections.milestones.findOne({
      _id: new ObjectId(milestoneId),
      isDeleted: { $ne: true }
    });

    if (!milestone) {
      return { done: false, error: 'Milestone not found' };
    }

    // Check if all dependencies are completed
    if (milestone.dependencies && milestone.dependencies.length > 0) {
      const dependencies = await collections.milestones.find({
        _id: { $in: milestone.dependencies },
        isDeleted: { $ne: true }
      }).toArray();

      const incompleteDeps = dependencies.filter(dep => dep.status !== 'Completed');
      if (incompleteDeps.length > 0) {
        return {
          done: false,
          error: 'Cannot complete milestone. Dependencies must be completed first.'
        };
      }
    }

    // Mark as complete
    const result = await collections.milestones.findOneAndUpdate(
      { _id: new ObjectId(milestoneId) },
      {
        $set: {
          status: 'Completed',
          progress: 100,
          completedDate: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return { done: true, data: result };
  } catch (error) {
    console.error('[MilestoneService] Error in markMilestoneComplete', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};
