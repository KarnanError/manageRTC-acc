/**
 * Edge-Case Tests — ObjectId null / string poisoning
 *
 * Reproduces every known variant of the "Cast to ObjectId failed for value 'null'"
 * class of bugs across three layers:
 *
 *  Layer 1 — Frontend logic  (resolveModulePageId equivalent, pure JS)
 *  Layer 2 — Backend service (configureModulePages / addPageToModule)
 *  Layer 3 — DB write guard  (normalizeModuleIds in packages.services.js)
 *
 * Run:
 *   npm test -- edge-cases/objectIdNullFix.edgecases.test.js
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';

// ─── Layer 1: pure JS — mirrors the fixed resolveModulePageId ─────────────────

/**
 * Exact replica of the FIXED resolveModulePageId from modules.tsx
 * (compiled to plain JS for backend testing without React/TS toolchain).
 */
function resolveModulePageId(mp) {
  const raw = mp.pageId;
  if (raw === null || raw === undefined) return null;
  const id = typeof raw === 'object' ? String(raw._id) : String(raw);
  return id && id !== 'null' && id !== 'undefined' ? id : null;
}

describe('Layer 1 — resolveModulePageId (fixed frontend logic)', () => {
  it('returns null when pageId is null', () => {
    expect(resolveModulePageId({ pageId: null })).toBeNull();
  });

  it('returns null when pageId is undefined', () => {
    expect(resolveModulePageId({ pageId: undefined })).toBeNull();
  });

  it('returns null when pageId is the string "null"', () => {
    expect(resolveModulePageId({ pageId: 'null' })).toBeNull();
  });

  it('returns null when pageId is the string "undefined"', () => {
    expect(resolveModulePageId({ pageId: 'undefined' })).toBeNull();
  });

  it('returns the string id when pageId is a valid hex string', () => {
    const id = new ObjectId().toHexString();
    expect(resolveModulePageId({ pageId: id })).toBe(id);
  });

  it('returns string of _id when pageId is a Mongoose-populated object', () => {
    const id  = new ObjectId();
    const obj = { _id: id, name: 'page', route: '/test' };
    expect(resolveModulePageId({ pageId: obj })).toBe(String(id));
  });

  it('returns null when pageId is an object whose _id is null', () => {
    expect(resolveModulePageId({ pageId: { _id: null } })).toBeNull();
  });

  it('returns null when pageId is an object whose _id is undefined', () => {
    expect(resolveModulePageId({ pageId: { _id: undefined } })).toBeNull();
  });

  it('BEFORE-FIX: string(null) used to produce "null" — regression guard', () => {
    // The old buggy code:  typeof null==='object' && null!==null → false → String(null)='null'
    // Verify the old path would have produced 'null'
    const raw = null;
    const oldBuggyResult = (typeof raw === 'object' && raw !== null)
      ? String(raw._id)
      : String(raw); // ← String(null) === 'null'
    expect(oldBuggyResult).toBe('null'); // proves the old bug existed

    // Verify the new code returns null instead
    expect(resolveModulePageId({ pageId: null })).toBeNull();
  });
});

// ─── Layer 2: backend service calls ───────────────────────────────────────────

let mongoServer;
let configureModulePages, addPageToModule;
let Module, Page, PageCategory;
let testCategoryId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  ({ configureModulePages, addPageToModule } = await import('../services/rbac/module.service.js'));
  Module       = (await import('../models/rbac/module.schema.js')).default;
  Page         = (await import('../models/rbac/page.schema.js')).default;
  PageCategory = (await import('../models/rbac/pageCategory.schema.js')).default;

  const cat = await PageCategory.create({
    identifier: 'EDGE', displayName: 'Edge Cases', label: 'edge', sortOrder: 99,
  });
  testCategoryId = cat._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function freshModule() {
  return Module.create({
    name:        `m-${Date.now()}`,
    displayName: 'Edge Module',
    route:       '/edge',
    icon:        'ti ti-folder',
    color:       '#000',
    accessLevel: 'all',
    isActive:    true,
    isSystem:    false,
    sortOrder:   0,
    pages:       [],
  });
}

async function freshPage(route) {
  return Page.create({
    category: testCategoryId,
    name:        `p-${Date.now()}`,
    displayName: 'Edge Page',
    route:       route ?? `/edge-${Date.now()}`,
    icon:        'ti ti-file',
    isActive:    true,
    isSystem:    false,
    sortOrder:   0,
  });
}

describe('Layer 2 — configureModulePages edge cases', () => {
  it('does not throw when pages array contains null', async () => {
    const mod = await freshModule();
    await expect(
      configureModulePages(mod._id.toString(), [null, undefined])
    ).resolves.not.toThrow();
  });

  it('does not throw when pages array contains objects with null pageId', async () => {
    const mod = await freshModule();
    const result = await configureModulePages(mod._id.toString(), [
      { pageId: null },
      { pageId: 'null' },
      { pageId: '' },
    ]);
    expect(result.success).toBe(true);
  });

  it('does not throw for a 12-byte non-ObjectId string', async () => {
    const mod    = await freshModule();
    const result = await configureModulePages(mod._id.toString(), [
      { pageId: 'short' },        // < 12 bytes
      { pageId: 'exactly12byt' }, // 12 chars — mongoose may try to cast
    ]);
    expect(result.success).toBe(true);
  });

  it('correctly saves only valid pages from a poisoned array', async () => {
    const mod  = await freshModule();
    const page = await freshPage('/poisoned-valid');

    const result = await configureModulePages(mod._id.toString(), [
      { pageId: null },
      { pageId: 'null' },
      { pageId: new ObjectId().toHexString() }, // valid id but page doesn't exist
      { pageId: page._id.toString(), isActive: true },
    ]);

    expect(result.success).toBe(true);
    expect(result.data.pages).toHaveLength(1);
    expect(result.data.pages[0].route).toBe('/poisoned-valid');
  });
});

describe('Layer 2 — addPageToModule edge cases', () => {
  const badIds = [null, undefined, 'null', 'undefined', '', '   ', 'not-an-id', '12345'];

  for (const bad of badIds) {
    it(`rejects pageId=${JSON.stringify(bad)} without crashing`, async () => {
      const mod    = await freshModule();
      const result = await addPageToModule(mod._id.toString(), { pageId: bad });
      expect(result.success).toBe(false);
      // Should be a clean validation error, not an uncaught mongoose cast error
      expect(typeof result.error).toBe('string');
      expect(result.error).not.toMatch(/cast to objectid/i);
    });
  }
});

// ─── Layer 3: normalizeModuleIds (packages.services.js) ───────────────────────

describe('Layer 3 — normalizeModuleIds DB-write guard', () => {
  /**
   * We test the guard by checking that valid ObjectId strings become BSON ObjectIds
   * and that invalid/null values do NOT cause ObjectId cast errors.
   */

  // Inline a minimal copy of normalizeModuleIds for pure-unit testing
  function normalizeModuleIds(planModules) {
    if (!Array.isArray(planModules)) return [];
    return planModules.map(pm => ({
      ...pm,
      moduleId: pm.moduleId && ObjectId.isValid(pm.moduleId)
        ? new ObjectId(pm.moduleId)
        : pm.moduleId,
    }));
  }

  it('converts 24-hex string to BSON ObjectId', () => {
    const hex = new ObjectId().toHexString();
    const [result] = normalizeModuleIds([{ moduleId: hex }]);
    expect(result.moduleId).toBeInstanceOf(ObjectId);
  });

  it('does not throw for null moduleId', () => {
    expect(() => normalizeModuleIds([{ moduleId: null }])).not.toThrow();
    expect(normalizeModuleIds([{ moduleId: null }])[0].moduleId).toBeNull();
  });

  it('does not throw for "null" string moduleId', () => {
    expect(() => normalizeModuleIds([{ moduleId: 'null' }])).not.toThrow();
    expect(normalizeModuleIds([{ moduleId: 'null' }])[0].moduleId).toBe('null');
  });

  it('does not throw for "all" string moduleId', () => {
    expect(() => normalizeModuleIds([{ moduleId: 'all' }])).not.toThrow();
    expect(normalizeModuleIds([{ moduleId: 'all' }])[0].moduleId).toBe('all');
  });

  it('handles empty array', () => {
    expect(normalizeModuleIds([])).toEqual([]);
  });

  it('handles non-array input', () => {
    expect(normalizeModuleIds(null)).toEqual([]);
    expect(normalizeModuleIds(undefined)).toEqual([]);
    expect(normalizeModuleIds('string')).toEqual([]);
  });

  it('preserves all other fields on the planModule entry', () => {
    const hex = new ObjectId().toHexString();
    const [result] = normalizeModuleIds([{
      moduleId:          hex,
      moduleName:        'hrm',
      moduleDisplayName: 'HRM',
      isActive:          true,
    }]);
    expect(result.moduleName).toBe('hrm');
    expect(result.moduleDisplayName).toBe('HRM');
    expect(result.isActive).toBe(true);
  });
});
