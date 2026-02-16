/**
 * PageCategory Service
 * Business logic for PageCategory CRUD operations
 */

import Page from '../../models/rbac/page.schema.js';
import PageCategory from '../../models/rbac/pageCategory.schema.js';

export const pageCategoryService = {
  /**
   * Get all categories with optional filters
   * @param {Object} filters - { activeOnly: boolean }
   * @returns {Promise<Array>} Array of categories
   */
  async getAll(filters = {}) {
    const query = {};
    if (filters.activeOnly) query.isActive = true;

    const categories = await PageCategory.find(query).sort({ sortOrder: 1 });

    // If requested, add page counts
    if (filters.includeCounts) {
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const pageCount = await Page.countDocuments({
            category: cat._id,
            isActive: true
          });
          const l1MenuGroupCount = await Page.countDocuments({
            category: cat._id,
            isMenuGroup: true,
            menuGroupLevel: 1,
            isActive: true
          });
          const directChildCount = await Page.countDocuments({
            category: cat._id,
            parentPage: null,
            isMenuGroup: false,
            isActive: true
          });

          return {
            ...cat.toObject(),
            stats: {
              totalPages: pageCount,
              l1MenuGroups: l1MenuGroupCount,
              directChildren: directChildCount,
            }
          };
        })
      );
      return categoriesWithCounts;
    }

    return categories;
  },

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Object|null>} Category document
   */
  async getById(id) {
    const category = await PageCategory.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  },

  /**
   * Get category by label
   * @param {string} label - Category label
   * @returns {Promise<Object|null>} Category document
   */
  async getByLabel(label) {
    const category = await PageCategory.findOne({ label: label.toLowerCase() });
    if (!category) {
      throw new Error(`Category with label "${label}" not found`);
    }
    return category;
  },

  /**
   * Get category by identifier (I, II, III, etc.)
   * @param {string} identifier - Roman numeral
   * @returns {Promise<Object|null>} Category document
   */
  async getByIdentifier(identifier) {
    const category = await PageCategory.findOne({
      identifier: identifier.toUpperCase()
    });
    if (!category) {
      throw new Error(`Category with identifier "${identifier}" not found`);
    }
    return category;
  },

  /**
   * Create new category
   * @param {Object} data - Category data
   * @returns {Promise<Object>} Created category
   */
  async create(data) {
    // Check if identifier already exists
    const existingIdentifier = await PageCategory.findOne({
      identifier: data.identifier.toUpperCase()
    });
    if (existingIdentifier) {
      throw new Error(`Category with identifier "${data.identifier}" already exists`);
    }

    // Check if label already exists
    const existingLabel = await PageCategory.findOne({
      label: data.label.toLowerCase()
    });
    if (existingLabel) {
      throw new Error(`Category with label "${data.label}" already exists`);
    }

    // Check if display name already exists
    const existingName = await PageCategory.findOne({
      displayName: data.displayName
    });
    if (existingName) {
      throw new Error(`Category with display name "${data.displayName}" already exists`);
    }

    const category = new PageCategory({
      identifier: data.identifier.toUpperCase(),
      label: data.label.toLowerCase(),
      displayName: data.displayName,
      description: data.description,
      icon: data.icon || 'ti ti-folder',
      sortOrder: data.sortOrder || 0,
      isSystem: data.isSystem || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: data.createdBy,
    });

    await category.save();
    return category;
  },

  /**
   * Update existing category
   * @param {string} id - Category ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated category
   */
  async update(id, data) {
    const category = await PageCategory.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if system category (restricted updates)
    if (category.isSystem) {
      // Allow only certain fields for system categories
      const allowedFields = ['description', 'icon', 'sortOrder', 'isActive'];
      const attemptedFields = Object.keys(data);
      const hasRestrictedField = attemptedFields.some(
        field => !allowedFields.includes(field)
      );
      if (hasRestrictedField) {
        throw new Error('Cannot modify identifier, label, or display name of system categories');
      }
    }

    // Check if identifier already exists (excluding current)
    if (data.identifier) {
      const existingIdentifier = await PageCategory.findOne({
        identifier: data.identifier.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingIdentifier) {
        throw new Error(`Category with identifier "${data.identifier}" already exists`);
      }
    }

    // Check if label already exists (excluding current)
    if (data.label) {
      const existingLabel = await PageCategory.findOne({
        label: data.label.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingLabel) {
        throw new Error(`Category with label "${data.label}" already exists`);
      }
    }

    // Check if display name already exists (excluding current)
    if (data.displayName) {
      const existingName = await PageCategory.findOne({
        displayName: data.displayName,
        _id: { $ne: id }
      });
      if (existingName) {
        throw new Error(`Category with display name "${data.displayName}" already exists`);
      }
    }

    // Update allowed fields
    if (data.identifier && !category.isSystem) {
      category.identifier = data.identifier.toUpperCase();
    }
    if (data.label && !category.isSystem) {
      category.label = data.label.toLowerCase();
    }
    if (data.displayName && !category.isSystem) {
      category.displayName = data.displayName;
    }
    if (data.description !== undefined) {
      category.description = data.description;
    }
    if (data.icon !== undefined) {
      category.icon = data.icon;
    }
    if (data.sortOrder !== undefined) {
      category.sortOrder = data.sortOrder;
    }
    if (data.isActive !== undefined) {
      category.isActive = data.isActive;
    }
    if (data.updatedBy) {
      category.updatedBy = data.updatedBy;
    }

    await category.save();
    return category;
  },

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Deleted category
   */
  async delete(id) {
    const category = await PageCategory.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Cannot delete system categories
    if (category.isSystem) {
      throw new Error('Cannot delete system category');
    }

    // Check if any pages use this category
    const pageCount = await Page.countDocuments({
      category: id,
      isActive: true
    });

    if (pageCount > 0) {
      throw new Error(`Cannot delete category with ${pageCount} active pages. Please reassign or delete pages first.`);
    }

    await PageCategory.findByIdAndDelete(id);
    return { message: 'Category deleted successfully' };
  },

  /**
   * Toggle category active status
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Updated category
   */
  async toggleStatus(id) {
    const category = await PageCategory.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    category.isActive = !category.isActive;
    await category.save();

    return category;
  },

  /**
   * Get category tree with hierarchy
   * @returns {Promise<Array>} Categories with their full hierarchy
   */
  async getTree() {
    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const categoriesWithHierarchy = await Promise.all(
      categories.map(async (cat) => {
        const l1MenuGroups = await Page.getL1MenuGroups(cat._id);
        const directChildren = await Page.getDirectCategoryChildren(cat._id);

        // Enrich L1 groups with their children
        const enrichedL1Groups = await Promise.all(
          l1MenuGroups.map(async (l1) => {
            const l2MenuGroups = await Page.getL2MenuGroups(l1._id);
            const l1DirectChildren = await Page.getChildPages(l1._id);

            // Enrich L2 groups with their children
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

        return {
          ...cat,
          l1MenuGroups: enrichedL1Groups,
          directChildren
        };
      })
    );

    return categoriesWithHierarchy;
  },

  /**
   * Reorder categories
   * @param {Array} categoryOrders - Array of { id, sortOrder }
   * @returns {Promise<Object>} Updated categories
   */
  async reorder(categoryOrders) {
    const updates = categoryOrders.map(({ id, sortOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { sortOrder }
      }
    }));

    await PageCategory.bulkWrite(updates);
    return { message: 'Categories reordered successfully' };
  }
};

export default pageCategoryService;
