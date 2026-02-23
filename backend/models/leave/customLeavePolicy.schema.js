/**
 * Custom Leave Policy Schema
 *
 * Allows HR/Admin to create specialized leave policies for specific employees.
 * For example: Senior staff may get 30 days annual leave vs standard 20 days.
 *
 * Database: {companyId}.custom_leave_policies
 */

import mongoose from 'mongoose';

const customLeavePolicySchema = new mongoose.Schema({
  // Company reference (for multi-tenant)
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Policy display name
  name: {
    type: String,
    required: true,
    trim: true
    // Example: "Senior Staff Policy", "Probation Policy"
  },

  // Leave type this policy applies to (matches leaveType schema values)
  // Values: earned, sick, casual, maternity, paternity, bereavement, compensatory, unpaid, special
  leaveType: {
    type: String,
    required: true,
    enum: ['earned', 'sick', 'casual', 'maternity', 'paternity', 'bereavement', 'compensatory', 'unpaid', 'special'],
    index: true
  },

  // Number of days allocated for this policy
  days: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  // Employees assigned to this policy
  employeeIds: [{
    type: String, // Using String for employeeId (as used elsewhere in the system)
    required: true
  }],

  // Policy settings (overrides default leave type settings)
  settings: {
    // Can unused leave be carried forward to next year?
    carryForward: {
      type: Boolean,
      default: false
    },

    // Maximum days that can be carried forward
    maxCarryForwardDays: {
      type: Number,
      default: 0,
      min: 0
    },

    // Is this an earned leave (accumulated over time)?
    isEarnedLeave: {
      type: Boolean,
      default: false
    }
  },

  // Is this policy currently active?
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Audit fields
  createdBy: {
    type: String, // userId
    required: true
  },
  updatedBy: {
    type: String // userId
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'custom_leave_policies'
});

// Indexes for efficient queries
customLeavePolicySchema.index({ companyId: 1, leaveType: 1, isActive: 1 });
customLeavePolicySchema.index({ companyId: 1, employeeIds: 1, isActive: 1 });
customLeavePolicySchema.index({ companyId: 1, leaveType: 1, employeeIds: 1 });

// Update the updatedAt field before saving
customLeavePolicySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get custom policy for an employee and leave type
customLeavePolicySchema.statics.getEmployeePolicy = async function(companyId, employeeId, leaveType) {
  return this.findOne({
    companyId,
    employeeIds: employeeId,
    leaveType,
    isActive: true
  });
};

// Static method to get all policies for a company
customLeavePolicySchema.statics.getCompanyPolicies = async function(companyId, filters = {}) {
  const query = { companyId, isActive: true };

  if (filters.leaveType) {
    query.leaveType = filters.leaveType;
  }

  if (filters.employeeId) {
    query.employeeIds = filters.employeeId;
  }

  return this.find(query).sort({ createdAt: -1 });
};

const CustomLeavePolicy = mongoose.model('CustomLeavePolicy', customLeavePolicySchema);

export default CustomLeavePolicy;
