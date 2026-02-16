# Pages Structure Implementation Plan V2

**Plan Version:** 2.0 (Multi-Level Hierarchy)
**Created:** 2026-02-14
**Status:** Ready for Implementation
**Estimated Duration:** 5-7 days

---

## 🚨 Critical Changes from V1

| Change | V1 | V2 | Reason |
|--------|-----|-----|--------|
| Max Hierarchy Levels | 2 | 4 | HRM has L2 parent menus |
| Schema Fields | Basic | Enhanced | Need `level`, `depth`, `hierarchyPath` |
| Menu Group Levels | 1 | 2 | L1 and L2 parent menus |
| Total Parent Menus | 20 | 23 | 3 L2 menus added |
| Query Complexity | Simple | Recursive | Need aggregation pipelines |

---

## Overview

This plan implements a **recursive 4-level hierarchy** based on the updated `page.md`:

```
Level 0: Category (12 total - I-XII)
    ↓
Level 1: L1 Parent Menu (20 total) or Direct Child Page
    ↓
Level 2: L2 Parent Menu (3 total) or Direct Child Page
    ↓
Level 3: Child Page (with route)
```

**Critical Example (HRM):**
```
Level 0: HRM (Category)
    ↓
Level 1: Attendance & Leave (L1 Parent Menu - no route)
    ↓
Level 2: Leaves (L2 Parent Menu - no route) ⭐ NEW!
    ↓
Level 3: Leaves (Admin) (/leaves - has route)
```

---

## Phase 1: Schema Foundation (Day 1 - All Day)

### 1.1 Update Page Schema for Recursive Hierarchy

**File:** `backend/models/rbac/page.schema.js`

```javascript
const pageSchema = new mongoose.Schema({
  // EXISTING FIELDS (preserve)
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String },
  route: { type: String },  // Can be null for menu groups
  icon: { type: String, default: 'ti ti-file' },

  // ============================================
  // NEW: HIERARCHY FIELDS
  // ============================================

  // Link to PageCategory (replaces moduleCategory enum)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PageCategory',
    required: true,
  },

  // Recursive parent reference
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
    index: true,
  },

  // Depth from category (1-4)
  depth: {
    type: Number,
    default: 1,
    min: 1,
    max: 4,
    index: true,
  },

  // Full path from category to this page
  // Used for efficient hierarchy queries
  hierarchyPath: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    index: true,
  },

  // Is this a menu group (parent menu)?
  isMenuGroup: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Menu group level (1 or 2)
  // null = not a menu group or child page
  menuGroupLevel: {
    type: Number,
    default: null,
    enum: [1, 2, null],
  },

  // EXISTING FIELDS (preserve)
  availableActions: { type: [String], default: ['read', 'create', 'write', 'delete', 'import', 'export'] },
  sortOrder: { type: Number, default: 0 },
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ============================================
// INDEXES FOR HIERARCHY QUERIES
// ============================================

// Find menu groups by level
pageSchema.index({ category: 1, isMenuGroup: 1, menuGroupLevel: 1, isActive: 1 });

// Find children of specific parent
pageSchema.index({ parentPage: 1, isActive: 1, sortOrder: 1 });

// Find all pages in a category by hierarchy path
pageSchema.index({ category: 1, 'hierarchyPath.0': 1, isActive: 1 });

// Find by depth
pageSchema.index({ category: 1, depth: 1, isActive: 1 });

// Compound index for common queries
pageSchema.index({
  category: 1,
  isActive: 1,
  sortOrder: 1
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get full hierarchy tree for a category
 * Returns recursive tree with all levels
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
 */
pageSchema.statics.getL1MenuGroups = async function(categoryId) {
  return await this.find({
    category: categoryId,
    isMenuGroup: true,
    menuGroupLevel: 1,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

/**
 * Get L2 menu groups under specific L1 parent
 */
pageSchema.statics.getL2MenuGroups = async function(l1ParentId) {
  return await this.find({
    parentPage: l1ParentId,
    isMenuGroup: true,
    menuGroupLevel: 2,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

/**
 * Get child pages (non-menu groups) for a parent
 */
pageSchema.statics.getChildPages = async function(parentId) {
  return await this.find({
    parentPage: parentId,
    isMenuGroup: false,
    isActive: true,
  }).sort({ sortOrder: 1 });
};

/**
 * Build hierarchy path for a page
 * Called automatically on save
 */
pageSchema.methods.buildHierarchyPath = async function() {
  const path = [];

  // Add category
  path.push(this.category);

  // If has parent, add parent's path
  if (this.parentPage) {
    const parent = await mongoose.model('Page').findById(this.parentPage);
    if (parent && parent.hierarchyPath) {
      path.push(...parent.hierarchyPath.slice(1)); // Exclude category from parent
    }
    path.push(this.parentPage);
  }

  this.hierarchyPath = path;

  // Calculate depth
  this.depth = path.length;

  // Calculate level (depth - 1, since category is depth 1)
  this.level = Math.max(1, this.depth - 1);
};

// Pre-save hook to build hierarchy
pageSchema.pre('save', async function() {
  if (this.isModified('parentPage') || this.isModified('category')) {
    await this.buildHierarchyPath();
  }
});

export default mongoose.models.Page || mongoose.model('Page', pageSchema);
```

### 1.2 Create PageCategory Schema

**File:** `backend/models/rbac/pageCategory.schema.js`

```javascript
import mongoose from 'mongoose';

const pageCategorySchema = new mongoose.Schema({
  // Roman numeral (I, II, III, etc.)
  identifier: {
    type: String,
    required: true,
    unique: true,
  },

  // Display name
  displayName: {
    type: String,
    required: true,
    unique: true,
  },

  // URL-friendly label
  label: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  // Description
  description: {
    type: String,
  },

  // Icon
  icon: {
    type: String,
    default: 'ti ti-folder',
  },

  // Sort order
  sortOrder: {
    type: Number,
    default: 0,
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true,
  },

  // System category (cannot be deleted)
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
pageCategorySchema.index({ identifier: 1 }, { unique: true });
pageCategorySchema.index({ label: 1 }, { unique: true });
pageCategorySchema.index({ sortOrder: 1 });
pageCategorySchema.index({ isActive: 1 });

export default mongoose.models.PageCategory || mongoose.model('PageCategory', pageCategorySchema);
```

### 1.3 Create PageCategory Service

**File:** `backend/services/rbac/pageCategory.service.js`

```javascript
import PageCategory from '../models/rbac/pageCategory.schema.js';
import Page from '../models/rbac/page.schema.js';

export const pageCategoryService = {
  async getAll(filters = {}) {
    const query = {};
    if (filters.activeOnly) query.isActive = true;
    return await PageCategory.find(query).sort({ sortOrder: 1 });
  },

  async getById(id) {
    return await PageCategory.findById(id);
  },

  async getByLabel(label) {
    return await PageCategory.findOne({ label });
  },

  async create(data) {
    // Check if label exists
    const existing = await PageCategory.findOne({ label: data.label });
    if (existing) {
      throw new Error(`Category with label "${data.label}" already exists`);
    }

    const category = new PageCategory(data);
    await category.save();
    return category;
  },

  async update(id, data) {
    // Check if label exists (excluding current)
    if (data.label) {
      const existing = await PageCategory.findOne({
        label: data.label,
        _id: { $ne: id }
      });
      if (existing) {
        throw new Error(`Category with label "${data.label}" already exists`);
      }
    }

    return await PageCategory.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  },

  async delete(id) {
    const category = await PageCategory.findById(id);
    if (category?.isSystem) {
      throw new Error('Cannot delete system category');
    }

    // Check if any pages use this category
    const count = await Page.countDocuments({ category: id });
    if (count > 0) {
      throw new Error(`Cannot delete category with ${count} pages`);
    }

    return await PageCategory.findByIdAndDelete(id);
  },

  async toggleStatus(id) {
    const category = await PageCategory.findById(id);
    if (!category) throw new Error('Category not found');
    category.isActive = !category.isActive;
    await category.save();
    return category;
  }
};
```

---

## Phase 2: API Endpoints (Day 2 - Morning)

### 2.1 Category Routes

**File:** `backend/routes/api/rbac/pageCategories.routes.js`

```javascript
import express from 'express';
import { requirePageAccess } from '../../middleware/pageAccess.js';
import { pageCategoryService } from '../../services/rbac/pageCategory.service.js';

const router = express.Router();

// GET /api/rbac/categories - Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await pageCategoryService.getAll({
      activeOnly: req.query.activeOnly === 'true'
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/categories/tree - Get category tree with hierarchy
router.get('/tree', async (req, res, next) => {
  try {
    const Page = mongoose.model('Page');
    const PageCategory = mongoose.model('PageCategory');

    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    // Add page counts and hierarchy for each category
    const enrichedCategories = await Promise.all(
      categories.map(async (cat) => {
        const pages = await Page.find({
          category: cat._id,
          isActive: true
        }).lean();

        return {
          ...cat,
          pageCount: pages.length,
          l1MenuGroups: await Page.getL1MenuGroups(cat._id),
          totalDepth: Math.max(0, ...pages.map(p => p.depth || 0)),
        };
      })
    );

    res.json({ success: true, data: enrichedCategories });
  } catch (error) {
    next(error);
  }
});

// POST /api/rbac/categories - Create category
router.post('/', requirePageAccess('super-admin.pages', 'create'), async (req, res, next) => {
  try {
    const category = await pageCategoryService.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// PUT /api/rbac/categories/:id - Update category
router.put('/:id', requirePageAccess('super-admin.pages', 'write'), async (req, res, next) => {
  try {
    const category = await pageCategoryService.update(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rbac/categories/:id - Delete category
router.delete('/:id', requirePageAccess('super-admin.pages', 'delete'), async (req, res, next) => {
  try {
    await pageCategoryService.delete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/rbac/categories/:id/toggle-status - Toggle status
router.patch('/:id/toggle-status', requirePageAccess('super-admin.pages', 'write'), async (req, res, next) => {
  try {
    const category = await pageCategoryService.toggleStatus(req.params.id);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 2.2 Enhanced Page Routes for Hierarchy

**File:** `backend/routes/api/rbac/pages.routes.js`

```javascript
import express from 'express';
import { requirePageAccess } from '../../middleware/pageAccess.js';
import Page from '../../models/rbac/page.schema.js';

const router = express.Router();

// GET /api/rbac/pages/hierarchy/:categoryId - Get full hierarchy tree
router.get('/hierarchy/:categoryId', async (req, res, next) => {
  try {
    const hierarchy = await Page.getHierarchyTree(req.params.categoryId);
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/l1-groups/:categoryId - Get L1 menu groups
router.get('/l1-groups/:categoryId', async (req, res, next) => {
  try {
    const groups = await Page.getL1MenuGroups(req.params.categoryId);
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/l2-groups/:l1ParentId - Get L2 menu groups
router.get('/l2-groups/:l1ParentId', async (req, res, next) => {
  try {
    const groups = await Page.getL2MenuGroups(req.params.l1ParentId);
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/children/:parentId - Get child pages
router.get('/children/:parentId', async (req, res, next) => {
  try {
    const children = await Page.getChildPages(req.params.parentId);
    res.json({ success: true, data: children });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/tree-structure - Get recursive tree structure
router.get('/tree-structure', async (req, res, next) => {
  try {
    const PageCategory = mongoose.model('PageCategory');
    const categories = await PageCategory.find({ isActive: true })
      .sort({ sortOrder: 1 });

    const tree = await Promise.all(
      categories.map(async (cat) => {
        const l1Groups = await Page.getL1MenuGroups(cat._id);

        const enrichedL1Groups = await Promise.all(
          l1Groups.map(async (l1) => {
            const l2Groups = await Page.getL2MenuGroups(l1._id);

            const enrichedL2Groups = await Promise.all(
              l2Groups.map(async (l2) => {
                const children = await Page.getChildPages(l2._id);
                return { ...l2.toObject(), children };
              })
            );

            // L1 might have direct children too
            const l1Children = await Page.getChildPages(l1._id);

            return {
              ...l1.toObject(),
              l2Groups: enrichedL2Groups,
              directChildren: l1Children
            };
          })
        );

        // Direct children of category (no L1 parent)
        const directChildren = await Page.find({
          category: cat._id,
          parentPage: null,
          isMenuGroup: false,
          isActive: true
        }).sort({ sortOrder: 1 });

        return {
          ...cat.toObject(),
          l1Groups: enrichedL1Groups,
          directChildren
        };
      })
    );

    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
});

// POST /api/rbac/pages - Create page (with hierarchy support)
router.post('/', requirePageAccess('super-admin.pages', 'create'), async (req, res, next) => {
  try {
    const page = new Page(req.body);

    // Auto-calculate hierarchy
    await page.buildHierarchyPath();

    await page.save();
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

// PUT /api/rbac/pages/:id - Update page
router.put('/:id', requirePageAccess('super-admin.pages', 'write'), async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    Object.assign(page, req.body);

    // Recalculate hierarchy if parent changed
    if (page.isModified('parentPage') || page.isModified('category')) {
      await page.buildHierarchyPath();
    }

    await page.save();
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/rbac/pages/:id - Delete page
router.delete('/:id', requirePageAccess('super-admin.pages', 'delete'), async (req, res, next) => {
  try {
    // Check if has children
    const children = await Page.countDocuments({ parentPage: req.params.id });
    if (children > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete page with ${children} children`
      });
    }

    await Page.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Phase 3: Seed Data with Hierarchy (Day 2 - Afternoon)

### 3.1 Category Seed

**File:** `backend/seed/pageCategories.seed.js`

```javascript
import mongoose from 'mongoose';
import PageCategory from '../models/rbac/pageCategory.schema.js';

const categoryDefinitions = [
  {
    identifier: 'I',
    displayName: 'Main Menu',
    label: 'main-menu',
    description: 'Super Admin main menu items',
    icon: 'ti ti-smart-home',
    sortOrder: 10,
    isSystem: true,
  },
  {
    identifier: 'II',
    displayName: 'Users & Permissions',
    label: 'users-permissions',
    description: 'User management and role-based access control',
    icon: 'ti ti-shield',
    sortOrder: 20,
    isSystem: true,
  },
  {
    identifier: 'III',
    displayName: 'Dashboards',
    label: 'dashboards',
    description: 'Analytics and reporting dashboards',
    icon: 'ti ti-dashboard',
    sortOrder: 30,
    isSystem: true,
  },
  {
    identifier: 'IV',
    displayName: 'HRM',
    label: 'hrm',
    description: 'Human Resource Management',
    icon: 'ti ti-users',
    sortOrder: 40,
    isSystem: true,
  },
  {
    identifier: 'V',
    displayName: 'Recruitment',
    label: 'recruitment',
    description: 'Talent acquisition and hiring',
    icon: 'ti ti-user-plus',
    sortOrder: 50,
    isSystem: true,
  },
  {
    identifier: 'VI',
    displayName: 'Projects',
    label: 'projects',
    description: 'Project and task management',
    icon: 'ti ti-folder',
    sortOrder: 60,
    isSystem: true,
  },
  {
    identifier: 'VII',
    displayName: 'CRM',
    label: 'crm',
    description: 'Customer Relationship Management',
    icon: 'ti ti-handshake',
    sortOrder: 70,
    isSystem: true,
  },
  {
    identifier: 'VIII',
    displayName: 'Applications',
    label: 'applications',
    description: 'Internal applications and tools',
    icon: 'ti ti-apps',
    sortOrder: 80,
    isSystem: true,
  },
  {
    identifier: 'IX',
    displayName: 'Finance & Accounts',
    label: 'finance-accounts',
    description: 'Financial management and accounting',
    icon: 'ti ti-currency-dollar',
    sortOrder: 90,
    isSystem: true,
  },
  {
    identifier: 'X',
    displayName: 'Administration',
    label: 'administration',
    description: 'System administration and settings',
    icon: 'ti ti-settings',
    sortOrder: 100,
    isSystem: true,
  },
  {
    identifier: 'XI',
    displayName: 'Pages',
    label: 'pages',
    description: 'Content and static pages',
    icon: 'ti ti-file',
    sortOrder: 110,
    isSystem: true,
  },
  {
    identifier: 'XII',
    displayName: 'Extras',
    label: 'extras',
    description: 'Additional features and extras',
    icon: 'ti ti-star',
    sortOrder: 120,
    isSystem: true,
  },
];

async function seedCategories() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

  console.log('🌱 Seeding PageCategories...');

  for (const catDef of categoryDefinitions) {
    let category = await PageCategory.findOne({ label: catDef.label });
    if (category) {
      Object.assign(category, catDef);
      await category.save();
      console.log(`✏️  Updated: ${catDef.displayName}`);
    } else {
      category = new PageCategory(catDef);
      await category.save();
      console.log(`✅ Created: ${catDef.displayName}`);
    }
  }

  console.log('✅ Categories seed complete!');
  await mongoose.disconnect();
}

seedCategories();
```

### 3.2 HRM Hierarchical Seed (Example with L2 menus)

**File:** `backend/seed/hrmHierarchical.seed.js`

```javascript
import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

const hrmPages = [
  // ===== L1 PARENT MENUS =====
  {
    name: 'hrm.employees-menu',
    displayName: 'Employees',
    description: 'Employee Management',
    route: null,
    icon: 'ti ti-users',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 10,
    children: [
      { name: 'hrm.employees-list', displayName: 'Employees List', route: '/employees', icon: 'ti ti-users', sortOrder: 10 },
      { name: 'hrm.departments', displayName: 'Department', route: '/departments', icon: 'ti ti-building-arch', sortOrder: 20 },
      { name: 'hrm.designations', displayName: 'Designation', route: '/designations', icon: 'ti ti-badge', sortOrder: 30 },
      { name: 'hrm.policies', displayName: 'Policies', route: '/policy', icon: 'ti ti-file-description', sortOrder: 40 },
    ]
  },

  // ===== L1 PARENT WITH L2 CHILDREN ⭐ NEW! =====
  {
    name: 'hrm.attendance-leave-menu',
    displayName: 'Attendance & Leave',
    description: 'Attendance and Leave Management',
    route: null,
    icon: 'ti ti-calendar-check',
    isMenuGroup: true,
    menuGroupLevel: 1,
    sortOrder: 40,
    l2Groups: [
      {
        name: 'hrm.leaves-menu',
        displayName: 'Leaves',
        description: 'Leave Management',
        route: null,
        icon: 'ti ti-calendar-off',
        isMenuGroup: true,
        menuGroupLevel: 2,
        sortOrder: 10,
        children: [
          { name: 'hrm.leaves-admin', displayName: 'Leaves (Admin)', route: '/leaves', icon: 'ti ti-calendar-off', sortOrder: 10 },
          { name: 'hrm.leaves-employee', displayName: 'Leaves (Employee)', route: '/leaves-employee', icon: 'ti ti-calendar-off', sortOrder: 20 },
          { name: 'hrm.leave-settings', displayName: 'Leave Settings', route: '/leave-settings', icon: 'ti ti-settings', sortOrder: 30 },
        ]
      },
      {
        name: 'hrm.attendance-menu',
        displayName: 'Attendance',
        description: 'Attendance Management',
        route: null,
        icon: 'ti ti-calendar-check',
        isMenuGroup: true,
        menuGroupLevel: 2,
        sortOrder: 20,
        children: [
          { name: 'hrm.attendance-admin', displayName: 'Attendance (Admin)', route: '/attendance-admin', icon: 'ti ti-calendar-check', sortOrder: 10 },
          { name: 'hrm.attendance-employee', displayName: 'Attendance (Employee)', route: '/attendance-employee', icon: 'ti ti-calendar-check', sortOrder: 20 },
          { name: 'hrm.timesheet', displayName: 'Timesheet', route: '/timesheets', icon: 'ti ti-clock', sortOrder: 30 },
        ]
      },
      {
        name: 'hrm.shift-schedule-menu',
        displayName: 'Shift & Schedule',
        description: 'Shift and Schedule Management',
        route: null,
        icon: 'ti ti-calendar-time',
        isMenuGroup: true,
        menuGroupLevel: 2,
        sortOrder: 30,
        children: [
          { name: 'hrm.schedule-timing', displayName: 'Schedule Timing', route: '/schedule-timing', icon: 'ti ti-calendar-time', sortOrder: 10 },
          { name: 'hrm.shifts-management', displayName: 'Shift Management', route: '/shifts-management', icon: 'ti ti-clock-hour-4', sortOrder: 20 },
          { name: 'hrm.batches-management', displayName: 'Shift Batches', route: '/batches-management', icon: 'ti ti-stack', sortOrder: 30 },
          { name: 'hrm.overtime', displayName: 'Overtime', route: '/overtime', icon: 'ti ti-clock-hour-12', sortOrder: 40 },
        ]
      },
    ]
  },
  // ... more L1 parent menus
];

async function seedHRMPages() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

  console.log('🌱 Seeding HRM hierarchical pages...');

  const hrmCategory = await PageCategory.findOne({ label: 'hrm' });
  if (!hrmCategory) {
    throw new Error('HRM category not found');
  }

  for (const l1Def of hrmPages) {
    // Create or update L1 parent menu
    let l1Page = await Page.findOne({ name: l1Def.name });

    const l1Data = {
      name: l1Def.name,
      displayName: l1Def.displayName,
      description: l1Def.description,
      route: l1Def.route,
      icon: l1Def.icon,
      category: hrmCategory._id,
      parentPage: null,
      isMenuGroup: l1Def.isMenuGroup,
      menuGroupLevel: l1Def.menuGroupLevel,
      sortOrder: l1Def.sortOrder,
      availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
      isSystem: true,
    };

    if (l1Page) {
      Object.assign(l1Page, l1Data);
      await l1Page.save();
      console.log(`✏️  Updated L1: ${l1Def.displayName}`);
    } else {
      l1Page = new Page(l1Data);
      await l1Page.save();
      console.log(`✅ Created L1: ${l1Def.displayName}`);
    }

    // Handle direct children (if no L2 groups)
    if (l1Def.children && !l1Def.l2Groups) {
      for (const childDef of l1Def.children) {
        let childPage = await Page.findOne({ name: childDef.name });

        const childData = {
          name: childDef.name,
          displayName: childDef.displayName,
          route: childDef.route,
          icon: childDef.icon,
          category: hrmCategory._id,
          parentPage: l1Page._id,
          isMenuGroup: false,
          menuGroupLevel: null,
          sortOrder: childDef.sortOrder,
          availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
          isSystem: true,
        };

        if (childPage) {
          Object.assign(childPage, childData);
          await childPage.save();
          console.log(`  ✏️  Updated child: ${childDef.displayName}`);
        } else {
          childPage = new Page(childData);
          await childPage.save();
          console.log(`  ✅ Created child: ${childDef.displayName}`);
        }
      }
    }

    // Handle L2 groups and their children
    if (l1Def.l2Groups) {
      for (const l2Def of l1Def.l2Groups) {
        let l2Page = await Page.findOne({ name: l2Def.name });

        const l2Data = {
          name: l2Def.name,
          displayName: l2Def.displayName,
          description: l2Def.description,
          route: l2Def.route,
          icon: l2Def.icon,
          category: hrmCategory._id,
          parentPage: l1Page._id, // L2's parent is L1
          isMenuGroup: l2Def.isMenuGroup,
          menuGroupLevel: l2Def.menuGroupLevel,
          sortOrder: l2Def.sortOrder,
          availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
          isSystem: true,
        };

        if (l2Page) {
          Object.assign(l2Page, l2Data);
          await l2Page.save();
          console.log(`    ✏️  Updated L2: ${l2Def.displayName}`);
        } else {
          l2Page = new Page(l2Data);
          await l2Page.save();
          console.log(`    ✅ Created L2: ${l2Def.displayName}`);
        }

        // Handle L2's children
        if (l2Def.children) {
          for (const childDef of l2Def.children) {
            let childPage = await Page.findOne({ name: childDef.name });

            const childData = {
              name: childDef.name,
              displayName: childDef.displayName,
              route: childDef.route,
              icon: childDef.icon,
              category: hrmCategory._id,
              parentPage: l2Page._id, // Child's parent is L2
              isMenuGroup: false,
              menuGroupLevel: null,
              sortOrder: childDef.sortOrder,
              availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
              isSystem: true,
            };

            if (childPage) {
              Object.assign(childPage, childData);
              await childPage.save();
              console.log(`      ✏️  Updated child: ${childDef.displayName}`);
            } else {
              childPage = new Page(childData);
              await childPage.save();
              console.log(`      ✅ Created child: ${childDef.displayName}`);
            }
          }
        }
      }
    }
  }

  console.log('✅ HRM hierarchical seed complete!');
  await mongoose.disconnect();
}

seedHRMPages();
```

---

## Phase 4: Frontend UI Components (Day 3-4)

### 4.1 Hierarchy Tree Component

**File:** `react/src/components/hierarchy/PageHierarchyTree.tsx`

```typescript
import React from 'react';

interface HierarchyNode {
  _id: string;
  displayName: string;
  route: string | null;
  isMenuGroup: boolean;
  menuGroupLevel: number | null;
  level: number;
  depth: number;
  children?: HierarchyNode[];
  l2Groups?: HierarchyNode[];
  directChildren?: HierarchyNode[];
}

interface PageHierarchyTreeProps {
  data: HierarchyNode[];
  onNodeClick?: (node: HierarchyNode) => void;
}

const PageHierarchyTree: React.FC<PageHierarchyTreeProps> = ({ data, onNodeClick }) => {
  const renderNode = (node: HierarchyNode, depth: number = 0) => {
    const paddingLeft = `${depth * 20}px`;
    const isL1Group = node.isMenuGroup && node.menuGroupLevel === 1;
    const isL2Group = node.isMenuGroup && node.menuGroupLevel === 2;
    const isChild = !node.isMenuGroup;

    return (
      <div key={node._id} className="hierarchy-node">
        <div
          className="hierarchy-item d-flex align-items-center p-2"
          style={{ paddingLeft }}
          onClick={() => onNodeClick?.(node)}
        >
          <i className={`${node.icon} me-2`}></i>
          <span className={isL1Group ? 'fw-bold' : isL2Group ? 'fw-semibold text-muted' : ''}>
            {node.displayName}
          </span>
          {isL1Group && <span className="badge bg-primary ms-2">L1 Menu</span>}
          {isL2Group && <span className="badge bg-info ms-2">L2 Menu</span>}
          {node.route && <code className="small ms-2">{node.route}</code>}
        </div>

        {/* Render L2 groups */}
        {node.l2Groups && node.l2Groups.map(l2 => renderNode(l2, depth + 1))}

        {/* Render direct children */}
        {node.directChildren && node.directChildren.map(child => renderNode(child, depth + 1))}

        {/* Render children (generic) */}
        {node.children && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="page-hierarchy-tree">
      {data.map(category => renderNode(category, 0))}
    </div>
  );
};

export default PageHierarchyTree;
```

---

## Phase 5: Migration Script (Day 4)

### 5.1 Data Migration Script

**File:** `backend/seed/migrate-to-hierarchical.js`

```javascript
import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function migrateToHierarchical() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

  console.log('🔄 Starting migration to hierarchical structure...\n');

  // Step 1: Backup
  console.log('📦 Creating backup...');
  const backup = await Page.find({});
  console.log(`✅ Backed up ${backup.length} pages\n`);

  // Step 2: Category mapping
  const categoryMapping = {
    'super-admin': 'main-menu',
    'users-permissions': 'users-permissions',
    'dashboards': 'dashboards',
    'hrm': 'hrm',
    'recruitment': 'recruitment',
    'projects': 'projects',
    'crm': 'crm',
    'applications': 'applications',
    'finance': 'finance-accounts',
    'administration': 'administration',
    'content': 'pages',
    'reports': 'administration',
    'pages': 'pages',
    'auth': 'extras',
    'ui': 'extras',
    null: 'extras',
  };

  // Step 3: Migrate each page
  let migrated = 0;
  let errors = 0;

  for (const page of backup) {
    try {
      const oldCategory = page.moduleCategory || page._doc?.moduleCategory;
      const newLabel = categoryMapping[oldCategory] || 'extras';

      const newCategory = await PageCategory.findOne({ label: newLabel });
      if (!newCategory) {
        console.log(`⚠️  Category not found: ${newLabel}`);
        errors++;
        continue;
      }

      // Update page
      page.category = newCategory._id;
      page.parentPage = null; // Will be set later if needed
      page.level = 1;
      page.depth = 1;
      page.isMenuGroup = false;
      page.menuGroupLevel = null;
      page.hierarchyPath = [newCategory._id];

      await page.save();
      migrated++;

      if (migrated % 10 === 0) {
        console.log(`  Progress: ${migrated}/${backup.length}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating ${page.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Errors: ${errors}`);

  await mongoose.disconnect();
}

migrateToHierarchical();
```

---

## Phase 6: Testing & Validation (Day 5)

### 6.1 Validation Checklist

- [ ] 12 categories created
- [ ] HRM has 3 L2 menu groups
- [ ] All pages have correct level/depth
- [ ] hierarchyPath correctly calculated
- [ ] Recursive queries work
- [ ] UI displays 4-level hierarchy
- [ ] Can create L1 menu groups
- [ ] Can create L2 menu groups
- [ ] Cannot create L3 menu groups (max is 2)
- [ ] Parent-child relationships preserved
- [ ] All permissions still work

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| 12 Categories | ⏳ Pending |
| 23 Parent Menus (20 L1 + 3 L2) | ⏳ Pending |
| 4-Level Hierarchy Support | ⏳ Pending |
| Recursive Schema Fields | ⏳ Pending |
| UI Displays Hierarchy | ⏳ Pending |
| Migration Complete | ⏳ Pending |

---

**Status:** ✅ Plan Complete
**Requires Approval:** Yes
**Estimated Duration:** 5-7 days
