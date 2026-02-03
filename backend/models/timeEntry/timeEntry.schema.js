import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  timeEntryId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project',
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  billable: {
    type: Boolean,
    default: true
  },
  billRate: {
    type: Number,
    min: 0,
    default: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  approvedBy: {
    type: String,
    default: null
  },
  approvedDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: ''
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
timeEntrySchema.index({ companyId: 1, userId: 1 });
timeEntrySchema.index({ companyId: 1, projectId: 1 });
timeEntrySchema.index({ companyId: 1, taskId: 1 });
timeEntrySchema.index({ companyId: 1, status: 1 });
timeEntrySchema.index({ companyId: 1, date: -1 });
timeEntrySchema.index({ companyId: 1, isDeleted: 1 });
timeEntrySchema.index({ userId: 1, date: -1 });
timeEntrySchema.index({ projectId: 1, date: -1 });

// Compound index for timesheet queries
timeEntrySchema.index({ userId: 1, status: 1, date: -1 });

// Pre-save middleware to update the updatedAt timestamp
timeEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Calculate duration if start and end time are provided
  if (this.startTime && this.endTime && !this.duration) {
    const diff = this.endTime.getTime() - this.startTime.getTime();
    this.duration = Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Convert to hours with 2 decimal places
  }

  next();
});

// Virtual for calculating billed amount
timeEntrySchema.virtual('billedAmount').get(function() {
  if (this.billable && this.billRate > 0) {
    return this.duration * this.billRate;
  }
  return 0;
});

// Virtual for checking if time entry is editable
timeEntrySchema.virtual('isEditable').get(function() {
  // Can edit if in Draft status or Rejected status
  return this.status === 'Draft' || this.status === 'Rejected';
});

// Virtual for checking if timesheet is overdue (not submitted within 7 days)
timeEntrySchema.virtual('isOverdue').get(function() {
  if (this.status !== 'Draft') return false;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return this.date < sevenDaysAgo;
});

// Method to submit timesheet for approval
timeEntrySchema.methods.submitForApproval = function() {
  this.status = 'Submitted';
  return this.save();
};

// Method to approve timesheet
timeEntrySchema.methods.approve = function(approverId) {
  this.status = 'Approved';
  this.approvedBy = approverId;
  this.approvedDate = new Date();
  return this.save();
};

// Method to reject timesheet
timeEntrySchema.methods.reject = function(reviewerId, reason) {
  this.status = 'Rejected';
  this.approvedBy = reviewerId;
  this.approvedDate = new Date();
  this.rejectionReason = reason || '';
  return this.save();
};

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

export default TimeEntry;
