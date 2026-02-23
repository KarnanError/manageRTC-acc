/**
 * Project Contract Schema - Mongoose Model
 * Tracks worker details for sub-contracts assigned to projects
 */

import mongoose from 'mongoose';

const projectContractSchema = new mongoose.Schema(
  {
    // Reference to Project's SubContract Detail (embedded document _id)
    subContractDetailId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Sub-Contract Detail ID is required'],
      index: true,
    },

    // Worker Details
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    numberOfWorkers: {
      type: Number,
      required: [true, 'Number of workers is required'],
      min: [1, 'Number of workers must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Number of workers must be a whole number',
      },
    },

    workedDate: {
      type: Date,
      required: [true, 'Worked date is required'],
    },

    // Metadata
    createdBy: {
      type: String,
      trim: true,
    },

    updatedBy: {
      type: String,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'projectcontracts',
  }
);

// Indexes for better query performance
projectContractSchema.index({ subContractDetailId: 1 });
projectContractSchema.index({ workedDate: 1 });
projectContractSchema.index({ isDeleted: 1 });

// Create the model
const ProjectContract = mongoose.model('ProjectContract', projectContractSchema);

export default ProjectContract;
