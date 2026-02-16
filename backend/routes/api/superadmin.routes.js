/**
 * Super Admin Routes
 * API endpoints for Super Admin user management
 */

import express from 'express';
import * as superAdminController from '../../controllers/superadmin.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Statistics
router.get('/stats', superAdminController.getSuperAdminStats);

// List all superadmins
router.get('/', superAdminController.getAllSuperAdmins);

// Get single superadmin
router.get('/:id', superAdminController.getSuperAdminById);

// Create new superadmin
router.post('/', superAdminController.createSuperAdmin);

// Update superadmin
router.put('/:id', superAdminController.updateSuperAdmin);

// Delete superadmin
router.delete('/:id', superAdminController.deleteSuperAdmin);

// Reset password
router.post('/:id/reset-password', superAdminController.resetSuperAdminPassword);

// Toggle status
router.patch('/:id/toggle-status', superAdminController.toggleSuperAdminStatus);

// Resend invitation
router.post('/:id/resend-invite', superAdminController.resendInvite);

// Refresh user metadata from Clerk
router.post('/:id/refresh-metadata', superAdminController.refreshUserMetadata);

export default router;
