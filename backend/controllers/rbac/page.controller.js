/**
 * Page Controller
 * Handles HTTP requests for page management
 */

import * as pageService from '../../services/rbac/page.service.js';

/**
 * Get all pages flattened with hierarchy info
 */
export async function getAllPagesFlattened(req, res) {
  const result = await pageService.getAllPagesFlattened(req.query);
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get all pages
 */
export async function getAllPages(req, res) {
  const result = await pageService.getAllPages(req.query);
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get pages grouped by category
 */
export async function getPagesGroupedByCategory(req, res) {
  const result = await pageService.getPagesGroupedByCategory();
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get a single page by ID
 */
export async function getPageById(req, res) {
  const result = await pageService.getPageById(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
}

/**
 * Get pages by module category
 */
export async function getPagesByModule(req, res) {
  const result = await pageService.getPagesByModule(req.params.category);
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Create a new page
 */
export async function createPage(req, res) {
  const result = await pageService.createPage(req.body, req.user?.id);
  res.status(result.success ? 201 : 400).json(result);
}

/**
 * Update a page
 */
export async function updatePage(req, res) {
  const result = await pageService.updatePage(req.params.id, req.body, req.user?.id);
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Delete a page
 */
export async function deletePage(req, res) {
  const result = await pageService.deletePage(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
}

/**
 * Toggle page status
 */
export async function togglePageStatus(req, res) {
  const result = await pageService.togglePageStatus(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get page statistics
 */
export async function getPageStats(req, res) {
  const result = await pageService.getPageStats();
  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Get hierarchical tree structure
 */
export async function getTreeStructure(req, res) {
  try {
    const Page = (await import('../../models/rbac/page.schema.js')).default;
    const PageCategory = (await import('../../models/rbac/pageCategory.schema.js')).default;

    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const tree = await Promise.all(
      categories.map(async (cat) => {
        // Get L1 menu groups with category populated
        const l1Groups = await Page.find({
          category: cat._id,
          isMenuGroup: true,
          menuGroupLevel: 1,
          isActive: true,
        }).populate('category', 'identifier displayName label icon')
          .sort({ sortOrder: 1 })
          .lean();

        const enrichedL1Groups = await Promise.all(
          l1Groups.map(async (l1) => {
            // Get L2 groups under this L1 with category populated
            const l2Groups = await Page.find({
              parentPage: l1._id,
              isMenuGroup: true,
              menuGroupLevel: 2,
              isActive: true,
            }).populate('category', 'identifier displayName label icon')
              .sort({ sortOrder: 1 })
              .lean();

            // Enrich L2 groups with their children (with category populated)
            const enrichedL2Groups = await Promise.all(
              l2Groups.map(async (l2) => {
                const l2Children = await Page.find({
                  parentPage: l2._id,
                  isMenuGroup: false,
                  isActive: true,
                }).populate('category', 'identifier displayName label icon')
                  .sort({ sortOrder: 1 })
                  .lean();
                return { ...l2, children: l2Children };
              })
            );

            // L1 direct children (not under L2 groups) with category populated
            const l1DirectChildren = await Page.find({
              parentPage: l1._id,
              isMenuGroup: false,
              isActive: true,
            }).populate('category', 'identifier displayName label icon')
              .sort({ sortOrder: 1 })
              .lean();

            return {
              ...l1,
              l2Groups: enrichedL2Groups,
              directChildren: l1DirectChildren
            };
          })
        );

        // Direct children of category (no L1 parent) with category populated
        const directChildren = await Page.find({
          category: cat._id,
          parentPage: null,
          isMenuGroup: false,
          isActive: true,
        }).populate('category', 'identifier displayName label icon')
          .sort({ sortOrder: 1 })
          .lean();

        return {
          ...cat,
          l1MenuGroups: enrichedL1Groups,
          directChildren
        };
      })
    );

    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Batch update page sort orders
 */
export async function updatePageOrders(req, res) {
  const result = await pageService.updatePageOrders(req.body.pageOrders || []);
  res.status(result.success ? 200 : 400).json(result);
}

export default {
  getAllPagesFlattened,
  getAllPages,
  getPagesGroupedByCategory,
  getPageById,
  getPagesByModule,
  createPage,
  updatePage,
  deletePage,
  togglePageStatus,
  getPageStats,
  getTreeStructure,
  updatePageOrders,
};
