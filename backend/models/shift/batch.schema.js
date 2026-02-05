/**
 * Batch Schema
 * Groups employees for shift assignment and rotation management
 */

import mongoose from 'mongoose';
import { generateBatchId } from '../../utils/idGenerator.js';

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Company for multi-tenant isolation
  companyId: {
    type: String,
    required: true,
    index: true
  },

  // Batch identification
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true,
    maxlength: [100, 'Batch name cannot exceed 100 characters']
  },
  code: {
    type: String,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Batch code cannot exceed 20 characters']
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },

  // Current shift assignment
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'Shift assignment is required'],
    index: true
  },
  shiftEffectiveFrom: {
    type: Date,
    default: Date.now
  },

  // Rotation configuration
  rotationEnabled: {
    type: Boolean,
    default: false
  },
  rotationPattern: {
    type: {
      // Rotation type: 'cyclic' (A→B→C→A) or 'sequential' (A→B→C)
      mode: {
        type: String,
        enum: ['cyclic', 'sequential'],
        default: 'cyclic'
      },
      // Shifts to rotate through (ordered)
      shiftSequence: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift'
      }],
      // Duration for each shift in rotation (days)
      daysPerShift: {
        type: Number,
        default: 7,
        min: [1, 'Days per shift must be at least 1']
      },
      // When rotation starts
      startDate: {
        type: Date,
        default: Date.now
      },
      // Current position in sequence
      currentIndex: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    _meta: {} // Store only if rotationEnabled is true
  },

  // Employee capacity (optional - null = unlimited)
  capacity: {
    type: Number,
    default: null,
    min: [1, 'Capacity must be at least 1']
  },

  // Department filter (optional - restrict batch to department)
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },

  // Color coding for UI
  color: {
    type: String,
    default: '#1890ff',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  },

  // Is default batch for company
  isDefault: {
    type: Boolean,
    default: false
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
batchSchema.index({ companyId: 1, isActive: 1 });
batchSchema.index({ companyId: 1, shiftId: 1 });
batchSchema.index({ companyId: 1, departmentId: 1 });
batchSchema.index({ companyId: 1, isDefault: 1 });
batchSchema.index({ companyId: 1, isDeleted: 1 });

// Pre-save middleware to generate batch ID
batchSchema.pre('save', async function(next) {
  if (!this.batchId) {
    try {
      this.batchId = await generateBatchId(this.companyId);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Virtual for employee count
batchSchema.virtual('employeeCount').get(function() {
  // This will be populated when querying
  return this._employeeCount || 0;
});

/**
 * Get current shift for this batch
 * @returns {ObjectId} Current shift ID
 */
batchSchema.methods.getCurrentShift = function() {
  if (!this.rotationEnabled || !this.rotationPattern?.shiftSequence?.length) {
    return this.shiftId;
  }

  // Calculate current position based on rotation
  const now = new Date();
  const startDate = new Date(this.rotationPattern.startDate);
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const shiftSequenceLength = this.rotationPattern.shiftSequence.length;
  const daysPerShift = this.rotationPattern.daysPerShift || 7;
  const totalCycleDays = shiftSequenceLength * daysPerShift;

  // Calculate position in cycle
  const positionInCycle = (daysSinceStart % totalCycleDays + totalCycleDays) % totalCycleDays;
  const shiftIndex = Math.floor(positionInCycle / daysPerShift);

  return this.rotationPattern.shiftSequence[shiftIndex % shiftSequenceLength];
};

/**
 * Get shift for a specific date
 * @param {Date} date - Target date
 * @returns {ObjectId} Shift ID for the date
 */
batchSchema.methods.getShiftForDate = function(date) {
  if (!this.rotationEnabled || !this.rotationPattern?.shiftSequence?.length) {
    return this.shiftId;
  }

  const targetDate = new Date(date);
  const startDate = new Date(this.rotationPattern.startDate);
  const daysSinceStart = Math.floor(
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const shiftSequenceLength = this.rotationPattern.shiftSequence.length;
  const daysPerShift = this.rotationPattern.daysPerShift || 7;
  const totalCycleDays = shiftSequenceLength * daysPerShift;

  // Calculate position in cycle (handle negative dates)
  const positionInCycle = (daysSinceStart % totalCycleDays + totalCycleDays) % totalCycleDays;
  const shiftIndex = Math.floor(positionInCycle / daysPerShift);

  return this.rotationPattern.shiftSequence[shiftIndex % shiftSequenceLength];
};

/**
 * Get rotation schedule for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of schedule objects with shiftId, startDate, endDate
 */
batchSchema.methods.getRotationSchedule = function(startDate, endDate) {
  if (!this.rotationEnabled || !this.rotationPattern?.shiftSequence?.length) {
    return [{
      shiftId: this.shiftId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isRotation: false
    }];
  }

  const schedule = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const rotationStart = new Date(this.rotationPattern.startDate);
  rotationStart.setHours(0, 0, 0, 0);

  const shiftSequence = this.rotationPattern.shiftSequence;
  const daysPerShift = this.rotationPattern.daysPerShift || 7;
  const totalCycleDays = shiftSequence.length * daysPerShift;

  let currentDate = new Date(start);

  while (currentDate <= end) {
    const daysSinceRotationStart = Math.floor(
      (currentDate.getTime() - rotationStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const positionInCycle = (daysSinceRotationStart % totalCycleDays + totalCycleDays) % totalCycleDays;
    const shiftIndex = Math.floor(positionInCycle / daysPerShift);
    const shiftId = shiftSequence[shiftIndex % shiftSequence.length];

    const periodStart = new Date(currentDate);
    const daysUntilNextShift = daysPerShift - (positionInCycle % daysPerShift);

    let periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + daysUntilNextShift - 1);
    periodEnd.setHours(23, 59, 59, 999);

    if (periodEnd > end) {
      periodEnd.setTime(end.getTime());
    }

    schedule.push({
      shiftId,
      startDate: periodStart,
      endDate: periodEnd,
      shiftIndex: shiftIndex % shiftSequence.length,
      isRotation: true
    });

    // Move to next period
    currentDate = new Date(periodEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return schedule;
};

/**
 * Get next rotation date
 * @returns {Date|null} Next rotation date or null if no rotation
 */
batchSchema.methods.getNextRotationDate = function() {
  if (!this.rotationEnabled || !this.rotationPattern?.shiftSequence?.length) {
    return null;
  }

  const now = new Date();
  const startDate = new Date(this.rotationPattern.startDate);
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysPerShift = this.rotationPattern.daysPerShift || 7;
  const positionInCycle = daysSinceStart % daysPerShift;
  const daysUntilNextRotation = daysPerShift - positionInCycle;

  const nextRotationDate = new Date(now);
  nextRotationDate.setDate(nextRotationDate.getDate() + daysUntilNextRotation);
  nextRotationDate.setHours(0, 0, 0, 0);

  return nextRotationDate;
};

/**
 * Static method to get default batch for company
 */
batchSchema.statics.getDefaultBatch = async function(companyId) {
  return this.findOne({
    companyId,
    isDefault: true,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

/**
 * Static method to get all active batches for company
 */
batchSchema.statics.getActiveBatches = async function(companyId) {
  return this.find({
    companyId,
    isActive: true,
    isDeleted: { $ne: true }
  }).sort({ isDefault: -1, name: 1 });
};

/**
 * Static method to get batches by shift
 */
batchSchema.statics.getBatchesByShift = async function(companyId, shiftId) {
  return this.find({
    companyId,
    shiftId,
    isActive: true,
    isDeleted: { $ne: true }
  }).populate('departmentId', 'name');
};

/**
 * Static method to get batches by department
 */
batchSchema.statics.getBatchesByDepartment = async function(companyId, departmentId) {
  return this.find({
    $or: [
      { departmentId: null },
      { departmentId }
    ],
    companyId,
    isActive: true,
    isDeleted: { $ne: true }
  }).sort({ name: 1 });
};

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
