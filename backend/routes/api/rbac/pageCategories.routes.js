/**
 * PageCategory API Routes
 * REST endpoints for PageCategory CRUD operations
 *
 * Routes:
 * GET    /api/rbac/categories       - Get all categories
 * GET    /api/rbac/categories/tree  - Get categories with hierarchy
 * POST   /api/rbac/categories       - Create new category
 * PUT    /api/rbac/categories/:id   - Update category
 * DELETE /api/rbac/categories/:id   - Delete category
 * PATCH  /api/rbac/categories/:id/toggle-status - Toggle active status
 * POST   /api/rbac/categories/reorder - Reorder categories
 */

import express from 'express';
import { requirePageAccess } from '../../../middleware/pageAccess.js';
import { pageCategoryService } from '../../../services/rbac/pageCategory.service.js';

const router = express.Router();

/**
 * GET /api/rbac/categories
 * Get all categories with optional filters
 * Query params:
 *   - activeOnly: true/false - Return only active categories
 *   - includeCounts: true/false - Include page counts
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      activeOnly: req.query.activeOnly === 'true',
      includeCounts: req.query.includeCounts === 'true',
    };
    const categories = await pageCategoryService.getAll(filters);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rbac/categories/tree
 * Get categories with full hierarchy tree
 * Includes L1 menus, L2 menus, and child pages for each category
 */
router.get('/tree', async (req, res, next) => {
  try {
    const Page = mongoose.model('Page');
    const PageCategory = mongoose.model('PageCategory');

    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    // Add hierarchy for each category
    const enrichedCategories = await Promise.all(
      categories.map(async (cat) => {
        const l1MenuGroups = await Page.getL1MenuGroups(cat._id);

        // Enrich L1 groups with L2 groups and children
        const enrichedL1Groups = await Promise.all(
          l1MenuGroups.map(async (l1) => {
            const l2MenuGroups = await Page.getL2MenuGroups(l1._id);
            const l1DirectChildren = await Page.getChildPages(l1._id);

            // Enrich L2 groups with children
            const enrichedL2Groups = await Promise.all(
              l2MenuGroups.map(async (l2) => {
                const l2Children = await Page.getChildPages(l2._id);
                return {
                  ...l2.toObject(),
                  children: l2Children
                };
              })
            );

            return {
              ...l1.toObject(),
              l2Groups: enrichedL2Groups,
              directChildren: l1DirectChildren
            };
          })
        );

        // Direct children of category (no L1 parent)
        const directChildren = await Page.getDirectCategoryChildren(cat._id);

        return {
          ...cat,
          l1MenuGroups: enrichedL1Groups,
          directChildren
        };
      })
    );

    res.json({ success: true, data: enrichedCategories });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rbac/categories/:id
 * Get single category by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const category = await pageCategoryService.getById(req.params.id);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/rbac/categories/by-label/:label
 * Get category by label
 */
router.get('/by-label/:label', async (req, res, next) => {
  try {
    const category = await pageCategoryService.getByLabel(req.params.label);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rbac/categories
 * Create new category
 * Requires: super-admin.pages 'create' permission
 */
router.post('/', requirePageAccess('super-admin.pages', 'create'), async (req, res, next) => {
  try {
    const category = await pageCategoryService.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/rbac/categories/:id
 * Update category
 * Requires: super-admin.pages 'write' permission
 */
router.put('/:id', requirePageAccess('super-admin.pages', 'write'), async (req, res, next) => {
  try {
    const category = await pageCategoryService.update(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/rbac/categories/:id
 * Delete category
 * Requires: super-admin.pages 'delete' permission
 */
router.delete('/:id', requirePageAccess('super-admin.pages', 'delete'), async (req, res, next) => {
  try {
    await pageCategoryService.delete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/rbac/categories/:id/toggle-status
 * Toggle category active status
 * Requires: super-admin.pages 'write' permission
 */
router.patch('/:id/toggle-status', requirePageAccess('super-admin.pages', 'write'), async (req, res, next) => {
  try {
    const category = await pageCategoryService.toggleStatus(req.params.id);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/rbac/categories/reorder
 * Reorder categories
 * Requires: super-admin.pages 'write' permission
 * Body: [{ id: ObjectId, sortOrder: Number }]
 */
router.post('/reorder', requirePageAccess('super-admin.pages', 'write'), async (req, res, next) => {
  try {
    const result = await pageCategoryService.reorder(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
