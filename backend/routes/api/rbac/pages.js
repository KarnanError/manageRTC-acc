/**
 * Pages API Routes
 * RESTful endpoints for page management
 */

import express from 'express';
import * as pageController from '../../../controllers/rbac/page.controller.js';

const router = express.Router();

// Get all pages flattened with hierarchy info (MUST be before /:id)
router.get('/flattened', pageController.getAllPagesFlattened);

// Get pages grouped by category (MUST be before /:id)
router.get('/grouped', pageController.getPagesGroupedByCategory);

// Get page statistics (MUST be before /:id)
router.get('/stats', pageController.getPageStats);

// Get hierarchical tree structure (MUST be before /:id)
router.get('/tree-structure', pageController.getTreeStructure);

// Get a single page (MUST be last to avoid catching other routes)
router.get('/:id', pageController.getPageById);

// Create a new page
router.post('/', pageController.createPage);

// Update a page
router.put('/:id', pageController.updatePage);

// Batch update page sort orders
router.put('/batch/orders', pageController.updatePageOrders);

// Delete a page
router.delete('/:id', pageController.deletePage);

// Toggle page status
router.patch('/:id/toggle-status', pageController.togglePageStatus);

export default router;
