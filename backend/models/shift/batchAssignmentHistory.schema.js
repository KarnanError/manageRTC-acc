/**
 * Batch Assignment History Schema
 * Tracks shift assignment history for batches
 */

import mongoose from 'mongoose';

const batchAssignmentHistorySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },

  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },

  // What shift was assigned
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true,
    index: true
  },

  // Effective period
  effectiveStartDate: {
    type: Date,
    required: true,
    index: true
  },
  effectiveEndDate: {
    type: Date,
    default: null,
    index: true
  },

  // Rotation snapshot (if applicable)
  rotationSnapshot: {
    enabled: Boolean,
    mode: String,
    shiftSequence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }],
    daysPerShift: Number,
    startDate: Date,
    currentIndex: Number
  },

  // Metadata
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  reason: {
    type: String,
    maxlength: 500,
    trim: true
  },
  changeType: {
    type: String,
    enum: ['initial', 'rotation', 'manual', 'batch_created', 'batch_deleted'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Indexes
batchAssignmentHistorySchema.index({ batchId: 1, effectiveStartDate: -1 });
batchAssignmentHistorySchema.index({ companyId: 1, shiftId: 1 });
batchAssignmentHistorySchema.index({ companyId: 1, effectiveStartDate: -1 });
batchAssignmentHistorySchema.index({ companyId: 1, changeType: 1 });

/**
 * Static method to get history for a batch
 */
batchAssignmentHistorySchema.statics.getBatchHistory = async function(batchId, limit = 20) {
  return this.find({ batchId })
    .populate('shiftId', 'name code startTime endTime color')
    .populate('assignedBy', 'firstName lastName employeeId')
    .sort({ effectiveStartDate: -1 })
    .limit(limit);
};

/**
 * Static method to get active assignment for a batch
 */
batchAssignmentHistorySchema.statics.getActiveAssignment = async function(batchId) {
  return this.findOne({
    batchId,
    effectiveEndDate: null
  }).populate('shiftId');
};

/**
 * Static method to create new assignment record
 * Closes any existing active assignments for the batch
 */
batchAssignmentHistorySchema.statics.createNewAssignment = async function(data) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Close any existing active assignments
    await this.updateMany(
      {
        batchId: data.batchId,
        effectiveEndDate: null
      },
      {
        effectiveEndDate: new Date(),
        $set: { effectiveEndDate: new Date() }
      },
      { session }
    );

    // Create new assignment
    const newAssignment = new this(data);
    await newAssignment.save({ session });

    await session.commitTransaction();
    return newAssignment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const BatchAssignmentHistory = mongoose.model('BatchAssignmentHistory', batchAssignmentHistorySchema);

export default BatchAssignmentHistory;
