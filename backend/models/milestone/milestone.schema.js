import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  milestoneId: {
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Overdue', 'On Hold'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  deliverables: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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
milestoneSchema.index({ companyId: 1, projectId: 1 });
milestoneSchema.index({ companyId: 1, status: 1 });
milestoneSchema.index({ companyId: 1, priority: 1 });
milestoneSchema.index({ companyId: 1, dueDate: 1 });
milestoneSchema.index({ companyId: 1, isDeleted: 1 });
milestoneSchema.index({ startDate: 1 });
milestoneSchema.index({ dueDate: 1 });

// Pre-save middleware to update the updatedAt timestamp
milestoneSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if milestone is overdue
milestoneSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Completed' || this.status === 'Cancelled') return false;
  return this.dueDate && new Date() > this.dueDate;
});

// Virtual for getting days until due date (negative if overdue)
milestoneSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const diff = this.dueDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to check if milestone depends on another milestone
milestoneSchema.methods.hasDependency = function(milestoneId) {
  return this.dependencies.some(dep => dep.toString() === milestoneId.toString());
};

// Method to mark milestone as complete
milestoneSchema.methods.markComplete = function() {
  this.status = 'Completed';
  this.progress = 100;
  this.completedDate = new Date();
  return this.save();
};

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
