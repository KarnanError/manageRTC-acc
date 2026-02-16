/**
 * Permission Service (Junction Table Approach - PRIMARY)
 * Handles permission-related business logic
 * PRIMARY STORAGE: role_permissions junction table
 */

import mongoose from 'mongoose';
import Permission from '../../models/rbac/permission.schema.js';
import Role from '../../models/rbac/role.schema.js';
import RolePermission from '../../models/rbac/rolePermission.schema.js';
import Page from '../../models/rbac/page.schema.js';

/**
 * Get all permissions grouped by category
 */
export async function getGroupedPermissions() {
  try {
    // Use new method that includes page population
    const permissions = await Permission.getGroupedWithPages();
    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get hierarchical permissions structure (same as pages tree structure)
 * Returns permissions organized by category with L1/L2 menu groups and children
 */
export async function getHierarchicalPermissions() {
  try {
    const PageCategory = (await import('../../models/rbac/pageCategory.schema.js')).default;
    const RolePermission = (await import('../../models/rbac/rolePermission.schema.js')).default;

    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const tree = await Promise.all(
      categories.map(async (cat) => {
        // Get L1 menu groups with category populated
        const Page = (await import('../../models/rbac/page.schema.js')).default;
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

                // Get permissions for L2 children
                const childrenWithPerms = await Promise.all(
                  l2Children.map(async (child) => {
                    const permission = await Permission.findOne({ pageId: child._id, isActive: true }).lean();
                    return {
                      ...child,
                      permission: permission || null,
                    };
                  })
                );

                return { ...l2, children: childrenWithPerms };
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

            // Get permissions for L1 direct children
            const l1DirectChildrenWithPerms = await Promise.all(
              l1DirectChildren.map(async (child) => {
                const permission = await Permission.findOne({ pageId: child._id, isActive: true }).lean();
                return {
                  ...child,
                  permission: permission || null,
                };
              })
            );

            return {
              ...l1,
              l2Groups: enrichedL2Groups,
              directChildren: l1DirectChildrenWithPerms
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

        // Get permissions for direct children
        const directChildrenWithPerms = await Promise.all(
          directChildren.map(async (child) => {
            const permission = await Permission.findOne({ pageId: child._id, isActive: true }).lean();
            return {
              ...child,
              permission: permission || null,
            };
          })
        );

        return {
          ...cat,
          l1MenuGroups: enrichedL1Groups,
          directChildren: directChildrenWithPerms
        };
      })
    );

    return {
      success: true,
      data: tree,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all permissions (flat list)
 */
export async function getAllPermissions(filters = {}) {
  try {
    const { category, isActive = true } = filters;
    const query = { isActive };
    if (category) {
      query.category = category;
    }

    const permissions = await Permission.find(query).sort({ category: 1, sortOrder: 1 });
    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get permissions by category
 */
export async function getPermissionsByCategory(category) {
  try {
    const permissions = await Permission.getByCategory(category);
    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get a single permission by ID
 */
export async function getPermissionById(permissionId) {
  try {
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }
    return {
      success: true,
      data: permission,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a new permission
 */
export async function createPermission(permissionData) {
  try {
    // Check if permission with same module already exists
    const existing = await Permission.findOne({ module: permissionData.module });
    if (existing) {
      return {
        success: false,
        error: 'Permission with this module already exists',
      };
    }

    const permission = new Permission(permissionData);
    await permission.save();

    return {
      success: true,
      data: permission,
      message: 'Permission created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update a permission
 */
export async function updatePermission(permissionId, updateData) {
  try {
    const permission = await Permission.findByIdAndUpdate(
      permissionId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    return {
      success: true,
      data: permission,
      message: 'Permission updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a permission (soft delete)
 */
export async function deletePermission(permissionId) {
  try {
    const permission = await Permission.findByIdAndUpdate(
      permissionId,
      { isActive: false },
      { new: true }
    );

    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    return {
      success: true,
      data: permission,
      message: 'Permission deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// JUNCTION TABLE PRIMARY METHODS
// ============================================

/**
 * Get role permissions with full permission details
 * PRIMARY METHOD - Uses Junction Table (role_permissions)
 * Returns mandatory permissions for frontend enforcement
 */
export async function getRolePermissions(roleId) {
  try {
    // Validate role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Get permissions from Junction Table
    const result = await RolePermission.getRolePermissionsGrouped(roleId);

    // Include mandatory permissions for frontend UI enforcement
    const mandatoryPermissions = (role.mandatoryPermissions || []).map(m => ({
      pageId: m.pageId?.toString(),
      actions: m.actions || [],
    }));

    return {
      success: true,
      data: {
        ...result,
        mandatoryPermissions: mandatoryPermissions,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Set permissions for a role
 * PRIMARY METHOD - Updates Junction Table (role_permissions)
 * ENFORCES MANDATORY PERMISSIONS - Backend enforcement that cannot be bypassed
 */
export async function setRolePermissions(roleId, permissionsData, userId = null) {
  try {
    // Validate role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Get all valid permissions/pages
    const permissionIds = permissionsData.map(p =>
      typeof p.permissionId === 'string' ? new mongoose.Types.ObjectId(p.permissionId) : p.permissionId
    );
    const validPermissions = await Permission.find({ _id: { $in: permissionIds }, isActive: true });

    // Build permissions array with all required fields for Junction Table
    const formattedPermissions = await Promise.all(permissionsData.map(async (p) => {
      const perm = validPermissions.find(vp =>
        vp._id.toString() === (typeof p.permissionId === 'string' ? p.permissionId : p.permissionId?.toString())
      );

      if (!perm) return null;

      // Get pageId from permission or directly from input
      let pageId = perm.pageId;
      if (p.pageId) {
        pageId = typeof p.pageId === 'string' ? new mongoose.Types.ObjectId(p.pageId) : p.pageId;
      }

      // Get route from page if available
      let route = null;
      if (pageId) {
        const page = await Page.findById(pageId);
        if (page) {
          route = page.route;
        }
      }

      return {
        pageId: pageId,
        permissionId: perm._id,
        module: perm.module,
        displayName: perm.displayName,
        category: perm.category,
        route: route,
        actions: p.actions || { all: false }
      };
    }));

    // Filter out null entries
    let validFormattedPermissions = formattedPermissions.filter(p => p !== null);

    // ============================================
    // ENFORCE MANDATORY PERMISSIONS
    // ============================================
    // Get role's mandatory permissions from database
    const mandatoryPermissions = role.mandatoryPermissions || [];
    const allActionKeys = ['all', 'read', 'create', 'write', 'delete', 'import', 'export', 'approve', 'assign'];

    if (mandatoryPermissions.length > 0) {
      // Create a map of current permissions by pageId for easy lookup
      const permissionsMap = new Map(
        validFormattedPermissions.map(p => [p.pageId?.toString(), p])
      );

      // Process each mandatory permission
      for (const mandatory of mandatoryPermissions) {
        const mandatoryPageId = mandatory.pageId?.toString();
        const mandatoryActions = mandatory.actions || [];

        // Find or create permission entry for this page
        let permEntry = permissionsMap.get(mandatoryPageId);

        if (!permEntry) {
          // If permission doesn't exist, we need to create it
          // First check if there's a page and permission for this
          const page = await Page.findById(mandatory.pageId);
          if (!page) {
            console.warn(`Mandatory permission page not found: ${mandatoryPageId}`);
            continue;
          }

          const permission = await Permission.findOne({ pageId: page._id, isActive: true });
          if (!permission) {
            console.warn(`Mandatory permission not found in permissions collection: ${mandatoryPageId}`);
            continue;
          }

          permEntry = {
            pageId: page._id,
            permissionId: permission._id,
            module: permission.module,
            displayName: permission.displayName,
            category: permission.category,
            route: page.route,
            actions: { all: false, read: false, create: false, write: false, delete: false, import: false, export: false, approve: false, assign: false }
          };

          permissionsMap.set(mandatoryPageId, permEntry);
        }

        // Ensure mandatory actions are always enabled
        if (mandatoryActions.includes('all')) {
          // All actions are mandatory - enable everything
          allActionKeys.forEach(action => {
            permEntry.actions[action] = true;
          });
        } else {
          // Specific actions are mandatory
          mandatoryActions.forEach(action => {
            if (action !== 'all') {
              permEntry.actions[action] = true;
            }
          });

          // Check if all individual mandatory actions are enabled, then enable 'all' too
          const individualActions = allActionKeys.filter(a => a !== 'all');
          const allIndividualEnabled = individualActions.every(a => permEntry.actions[a] === true);
          if (allIndividualEnabled) {
            permEntry.actions.all = true;
          }
        }
      }

      // Convert map back to array
      validFormattedPermissions = Array.from(permissionsMap.values());
    }

    // Save to Junction Table
    await RolePermission.setRolePermissions(roleId, validFormattedPermissions, userId);

    // Calculate categories for stats
    const categories = [...new Set(validFormattedPermissions.map(p => p.category))];

    return {
      success: true,
      message: `Updated ${validFormattedPermissions.length} permissions for role ${role.displayName}`,
      data: {
        totalPermissions: validFormattedPermissions.length,
        categories: categories,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if a role has a specific permission action
 * PRIMARY METHOD - Uses Junction Table (role_permissions)
 */
export async function checkRolePermission(roleId, module, action) {
  try {
    const hasPermission = await RolePermission.hasModuleAccess(roleId, module, action);
    return hasPermission;
  } catch (error) {
    console.error('Error checking role permission:', error);
    return false;
  }
}

/**
 * Check if role has access to a specific page
 * PRIMARY METHOD - Uses Junction Table (role_permissions)
 */
export async function checkRolePageAccess(roleId, pageId, action = 'read') {
  try {
    return await RolePermission.hasPageAccess(roleId, pageId, action);
  } catch (error) {
    console.error('Error checking role page access:', error);
    return false;
  }
}

/**
 * Get all accessible pages for a role
 * PRIMARY METHOD - Uses Junction Table (role_permissions)
 */
export async function getRoleAccessiblePages(roleId) {
  try {
    return await RolePermission.getAccessiblePages(roleId);
  } catch (error) {
    console.error('Error getting role accessible pages:', error);
    return [];
  }
}

/**
 * Update a single permission action for a role
 * PRIMARY METHOD - Uses Junction Table (role_permissions)
 * @param {String} roleId - Role ID
 * @param {String} pageId - Page ID (from route param)
 * @param {Object} actions - Actions to update
 */
export async function updateRolePermissionAction(roleId, pageId, actions) {
  try {
    const result = await RolePermission.updateRolePermissionAction(roleId, pageId, actions);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// PERMISSION-PAGE SYNC METHODS
// ============================================

/**
 * Sync permissions from pages
 * Creates or updates permissions based on existing pages
 */
export async function syncPermissionsFromPages() {
  try {
    const results = await Permission.syncFromPages();
    return {
      success: true,
      data: results,
      message: `Synced ${results.created + results.updated} permissions from pages`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create permission from a page
 * Automatically creates a permission for a given page
 */
export async function createPermissionFromPage(pageId) {
  try {
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        success: false,
        error: 'Page not found',
      };
    }

    const permission = await Permission.findOrCreateFromPage(page);

    return {
      success: true,
      data: permission,
      message: 'Permission created/updated from page',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Migrate role permissions from embedded to junction table
 * Call this to transition from hybrid to pure junction table approach
 */
export async function migrateToJunctionTable(roleId) {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if role has embedded permissions
    if (!role.permissions || role.permissions.length === 0) {
      return {
        success: true,
        message: 'No embedded permissions to migrate',
        data: { migrated: 0 },
      };
    }

    // Convert embedded permissions to junction table format
    const permissionsData = role.permissions.map(p => ({
      pageId: p.pageId,
      permissionId: p.permissionId,
      module: p.module,
      displayName: p.displayName,
      category: p.category,
      route: null,
      actions: p.actions || { all: false }
    }));

    // Save to junction table
    await RolePermission.setRolePermissions(roleId, permissionsData);

    // Clear embedded permissions from role
    role.permissions = [];
    role.permissionStats = {
      totalPermissions: 0,
      categories: [],
      lastUpdatedAt: new Date()
    };
    await role.save();

    return {
      success: true,
      message: `Migrated ${permissionsData.length} permissions to junction table`,
      data: { migrated: permissionsData.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Migrate all roles to junction table
 */
export async function migrateAllRolesToJunctionTable() {
  try {
    const roles = await Role.find({ 'permissions.0': { $exists: true } });
    let migrated = 0;
    let failed = 0;

    for (const role of roles) {
      try {
        await migrateToJunctionTable(role._id);
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate role ${role._id}:`, error);
        failed++;
      }
    }

    return {
      success: true,
      message: `Migrated ${migrated} roles, ${failed} failed`,
      data: { migrated, failed, total: roles.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  getGroupedPermissions,
  getHierarchicalPermissions,
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  // Junction Table Primary Methods
  getRolePermissions,
  setRolePermissions,
  checkRolePermission,
  checkRolePageAccess,
  getRoleAccessiblePages,
  updateRolePermissionAction,
  // Sync Methods
  syncPermissionsFromPages,
  createPermissionFromPage,
  // Migration Helpers
  migrateToJunctionTable,
  migrateAllRolesToJunctionTable,
};
