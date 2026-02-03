import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  budgetId: {
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  allocatedBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBudget: {
    type: Number,
    default: 0
  },
  budgetType: {
    type: String,
    enum: ['Project', 'Phase', 'Task', 'Milestone'],
    default: 'Project'
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Approved', 'Exceeded'],
    default: 'Draft'
  },
  fiscalYear: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budgetCategories: [{
    category: {
      type: String,
      required: true,
      trim: true
    },
    allocated: {
      type: Number,
      default: 0,
      min: 0
    },
    spent: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  approvals: [{
    userId: {
      type: String,
      required: true
    },
    approvedAt: {
      type: Date,
      default: Date.now
    },
    comments: {
      type: String,
      trim: true
    }
  }],
  approvedBy: {
    type: String,
    default: null
  },
  approvedDate: {
    type: Date,
    default: null
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
budgetSchema.index({ companyId: 1, projectId: 1 });
budgetSchema.index({ companyId: 1, status: 1 });
budgetSchema.index({ companyId: 1, budgetType: 1 });
budgetSchema.index({ companyId: 1, fiscalYear: 1 });
budgetSchema.index({ companyId: 1, isDeleted: 1 });
budgetSchema.index({ startDate: 1 });
budgetSchema.index({ endDate: 1 });

// Pre-save middleware to update the updatedAt timestamp and calculate remaining budget
budgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Calculate remaining budget
  this.remainingBudget = this.totalBudget - this.spentAmount;

  // Update status based on spending
  if (this.spentAmount > this.totalBudget) {
    this.status = 'Exceeded';
  } else if (this.status === 'Exceeded' && this.spentAmount <= this.totalBudget) {
    this.status = 'Active';
  }

  next();
});

// Virtual for calculating budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.totalBudget === 0) return 0;
  return Math.round((this.spentAmount / this.totalBudget) * 100);
});

// Virtual for checking if budget is over limit
budgetSchema.virtual('isOverBudget').get(function() {
  return this.spentAmount > this.totalBudget;
});

// Virtual for checking if budget is near limit (80%+)
budgetSchema.virtual('isNearLimit').get(function() {
  if (this.totalBudget === 0) return false;
  return (this.spentAmount / this.totalBudget) >= 0.8;
});

// Virtual for getting days until budget expires
budgetSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.endDate) return null;
  const diff = this.endDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to add expense to budget
budgetSchema.methods.addExpense = function(amount, category = null) {
  this.spentAmount += amount;

  // Update category if provided
  if (category && this.budgetCategories && this.budgetCategories.length > 0) {
    const cat = this.budgetCategories.find(c => c.category === category);
    if (cat) {
      cat.spent += amount;
    }
  }

  return this.save();
};

// Method to approve budget
budgetSchema.methods.approve = function(approverId, comment = null) {
  this.status = 'Approved';
  this.approvedBy = approverId;
  this.approvedDate = new Date();

  this.approvals.push({
    userId: approverId,
    approvedAt: new Date(),
    comments: comment || ''
  });

  return this.save();
};

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
