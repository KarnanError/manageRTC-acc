import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Footer from "../../core/common/footer";
import { all_routes } from "../router/all_routes";
import PageCategoriesModal from "./pageCategories";
import IconPicker from "../../core/common/icon-picker/IconPicker";

// API Base URL
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Types
interface PageCategory {
  _id: string;
  identifier: string;
  displayName: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
}

interface Page {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  route: string;
  icon: string;
  category?: PageCategory;
  parentPage?: {
    _id: string;
    displayName: string;
    name: string;
  };
  level: number;
  depth: number;
  isMenuGroup: boolean;
  menuGroupLevel?: 1 | 2 | null;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
  availableActions?: string[];
  featureFlags?: { enabledForAll?: boolean };
  l2Groups?: Page[];
  directChildren?: Page[];
  children?: Page[];
}

interface CategoryTree {
  _id: string;
  identifier: string;
  displayName: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
  l1MenuGroups: Page[];
  directChildren: Page[];
}

interface PageStats {
  totalPages: number;
  activePages: number;
  systemPages: number;
  customPages: number;
  byCategory: {
    _id: string;
    count: number;
  }[];
}

const ACTION_LABELS: Record<string, string> = {
  'all': 'All',
  'read': 'Read',
  'create': 'Create',
  'write': 'Write',
  'delete': 'Delete',
  'import': 'Import',
  'export': 'Export',
  'approve': 'Approve',
  'assign': 'Assign',
};

const Pages = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Categories and Pages
  const [categories, setCategories] = useState<PageCategory[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [stats, setStats] = useState<PageStats | null>(null);

  // Expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedL1, setExpandedL1] = useState<Set<string>>(new Set());
  const [expandedL2, setExpandedL2] = useState<Set<string>>(new Set());

  // Modal states
  const [showPageModal, setShowPageModal] = useState(false);
  const [pageMode, setPageMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [loadingPageDetails, setLoadingPageDetails] = useState(false);

  // Confirmation states
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteFinalConfirmModal, setShowDeleteFinalConfirmModal] = useState(false);
  const [confirmPageName, setConfirmPageName] = useState('');
  const [pendingDeletePage, setPendingDeletePage] = useState<{ id: string; displayName: string } | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Form state
  const [pageForm, setPageForm] = useState({
    name: '',
    displayName: '',
    description: '',
    route: '',
    icon: 'ti ti-file',
    category: '',
    parentPage: null as string | null,
    isMenuGroup: false,
    menuGroupLevel: null as 1 | 2 | null,
    sortOrder: 0,
    availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
    isSystem: false,
    enabledForAll: false,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchCategories();
    fetchTreeStructure();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rbac/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTreeStructure = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/rbac/pages/tree-structure`);
      const data = await response.json();
      if (data.success) {
        setCategoryTree(data.data);
        // Auto-expand first category
        if (data.data.length > 0) {
          setExpandedCategories(new Set([data.data[0]._id]));
        }
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rbac/pages/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleL1 = (l1Id: string) => {
    const newExpanded = new Set(expandedL1);
    if (newExpanded.has(l1Id)) {
      newExpanded.delete(l1Id);
    } else {
      newExpanded.add(l1Id);
    }
    setExpandedL1(newExpanded);
  };

  const toggleL2 = (l2Id: string) => {
    const newExpanded = new Set(expandedL2);
    if (newExpanded.has(l2Id)) {
      newExpanded.delete(l2Id);
    } else {
      newExpanded.add(l2Id);
    }
    setExpandedL2(newExpanded);
  };

  const handleToggleStatus = async (pageId: string) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/rbac/pages/${pageId}/toggle-status`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (data.success) {
        await fetchTreeStructure();
        await fetchStats();
      } else {
        alert(data.error || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to toggle status');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = (category?: PageCategory, parent?: Page) => {
    const defaultCategory = category?.label || 'main-menu';

    setPageForm({
      name: '',
      displayName: '',
      description: '',
      route: '',
      icon: 'ti ti-file',
      category: defaultCategory,
      parentPage: parent?._id || null,
      isMenuGroup: false,
      menuGroupLevel: null,
      sortOrder: 0,
      availableActions: ['read', 'create', 'write', 'delete', 'import', 'export'],
      isSystem: false,
      enabledForAll: false,
    });
    setSelectedPage(null);
    setPageMode('create');
    setShowPageModal(true);
  };

  const handleOpenEditModal = async (page: Page) => {
    setLoadingPageDetails(true);
    setPageMode('edit');
    setShowPageModal(true);

    // Fetch full page details from API
    try {
      const response = await fetch(`${API_BASE}/api/rbac/pages/${page._id}`);
      const data = await response.json();

      if (data.success && data.data) {
        const fullPage = data.data;
        setPageForm({
          name: fullPage.name,
          displayName: fullPage.displayName,
          description: fullPage.description || '',
          route: fullPage.route || '',
          icon: fullPage.icon || 'ti ti-file',
          category: fullPage.category?.label || '',
          parentPage: fullPage.parentPage?._id || null,
          isMenuGroup: fullPage.isMenuGroup || false,
          menuGroupLevel: fullPage.menuGroupLevel,
          sortOrder: fullPage.sortOrder,
          availableActions: fullPage.availableActions || ['read', 'create', 'write', 'delete', 'import', 'export'],
          isSystem: fullPage.isSystem || false,
          enabledForAll: fullPage.featureFlags?.enabledForAll || false,
        });
        setSelectedPage(fullPage);
      } else {
        alert('Failed to load page details');
        // Fall back to using the data from tree
        setPageForm({
          name: page.name,
          displayName: page.displayName,
          description: page.description || '',
          route: page.route || '',
          icon: page.icon || 'ti ti-file',
          category: page.category?.label || '',
          parentPage: page.parentPage?._id || null,
          isMenuGroup: page.isMenuGroup || false,
          menuGroupLevel: page.menuGroupLevel,
          sortOrder: page.sortOrder,
          availableActions: page.availableActions || [],
          isSystem: page.isSystem || false,
          enabledForAll: page.featureFlags?.enabledForAll || false,
        });
        setSelectedPage(page);
      }
    } catch (error) {
      console.error('Error fetching page details:', error);
      // Fall back to using the data from tree if API fails
      setPageForm({
        name: page.name,
        displayName: page.displayName,
        description: page.description || '',
        route: page.route || '',
        icon: page.icon || 'ti ti-file',
        category: page.category?.label || '',
        parentPage: page.parentPage?._id || null,
        isMenuGroup: page.isMenuGroup || false,
        menuGroupLevel: page.menuGroupLevel,
        sortOrder: page.sortOrder,
        availableActions: page.availableActions || [],
        isSystem: page.isSystem || false,
        enabledForAll: page.featureFlags?.enabledForAll || false,
      });
      setSelectedPage(page);
    } finally {
      setLoadingPageDetails(false);
    }
  };

  const handleOpenViewModal = async (page: Page) => {
    setLoadingPageDetails(true);
    setPageMode('view');
    setShowPageModal(true);
    setSelectedPage(page);

    // Fetch full page details from API
    try {
      const response = await fetch(`${API_BASE}/api/rbac/pages/${page._id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSelectedPage(data.data);
      }
    } catch (error) {
      console.error('Error fetching page details:', error);
      // Keep the original page data
    } finally {
      setLoadingPageDetails(false);
    }
  };

  const handleSavePage = async () => {
    // Show confirmation modal requiring page name to be typed
    setShowSaveConfirmModal(true);
    setConfirmPageName('');
  };

  const confirmSavePage = async () => {
    // Verify the user typed the correct page name
    const expectedName = pageMode === 'edit'
      ? selectedPage?.displayName || pageForm.displayName
      : pageForm.displayName;

    if (confirmPageName !== expectedName) {
      alert(`Page name doesn't match. Expected: "${expectedName}"`);
      return;
    }

    try {
      setSaving(true);
      setShowSaveConfirmModal(false);

      const url = pageMode === 'create'
        ? `${API_BASE}/api/rbac/pages`
        : `${API_BASE}/api/rbac/pages/${selectedPage?._id}`;
      const method = pageMode === 'create' ? 'POST' : 'PUT';

      // Find category ID from label
      const categoryObj = categories.find(c => c.label === pageForm.category);
      if (!categoryObj) {
        alert('Invalid category');
        return;
      }

      const { enabledForAll, ...restForm } = pageForm;
      const payload = {
        ...restForm,
        category: categoryObj._id,
        featureFlags: { enabledForAll },
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
        setShowPageModal(false);
        await fetchTreeStructure();
        await fetchStats();
      } else {
        alert(data.error || 'Failed to save page');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page');
    } finally {
      setSaving(false);
      setConfirmPageName('');
    }
  };

  const handleDeletePage = async (pageId: string, displayName: string) => {
    // Step 1: Show warning modal
    setPendingDeletePage({ id: pageId, displayName });
    setShowDeleteConfirmModal(true);
    setConfirmPageName('');
  };

  const proceedToDeleteConfirmation = () => {
    // Step 2: User acknowledged warning, now show final confirmation requiring page name
    setShowDeleteConfirmModal(false);
    setShowDeleteFinalConfirmModal(true);
  };

  const confirmDeletePage = async () => {
    // Step 3: Verify page name and show final confirmation
    if (!pendingDeletePage) return;

    if (confirmPageName !== pendingDeletePage.displayName) {
      alert(`Page name doesn't match. Expected: "${pendingDeletePage.displayName}"`);
      return;
    }

    // Step 4: Final confirmation
    if (!window.confirm(`FINAL WARNING: This will PERMANENTLY delete "${pendingDeletePage.displayName}". This action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?`)) {
      return;
    }

    try {
      setSaving(true);
      setShowDeleteFinalConfirmModal(false);

      const response = await fetch(`${API_BASE}/api/rbac/pages/${pendingDeletePage.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchTreeStructure();
        await fetchStats();
      } else {
        alert(data.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setSaving(false);
      setConfirmPageName('');
      setPendingDeletePage(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setShowDeleteFinalConfirmModal(false);
    setConfirmPageName('');
    setPendingDeletePage(null);
  };

  // Count pages in a category tree
  const countPagesInCategory = (catTree: CategoryTree): number => {
    let count = catTree.directChildren?.length || 0;
    catTree.l1MenuGroups?.forEach(l1 => {
      count += l1.directChildren?.length || 0;
      l1.l2Groups?.forEach(l2 => {
        count += l2.children?.length || 0;
      });
    });
    return count;
  };

  // Filter category tree by search term
  const filterCategoryTree = (catTree: CategoryTree): CategoryTree | null => {
    if (!searchTerm) return catTree;

    const searchLower = searchTerm.toLowerCase();

    // Filter direct children
    const filteredDirect = catTree.directChildren?.filter(child =>
      child.displayName.toLowerCase().includes(searchLower) ||
      child.name.toLowerCase().includes(searchLower) ||
      child.route?.toLowerCase().includes(searchLower)
    ) || [];

    // Filter L1 groups
    const filteredL1 = catTree.l1MenuGroups?.map(l1 => {
      // Filter direct children of L1
      const filteredL1Direct = l1.directChildren?.filter(child =>
        child.displayName.toLowerCase().includes(searchLower) ||
        child.name.toLowerCase().includes(searchLower) ||
        child.route?.toLowerCase().includes(searchLower)
      ) || [];

      // Filter L2 groups
      const filteredL2 = l1.l2Groups?.map(l2 => {
        const filteredL2Children = l2.children?.filter(child =>
          child.displayName.toLowerCase().includes(searchLower) ||
          child.name.toLowerCase().includes(searchLower) ||
          child.route?.toLowerCase().includes(searchLower)
        ) || [];

        // Include L2 if it has matching children or name matches
        const l2Match = l2.displayName.toLowerCase().includes(searchLower) ||
                      l2.name.toLowerCase().includes(searchLower);

        if (filteredL2Children.length > 0 || l2Match) {
          return { ...l2, children: filteredL2Children };
        }
        return null;
      }).filter(l2 => l2 !== null) || [];

      // Include L1 if it has matching content
      const l1Match = l1.displayName.toLowerCase().includes(searchLower) ||
                    l1.name.toLowerCase().includes(searchLower);

      if (filteredL1Direct.length > 0 || filteredL2.length > 0 || l1Match) {
        return {
          ...l1,
          directChildren: filteredL1Direct,
          l2Groups: filteredL2
        };
      }
      return null;
    }).filter(l1 => l1 !== null) || [];

    // Return filtered tree if it has any content
    if (filteredDirect.length > 0 || filteredL1.length > 0) {
      return {
        ...catTree,
        directChildren: filteredDirect,
        l1MenuGroups: filteredL1
      };
    }
    return null;
  };

  // ============================================================================
  // RENDERERS
  // ============================================================================

  const renderL2Group = (l2: Page, l1Page: Page, category: PageCategory) => (
    <React.Fragment key={l2._id}>
      {/* L2 Parent Menu Row */}
      <tr className="table-light bg-opacity-10">
        <td colSpan={8}>
          <div
            className="d-flex align-items-center p-2 cursor-pointer"
            style={{ paddingLeft: '48px' }}
            onClick={() => toggleL2(l2._id)}
          >
            <i className={`ti ti-chevron-${expandedL2.has(l2._id) ? 'down' : 'right'} me-2 text-muted`}></i>
            <i className={`${l2.icon} me-2 text-info`}></i>
            <span className="fw-semibold text-info">{l2.displayName}</span>
            <span className="badge bg-light text-dark ms-2">L2</span>
            <span className="badge bg-secondary ms-2">{l2.children?.length || 0} pages</span>
          </div>
        </td>
        <td style={{ width: '100px' }}>
          <div className="btn-group" role="group">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleOpenEditModal(l2)}
              title="Edit"
            >
              <i className="ti ti-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleOpenCreateModal(category, l1Page)}
              title="Add Child Page"
            >
              <i className="ti ti-plus"></i>
            </button>
          </div>
        </td>
      </tr>

      {/* L2 Children (expanded) */}
      {expandedL2.has(l2._id) && l2.children?.map((child) => (
        <tr key={child._id} className={!child.isActive ? 'table-light' : ''}>
          <td colSpan={8}>
            <div
              className="d-flex align-items-center p-2"
              style={{ paddingLeft: '72px' }}
            >
              <i className={`${child.icon} me-2 text-muted`}></i>
              <span className="me-2">{child.displayName}</span>
              {child.isSystem && <span className="badge bg-info ms-2">System</span>}
              {child.featureFlags?.enabledForAll && <span className="badge bg-success ms-2" title="Always accessible — no module or company restriction applies">Public</span>}
              {child.route && <code className="small text-muted ms-2">/{child.route}</code>}
            </div>
          </td>
          <td style={{ width: '100px' }}>
            <div className="btn-group" role="group">
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => handleOpenViewModal(child)}
              >
                <i className="ti ti-eye"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleOpenEditModal(child)}
                title={child.isSystem ? "Editing system pages may affect application behavior" : "Edit page"}
              >
                <i className="ti ti-edit"></i>
              </button>
              <button
                className="btn-sm btn-outline-danger"
                onClick={() => handleDeletePage(child._id, child.displayName)}
                title={child.isSystem ? "Deleting system pages may break application functionality" : "Delete page"}
              >
                <i className="ti ti-trash"></i>
              </button>
              <button
                className="btn-sm btn-outline-warning"
                onClick={() => handleToggleStatus(child._id)}
              >
                <i className="ti ti-power-off"></i>
              </button>
            </div>
          </td>
        </tr>
      ))}
    </React.Fragment>
  );

  const renderL1Group = (l1: Page, category: PageCategory) => (
    <React.Fragment key={l1._id}>
      {/* L1 Parent Menu Row */}
      <tr className="table-light">
        <td colSpan={8}>
          <div
            className="d-flex align-items-center p-2 cursor-pointer"
            style={{ paddingLeft: '24px' }}
            onClick={() => toggleL1(l1._id)}
          >
            <i className={`ti ti-chevron-${expandedL1.has(l1._id) ? 'down' : 'right'} me-2 text-muted`}></i>
            <i className={`${l1.icon} me-2 text-primary`}></i>
            <span className="fw-bold text-primary">{l1.displayName}</span>
            <span className="badge bg-light text-dark ms-2">L1 Menu</span>
            <span className="badge bg-secondary ms-2">
              {(l1.l2Groups?.length || 0) + (l1.directChildren?.length || 0)} items
            </span>
          </div>
        </td>
        <td style={{ width: '100px' }}>
          <div className="btn-group" role="group">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleOpenEditModal(l1)}
              title="Edit"
            >
              <i className="ti ti-edit"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleOpenCreateModal(category, l1)}
              title="Add Child"
            >
              <i className="ti ti-plus"></i>
            </button>
          </div>
        </td>
      </tr>

      {/* L1 Direct Children (no L2) */}
      {expandedL1.has(l1._id) && l1.directChildren?.map((child) => (
        <tr key={child._id} className={!child.isActive ? 'table-light' : ''}>
          <td colSpan={8}>
            <div
              className="d-flex align-items-center p-2"
              style={{ paddingLeft: '48px' }}
            >
              <i className={`${child.icon} me-2 text-muted`}></i>
              <span className="me-2">{child.displayName}</span>
              {child.isSystem && <span className="badge bg-info ms-2">System</span>}
              {child.featureFlags?.enabledForAll && <span className="badge bg-success ms-2" title="Always accessible — no module or company restriction applies">Public</span>}
              {child.route && <code className="small text-muted ms-2">/{child.route}</code>}
            </div>
          </td>
          <td style={{ width: '100px' }}>
            <div className="btn-group" role="group">
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => handleOpenViewModal(child)}
              >
                <i className="ti ti-eye"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleOpenEditModal(child)}
                title={child.isSystem ? "Editing system pages may affect application behavior" : "Edit page"}
              >
                <i className="ti ti-edit"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeletePage(child._id, child.displayName)}
                title={child.isSystem ? "Deleting system pages may break application functionality" : "Delete page"}
              >
                <i className="ti ti-trash"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => handleToggleStatus(child._id)}
              >
                <i className="ti ti-power"></i>
              </button>
            </div>
          </td>
        </tr>
      ))}

      {/* L2 Groups under this L1 */}
      {expandedL1.has(l1._id) && l1.l2Groups?.map((l2) =>
        renderL2Group(l2, l1, category)
      )}
    </React.Fragment>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Pages Management</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.superAdminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Super Admin</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Pages
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <button
                  className="btn btn-outline-primary d-flex align-items-center"
                  onClick={() => setShowCategoriesModal(true)}
                >
                  <i className="ti ti-folders me-1"></i> Manage Categories
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row">
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <span className="avatar avatar-lg bg-dark rounded-circle">
                        <i className="ti ti-file" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Total Pages</p>
                      <h4>{stats?.totalPages || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <span className="avatar avatar-lg bg-success rounded-circle">
                        <i className="ti ti-check" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Active Pages</p>
                      <h4>{stats?.activePages || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <span className="avatar avatar-lg bg-info rounded-circle">
                        <i className="ti ti-lock" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">System Pages</p>
                      <h4>{stats?.systemPages || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <span className="avatar avatar-lg bg-warning rounded-circle">
                        <i className="ti ti-file-description" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Custom Pages</p>
                      <h4>{stats?.customPages || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row align-items-center g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search pages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-6 text-end">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleOpenCreateModal()}
                  >
                    <i className="ti ti-plus me-2"></i> Add Page
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pages Tree Table */}
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Pages Hierarchy</h5>
              <span className="badge bg-primary">{stats?.totalPages || 0} pages</span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2">Loading...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Page Structure</th>
                        <th style={{ width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryTree.map((catTree) => {
                        const filteredCatTree = searchTerm ? filterCategoryTree(catTree) : catTree;
                        if (!filteredCatTree) return null;

                        const isExpanded = expandedCategories.has(catTree._id);
                        const pageCount = countPagesInCategory(filteredCatTree);

                        return (
                          <React.Fragment key={catTree._id}>
                            {/* Category Header */}
                            <tr className="table-light">
                              <td>
                                <div
                                  className="d-flex align-items-center p-2 cursor-pointer text-dark"
                                  onClick={() => toggleCategory(catTree._id)}
                                >
                                  <i className={`ti ti-chevron-${isExpanded ? 'down' : 'right'} me-2`}></i>
                                  <span className="badge bg-primary text-white me-2">{catTree.identifier}</span>
                                  <span className="fw-bold">{catTree.displayName}</span>
                                  <span className="badge bg-secondary text-white ms-2">{pageCount} pages</span>
                                </div>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-light me-1"
                                  onClick={() => handleOpenCreateModal(catTree)}
                                  title="Add Page to this Category"
                                >
                                  <i className="ti ti-plus"></i>
                                </button>
                              </td>
                            </tr>

                            {/* Category Content */}
                            {isExpanded && (
                              <>
                                {/* Direct Children of Category */}
                                {filteredCatTree.directChildren?.map((child) => (
                                  <tr key={child._id} className={!child.isActive ? 'table-light' : ''}>
                                    <td>
                                      <div className="d-flex align-items-center p-2">
                                        <i className={`${child.icon} me-2 text-muted`}></i>
                                        <span className="me-2">{child.displayName}</span>
                                        {child.isSystem && <span className="badge bg-info ms-2">System</span>}
                                        {child.featureFlags?.enabledForAll && <span className="badge bg-success ms-2" title="Always accessible — no module or company restriction applies">Public</span>}
                                        {child.route && <code className="small text-muted ms-2">/{child.route}</code>}
                                      </div>
                                    </td>
                                    <td className="text-end">
                                      <div className="btn-group" role="group">
                                        <button
                                          className="btn btn-sm btn-outline-light"
                                          onClick={() => handleOpenViewModal(child)}
                                        >
                                          <i className="ti ti-eye"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-primary"
                                          onClick={() => handleOpenEditModal(child)}
                                          title={child.isSystem ? "Editing system pages may affect application behavior" : "Edit page"}
                                        >
                                          <i className="ti ti-edit"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => handleDeletePage(child._id, child.displayName)}
                                          title={child.isSystem ? "Deleting system pages may break application functionality" : "Delete page"}
                                        >
                                          <i className="ti ti-trash"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-warning"
                                          onClick={() => handleToggleStatus(child._id)}
                                        >
                                          <i className="ti ti-power"></i>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}

                                {/* L1 Menu Groups */}
                                {filteredCatTree.l1MenuGroups?.map((l1) =>
                                  renderL1Group(l1, catTree)
                                )}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {categoryTree.every(cat => searchTerm ? !filterCategoryTree(cat) : false) && (
                        <tr>
                          <td colSpan={2} className="text-center py-5">
                            <i className="ti ti-file-off text-muted" style={{ fontSize: '48px' }}></i>
                            <p className="text-muted mt-2">No pages found matching "{searchTerm}"</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Page Modal */}
          {showPageModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {pageMode === 'create' && 'Add New Page'}
                      {pageMode === 'edit' && 'Edit Page'}
                      {pageMode === 'view' && 'View Page Details'}
                    </h5>
                    <button
                      type="button"
                      className="btn-close custom-btn-close"
                      onClick={() => setShowPageModal(false)}
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>

                  {loadingPageDetails ? (
                    <div className="modal-body text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="mt-2">Loading page details...</p>
                    </div>
                  ) : pageMode === 'view' ? (
                    <div className="modal-body">
                      <dl className="row">
                        <dt className="col-sm-4">Name:</dt>
                        <dd className="col-sm-8">
                          <code>{selectedPage?.name}</code>
                        </dd>

                        <dt className="col-sm-4">Display Name:</dt>
                        <dd className="col-sm-8">
                          {selectedPage?.icon && <i className={`${selectedPage.icon} me-2`}></i>}
                          {selectedPage?.displayName}
                        </dd>

                        <dt className="col-sm-4">Description:</dt>
                        <dd className="col-sm-8">{selectedPage?.description || '-'}</dd>

                        <dt className="col-sm-4">Route:</dt>
                        <dd className="col-sm-8">
                          {selectedPage?.route ? <code>/{selectedPage?.route}</code> : <span className="text-muted">No route (parent menu)</span>}
                        </dd>

                        <dt className="col-sm-4">Category:</dt>
                        <dd className="col-sm-8">
                          {selectedPage?.category ? (
                            <>
                              <span className="badge bg-secondary me-1">{selectedPage.category.identifier}</span>
                              {selectedPage.category.displayName}
                            </>
                          ) : '-'}
                        </dd>

                        <dt className="col-sm-4">Parent Page:</dt>
                        <dd className="col-sm-8">{selectedPage?.parentPage?.displayName || '-'}</dd>

                        <dt className="col-sm-4">Menu Group:</dt>
                        <dd className="col-sm-8">
                          {selectedPage?.isMenuGroup ? (
                            <span className="badge bg-info">
                              Level {selectedPage?.menuGroupLevel} (L{selectedPage?.menuGroupLevel})
                            </span>
                          ) : (
                            <span className="text-muted">No</span>
                          )}
                        </dd>

                        <dt className="col-sm-4">Hierarchy Level:</dt>
                        <dd className="col-sm-8">
                          Level {selectedPage?.level ?? 0}, Depth {selectedPage?.depth ?? 0}
                        </dd>

                        <dt className="col-sm-4">Icon Class:</dt>
                        <dd className="col-sm-8">
                          <code className="small">{selectedPage?.icon || 'ti ti-file'}</code>
                          {selectedPage?.icon && (
                            <span className="ms-2">
                              <i className={`${selectedPage.icon}`}></i> Preview
                            </span>
                          )}
                        </dd>

                        <dt className="col-sm-4">Available Actions:</dt>
                        <dd className="col-sm-8">
                          {selectedPage?.availableActions?.map(action => (
                            <span key={action} className="badge bg-secondary me-1">
                              {ACTION_LABELS[action] || action}
                            </span>
                          ))}
                        </dd>

                        <dt className="col-sm-4">Sort Order:</dt>
                        <dd className="col-sm-8">{selectedPage?.sortOrder}</dd>

                        <dt className="col-sm-4">Status:</dt>
                        <dd className="col-sm-8">
                          <span className={`badge ${selectedPage?.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {selectedPage?.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </dd>

                        <dt className="col-sm-4">System Page:</dt>
                        <dd className="col-sm-8">
                          {selectedPage?.isSystem ? (
                            <span className="badge bg-info">Yes</span>
                          ) : 'No'}
                        </dd>

                        <dt className="col-sm-4">Access:</dt>
                        <dd className="col-sm-8">
                          {(selectedPage as any)?.featureFlags?.enabledForAll ? (
                            <span className="badge bg-success" title="Always accessible — bypasses all module and company plan restrictions">
                              <i className="ti ti-lock-open me-1"></i>Public (Always On)
                            </span>
                          ) : (
                            <span className="badge bg-secondary">Plan-restricted</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSavePage(); }}>
                      <div className="modal-body">
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label">Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              value={pageForm.name}
                              onChange={(e) => setPageForm({ ...pageForm, name: e.target.value })}
                              placeholder="e.g., dashboard"
                              required
                              disabled={pageMode === 'edit'}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Display Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              value={pageForm.displayName}
                              onChange={(e) => setPageForm({ ...pageForm, displayName: e.target.value })}
                              placeholder="e.g., Dashboard"
                              required
                            />
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-12">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={pageForm.description}
                              onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })}
                              placeholder="Brief description of this page"
                            />
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-6">
                            <label className="form-label">Route *</label>
                            <input
                              type="text"
                              className="form-control"
                              value={pageForm.route}
                              onChange={(e) => setPageForm({ ...pageForm, route: e.target.value })}
                              placeholder="e.g., dashboard"
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Icon</label>
                            <div className="input-group">
                              <span className="input-group-text">
                                <i className={pageForm.icon || 'ti ti-file'}></i>
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                value={pageForm.icon ? pageForm.icon.replace('ti ti-', '').toUpperCase() : ''}
                                onChange={(e) => setPageForm({ ...pageForm, icon: e.target.value })}
                                placeholder="Choose an icon..."
                                readOnly
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowIconPicker(true)}
                              />
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => setShowIconPicker(true)}
                                title="Choose Icon"
                              >
                                <i className="ti ti-apps"></i>
                              </button>
                            </div>
                            <small className="text-muted">
                              {pageForm.icon && pageForm.icon !== 'ti ti-file' ? (
                                <span className="text-success">
                                  <i className="ti ti-check"></i> {pageForm.icon}
                                </span>
                              ) : (
                                'Click to browse icons'
                              )}
                            </small>
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-4">
                            <label className="form-label">Category *</label>
                            <select
                              className="form-select"
                              value={pageForm.category}
                              onChange={(e) => setPageForm({ ...pageForm, category: e.target.value })}
                              required
                            >
                              <option value="">Select Category</option>
                              {categories.map(cat => (
                                <option key={cat._id} value={cat.label}>
                                  {cat.identifier}. {cat.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Parent Page</label>
                            <select
                              className="form-select"
                              value={pageForm.parentPage || ''}
                              onChange={(e) => setPageForm({ ...pageForm, parentPage: e.target.value || null })}
                            >
                              <option value="">No Parent (Root Level)</option>
                              {categoryTree.flatMap(cat => [
                                ...(cat.directChildren || []),
                                ...(cat.l1MenuGroups || [])
                              ]).map(p => (
                                <option key={p._id} value={p._id}>
                                  {p.category?.identifier}. {p.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Sort Order</label>
                            <input
                              type="number"
                              className="form-control"
                              value={pageForm.sortOrder}
                              onChange={(e) => setPageForm({ ...pageForm, sortOrder: parseInt(e.target.value) || 0 })}
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-6">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={pageForm.isMenuGroup}
                                onChange={(e) => setPageForm({ ...pageForm, isMenuGroup: e.target.checked })}
                              />
                              <label className="form-label">Is Menu Group (Parent Menu)</label>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Menu Group Level</label>
                            <select
                              className="form-select"
                              value={pageForm.menuGroupLevel || ''}
                              onChange={(e) => setPageForm({ ...pageForm, menuGroupLevel: e.target.value ? parseInt(e.target.value) as 1 | 2 : null })}
                              disabled={!pageForm.isMenuGroup}
                            >
                              <option value="">Not a Menu Group</option>
                              <option value="1">Level 1 (L1)</option>
                              <option value="2">Level 2 (L2)</option>
                            </select>
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-12">
                            <label className="form-label">Available Actions</label>
                            <div className="row">
                              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                <div key={key} className="col-md-4 mb-2">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={pageForm.availableActions.includes(key)}
                                      onChange={(e) => {
                                        const allActionKeys = Object.keys(ACTION_LABELS);
                                        let newActions: string[];

                                        if (key === 'all') {
                                          // Toggle 'all' - if checked, add all actions; if unchecked, clear all
                                          if (e.target.checked) {
                                            newActions = allActionKeys; // Add all actions including 'all'
                                          } else {
                                            newActions = []; // Clear all
                                          }
                                        } else {
                                          // Toggle individual action
                                          if (e.target.checked) {
                                            // Adding an action
                                            const currentActions = pageForm.availableActions;
                                            if (currentActions.includes('all')) {
                                              // If 'all' is currently selected, remove 'all' and add all individual actions except this one
                                              newActions = allActionKeys.filter(a => a !== 'all');
                                            } else {
                                              // Just add this action
                                              newActions = [...pageForm.availableActions, key];
                                            }
                                          } else {
                                            // Removing an action
                                            newActions = pageForm.availableActions.filter(a => a !== key);
                                          }

                                          // Check if all individual actions are now selected (excluding 'all')
                                          const individualKeys = allActionKeys.filter(a => a !== 'all');
                                          const allIndividualSelected = individualKeys.every(a => newActions.includes(a));

                                          if (allIndividualSelected && !newActions.includes('all')) {
                                            // All individual actions selected, add 'all'
                                            newActions.push('all');
                                          } else if (!allIndividualSelected && newActions.includes('all')) {
                                            // Not all individual actions selected, remove 'all'
                                            newActions = newActions.filter(a => a !== 'all');
                                          }
                                        }

                                        setPageForm({ ...pageForm, availableActions: newActions });
                                      }}
                                    />
                                    <label className="form-check-label">{label}</label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="row mt-3">
                          <div className="col-md-6">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="enabledForAllCheck"
                                checked={pageForm.enabledForAll}
                                onChange={(e) => setPageForm({ ...pageForm, enabledForAll: e.target.checked })}
                              />
                              <label className="form-check-label" htmlFor="enabledForAllCheck">
                                <span className="fw-semibold">Public Access (Always On)</span>
                                <br />
                                <small className="text-muted">Bypasses all company plan and module restrictions. Use for login, register, etc.</small>
                              </label>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="isSystemCheck"
                                checked={pageForm.isSystem}
                                onChange={(e) => setPageForm({ ...pageForm, isSystem: e.target.checked })}
                              />
                              <label className="form-check-label" htmlFor="isSystemCheck">
                                <span className="fw-semibold">System Page</span>
                                <br />
                                <small className="text-muted">Core system page — editing or deleting may break functionality.</small>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-light me-2"
                          onClick={() => setShowPageModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Saving...
                            </>
                          ) : (
                            pageMode === 'create' ? 'Create Page' : 'Save Changes'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Confirmation Modal */}
          {showSaveConfirmModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {pageMode === 'create' ? 'Confirm Create Page' : 'Confirm Save Changes'}
                    </h5>
                    <button
                      type="button"
                      className="btn-close custom-btn-close"
                      onClick={() => {
                        setShowSaveConfirmModal(false);
                        setConfirmPageName('');
                      }}
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                  <div className="modal-body">
                    {pageMode === 'edit' && selectedPage?.isSystem && (
                      <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <i className="ti ti-alert-triangle fs-4 me-2"></i>
                        <div>
                          <strong>Warning:</strong> You are editing a system page. Changes may affect application behavior.
                        </div>
                      </div>
                    )}
                    <p>
                      {pageMode === 'create'
                        ? 'Are you sure you want to create this new page?'
                        : 'Are you sure you want to save changes to this page?'}
                    </p>
                    <p className="text-muted">
                      To confirm, please type the page display name: <strong>{pageMode === 'edit' ? selectedPage?.displayName || pageForm.displayName : pageForm.displayName}</strong>
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type the page display name to confirm"
                      value={confirmPageName}
                      onChange={(e) => setConfirmPageName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => {
                        setShowSaveConfirmModal(false);
                        setConfirmPageName('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={confirmSavePage}
                      disabled={confirmPageName !== (pageMode === 'edit' ? selectedPage?.displayName || pageForm.displayName : pageForm.displayName)}
                    >
                      Confirm & Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Warning Modal - Step 1 */}
          {showDeleteConfirmModal && pendingDeletePage && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">
                      <i className="ti ti-alert-triangle me-2"></i>
                      Delete Page Warning
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={cancelDelete}
                    >
                    </button>
                  </div>
                  <div className="modal-body">
                    {pendingDeletePage && (
                      <>
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                          <i className="ti ti-alert-triangle fs-4 me-2"></i>
                          <div>
                            <strong>Danger:</strong> You are about to delete a page!
                          </div>
                        </div>
                        <p>
                          You are about to delete the page: <strong>{pendingDeletePage.displayName}</strong>
                        </p>
                        <p className="text-muted">
                          This action requires multiple confirmation steps to prevent accidental deletion.
                        </p>
                        <ul>
                          <li>This may affect permissions and roles</li>
                          <li>This may affect navigation menus</li>
                          <li>This action is permanent</li>
                        </ul>
                      </>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={cancelDelete}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={proceedToDeleteConfirmation}
                    >
                      I Understand, Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Final Confirmation Modal - Step 2 */}
          {showDeleteFinalConfirmModal && pendingDeletePage && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">
                      <i className="ti ti-alert-circle me-2"></i>
                      Final Confirmation Required
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={cancelDelete}
                    >
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="ti ti-alert-circle fs-4 me-2"></i>
                      <div>
                        <strong>FINAL WARNING:</strong> This action CANNOT be undone!
                      </div>
                    </div>
                    <p>
                      To permanently delete <strong>{pendingDeletePage.displayName}</strong>,
                      please type the page display name below to confirm:
                    </p>
                    <p className="text-muted">
                      Type: <strong className="text-danger">{pendingDeletePage.displayName}</strong>
                    </p>
                    <input
                      type="text"
                      className="form-control border-danger"
                      placeholder="Type the page display name"
                      value={confirmPageName}
                      onChange={(e) => setConfirmPageName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={cancelDelete}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={confirmDeletePage}
                      disabled={confirmPageName !== pendingDeletePage.displayName}
                    >
                      <i className="ti ti-trash me-2"></i>
                      Permanently Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PageCategories Modal */}
          <PageCategoriesModal
            isOpen={showCategoriesModal}
            onClose={() => setShowCategoriesModal(false)}
            onCategoriesChange={fetchCategories}
          />

          {/* Icon Picker Modal */}
          <IconPicker
            isOpen={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            onSelect={(icon) => setPageForm({ ...pageForm, icon })}
            currentIcon={pageForm.icon}
          />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Pages;
