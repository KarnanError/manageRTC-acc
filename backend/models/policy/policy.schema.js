/**
 * Policy Schema
 * Company policies that can be assigned to departments/designations or all employees
 */

import mongoose from 'mongoose';

// Sub-schema for policy assignments
const policyAssignmentSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  designationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation'
  }]
}, { _id: false });

const policySchema = new mongoose.Schema({
  // Company for multi-tenant isolation
  companyId: {
    type: String,
    required: true,
    index: true
  },

  // Policy details
  policyName: {
    type: String,
    required: [true, 'Policy name is required'],
    trim: true,
    maxlength: [200, 'Policy name cannot exceed 200 characters']
  },

  policyDescription: {
    type: String,
    required: [true, 'Policy description is required'],
    trim: true,
    maxlength: [5000, 'Policy description cannot exceed 5000 characters']
  },

  // Date when policy becomes effective
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
    index: true
  },

  // When true, policy applies to all current and future employees
  applyToAll: {
    type: Boolean,
    default: false
  },

  // Assign policy to specific departments/designations
  // Empty array + applyToAll=false = policy not assigned
  assignTo: [policyAssignmentSchema],

  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false
  },

  // Created by (user reference)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Updated by (user reference)
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
policySchema.index({ companyId: 1, isDeleted: 1 });
policySchema.index({ companyId: 1, effectiveDate: -1 });
policySchema.index({ companyId: 1, applyToAll: 1 });

// Virtual to populate department names in assignTo
policySchema.virtual('assignWithNames').get(function() {
  return this.assignTo;
});

// Pre-find middleware to populate department names
policySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignTo.departmentId',
    select: 'department status'
  });
  next();
});

// Static method to get policy stats
policySchema.statics.getStats = async function(companyId) {
  const stats = await this.aggregate([
    { $match: { companyId, isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        applyToAllCount: {
          $sum: { $cond: ['$applyToAll', 1, 0] }
        }
      }
    }
  ]);

  return {
    total: stats[0]?.total || 0,
    active: stats[0]?.total || 0, // All policies are active unless deleted
    inactive: 0,
    applyToAllCount: stats[0]?.applyToAllCount || 0
  };
};

// Method to check if policy applies to a specific employee
policySchema.methods.appliesToEmployee = function(employeeDepartmentId, employeeDesignationId) {
  if (this.applyToAll) return true;

  return this.assignTo.some(assignment => {
    // Check if assignment is for this department
    if (assignment.departmentId.toString() !== employeeDepartmentId.toString()) {
      return false;
    }

    // If no specific designations, applies to all designations in this department
    if (!assignment.designationIds || assignment.designationIds.length === 0) {
      return true;
    }

    // Check if employee's designation is in the list
    return assignment.designationIds.some(dId =>
      dId.toString() === employeeDesignationId.toString()
    );
  });
};

const Policy = mongoose.model('Policy', policySchema);

export default Policy;
