/**
 * Pages API Routes - Enhanced with Hierarchy Support
 * RESTful endpoints for page management with hierarchical structure
 *
 * Routes:
 * GET    /api/rbac/pages              - Get all pages with filtering
 * GET    /api/rbac/pages/grouped       - Get pages grouped by category (legacy)
 * GET    /api/rbac/pages/stats         - Get page statistics
 * GET    /api/rbac/pages/category/:cat  - Get pages by category ID (NEW)
 * GET    /api/rbac/pages/hierarchy/:id    - Get full hierarchy tree for category (NEW)
 * GET    /api/rbac/pages/l1-groups/:id    - Get L1 menu groups for category (NEW)
 * GET    /api/rbac/pages/l2-groups/:l1Id - Get L2 menu groups for L1 parent (NEW)
 * GET    /api/rbac/pages/children/:id   - Get child pages of any parent (NEW)
 * GET    /api/rbac/pages/tree-structure - Get recursive tree structure (NEW)
 * POST   /api/rbac/pages              - Create new page
 * PUT    /api/rbac/pages/:id            - Update page
 * DELETE /api/rbac/pages/:id            - Delete page
 * PATCH  /api/rbac/pages/:id/toggle-status - Toggle active status
 * PUT    /api/rbac/pages/batch/orders   - Batch update sort orders
 */

import express from 'express';
import { requirePageAccess } from '../../../middleware/pageAccess.js';
import * as pageController from '../../../controllers/rbac/page.controller.js';

const router = express.Router();

// ============================================================================
// LEGACY ENDPOINTS (Preserved for backward compatibility)
// ============================================================================

// GET /api/rbac/pages - Get all pages with optional filtering
router.get('/', pageController.getAllPages);

// GET /api/rbac/pages/grouped - Get pages grouped by category (LEGACY)
router.get('/grouped', pageController.getPagesGroupedByCategory);

// GET /api/rbac/pages/stats - Get page statistics
router.get('/stats', pageController.getPageStats);

// GET /api/rbac/pages/category/:category - Get pages by module category (LEGACY)
router.get('/category/:category', pageController.getPagesByModule);

// GET /api/rbac/pages/:id - Get single page
router.get('/:id', pageController.getPageById);

// POST /api/rbac/pages - Create new page
router.post('/', requirePageAccess('super-admin.pages', 'create'), pageController.createPage);

// PUT /api/rbac/pages/:id - Update page
router.put('/:id', requirePageAccess('super-admin.pages', 'write'), pageController.updatePage);

// PUT /api/rbac/pages/batch/orders - Batch update sort orders
router.put('/batch/orders', requirePageAccess('super-admin.pages', 'write'), pageController.updatePageOrders);

// DELETE /api/rbac/pages/:id - Delete page
router.delete('/:id', requirePageAccess('super-admin.pages', 'delete'), pageController.deletePage);

// PATCH /api/rbac/pages/:id/toggle-status - Toggle page status
router.patch('/:id/toggle-status', requirePageAccess('super-admin.pages', 'write'), pageController.togglePageStatus);

// ============================================================================
// NEW HIERARCHY ENDPOINTS
// ============================================================================

// GET /api/rbac/pages/category/:categoryId - Get full hierarchy tree for category
/**
 * Returns all pages in a category organized by hierarchy:
 * - L1 Parent Menus
 *   - L2 Parent Menus (under L1)
 *     - Child Pages (under L2)
 *   - Direct Child Pages (under L1)
 * - Direct Child Pages of category (no L1 parent)
 *
 * Query params:
 *   - includeInactive: true/false - Include inactive pages
 */
router.get('/hierarchy/:categoryId', async (req, res, next) => {
  try {
    const Page = req.models.Page;
    const PageCategory = req.models.PageCategory;

    const category = await PageCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const includeInactive = req.query.includeInactive === 'true';

    // Get all pages in this category
    const allPages = await Page.find({
      category: req.params.categoryId,
      ...(includeInactive ? {} : { isActive: true })
    }).sort({ hierarchyPath: 1, sortOrder: 1 })
      .populate('category')
      .populate('parentPage')
      .lean();

    // Build hierarchy tree
    const pageMap = new Map();
    const rootPages = [];

    // First pass: create map
    allPages.forEach(page => {
      pageMap.set(page._id.toString(), { ...page, children: [] });
    });

    // Second pass: build tree
    allPages.forEach(page => {
      const pageWithChildren = pageMap.get(page._id.toString());
      if (page.parentPage) {
        const parent = pageMap.get(page.parentPage._id.toString());
        if (parent) {
          parent.children.push(pageWithChildren);
        }
      } else {
        rootPages.push(pageWithChildren);
      }
    });

    // Add L1/L2 menu group labels
    const enrichedRootPages = rootPages.map(page => {
      const enriched = { ...page };

      // Mark L1 menu groups
      if (page.isMenuGroup && page.menuGroupLevel === 1) {
        enriched.menuGroupType = 'L1 Parent Menu';
      }
      // Mark L2 menu groups
      else if (page.isMenuGroup && page.menuGroupLevel === 2) {
        enriched.menuGroupType = 'L2 Parent Menu';
      }
      // Mark direct children
      else if (!page.isMenuGroup) {
        enriched.menuGroupType = page.parentPage ? 'Child Page' : 'Direct Child';
      }

      return enriched;
    });

    res.json({
      success: true,
      data: {
        category,
        hierarchy: enrichedRootPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/l1-groups/:categoryId - Get L1 menu groups for category
/**
 * Returns all L1 parent menus in a category
 * L1 menus have: isMenuGroup=true, menuGroupLevel=1
 */
router.get('/l1-groups/:categoryId', async (req, res, next) => {
  try {
    const Page = req.models.Page;
    const PageCategory = req.models.PageCategory;

    const category = await PageCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const l1Groups = await Page.find({
      category: req.params.categoryId,
      isMenuGroup: true,
      menuGroupLevel: 1,
      isActive: true
    }).sort({ sortOrder: 1 })
      .populate('parentPage')
      .lean();

    // Enrich with child counts
    const enrichedGroups = await Promise.all(
      l1Groups.map(async (group) => {
        // Count L2 groups
        const l2Count = await Page.countDocuments({
          parentPage: group._id,
          isMenuGroup: true,
          menuGroupLevel: 2,
          isActive: true
        });

        // Count direct children (non-menu)
        const directChildrenCount = await Page.countDocuments({
          parentPage: group._id,
          isMenuGroup: false,
          isActive: true
        });

        return {
          ...group,
          stats: {
            l2Groups,
            directChildren: directChildrenCount,
            totalChildren: l2Count + directChildrenCount
          }
        };
      })
    );

    res.json({ success: true, data: enrichedGroups });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/l2-groups/:l1ParentId - Get L2 menu groups under L1 parent
/**
 * Returns all L2 parent menus under a specific L1 parent
 * L2 menus have: isMenuGroup=true, menuGroupLevel=2
 */
router.get('/l2-groups/:l1ParentId', async (req, res, next) => {
  try {
    const Page = req.models.Page;

    const l2Groups = await Page.find({
      parentPage: req.params.l1ParentId,
      isMenuGroup: true,
      menuGroupLevel: 2,
      isActive: true
    }).sort({ sortOrder: 1 })
      .populate('parentPage')
      .lean();

    // Enrich with child counts
    const enrichedGroups = await Promise.all(
      l2Groups.map(async (group) => {
        const childCount = await Page.countDocuments({
          parentPage: group._id,
          isMenuGroup: false,
          isActive: true
        });

        return {
          ...group,
          stats: {
            children: childCount
          }
        };
      })
    );

    res.json({ success: true, data: enrichedGroups });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/children/:parentId - Get child pages (non-menu) of a parent
/**
 * Returns all child pages (isMenuGroup=false) of any parent
 * Can be L1 parent, L2 parent, or category
 */
router.get('/children/:parentId', async (req, res, next) => {
  try {
    const Page = req.models.Page;

    const children = await Page.find({
      parentPage: req.params.parentId,
      isMenuGroup: false,
      isActive: true
    }).sort({ sortOrder: 1 })
      .populate('category')
      .populate('parentPage')
      .lean();

    res.json({ success: true, data: children });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/all-children/:parentId - Get all children (including L2 menus)
/**
 * Returns ALL children of a parent, including both L2 menus and direct children
 */
router.get('/all-children/:parentId', async (req, res, next) => {
  try {
    const Page = req.models.Page;

    const children = await Page.find({
      parentPage: req.params.parentId,
      isActive: true
    }).sort({ isMenuGroup: -1, sortOrder: 1 }) // L2 menus first, then by sortOrder
      .populate('category')
      .populate('parentPage')
      .lean();

    res.json({ success: true, data: children });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/tree-structure - Get recursive tree structure
/**
 * Returns complete recursive tree with all levels:
 * Category -> L1 Menus -> L2 Menus -> Child Pages
 */
router.get('/tree-structure', async (req, res, next) => {
  try {
    const Page = req.models.Page;
    const PageCategory = req.models.PageCategory;

    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const tree = await Promise.all(
      categories.map(async (cat) => {
        // Get L1 groups and direct children
        const l1Items = await Page.find({
          category: cat._id,
          parentPage: null, // Direct children of category
          isActive: true
        }).sort({ isMenuGroup: -1, sortOrder: 1 });

        const enrichedL1Items = await Promise.all(
          l1Items.map(async (l1Item) => {
            if (l1Item.isMenuGroup && l1Item.menuGroupLevel === 1) {
              // L1 Parent Menu - get L2 groups and direct children
              const l2Groups = await Page.find({
                parentPage: l1Item._id,
                isMenuGroup: true,
                menuGroupLevel: 2,
                isActive: true
              }).sort({ sortOrder: 1 });

              const l2GroupsEnriched = await Promise.all(
                l2Groups.map(async (l2Item) => {
                  // L2's children
                  const l2Children = await Page.find({
                    parentPage: l2Item._id,
                    isMenuGroup: false,
                    isActive: true
                  }).sort({ sortOrder: 1 });

                  return {
                    ...l2Item,
                    children: l2Children
                  };
                })
              );

              // L1's direct children (non-L2)
              const l1DirectChildren = await Page.find({
                parentPage: l1Item._id,
                isMenuGroup: false,
                isActive: true
              }).sort({ sortOrder: 1 });

              return {
                ...l1Item,
                l2Groups: l2GroupsEnriched,
                directChildren: l1DirectChildren,
                type: 'L1 Menu Group'
              };
            } else {
              // Direct child of category (no L1 parent)
              return {
                ...l1Item,
                type: 'Direct Child'
              };
            }
          })
        );

        return {
          ...cat,
          items: enrichedL1Items
        };
      })
    );

    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
});

export default router;
