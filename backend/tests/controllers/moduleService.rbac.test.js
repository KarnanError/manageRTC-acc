/**
 * Unit Tests — module.service.js (RBAC fixes)
 *
 * Covers:
 *  1. configureModulePages — null pageId entries are silently dropped
 *  2. configureModulePages — "null" / "undefined" string pageIds are dropped
 *  3. configureModulePages — valid pageIds are saved correctly
 *  4. addPageToModule      — invalid pageId returns a clean error (no crash)
 *  5. addPageToModule      — valid pageId resolves and saves
 *
 * Run:
 *   npm test -- tests/controllers/moduleService.rbac.test.js
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// ─── helpers to lazy-import after mongoose is connected ──────────────────────
let configureModulePages, addPageToModule;
let Module, Page, PageCategory;
let testCategoryId; // shared category for all test pages

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Dynamic import AFTER connection so models register properly
  ({ configureModulePages, addPageToModule } = await import('../../services/rbac/module.service.js'));
  Module       = (await import('../../models/rbac/module.schema.js')).default;
  Page         = (await import('../../models/rbac/page.schema.js')).default;
  PageCategory = (await import('../../models/rbac/pageCategory.schema.js')).default;

  // Create a shared category used by all test pages
  const cat = await PageCategory.create({
    identifier:  'TEST',
    displayName: 'Test Category',
    label:       'test',
    sortOrder:   99,
  });
  testCategoryId = cat._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ─── seed helpers ─────────────────────────────────────────────────────────────

async function seedModule(overrides = {}) {
  return Module.create({
    name:        overrides.name        ?? `test-module-${Date.now()}`,
    displayName: overrides.displayName ?? 'Test Module',
    route:       overrides.route       ?? '/test',
    icon:        'ti ti-folder',
    color:       '#000',
    accessLevel: 'all',
    isActive:    true,
    isSystem:    false,
    sortOrder:   0,
    pages:       overrides.pages ?? [],
  });
}

async function seedPage(overrides = {}) {
  return Page.create({
    name:        overrides.name        ?? `page-${Date.now()}`,
    displayName: overrides.displayName ?? 'Test Page',
    route:       overrides.route       ?? `/test-${Date.now()}`,
    icon:        'ti ti-file',
    category:    testCategoryId,   // required field
    isActive:    overrides.isActive ?? true,
    isSystem:    false,
    sortOrder:   0,
  });
}

// ─── 1. configureModulePages ──────────────────────────────────────────────────

describe('configureModulePages', () => {
  it('saves valid pages and returns them', async () => {
    const mod  = await seedModule();
    const page = await seedPage();

    const result = await configureModulePages(mod._id.toString(), [
      { pageId: page._id.toString(), isActive: true },
    ]);

    expect(result.success).toBe(true);
    expect(result.data.pages).toHaveLength(1);
    expect(String(result.data.pages[0].pageId?._id ?? result.data.pages[0].pageId)).toBe(page._id.toString());
    expect(result.message).toMatch(/configured/i);
  });

  it('silently drops null pageId entries — does not throw', async () => {
    const mod  = await seedModule();
    const page = await seedPage();

    const result = await configureModulePages(mod._id.toString(), [
      { pageId: null, isActive: true },          // null value
      { pageId: page._id.toString(), isActive: true },
    ]);

    expect(result.success).toBe(true);
    // Only the valid page should be saved
    expect(result.data.pages).toHaveLength(1);
    expect(String(result.data.pages[0].pageId?._id ?? result.data.pages[0].pageId)).toBe(page._id.toString());
  });

  it('silently drops "null" string pageId entries — does not throw', async () => {
    const mod  = await seedModule();
    const page = await seedPage();

    const result = await configureModulePages(mod._id.toString(), [
      { pageId: 'null',      isActive: true },   // string "null"
      { pageId: 'undefined', isActive: true },   // string "undefined"
      { pageId: 'not-an-id', isActive: true },   // random invalid string
      { pageId: page._id.toString(), isActive: true },
    ]);

    expect(result.success).toBe(true);
    expect(result.data.pages).toHaveLength(1);
    expect(String(result.data.pages[0].pageId?._id ?? result.data.pages[0].pageId)).toBe(page._id.toString());
  });

  it('returns empty pages array when ALL pageIds are invalid', async () => {
    const mod = await seedModule();

    const result = await configureModulePages(mod._id.toString(), [
      { pageId: null },
      { pageId: 'null' },
      { pageId: 'bad-id' },
    ]);

    expect(result.success).toBe(true);
    expect(result.data.pages).toHaveLength(0);
  });

  it('returns error for unknown moduleId', async () => {
    const fakeModuleId = new mongoose.Types.ObjectId().toString();
    const page = await seedPage();

    const result = await configureModulePages(fakeModuleId, [
      { pageId: page._id.toString(), isActive: true },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it('handles inactive pages — they are excluded from results', async () => {
    const mod          = await seedModule();
    const activePage   = await seedPage({ name: 'active-p', isActive: true });
    const inactivePage = await seedPage({ name: 'inactive-p', isActive: false });
    // Force inactive
    await Page.updateOne({ _id: inactivePage._id }, { $set: { isActive: false } });

    const result = await configureModulePages(mod._id.toString(), [
      { pageId: activePage._id.toString(),   isActive: true },
      { pageId: inactivePage._id.toString(), isActive: true },
    ]);

    expect(result.success).toBe(true);
    // Only the active page should be found and saved
    expect(result.data.pages).toHaveLength(1);
    expect(result.data.pages[0].name).toBe('active-p');
  });
});

// ─── 2. addPageToModule ───────────────────────────────────────────────────────

describe('addPageToModule', () => {
  it('adds a valid page successfully', async () => {
    const mod  = await seedModule();
    const page = await seedPage();

    const result = await addPageToModule(mod._id.toString(), { pageId: page._id.toString() });

    expect(result.success).toBe(true);
    const savedPages = result.data.pages;
    expect(savedPages.some(p => p.pageId._id.toString() === page._id.toString()
                              || p.pageId.toString() === page._id.toString())).toBe(true);
  });

  it('returns clean error for null pageId — no crash', async () => {
    const mod = await seedModule();

    const result = await addPageToModule(mod._id.toString(), { pageId: null });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid page id/i);
  });

  it('returns clean error for "null" string pageId', async () => {
    const mod = await seedModule();

    const result = await addPageToModule(mod._id.toString(), { pageId: 'null' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid page id/i);
  });

  it('returns clean error for a random non-ObjectId string', async () => {
    const mod = await seedModule();

    const result = await addPageToModule(mod._id.toString(), { pageId: 'not-an-objectid' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid page id/i);
  });

  it('returns error when page does not exist in DB', async () => {
    const mod          = await seedModule();
    const ghostPageId  = new mongoose.Types.ObjectId().toString();

    const result = await addPageToModule(mod._id.toString(), { pageId: ghostPageId });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/page not found/i);
  });

  it('prevents duplicate pages in the same module', async () => {
    const mod  = await seedModule();
    const page = await seedPage();

    await addPageToModule(mod._id.toString(), { pageId: page._id.toString() });
    const result = await addPageToModule(mod._id.toString(), { pageId: page._id.toString() });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/i);
  });
});
