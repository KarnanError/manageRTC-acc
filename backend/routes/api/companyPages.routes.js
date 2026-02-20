/**
 * Company Pages Routes
 * Returns the pages enabled for the authenticated user's company
 * via the Company → Plan → Module → Page chain.
 */

import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { getEnabledPages } from '../../controllers/rest/companyPages.controller.js';

const router = express.Router();

router.use(authenticate);

/**
 * @route   GET /api/company/enabled-pages
 * @desc    Get all enabled page routes/names for the current user's company
 * @access  Private (all authenticated roles)
 */
router.get('/enabled-pages', getEnabledPages);

export default router;
