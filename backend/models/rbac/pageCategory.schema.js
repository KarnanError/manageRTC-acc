/**
 * PageCategory Schema
 * Represents top-level navigation categories (I-XII from page.md)
 *
 * Categories are the highest level in the hierarchy:
 * Level -1: Category (I-XII) - 12 total
 *   Level 0: L1 Parent Menu or Direct Child
 *     Level 1: L2 Parent Menu or Child of L1
 *       Level 2: Child Page
 */

import mongoose from 'mongoose';

const pageCategorySchema = new mongoose.Schema({
  // Roman numeral identifier (I, II, III, etc.)
  identifier: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  // Display name (Main Menu, Users & Permissions, etc.)
  displayName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  // URL-friendly label (main-menu, users-permissions, etc.)
  label: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Description
  description: {
    type: String,
    trim: true,
  },

  // Icon (Tabler icon class)
  icon: {
    type: String,
    default: 'ti ti-folder',
  },

  // Sort order for display
  sortOrder: {
    type: Number,
    default: 0,
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true,
  },

  // System category (cannot be deleted)
  isSystem: {
    type: Boolean,
    default: false,
  },

  // Created/Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
pageCategorySchema.index({ identifier: 1 }, { unique: true });
pageCategorySchema.index({ label: 1 }, { unique: true });
pageCategorySchema.index({ sortOrder: 1 });
pageCategorySchema.index({ isActive: 1 });

// Static method to get all active categories
pageCategorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

// Static method to get category by label
pageCategorySchema.statics.getByLabel = function(label) {
  return this.findOne({ label: label.toLowerCase() });
};

// Static method to get category by identifier
pageCategorySchema.statics.getByIdentifier = function(identifier) {
  return this.findOne({ identifier: identifier.toUpperCase() });
};

export default mongoose.models.PageCategory || mongoose.model('PageCategory', pageCategorySchema);
