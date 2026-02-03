/**
 * Project Notes API Routes
 * REST API endpoints for Project Notes management
 */

import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../../controllers/rest/projectNotes.controller.js';
import {
  authenticate,
  requireRole,
  requireCompany,
  attachRequestId,
} from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

// Get all notes for a project
router.get(
  '/:projectId',
  authenticate,
  requireCompany,
  getNotes
);

// Create a new note for a project
router.post(
  '/:projectId',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  createNote
);

// Update a note
router.put(
  '/:projectId/:noteId',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  updateNote
);

// Delete a note (soft delete)
router.delete(
  '/:projectId/:noteId',
  authenticate,
  requireCompany,
  requireRole('admin', 'hr', 'superadmin'),
  deleteNote
);

export default router;
