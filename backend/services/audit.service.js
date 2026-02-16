/**
 * Audit Service
 * Provides a centralized way to log audit events
 */

import AuditLog from '../models/auditLog.schema.js';

/**
 * Extract user information from request
 */
function extractActorInfo(req) {
  const user = req.user || {};
  return {
    actorId: user.id || user.dbUserId || null,
    actorName: user.fullName || user.name || 'Unknown User',
    actorEmail: user.email || null,
    actorRole: user.role || user.publicMetadata?.role || null,
  };
}

/**
 * Extract request context
 */
function extractRequestContext(req) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
    requestId: req.id || req.headers?.['x-request-id'] || null,
  };
}

/**
 * Calculate changes between two objects
 */
function calculateChanges(before, after) {
  const changedFields = [];
  const changes = { before: {}, after: {} };

  if (!before || !after) {
    return { changedFields, changes: { before, after } };
  }

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    const beforeVal = before?.[key];
    const afterVal = after?.[key];

    // Skip internal fields
    if (key.startsWith('_') || key === 'password' || key === 'updatedAt') {
      continue;
    }

    // Compare values
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changedFields.push(key);
      changes.before[key] = beforeVal;
      changes.after[key] = afterVal;
    }
  }

  return { changedFields, changes };
}

/**
 * Log an audit event
 * @param {Object} options - Audit log options
 * @param {String} options.entityType - Type of entity
 * @param {String} options.entityId - ID of entity
 * @param {String} options.entityName - Name of entity
 * @param {String} options.action - Action performed
 * @param {Object} options.req - Express request object (optional)
 * @param {Object} options.actor - Actor info (if req not provided)
 * @param {Object} options.before - State before change
 * @param {Object} options.after - State after change
 * @param {String} options.status - Status of action
 * @param {String} options.errorMessage - Error message if failed
 * @param {Object} options.metadata - Additional metadata
 */
export async function logAction({
  entityType,
  entityId,
  entityName,
  action,
  req = null,
  actor = null,
  before = null,
  after = null,
  status = 'success',
  errorMessage = null,
  metadata = null,
}) {
  try {
    // Extract actor info
    let actorInfo = actor;
    if (req && !actor) {
      actorInfo = extractActorInfo(req);
    }

    // Extract request context
    let requestContext = {};
    if (req) {
      requestContext = extractRequestContext(req);
    }

    // Calculate changes if both before and after provided
    let changes = { before, after };
    let changedFields = [];

    if (before && after) {
      const calculated = calculateChanges(before, after);
      changedFields = calculated.changedFields;
      changes = calculated.changes;
    }

    // Create log entry
    const logData = {
      entityType,
      entityId,
      entityName,
      action,
      ...actorInfo,
      changes,
      changedFields,
      ...requestContext,
      status,
      errorMessage,
      metadata,
    };

    const log = await AuditLog.logAction(logData);
    return log;
  } catch (error) {
    console.error('Failed to log audit action:', error);
    return null;
  }
}

/**
 * Log create action
 */
export async function logCreate({ entityType, entity, req, actor, metadata }) {
  return logAction({
    entityType,
    entityId: entity._id,
    entityName: entity.name || entity.email || entity.displayName || entity._id.toString(),
    action: 'create',
    req,
    actor,
    after: entity,
    metadata,
  });
}

/**
 * Log update action
 */
export async function logUpdate({ entityType, entityId, entityName, before, after, req, actor, metadata }) {
  return logAction({
    entityType,
    entityId,
    entityName,
    action: 'update',
    req,
    actor,
    before,
    after,
    metadata,
  });
}

/**
 * Log delete action
 */
export async function logDelete({ entityType, entityId, entityName, before, req, actor, metadata }) {
  return logAction({
    entityType,
    entityId,
    entityName,
    action: 'delete',
    req,
    actor,
    before,
    metadata,
  });
}

/**
 * Log status change action
 */
export async function logStatusChange({ entityType, entityId, entityName, oldStatus, newStatus, req, actor, metadata }) {
  return logAction({
    entityType,
    entityId,
    entityName,
    action: 'status_change',
    req,
    actor,
    before: { status: oldStatus },
    after: { status: newStatus },
    metadata: { ...metadata, oldStatus, newStatus },
  });
}

/**
 * Log login action
 */
export async function logLogin({ req, user, status = 'success', errorMessage = null }) {
  return logAction({
    entityType: 'user',
    entityId: user._id || user.id,
    entityName: user.name || user.email || 'Unknown',
    action: 'login',
    req,
    status,
    errorMessage,
    metadata: {
      loginMethod: user.loginMethod || 'standard',
    },
  });
}

/**
 * Log password reset action
 */
export async function logPasswordReset({ entityType, entityId, entityName, req, actor, metadata }) {
  return logAction({
    entityType,
    entityId,
    entityName,
    action: 'password_reset',
    req,
    actor,
    metadata: {
      ...metadata,
      sensitive: true,
    },
  });
}

/**
 * Get audit logs for an entity
 */
export async function getEntityLogs(entityType, entityId, options = {}) {
  return AuditLog.getEntityLogs(entityType, entityId, options);
}

/**
 * Get audit logs by actor
 */
export async function getActorLogs(actorId, options = {}) {
  return AuditLog.getActorLogs(actorId, options);
}

/**
 * Get audit statistics
 */
export async function getAuditStats(options = {}) {
  const { startDate, endDate, entityType } = options;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  if (entityType) {
    matchStage.entityType = entityType;
  }

  const stats = await AuditLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        successfulActions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
        },
        failedActions: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
        },
        actionsByType: {
          $push: '$action',
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalLogs: 0,
    successfulActions: 0,
    failedActions: 0,
    actionsByType: [],
  };

  // Count action types
  const actionCounts = {};
  for (const action of result.actionsByType) {
    actionCounts[action] = (actionCounts[action] || 0) + 1;
  }

  return {
    totalLogs: result.totalLogs,
    successfulActions: result.successfulActions,
    failedActions: result.failedActions,
    actionCounts,
  };
}

export default {
  logAction,
  logCreate,
  logUpdate,
  logDelete,
  logStatusChange,
  logLogin,
  logPasswordReset,
  getEntityLogs,
  getActorLogs,
  getAuditStats,
};
