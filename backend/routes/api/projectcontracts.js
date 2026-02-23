/**
 * Project Contract API Routes
 * REST API endpoints for Project Contract (Worker) management
 */

import express from 'express';
import {
  createProjectContract,
  deleteProjectContract,
  getContractsByDetailId,
  getProjectContractById,
  getProjectContracts,
  getSubContractProjects,
  updateProjectContract,
} from '../../controllers/project/projectcontract.controller.js';
import { attachRequestId, authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Apply request ID middleware to all routes
router.use(attachRequestId);

/**
 * All routes require authentication
 */

// Create a new project contract
router.post('/', authenticate, createProjectContract);

// Get all project contracts by subContractDetail ID
router.get('/detail/:subContractDetailId', authenticate, getContractsByDetailId);

// Deprecated routes - kept for backward compatibility
router.get('/project/:projectId', authenticate, getProjectContracts);
router.get('/subcontract/:subContractId', authenticate, getSubContractProjects);

// Get a single project contract by ID
router.get('/:id', authenticate, getProjectContractById);

// Update a project contract
router.put('/:id', authenticate, updateProjectContract);

// Delete a project contract (soft delete)
router.delete('/:id', authenticate, deleteProjectContract);

export default router;
