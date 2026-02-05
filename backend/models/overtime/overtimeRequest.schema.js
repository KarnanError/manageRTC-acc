/**
 * Overtime Request Schema
 * Tracks overtime requests and approvals
 */

import mongoose from 'mongoose';
import { generateOvertimeId } from '../../utils/idGenerator.js';

const overtimeRequestSchema = new mongoose.Schema({
  overtimeId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Reference to employee
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required'],
    index: true
  },

  // Employee details for quick reference
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },

  // Company for multi-tenant isolation
  companyId: {
    type: String,
    required: true,
    index: true
  },

  // Overtime details
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },

  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },

  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },

  requestedHours: {
    type: Number,
    required: [true, 'Requested hours is required'],
    min: [0.25, 'Minimum overtime is 15 minutes'],
    max: [12, 'Maximum overtime per day is 12 hours']
  },

  approvedHours: {
    type: Number,
    default: 0,
    min: 0
  },

  // Reason for overtime
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },

  // Work details
  project: {
    type: String,
    trim: true
  },
  taskDescription: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Approval workflow
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  approvedAt: {
    type: Date
  },

  approvalComments: {
    type: String,
    trim: true,
    maxlength: 500
  },

  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  rejectedAt: {
    type: Date
  },

  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  cancelledAt: {
    type: Date
  },

  cancellationReason: {
    type: String,
    trim: true
  },

  // Attachment (proof of work)
  attachments: [{
    type: String,
    url: String
  }],

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

  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
overtimeRequestSchema.index({ employee: 1, date: -1 });
overtimeRequestSchema.index({ companyId: 1, status: 1 });
overtimeRequestSchema.index({ companyId: 1, date: -1 });
overtimeRequestSchema.index({ employee: 1, isDeleted: 1 });

// Virtual for overtime duration in hours
overtimeRequestSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    const diffMs = this.endTime - this.startTime;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  return this.requestedHours || 0;
});

// Pre-save middleware to generate overtimeId
overtimeRequestSchema.pre('save', async function(next) {
  if (!this.overtimeId) {
    try {
      this.overtimeId = await generateOvertimeId(this.companyId, this.date);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Static method to check for existing overtime on same date
overtimeRequestSchema.statics.hasExistingOvertime = async function(employeeId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await this.findOne({
    employee: employeeId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending', 'approved'] },
    isDeleted: false
  });

  return !!existing;
};

// Instance method to approve overtime
overtimeRequestSchema.methods.approve = function(approverId, comments, approvedHours) {
  this.status = 'approved';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.approvalComments = comments || '';
  this.approvedHours = approvedHours || this.requestedHours;
  return this.save();
};

// Instance method to reject overtime
overtimeRequestSchema.methods.reject = function(rejectorId, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectorId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Instance method to cancel overtime
overtimeRequestSchema.methods.cancel = function(cancelledBy, reason) {
  if (this.status === 'approved') {
    throw new Error('Cannot cancel approved overtime request');
  }
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

const OvertimeRequest = mongoose.model('OvertimeRequest', overtimeRequestSchema);

export default OvertimeRequest;
