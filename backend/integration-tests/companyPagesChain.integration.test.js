/**
 * Integration Tests — Company → Plan → Module → Page chain
 *
 * Validates the full sidebar-filter data chain used by
 * GET /api/company/enabled-pages (companyPages.controller.js).
 *
 * Scenarios tested:
 *  A. Happy path  — all ObjectId refs correct → routes returned
 *  B. Bug (before fix) — planModules.moduleId stored as string → no routes
 *  C. Bug (before fix) — company.planId not set (only plan_id string) → no routes
 *  D. After fix script — planId set from plan_id → routes returned
 *  E. Module has pages but moduleId dangling ref → that module's routes excluded
 *  F. Page.isActive=false → route excluded
 *  G. planModule.isActive=false → module's routes excluded
 *
 * Run:
 *   npm test -- integration-tests/companyPagesChain.integration.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let Company, Plan, Module, Page, PageCategory;
let getEnabledPages; // controller function under test
let testCategoryId;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Import models & controller AFTER connection
  ({ Company, Plan } = await import('../models/superadmin/package.schema.js'));
  Module       = (await import('../models/rbac/module.schema.js')).default;
  Page         = (await import('../models/rbac/page.schema.js')).default;
  PageCategory = (await import('../models/rbac/pageCategory.schema.js')).default;

  // Create a shared category required by Page schema
  const cat = await PageCategory.create({
    identifier: 'INT', displayName: 'Integration', label: 'integration', sortOrder: 99,
  });
  testCategoryId = cat._id;

  // Import the pure business logic (extracted from controller for testability)
  // We test the controller function directly by constructing req/res objects
  ({ getEnabledPages } = await import('../controllers/rest/companyPages.controller.js'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Call getEnabledPages with a fake req / res and return the JSON body. */
async function callGetEnabledPages(companyId, role = 'hr') {
  let body;
  const req = {
    user: { companyId, role },
    query: { debug: '1' },  // enable debug output for richer assertions
  };
  const res = {
    json: (data) => { body = data; },
    status: (code) => ({ json: (data) => { body = { _status: code, ...data }; } }),
  };
  await getEnabledPages(req, res);
  return body;
}

async function createPage(overrides = {}) {
  return Page.create({
    name:        overrides.name        ?? `page-${Date.now()}`,
    displayName: overrides.displayName ?? 'Test Page',
    route:       overrides.route       ?? `/route-${Date.now()}`,
    icon:        'ti ti-file',
    category:    testCategoryId,        // required field
    isActive:    overrides.isActive    ?? true,
    isSystem:    false,
    sortOrder:   0,
  });
}

async function createModule(pages = [], overrides = {}) {
  return Module.create({
    name:        overrides.name        ?? `module-${Date.now()}`,
    displayName: overrides.displayName ?? 'Test Module',
    route:       overrides.route       ?? '/test',
    icon:        'ti ti-folder',
    color:       '#000',
    accessLevel: 'all',
    isActive:    overrides.isActive    ?? true,
    isSystem:    false,
    sortOrder:   0,
    pages:       pages.map((p, i) => ({
      pageId:      p._id,
      name:        p.name,
      displayName: p.displayName,
      route:       p.route,
      icon:        p.icon,
      sortOrder:   i,
      isActive:    true,
    })),
  });
}

async function createPlan(modules = [], overrides = {}) {
  return Plan.create({
    planName:         overrides.planName         ?? `Plan-${Date.now()}`,
    planType:         'Monthly',
    price:            99,
    planPosition:     '1',
    planCurrency:     'USD',
    planCurrencytype: 'fixed',
    discountType:     'none',
    discount:         0,
    limitationsInvoices: 100,
    maxCustomers:     50,
    product:          10,
    supplier:         5,
    accessTrial:      false,
    trialDays:        0,
    isRecommended:    false,
    status:           'Active',
    description:      'Test plan',
    logo:             'test-logo.png',
    planModules: modules.map((m) => ({
      moduleId:          m._id,
      moduleName:        m.name,
      moduleDisplayName: m.displayName,
      isActive:          true,
    })),
  });
}

async function createCompany(planId, overrides = {}) {
  return Company.create({
    name:    overrides.name   ?? `Company-${Date.now()}`,
    email:   `test-${Date.now()}@co.com`,
    domain:  `domain-${Date.now()}.com`,
    phone:   '000',
    website: 'http://test.com',
    address: '123 Test St',
    planId:  planId,       // Mongoose ObjectId ref
    status:  'Active',
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// A. Happy Path
// ══════════════════════════════════════════════════════════════════════════════

describe('A — Happy path (all ObjectId refs correct)', () => {
  it('returns the routes from the company plan modules', async () => {
    const page1 = await createPage({ route: '/employees' });
    const page2 = await createPage({ route: '/departments' });
    const mod   = await createModule([page1, page2]);
    const plan  = await createPlan([mod]);
    const co    = await createCompany(plan._id);

    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    expect(body.data.allEnabled).toBe(false);
    expect(body.data.routes).toContain('/employees');
    expect(body.data.routes).toContain('/departments');
  });

  it('superadmin always gets allEnabled=true regardless of company', async () => {
    const body = await callGetEnabledPages('any-id', 'superadmin');
    expect(body.success).toBe(true);
    expect(body.data.allEnabled).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// B. Mongoose 8 behaviour: moduleId stored as string is still populate-able
//    because Mongoose 8 auto-casts string values to ObjectId when populating
//    a field whose schema type is ObjectId.  The normalizeModuleIds() fix we
//    applied is still good practice (ensures clean DB storage), but it is no
//    longer required to make populate work in Mongoose 8.
// ══════════════════════════════════════════════════════════════════════════════

describe('B — Mongoose 8: string moduleId is auto-cast by populate', () => {
  it('still returns routes when moduleId is a raw string (Mongoose 8 auto-casts)', async () => {
    const page = await createPage({ route: '/broken-route' });
    const mod  = await createModule([page]);
    const plan = await createPlan([]);  // start clean

    // Write a string moduleId using the raw collection to bypass Mongoose casting.
    // In Mongoose 8, populate() will cast this string back to ObjectId for the
    // lookup, so the module IS found and routes ARE returned.
    await Plan.collection.updateOne(
      { _id: plan._id },
      {
        $set: {
          planModules: [{
            moduleId:          mod._id.toString(),   // STRING — not BSON ObjectId
            moduleName:        mod.name,
            moduleDisplayName: mod.displayName,
            isActive:          true,
          }],
        },
      }
    );

    const co   = await createCompany(plan._id);
    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    // Mongoose 8 auto-casts: routes are returned even with string-stored refs.
    // (Older Mongoose versions would have silently returned null and 0 routes.)
    expect(body.data.routes).toContain('/broken-route');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// C. Before-fix scenario: company.planId not set (only legacy plan_id string)
// ══════════════════════════════════════════════════════════════════════════════

describe('C — Before fix: company.planId not set', () => {
  it('returns reason=No plan assigned when planId is missing', async () => {
    const page = await createPage({ route: '/no-plan-route' });
    const mod  = await createModule([page]);
    const plan = await createPlan([mod]);

    // Create company WITHOUT planId (only legacy plan_id string)
    const co = await Company.create({
      name:    `NoPlanId-${Date.now()}`,
      email:   `noplanid-${Date.now()}@co.com`,
      domain:  `noplanid-${Date.now()}.com`,
      phone:   '000',
      website: 'http://test.com',
      address: '123 Test St',
      plan_id: plan._id.toString(),  // string only — planId ObjectId NOT set
      status:  'Active',
    });

    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    expect(body.data.allEnabled).toBe(false);
    expect(body.data.reason).toMatch(/no plan/i);
    expect(body.data.routes).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// D. After fix script: planId set from plan_id → routes returned
// ══════════════════════════════════════════════════════════════════════════════

describe('D — After fix script: planId populated from plan_id', () => {
  it('returns routes after planId ObjectId is set via migration', async () => {
    const page = await createPage({ route: '/after-fix-route' });
    const mod  = await createModule([page]);
    const plan = await createPlan([mod]);

    // Create company with plan_id string only (simulates legacy create)
    const co = await Company.create({
      name:    `FixedCompany-${Date.now()}`,
      email:   `fixed-${Date.now()}@co.com`,
      domain:  `fixed-${Date.now()}.com`,
      phone:   '000',
      website: 'http://test.com',
      address: '123 Test St',
      plan_id: plan._id.toString(),
      status:  'Active',
    });

    // Simulate what fixCompanyPlanRefs.js --fix does
    await Company.updateOne(
      { _id: co._id },
      { $set: { planId: new mongoose.Types.ObjectId(plan._id.toString()) } }
    );

    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    expect(body.data.routes).toContain('/after-fix-route');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// E. Dangling module ref → that module excluded, others remain
// ══════════════════════════════════════════════════════════════════════════════

describe('E — Dangling module ref is excluded gracefully', () => {
  it('skips a module whose moduleId does not exist, returns routes from valid ones', async () => {
    const page1 = await createPage({ route: '/valid-module-route' });
    const mod   = await createModule([page1]);
    const plan  = await createPlan([mod]);

    // Inject a second planModule with a ghost moduleId
    await Plan.updateOne(
      { _id: plan._id },
      {
        $push: {
          planModules: {
            moduleId:          new mongoose.Types.ObjectId(), // ghost — not in DB
            moduleName:        'ghost',
            moduleDisplayName: 'Ghost Module',
            isActive:          true,
          },
        },
      }
    );

    const co   = await createCompany(plan._id);
    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    expect(body.data.routes).toContain('/valid-module-route');
    // Ghost module contributes nothing (no crash)
    expect(body.data.routes).not.toContain(undefined);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// F. Page.isActive=false → route excluded
// ══════════════════════════════════════════════════════════════════════════════

describe('F — Inactive page route is excluded', () => {
  it('does not include route from an inactive page', async () => {
    const activePage   = await createPage({ route: '/active-route',   isActive: true });
    const inactivePage = await createPage({ route: '/inactive-route', isActive: false });
    const mod  = await createModule([activePage, inactivePage]);
    const plan = await createPlan([mod]);
    const co   = await createCompany(plan._id);

    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    expect(body.data.routes).toContain('/active-route');
    expect(body.data.routes).not.toContain('/inactive-route');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// G. planModule.isActive=false → entire module skipped
// ══════════════════════════════════════════════════════════════════════════════

describe('G — Inactive planModule is skipped', () => {
  it('excludes routes from a planModule whose isActive=false', async () => {
    const page = await createPage({ route: '/inactive-module-route' });
    const mod  = await createModule([page]);
    const plan = await Plan.create({
      planName:         `InactiveMod-${Date.now()}`,
      planType:         'Monthly',
      price:            49,
      planPosition:     '1',
      planCurrency:     'USD',
      planCurrencytype: 'fixed',
      discountType:     'none',
      discount:         0,
      limitationsInvoices: 100,
      maxCustomers:     50,
      product:          10,
      supplier:         5,
      accessTrial:      false,
      trialDays:        0,
      isRecommended:    false,
      status:           'Active',
      description:      'Test',
      logo:             'test-logo.png',
      planModules: [{
        moduleId:          mod._id,
        moduleName:        mod.name,
        moduleDisplayName: mod.displayName,
        isActive:          false,   // ← disabled
      }],
    });

    const co   = await createCompany(plan._id);
    const body = await callGetEnabledPages(co._id.toString());

    expect(body.success).toBe(true);
    expect(body.data.routes).not.toContain('/inactive-module-route');
    expect(body.data.routes).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// H. No company found for given companyId
// ══════════════════════════════════════════════════════════════════════════════

describe('H — Company not found', () => {
  it('returns allEnabled=false with reason when company does not exist', async () => {
    const ghostId = new mongoose.Types.ObjectId().toString();
    const body    = await callGetEnabledPages(ghostId);

    expect(body.success).toBe(true);
    expect(body.data.allEnabled).toBe(false);
    expect(body.data.reason).toMatch(/company not found/i);
  });

  it('returns allEnabled=false with reason when companyId is null', async () => {
    const body = await callGetEnabledPages(null);

    expect(body.success).toBe(true);
    expect(body.data.allEnabled).toBe(false);
    expect(body.data.reason).toMatch(/no company/i);
  });
});
