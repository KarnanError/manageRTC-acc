/**
 * Page Schema - Updated for Multi-Level Hierarchy
 * Represents individual pages/routes with support for recursive parent-child relationships
 *
 * Hierarchy Structure:
 * Level -1: Category (I-XII) - 12 total
 *   Level 0: L1 Parent Menu or Direct Child Page
 *     Level 1: L2 Parent Menu or Child Page
 *       Level 2: Child Page (with route)
 */

import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  // ============================================
  // BASIC FIELDS
  // ============================================

  // Unique page identifier (e.g., "hrm.employees", "projects.tasks")
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Display name (e.g., "Employees", "Tasks")
  displayName: {
    type: String,
    required: true,
  },

  // Description
  description: {
    type: String,
  },

  // Route path (e.g., "/hrm/employees", "/projects/tasks")
  // Can be NULL for menu groups
  route: {
    type: String,
    default: null,
  },

  // Icon (Tabler icon class)
  icon: {
    type: String,
    default: 'ti ti-file',
  },

  // ============================================
  // HIERARCHY FIELDS - NEW
  // ============================================

  // Link to PageCategory (replaces moduleCategory enum)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PageCategory',
    required: true,
  },

  // Recursive parent reference
  // Points to parent page (can be L1 or L2 menu group)
  parentPage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    default: null,
  },

  // Hierarchy level (1-3)
  // 1 = Direct child of category
  // 2 = Child of L1 parent
  // 3 = Child of L2 parent
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 3,
  },

  // Depth from category (1-4)
  // Category = 0 (not stored)
  // Direct child of category = 1
  // Child of L1 = 2
  // Child of L2 = 3
  depth: {
    type: Number,
    default: 1,
    min: 1,
    max: 4,
  },

  // Full path from category to this page
  // Used for efficient hierarchy queries
  // [categoryId, l1ParentId?, l2ParentId?]
  hierarchyPath: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },

  // Is this a menu group (any level)?
  // Menu groups don't have routes and serve as navigation parents
  isMenuGroup: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Menu group level (1 or 2)
  // 1 = L1 menu group (direct child of category)
  // 2 = L2 menu group (child of L1 menu group)
  // null = Not a menu group
  menuGroupLevel: {
    type: Number,
    default: null,
    enum: [1, 2, null],
  },

  // ============================================
  // DEPRECATED: Module Category (kept for backward compatibility)
  // ============================================
  moduleCategory: {
    type: String,
    enum: ['super-admin', 'users-permissions', 'applications', 'hrm', 'projects',
           'crm', 'recruitment', 'finance', 'administration', 'content',
           'pages', 'auth', 'ui', 'extras', 'dashboards', 'reports', null],
    description: 'DEPRECATED: Use category (ObjectId) instead',
  },

  // ============================================
  // DISPLAY FIELDS
  // ============================================

  // Sort order for display
  sortOrder: {
    type: Number,
    default: 0,
  },

  // Is this a system page (cannot be deleted)
  isSystem: {
    type: Boolean,
    default: false,
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true,
  },

  // ============================================
  // AVAILABLE ACTIONS - RBAC
  // ============================================
  // Defines which actions can be performed on this page
  // This field determines what permission checkboxes are shown
  availableActions: {
    type: [String],
    default: ['read', 'create', 'write', 'delete', 'import', 'export'],
    enum: ['all', 'read', 'create', 'write', 'delete', 'import', 'export', 'approve', 'assign'],
  },

  // ============================================
  // SEO / Display metadata
  // ============================================
  meta: {
    title: String,
    keywords: [String],
    layout: {
      type: String,
      enum: ['default', 'full-width', 'no-sidebar', 'blank'],
      default: 'default',
    },
  },

  // ============================================
  // ACCESS CONTROL FIELDS
  // ============================================

  // API Routes for automatic route protection
  apiRoutes: [{
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['read', 'create', 'write', 'delete', 'import', 'export', 'approve', 'assign'],
      default: 'read',
    },
    description: String,
  }],

  // Access conditions for conditional access control
  accessConditions: {
    // Require company context
    requiresCompany: {
      type: Boolean,
      default: true,
    },
    // Require specific plan
    requiresPlan: {
      type: Boolean,
      default: false,
    },
    // Role-based restrictions
    allowedRoles: [{
      type: String,
    }],
    deniedRoles: [{
      type: String,
    }],
    // Time-based restrictions
    timeRestricted: {
      enabled: {
        type: Boolean,
        default: false,
      },
      allowedHours: {
        start: { type: Number, min: 0, max: 23 },
        end: { type: Number, min: 0, max: 23 },
      },
      allowedDays: [{
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday, 6 = Saturday
      }],
    },
    // IP restrictions
    ipRestricted: {
      enabled: {
        type: Boolean,
        default: false,
      },
      allowedIPs: [String],
      deniedIPs: [String],
    },
  },

  // Feature flags for plan-based access control
  featureFlags: {
    // Required features (user's plan must include these)
    requiresFeature: [{
      type: String,
    }],
    // Minimum plan tier required
    minimumPlanTier: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise', null],
      default: null,
    },
    // Enable for all users regardless of plan
    enabledForAll: {
      type: Boolean,
      default: false,
    },
  },

  // Data scope for row-level security
  dataScope: {
    // Filter data by user's company
    filterByCompany: {
      type: Boolean,
      default: true,
    },
    // Filter data by user (for personal data)
    filterByUser: {
      type: Boolean,
      default: false,
    },
    // Filter by user's department
    filterByDepartment: {
      type: Boolean,
      default: false,
    },
    // Custom MongoDB filter query
    customFilter: {
      type: String,
    },
    // Field-level restrictions
    restrictedFields: [{
      field: String,
      roles: [String], // Roles that CAN access this field
    }],
  },

  // ============================================
  // AUDIT FIELDS
  // ============================================
  // Created/Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// ============================================
// INDEXES
// ============================================

// Hierarchy queries
pageSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
pageSchema.index({ category: 1, isMenuGroup: 1, menuGroupLevel: 1, isActive: 1 });
pageSchema.index({ parentPage: 1, isActive: 1, sortOrder: 1 });
pageSchema.index({ category: 1, hierarchyPath: 1, isActive: 1 });
pageSchema.index({ category: 1, level: 1, isActive: 1 });
pageSchema.index({ category: 1, depth: 1, isActive: 1 });

// Legacy support
pageSchema.index({ moduleCategory: 1, isActive: 1 });

// Search
pageSchema.index({ displayName: 'text', name: 'text', route: 'text' });

// API routes
pageSchema.index({ 'apiRoutes.path': 1, 'apiRoutes.method': 1 });

// Feature flags
pageSchema.index({ 'featureFlags.requiresFeature': 1 });

// ============================================
// STATIC METHODS - Legacy Support
// ============================================

/**
 * Get pages by module category (LEGACY - for backward compatibility)
 */
pageSchema.statics.getByModule = function(moduleCategory) {
  return this.find({
    moduleCategory,
    isActive: true,
    parentPage: null  // Only top-level pages
  }).sort({ sortOrder: 1 });
};

/**
 * Get all pages grouped by module (LEGACY)
 */
pageSchema.statics.getGroupedByModule = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $sort: { moduleCategory: 1, sortOrder: 1 } },
    {
      $group: {
        _id: '$moduleCategory',
        pages: {
          $push: {
            _id: '$_id',
            name: '$name',
            displayName: '$displayName',
            description: '$description',
            route: '$route',
            icon: '$icon',
            sortOrder: '$sortOrder',
            isSystem: '$isSystem',
            availableActions: '$availableActions',
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// ============================================
// STATIC METHODS - Hierarchy Support
// ============================================

/**
 * Get full hierarchy tree for a category
 * Returns all levels: L1 menus, L2 menus, and child pages
 */
pageSchema.statics.getHierarchyTree = async function(categoryId) {
  const pipeline = [
    // Match active pages in category
    {
      $match: {
        category: mongoose.Types.ObjectId(categoryId),
        isActive: true
      }
    },
    // Sort by hierarchy
    {
      $sort: {
        'hierarchyPath.0': 1,  // First sort by path
        sortOrder: 1
      }
    },
    // Lookup parent pages
    {
      $lookup: {
        from: 'pages',
        localField: 'parentPage',
        foreignField: '_id',
        as: 'parent'
      }
    },
    {
      $unwind: {
        path: '$parent',
        preserveNullAndEmptyArrays: true
      }
    },
    // Lookup category
    {
      $lookup: {
        from: 'pagecategories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryData'
      }
    },
    {
      $unwind: '$categoryData'
    }
  ];

  return await this.aggregate(pipeline);
};

/**
 * Get L1 menu groups for a category
 * L1 menu groups have isMenuGroup=true and menuGroupLevel=1
 */
pageSchema.statics.getL1MenuGroups = async function(categoryId) {
  return await this.find({
    category: categoryId,
    isMenuGroup: true,
    menuGroupLevel: 1,
    isActive: true,
  }).sort({ sortOrder: 1 }).populate('parentPage');
};

/**
 * Get L2 menu groups under specific L1 parent
 * L2 menu groups have isMenuGroup=true and menuGroupLevel=2
 */
pageSchema.statics.getL2MenuGroups = async function(l1ParentId) {
  return await this.find({
    parentPage: l1ParentId,
    isMenuGroup: true,
    menuGroupLevel: 2,
    isActive: true,
  }).sort({ sortOrder: 1 }).populate('parentPage');
};

/**
 * Get child pages (non-menu groups) for a parent
 * Returns pages that are not menu groups
 */
pageSchema.statics.getChildPages = async function(parentId) {
  return await this.find({
    parentPage: parentId,
    isMenuGroup: false,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

/**
 * Get all children (including both menu groups and pages)
 */
pageSchema.statics.getAllChildren = async function(parentId) {
  return await this.find({
    parentPage: parentId,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

/**
 * Get direct children of category (no parent)
 */
pageSchema.statics.getDirectCategoryChildren = async function(categoryId) {
  return await this.find({
    category: categoryId,
    parentPage: null,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Build hierarchy path for a page
 * Automatically called before save
 */
pageSchema.methods.buildHierarchyPath = async function() {
  const path = [];

  // Add category
  path.push(this.category);

  // If has parent, add parent's path
  if (this.parentPage) {
    const Page = mongoose.model('Page');
    const parent = await Page.findById(this.parentPage);
    if (parent && parent.hierarchyPath) {
      // Add parent's path (excluding category since we already added it)
      // Parent path is [category, l1Parent?, l2Parent?]
      // We only want [l1Parent?, l2Parent?] since we have category
      if (parent.hierarchyPath.length > 1) {
        path.push(...parent.hierarchyPath.slice(1));
      } else {
        path.push(...parent.hierarchyPath);
      }
    }
    path.push(this.parentPage);
  }

  this.hierarchyPath = path;

  // Calculate depth
  this.depth = path.length;

  // Calculate level (depth - 1, since category counts as depth 1)
  // Direct child of category = depth 1 = level 1
  // Child of L1 = depth 2 = level 2
  // Child of L2 = depth 3 = level 3
  this.level = Math.max(1, this.depth - 1);
};

// ============================================
// PRE-SAVE HOOK
// ============================================

// Build hierarchy path before save
pageSchema.pre('save', async function(next) {
  if (this.isModified('parentPage') || this.isModified('category')) {
    await this.buildHierarchyPath();
  }
  next();
});

// ============================================
// LEGACY STATIC METHODS FOR ACCESS CONTROL
// ============================================

/**
 * Find page by API route
 */
pageSchema.statics.findByApiRoute = async function(method, path) {
  // Normalize path for matching
  const normalizedPath = path.split('/').map(segment => {
    return segment.match(/^[a-f0-9]{24}$/i) || segment.match(/^\d+$/) ? ':id' : segment;
  }).join('/');

  return this.findOne({
    isActive: true,
    'apiRoutes': {
      $elemMatch: {
        method: method.toUpperCase(),
        path: { $in: [path, normalizedPath, path.replace(/\/$/, ''), normalizedPath.replace(/\/$/, '')] }
      }
    }
  });
};

/**
 * Get all pages with their API routes
 */
pageSchema.statics.getPagesWithApiRoutes = async function() {
  return this.find({
    isActive: true,
    'apiRoutes.0': { $exists: true }
  }).select('name displayName route availableActions apiRoutes accessConditions featureFlags dataScope');
};

/**
 * Get pages required for a specific plan tier
 */
pageSchema.statics.getPagesForTier = async function(tier) {
  const tierOrder = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  const tierLevel = tierOrder[tier] || 0;

  return this.find({
    isActive: true,
    $or: [
      { 'featureFlags.enabledForAll': true },
      { 'featureFlags.minimumPlanTier': null },
      { 'featureFlags.minimumPlanTier': { $exists: false } },
      { 'featureFlags.minimumPlanTier': { $in: Object.keys(tierOrder).filter(t => tierOrder[t] <= tierLevel) } }
    ]
  });
};

/**
 * Check if a page requires specific features
 */
pageSchema.statics.checkFeatureAccess = async function(pageName, availableFeatures = []) {
  const page = await this.findOne({ name: pageName, isActive: true });

  if (!page) {
    return { allowed: false, reason: 'Page not found' };
  }

  if (page.featureFlags?.enabledForAll) {
    return { allowed: true, page };
  }

  const requiredFeatures = page.featureFlags?.requiresFeature || [];
  const missingFeatures = requiredFeatures.filter(f => !availableFeatures.includes(f));

  if (missingFeatures.length > 0) {
    return {
      allowed: false,
      reason: 'Missing required features',
      missingFeatures,
      page
    };
  }

  return { allowed: true, page };
};

/**
 * Get data scope configuration for a page
 */
pageSchema.statics.getDataScope = async function(pageName) {
  const page = await this.findOne({ name: pageName, isActive: true })
    .select('dataScope');

  return page?.dataScope || null;
};

/**
 * Build MongoDB filter based on data scope
 */
pageSchema.statics.buildDataFilter = async function(pageName, context = {}) {
  const dataScope = await this.getDataScope(pageName);

  if (!dataScope) {
    return {};
  }

  const filter = {};

  if (dataScope.filterByCompany && context.companyId) {
    filter.companyId = context.companyId;
  }

  if (dataScope.filterByUser && context.userId) {
    filter.userId = context.userId;
  }

  if (dataScope.filterByDepartment && context.departmentId) {
    filter.departmentId = context.departmentId;
  }

  if (dataScope.customFilter) {
    try {
      const customFilter = JSON.parse(dataScope.customFilter);
      Object.assign(filter, customFilter);
    } catch (e) {
      console.error('Invalid custom filter:', e);
    }
  }

  return filter;
};

export default mongoose.models.Page || mongoose.model('Page', pageSchema);
