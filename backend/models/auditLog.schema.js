/**
 * Audit Log Schema
 * Tracks all administrative actions for security and compliance
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Entity details
  entityType: {
    type: String,
    required: true,
    enum: ['superadmin', 'user', 'role', 'permission', 'module', 'company', 'other'],
    index: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  entityName: {
    type: String,
  },

  // Action performed
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'password_reset', 'status_change', 'permission_change', 'other'],
    index: true,
  },

  // Actor details
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  actorName: {
    type: String,
    required: true,
  },
  actorEmail: {
    type: String,
  },
  actorRole: {
    type: String,
  },

  // Changes made
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  changedFields: [String],

  // Request context
  ipAddress: String,
  userAgent: String,
  requestId: String,

  // Result
  status: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success',
  },
  errorMessage: String,

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
  capped: { size: 10240000, max: 50000 }, // 10MB cap, max 50k documents (rotates)
});

// Index for efficient queries
auditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entityId: 1, createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to save audit log:', error);
    // Don't throw - audit logging failures shouldn't break the main operation
    return null;
  }
};

// Static method to get logs for an entity
auditLogSchema.statics.getEntityLogs = async function(entityType, entityId, options = {}) {
  const {
    limit = 100,
    skip = 0,
    startDate,
    endDate,
    actions,
  } = options;

  const query = { entityType, entityId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }

  const logs = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await this.countDocuments(query);

  return { logs, total };
};

// Static method to get logs by actor
auditLogSchema.statics.getActorLogs = async function(actorId, options = {}) {
  const {
    limit = 100,
    skip = 0,
    startDate,
    endDate,
  } = options;

  const query = { actorId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await this.countDocuments(query);

  return { logs, total };
};

// Instance method to get summary
auditLogSchema.methods.getSummary = function() {
  return {
    id: this._id,
    action: this.action,
    entityType: this.entityType,
    entityName: this.entityName,
    actor: this.actorName,
    timestamp: this.createdAt,
    status: this.status,
  };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
