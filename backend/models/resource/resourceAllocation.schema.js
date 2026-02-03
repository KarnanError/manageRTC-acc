import mongoose from 'mongoose';

const resourceAllocationSchema = new mongoose.Schema({
  allocationId: {
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
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Employee',
    index: true
  },
  allocationPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  role: {
    type: String,
    trim: true,
    default: ''
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  skills: [{
    type: String,
    trim: true
  }],
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
resourceAllocationSchema.index({ companyId: 1, resourceId: 1 });
resourceAllocationSchema.index({ companyId: 1, projectId: 1 });
resourceAllocationSchema.index({ companyId: 1, taskId: 1 });
resourceAllocationSchema.index({ companyId: 1, status: 1 });
resourceAllocationSchema.index({ companyId: 1, isDeleted: 1 });
resourceAllocationSchema.index({ resourceId: 1, startDate: 1, endDate: 1 });
resourceAllocationSchema.index({ startDate: 1, endDate: 1 });

// Compound index for availability queries
resourceAllocationSchema.index({ resourceId: 1, status: 1, startDate: 1, endDate: 1 });

// Pre-save middleware to update the updatedAt timestamp
resourceAllocationSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Auto-update status based on dates
  const now = new Date();
  if (this.status === 'Active') {
    if (this.endDate < now) {
      this.status = 'Completed';
    }
  }

  next();
});

// Virtual for checking if allocation is current
resourceAllocationSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'Active';
});

// Virtual for checking if allocation is upcoming
resourceAllocationSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return this.startDate > now && this.status === 'Active';
});

// Virtual for getting allocation duration in days
resourceAllocationSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diff = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to check if allocation conflicts with another
resourceAllocationSchema.methods.conflictsWith = function(otherAllocation) {
  const thisStart = this.startDate.getTime();
  const thisEnd = this.endDate.getTime();
  const otherStart = otherAllocation.startDate.getTime();
  const otherEnd = otherAllocation.endDate.getTime();

  // Check if date ranges overlap
  const datesOverlap = thisStart <= otherEnd && thisEnd >= otherStart;

  // Check if same resource
  const sameResource = this.resourceId.toString() === otherAllocation.resourceId.toString();

  return datesOverlap && sameResource;
};

// Method to cancel allocation
resourceAllocationSchema.methods.cancel = function(reason = '') {
  this.status = 'Cancelled';
  return this.save();
};

const ResourceAllocation = mongoose.model('ResourceAllocation', resourceAllocationSchema);

export default ResourceAllocation;
