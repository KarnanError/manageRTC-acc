/**
 * SuperAdmin User Schema
 * Stores information about Super Admin users created through the admin panel
 * References Clerk users for authentication
 */

import mongoose from 'mongoose';

const superAdminUserSchema = new mongoose.Schema({
  // Clerk User ID - reference to the user in Clerk
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
  },

  lastName: {
    type: String,
    required: true,
    trim: true,
  },

  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  phone: {
    type: String,
    trim: true,
    default: null,
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: true,
  },

  // Profile Image (optional)
  profileImage: {
    type: String,
    default: null,
  },

  // Address (optional)
  address: {
    type: String,
    default: null,
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active',
  },

  // Creator Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdminUser',
    default: null,
  },

  creatorName: {
    type: String,
    default: null,
  },

  // Last Updated By
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdminUser',
    default: null,
  },

  updaterName: {
    type: String,
    default: null,
  },

  // Password Information (for tracking, actual password stored in Clerk)
  passwordLastReset: {
    type: Date,
    default: null,
  },

  passwordResetToken: {
    type: String,
    default: null,
  },

  passwordResetExpires: {
    type: Date,
    default: null,
  },

  // Email Tracking
  inviteAccepted: {
    type: Boolean,
    default: false,
  },

  inviteAcceptedAt: {
    type: Date,
    default: null,
  },

  lastInviteSent: {
    type: Date,
    default: null,
  },

  // Activity Tracking
  lastLogin: {
    type: Date,
    default: null,
  },

  loginCount: {
    type: Number,
    default: 0,
  },

  // Audit Fields
  notes: {
    type: String,
    default: null,
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdminUser',
    default: null,
  },

  deletionReason: {
    type: String,
    default: null,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
superAdminUserSchema.index({ email: 1 });
superAdminUserSchema.index({ status: 1 });
superAdminUserSchema.index({ createdAt: -1 });
superAdminUserSchema.index({ createdBy: 1 });
superAdminUserSchema.index({ isDeleted: 1 });

// Virtual for getting full name with formatting
superAdminUserSchema.virtual('formattedName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to check if email exists
superAdminUserSchema.statics.emailExists = async function(email, excludeId = null) {
  const query = { email, isDeleted: false };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const user = await this.findOne(query);
  return !!user;
};

// Static method to get active superadmins count
superAdminUserSchema.statics.getActiveCount = async function() {
  return await this.countDocuments({ status: 'active', isDeleted: false });
};

// Instance method to soft delete
superAdminUserSchema.methods.softDelete = function(deletedBy, reason = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletionReason = reason;
  this.status = 'inactive';
  return this.save();
};

// Instance method to update status
superAdminUserSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  return this.save();
};

// Pre-save middleware to update fullName
superAdminUserSchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
  next();
});

const SuperAdminUser = mongoose.model('SuperAdminUser', superAdminUserSchema);

export default SuperAdminUser;
