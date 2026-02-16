# Pages Structure Implementation Plan

**Plan Version:** 1.0
**Created:** 2026-02-14
**Status:** Ready for Implementation
**Estimated Duration:** 3-5 days

---

## Overview

This plan outlines the phase-by-phase implementation to migrate the current flat Pages structure to the hierarchical structure defined in `page.md`, including parent-child menu relationships and category management.

---

## Phase 1: Schema Foundation (Day 1 - Morning)

### 1.1 Create PageCategory Schema

**File:** `backend/models/rbac/pageCategory.schema.js`

```javascript
import mongoose from 'mongoose';

const pageCategorySchema = new mongoose.Schema({
  // Numeric/Roman identifier (I, II, III, etc.)
  identifier: {
    type: String,
    required: true,
    unique: true,
  },

  // Display name (Main Menu, Users & Permissions, etc.)
  displayName: {
    type: String,
    required: true,
    unique: true,
  },

  // URL-friendly label (main-menu, users-permissions, etc.)
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

  // Icon (Tabler icon class)
  icon: {
    type: String,
    default: 'ti ti-folder',
  },

  // Sort order for display
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

// Indexes
pageCategorySchema.index({ identifier: 1 }, { unique: true });
pageCategorySchema.index({ label: 1 }, { unique: true });
pageCategorySchema.index({ sortOrder: 1 });
pageCategorySchema.index({ isActive: 1 });

export default mongoose.models.PageCategory || mongoose.model('PageCategory', pageCategorySchema);
```

### 1.2 Update Page Schema

**File:** `backend/models/rbac/page.schema.js`

**Changes:**
```javascript
// Add new field
category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'PageCategory',
  required: true,
},

// Add flag for parent menu groups
isMenuGroup: {
  type: Boolean,
  default: false,
},

// Update existing fields
// Change moduleCategory from enum string to ObjectId reference
// Keep moduleCategory for backward compatibility but deprecate

// Deprecation notice
moduleCategoryDeprecated: {
  type: String,
  enum: ['super-admin', 'users-permissions', 'applications', 'hrm', 'projects',
         'crm', 'recruitment', 'finance', 'administration', 'content',
         'pages', 'auth', 'ui', 'extras', 'dashboards', 'reports', null],
}
```

### 1.3 Create Category Service

**File:** `backend/services/rbac/pageCategory.service.js`

```javascript
import PageCategory from '../models/rbac/pageCategory.schema.js';

export const pageCategoryService = {
  async getAll(filters = {}) {
    const query = {};
    if (filters.activeOnly) query.isActive = true;
    return await PageCategory.find(query).sort({ sortOrder: 1 });
  },

  async getById(id) {
    return await PageCategory.findById(id);
  },

  async create(data) {
    const category = new PageCategory(data);
    await category.save();
    return category;
  },

  async update(id, data) {
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
    const Page = mongoose.model('Page');
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

## Phase 2: API Endpoints (Day 1 - Afternoon)

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

### 2.2 Update Page Routes for Hierarchy

**File:** `backend/routes/api/rbac/pages.routes.js`

**Updates:**
```javascript
// GET /api/rbac/pages/tree - Get hierarchical tree
router.get('/tree', async (req, res, next) => {
  try {
    const tree = await Page.getPageTree();
    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/menu-groups - Get parent menu groups only
router.get('/menu-groups', async (req, res, next) => {
  try {
    const menuGroups = await Page.find({
      isMenuGroup: true,
      isActive: true
    }).populate('category').sort({ sortOrder: 1 });
    res.json({ success: true, data: menuGroups });
  } catch (error) {
    next(error);
  }
});

// GET /api/rbac/pages/by-parent/:parentId - Get children of a parent
router.get('/by-parent/:parentId', async (req, res, next) => {
  try {
    const children = await Page.find({
      parentPage: req.params.parentId,
      isActive: true
    }).sort({ sortOrder: 1 });
    res.json({ success: true, data: children });
  } catch (error) {
    next(error);
  }
});
```

---

## Phase 3: Seed Data (Day 2 - Morning)

### 3.1 Create Category Seed

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
  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

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

  await mongoose.disconnect();
}

seedCategories();
```

### 3.2 Create Hierarchical Page Seed

**File:** `backend/seed/pagesHierarchical.seed.js`

```javascript
import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

// Get categories by label
const getCategoryId = async (label) => {
  const cat = await PageCategory.findOne({ label });
  return cat?._id;
};

// HRM Example Structure
const hrmPages = [
  // Parent Menu: Employees
  {
    name: 'hrm.employees-menu',
    displayName: 'Employees',
    description: 'Employee Management',
    route: null,  // No route for parent menu
    icon: 'ti ti-users',
    isMenuGroup: true,
    sortOrder: 10,
  },
  // Children
  {
    name: 'hrm.employees-list',
    displayName: 'Employees List',
    description: 'Employees List',
    route: '/employees',
    icon: 'ti ti-users',
    isMenuGroup: false,
    sortOrder: 10,
    parentMenu: 'hrm.employees-menu',
  },
  {
    name: 'hrm.departments',
    displayName: 'Department',
    description: 'Department Management',
    route: '/departments',
    icon: 'ti ti-building-arch',
    isMenuGroup: false,
    sortOrder: 20,
    parentMenu: 'hrm.employees-menu',
  },
  {
    name: 'hrm.designations',
    displayName: 'Designation',
    description: 'Designation/Job Titles',
    route: '/designations',
    icon: 'ti ti-badge',
    isMenuGroup: false,
    sortOrder: 30,
    parentMenu: 'hrm.employees-menu',
  },
  {
    name: 'hrm.policies',
    displayName: 'Policies',
    description: 'Company Policies',
    route: '/policy',
    icon: 'ti ti-file-description',
    isMenuGroup: false,
    sortOrder: 40,
    parentMenu: 'hrm.employees-menu',
  },
  // ... more pages
];

async function seedHierarchicalPages() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

  const hrmCategoryId = await getCategoryId('hrm');

  for (const pageDef of hrmPages) {
    // Handle parent page reference
    let parentPageId = null;
    if (pageDef.parentMenu) {
      const parent = await Page.findOne({ name: pageDef.parentMenu });
      if (parent) parentPageId = parent._id;
      delete pageDef.parentMenu;
    }

    const pageData = {
      ...pageDef,
      category: hrmCategoryId,
      parentPage: parentPageId,
    };

    let page = await Page.findOne({ name: pageDef.name });
    if (page) {
      Object.assign(page, pageData);
      await page.save();
      console.log(`✏️  Updated: ${pageDef.displayName}`);
    } else {
      page = new Page(pageData);
      await page.save();
      console.log(`✅ Created: ${pageDef.displayName}`);
    }
  }

  await mongoose.disconnect();
}

seedHierarchicalPages();
```

---

## Phase 4: Frontend UI - Category Management (Day 2 - Afternoon)

### 4.1 Create Category Management Component

**File:** `react/src/feature-module/super-admin/pageCategories.tsx`

```typescript
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";

interface PageCategory {
  _id: string;
  identifier: string;
  displayName: string;
  label: string;
  description?: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
}

const PageCategories = () => {
  const [categories, setCategories] = useState<PageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCategory, setSelectedCategory] = useState<PageCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    identifier: '',
    displayName: '',
    label: '',
    description: '',
    icon: 'ti ti-folder',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rbac/categories`);
      const data = await response.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Implementation
  };

  const handleDelete = async (id: string) => {
    // Implementation
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Page Categories</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Super Admin</li>
                <li className="breadcrumb-item active">Categories</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Categories ({categories.length})</h5>
            <button
              className="btn btn-primary"
              onClick={() => {
                setFormData({
                  identifier: '',
                  displayName: '',
                  label: '',
                  description: '',
                  icon: 'ti ti-folder',
                  sortOrder: 0,
                });
                setMode('create');
                setShowModal(true);
              }}
            >
              <i className="ti ti-plus me-1"></i> Add Category
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Identifier</th>
                    <th>Display Name</th>
                    <th>Label</th>
                    <th>Description</th>
                    <th className="text-center">Sort</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat._id}>
                      <td><span className="badge bg-primary">{cat.identifier}</span></td>
                      <td className="fw-medium">{cat.displayName}</td>
                      <td><code className="small">{cat.label}</code></td>
                      <td>{cat.description || '-'}</td>
                      <td className="text-center">{cat.sortOrder}</td>
                      <td className="text-center">
                        <span className={`badge ${cat.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setFormData({
                              identifier: cat.identifier,
                              displayName: cat.displayName,
                              label: cat.label,
                              description: cat.description || '',
                              icon: cat.icon,
                              sortOrder: cat.sortOrder,
                            });
                            setMode('edit');
                            setShowModal(true);
                          }}
                          disabled={cat.isSystem}
                        >
                          <i className="ti ti-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(cat._id)}
                          disabled={cat.isSystem}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageCategories;
```

### 4.2 Update Pages.tsx for Categories and Hierarchy

**Key changes:**
1. Add "Manage Categories" button
2. Update page form to select category (dropdown from PageCategory collection)
3. Add "Parent Menu" selector for child pages
4. Display hierarchy in table (indented child pages)

---

## Phase 5: Data Migration Script (Day 3 - Morning)

### 5.1 Migration Script

**File:** `backend/seed/migrate-pages-structure.js`

```javascript
import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function migratePages() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE || 'AmasQIS'
  });

  console.log('🔄 Starting pages migration...');

  // Step 1: Backup existing data
  const existingPages = await Page.find({});
  console.log(`📦 Found ${existingPages.length} existing pages`);

  // Step 2: Create a mapping of old categories to new labels
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
    'reports': 'administration', // Reports go under Administration
    null: 'extras',
  };

  // Step 3: Migrate each page
  for (const page of existingPages) {
    const oldCategory = page.moduleCategory;
    const newLabel = categoryMapping[oldCategory] || 'extras';

    const newCategory = await PageCategory.findOne({ label: newLabel });
    if (!newCategory) {
      console.log(`⚠️  Category not found: ${newLabel}`);
      continue;
    }

    // Update page with new category
    page.category = newCategory._id;
    // Keep old moduleCategory for reference
    page.moduleCategoryDeprecated = oldCategory;

    await page.save();
    console.log(`✅ Migrated: ${page.displayName} -> ${newLabel}`);
  }

  console.log('✅ Migration complete!');
  await mongoose.disconnect();
}

migratePages();
```

---

## Phase 6: Testing & Validation (Day 3 - Afternoon)

### 6.1 Validation Checklist

- [ ] All 12 categories created
- [ ] All categories have correct identifiers (I-XII)
- [ ] All pages linked to categories
- [ ] Parent menu groups created (20 total)
- [ ] Child pages linked to parents
- [ ] API endpoints return correct data
- [ ] UI displays hierarchy correctly
- [ ] Category management works (CRUD)
- [ ] Can add new categories via UI
- [ ] Cannot delete system categories
- [ ] Page permissions still work
- [ ] All 130 pages from page.md are present

### 6.2 Rollback Plan

If migration fails:
1. Restore from backup created during migration
2. Revert schema changes
3. Deploy previous version

---

## Phase 7: Cleanup & Documentation (Day 4)

### 7.1 Cleanup Tasks

1. Remove deprecated `moduleCategory` field after verification
2. Update all references to use `category` ObjectId
3. Add API documentation
4. Update RBAC documentation

### 7.2 Documentation Updates

1. Update `.ferb/docs/docs_output/RBAC/README.md`
2. Add category management section
3. Document parent-child relationship pattern
4. Create migration guide for future developers

---

## Success Criteria

### Phase Completion

| Phase | Criteria | Status |
|-------|----------|--------|
| 1 | Schema created and tested | ⏳ Pending |
| 2 | API endpoints functional | ⏳ Pending |
| 3 | Seed data created | ⏳ Pending |
| 4 | UI components built | ⏳ Pending |
| 5 | Migration successful | ⏳ Pending |
| 6 | All tests pass | ⏳ Pending |
| 7 | Documentation updated | ⏳ Pending |

### Overall Success

- [ ] 12 categories in database
- [ ] 130+ pages with proper category references
- [ ] 20 parent menu groups
- [ ] UI can manage categories
- [ ] Parent-child hierarchy visible in UI
- [ ] No data loss during migration
- [ ] All permissions functional

---

**Implementation Ready:** Yes ✅
**Requires Approval:** Yes - Schema changes need approval
**Estimated Completion:** 3-5 days
