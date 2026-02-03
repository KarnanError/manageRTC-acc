import { getTenantCollections } from '../../config/db.js';
import { ObjectId } from 'mongodb';

// Helper function to generate next budget ID
const generateNextBudgetId = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    const lastBudget = await collections.budgets.findOne(
      {},
      { sort: { createdAt: -1 } }
    );

    let nextId = 1;
    if (lastBudget && lastBudget.budgetId) {
      const lastIdNumber = parseInt(lastBudget.budgetId.replace('BDG-', ''));
      nextId = lastIdNumber + 1;
    }

    const budgetId = `BDG-${String(nextId).padStart(4, '0')}`;
    return budgetId;
  } catch (error) {
    console.error('Error generating budget ID:', error);
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
    console.error('[BudgetService] Error parsing date:', { dateString, error });
    return undefined;
  }
};

/**
 * Create a new budget
 */
export const createBudget = async (companyId, budgetData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[BudgetService] createBudget', { companyId, budgetData });

    // Generate budget ID
    const budgetId = await generateNextBudgetId(companyId);

    const newBudget = {
      ...budgetData,
      budgetId,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: budgetData.status || 'Draft',
      budgetType: budgetData.budgetType || 'Project',
      allocatedBudget: budgetData.allocatedBudget || 0,
      spentAmount: budgetData.spentAmount || 0,
      remainingBudget: (budgetData.totalBudget || 0) - (budgetData.spentAmount || 0),
      isDeleted: false,
      startDate: parseDateFromString(budgetData.startDate),
      endDate: parseDateFromString(budgetData.endDate),
    };

    // Convert projectId to ObjectId
    if (budgetData.projectId) {
      if (!ObjectId.isValid(budgetData.projectId)) {
        return { done: false, error: 'Invalid projectId format' };
      }
      newBudget.projectId = new ObjectId(budgetData.projectId);
    }

    // Ensure budgetCategories is an array
    newBudget.budgetCategories = Array.isArray(budgetData.budgetCategories) ? budgetData.budgetCategories : [];

    // Ensure approvals is an array
    newBudget.approvals = Array.isArray(budgetData.approvals) ? budgetData.approvals : [];

    const result = await collections.budgets.insertOne(newBudget);
    console.log('[BudgetService] insertOne result', { result });

    if (result.insertedId) {
      const inserted = await collections.budgets.findOne({
        _id: result.insertedId,
      });
      console.log('[BudgetService] inserted budget', { inserted });
      return { done: true, data: inserted };
    } else {
      console.error('[BudgetService] Failed to insert budget');
      return { done: false, error: 'Failed to insert budget' };
    }
  } catch (error) {
    console.error('[BudgetService] Error in createBudget', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get budgets by project
 */
export const getBudgetsByProject = async (companyId, projectId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[BudgetService] getBudgetsByProject', { companyId, projectId, filters });

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

    // Apply budget type filter
    if (filters.budgetType && filters.budgetType !== 'all') {
      query.budgetType = filters.budgetType;
    }

    const sort = { startDate: -1 };

    const budgets = await collections.budgets
      .find(query)
      .sort(sort)
      .toArray();

    return { done: true, data: budgets };
  } catch (error) {
    console.error('[BudgetService] Error in getBudgetsByProject', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get all budgets with filters
 */
export const getBudgets = async (companyId, filters = {}) => {
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

    // Apply budget type filter
    if (filters.budgetType && filters.budgetType !== 'all') {
      query.budgetType = filters.budgetType;
    }

    // Apply fiscal year filter
    if (filters.fiscalYear) {
      query.fiscalYear = filters.fiscalYear;
    }

    // Apply search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const sort = filters.sortBy ? { [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 };

    const budgets = await collections.budgets
      .find(query)
      .sort(sort)
      .toArray();

    return { done: true, data: budgets };
  } catch (error) {
    console.error('[BudgetService] Error in getBudgets', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get budget by ID
 */
export const getBudgetById = async (companyId, budgetId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[BudgetService] getBudgetById', { companyId, budgetId });

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const budget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
      isDeleted: { $ne: true }
    });

    if (!budget) {
      return { done: false, error: 'Budget not found' };
    }

    // Populate project details
    if (budget.projectId) {
      const project = await collections.projects.findOne({
        _id: budget.projectId,
        isDeleted: { $ne: true }
      });
      if (project) {
        budget.projectDetails = {
          projectId: project.projectId,
          name: project.name,
          status: project.status
        };
      }
    }

    return { done: true, data: budget };
  } catch (error) {
    console.error('[BudgetService] Error in getBudgetById', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Update budget
 */
export const updateBudget = async (companyId, budgetId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[BudgetService] updateBudget', {
      companyId,
      budgetId,
      updateData,
    });

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const existingBudget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
    });

    if (!existingBudget) {
      return { done: false, error: 'Budget not found' };
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

    // Recalculate remaining budget if total or spent changed
    if (updateData.totalBudget !== undefined || updateData.spentAmount !== undefined) {
      const totalBudget = updateData.totalBudget !== undefined ? updateData.totalBudget : existingBudget.totalBudget;
      const spentAmount = updateData.spentAmount !== undefined ? updateData.spentAmount : existingBudget.spentAmount;
      updateFields.remainingBudget = totalBudget - spentAmount;

      // Update status if over budget
      if (spentAmount > totalBudget) {
        updateFields.status = 'Exceeded';
      } else if (existingBudget.status === 'Exceeded' && spentAmount <= totalBudget) {
        updateFields.status = 'Active';
      }
    }

    // Ensure budgetCategories is an array
    if (updateData.budgetCategories !== undefined) {
      updateFields.budgetCategories = Array.isArray(updateData.budgetCategories) ? updateData.budgetCategories : [];
    }

    const result = await collections.budgets.updateOne(
      { _id: new ObjectId(budgetId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: 'Budget not found' };
    }

    const updatedBudget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
    });

    return { done: true, data: updatedBudget };
  } catch (error) {
    console.error('[BudgetService] Error in updateBudget', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Delete budget (soft delete)
 */
export const deleteBudget = async (companyId, budgetId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[BudgetService] deleteBudget', { companyId, budgetId });

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const existingBudget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
      companyId,
      isDeleted: { $ne: true },
    });

    if (!existingBudget) {
      return { done: false, error: 'Budget not found' };
    }

    const result = await collections.budgets.updateOne(
      { _id: new ObjectId(budgetId), companyId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: 'Budget not found' };
    }

    return { done: true, data: existingBudget };
  } catch (error) {
    console.error('[BudgetService] Error in deleteBudget', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Add expense to budget
 */
export const addExpense = async (companyId, budgetId, amount, category = null) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const budget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
      isDeleted: { $ne: true }
    });

    if (!budget) {
      return { done: false, error: 'Budget not found' };
    }

    const updateFields = {
      $inc: { spentAmount: amount },
      updatedAt: new Date()
    };

    // Update category if provided
    if (category && budget.budgetCategories && budget.budgetCategories.length > 0) {
      const catIndex = budget.budgetCategories.findIndex(c => c.category === category);
      if (catIndex >= 0) {
        updateFields.$inc[`budgetCategories.${catIndex}.spent`, amount];
      }
    }

    // Recalculate remaining budget
    const newSpentAmount = budget.spentAmount + amount;
    updateFields.$set = {
      remainingBudget: budget.totalBudget - newSpentAmount
    };

    // Update status if over budget
    if (newSpentAmount > budget.totalBudget) {
      updateFields.$set.status = 'Exceeded';
    }

    const result = await collections.budgets.findOneAndUpdate(
      { _id: new ObjectId(budgetId) },
      updateFields,
      { returnDocument: 'after' }
    );

    return { done: true, data: result };
  } catch (error) {
    console.error('[BudgetService] Error in addExpense', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get budget tracking
 */
export const getBudgetTracking = async (companyId, budgetId) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const budget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
      isDeleted: { $ne: true }
    });

    if (!budget) {
      return { done: false, error: 'Budget not found' };
    }

    // Calculate tracking metrics
    const tracking = {
      budgetId: budget.budgetId,
      name: budget.name,
      totalBudget: budget.totalBudget,
      allocatedBudget: budget.allocatedBudget,
      spentAmount: budget.spentAmount,
      remainingBudget: budget.remainingBudget,
      utilizationPercentage: budget.totalBudget > 0 ? Math.round((budget.spentAmount / budget.totalBudget) * 100) : 0,
      isOverBudget: budget.spentAmount > budget.totalBudget,
      isNearLimit: budget.totalBudget > 0 && (budget.spentAmount / budget.totalBudget) >= 0.8,
      status: budget.status,
      budgetCategories: budget.budgetCategories || [],
      variance: budget.totalBudget - budget.spentAmount,
      startDate: budget.startDate,
      endDate: budget.endDate
    };

    return { done: true, data: tracking };
  } catch (error) {
    console.error('[BudgetService] Error in getBudgetTracking', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Approve budget
 */
export const approveBudget = async (companyId, budgetId, approverId, comment = null) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const budget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
      isDeleted: { $ne: true }
    });

    if (!budget) {
      return { done: false, error: 'Budget not found' };
    }

    const approvals = budget.approvals || [];
    approvals.push({
      userId: approverId,
      approvedAt: new Date(),
      comments: comment || ''
    });

    const result = await collections.budgets.findOneAndUpdate(
      { _id: new ObjectId(budgetId) },
      {
        $set: {
          status: 'Approved',
          approvedBy: approverId,
          approvedDate: new Date(),
          approvals: approvals,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return { done: true, data: result };
  } catch (error) {
    console.error('[BudgetService] Error in approveBudget', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Check if budget is exceeded
 */
export const checkBudgetExceeded = async (companyId, budgetId) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(budgetId)) {
      return { done: false, error: 'Invalid budget ID format' };
    }

    const budget = await collections.budgets.findOne({
      _id: new ObjectId(budgetId),
      isDeleted: { $ne: true }
    });

    if (!budget) {
      return { done: false, error: 'Budget not found' };
    }

    const isExceeded = budget.spentAmount > budget.totalBudget;
    const variance = budget.totalBudget - budget.spentAmount;
    const utilizationPercentage = budget.totalBudget > 0
      ? Math.round((budget.spentAmount / budget.totalBudget) * 100)
      : 0;

    return {
      done: true,
      data: {
        isExceeded,
        isNearLimit: utilizationPercentage >= 80,
        variance,
        utilizationPercentage,
        spentAmount: budget.spentAmount,
        totalBudget: budget.totalBudget,
        remainingBudget: budget.remainingBudget
      }
    };
  } catch (error) {
    console.error('[BudgetService] Error in checkBudgetExceeded', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

/**
 * Get budget statistics
 */
export const getBudgetStats = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log('[BudgetService] getBudgetStats', { companyId });

    const pipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          exceeded: { $sum: { $cond: [{ $eq: ['$status', 'Exceeded'] }, 1, 0] } },
          totalBudget: { $sum: '$totalBudget' },
          totalSpent: { $sum: '$spentAmount' },
          totalRemaining: { $sum: '$remainingBudget' }
        }
      }
    ];

    const stats = await collections.budgets.aggregate(pipeline).toArray();
    const result = stats[0] || {
      total: 0,
      draft: 0,
      active: 0,
      approved: 0,
      exceeded: 0,
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0
    };

    // Budget type distribution
    const typePipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      { $group: { _id: '$budgetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const typeStats = await collections.budgets
      .aggregate(typePipeline)
      .toArray();

    return {
      done: true,
      data: {
        ...result,
        typeDistribution: typeStats,
        overallUtilization: result.totalBudget > 0
          ? Math.round((result.totalSpent / result.totalBudget) * 100)
          : 0
      }
    };
  } catch (error) {
    console.error('[BudgetService] Error in getBudgetStats', {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};
