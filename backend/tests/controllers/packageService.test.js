/**
 * Unit Tests — packages.services.js  (normalizeModuleIds fix)
 *
 * Uses an absolute-path mock so jest.unstable_mockModule resolves
 * correctly when running under --experimental-vm-modules.
 */

import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

// ── Compute the absolute path of config/db.js so jest.unstable_mockModule
//    can resolve it correctly in ESM mode (relative paths are resolved from
//    the setup file, not the test file, causing "Cannot find module" errors).
const __testDir = dirname(fileURLToPath(import.meta.url));
const dbAbsPath  = resolve(__testDir, '../../config/db.js');

let mockInsertedDoc = null;
let mockUpdatedDoc  = null;

await jest.unstable_mockModule(dbAbsPath, () => ({
  getsuperadminCollections: () => ({
    packagesCollection: {
      insertOne: jest.fn(async (doc) => { mockInsertedDoc = doc; return { insertedId: 'mock-id' }; }),
      findOne:   jest.fn(async () => ({
        plan_id:    'existing-plan-id',
        created_by: 'user-1',
        created_at: '2025-01-01',
        subscribers: 3,
        planModules: [],
      })),
      updateOne: jest.fn(async (filter, update) => { mockUpdatedDoc = update.$set; return { modifiedCount: 1 }; }),
    },
  }),
}));

let addPlan, updatePlan;
beforeAll(async () => {
  ({ addPlan, updatePlan } = await import('../../services/superadmin/packages.services.js'));
});

function validHex() { return new ObjectId().toHexString(); }

describe('normalizeModuleIds (via addPlan)', () => {
  beforeEach(() => { mockInsertedDoc = null; });

  it('converts valid 24-char hex string moduleId to BSON ObjectId', async () => {
    const hexId = validHex();
    await addPlan('u1', { planName: 'P', planModules: [{ moduleId: hexId, moduleName: 'hrm' }] });
    expect(mockInsertedDoc.planModules[0].moduleId).toBeInstanceOf(ObjectId);
    expect(mockInsertedDoc.planModules[0].moduleId.toHexString()).toBe(hexId);
  });

  it('leaves "all" string unchanged', async () => {
    await addPlan('u1', { planName: 'P', planModules: [{ moduleId: 'all', moduleName: 'all' }] });
    expect(mockInsertedDoc.planModules[0].moduleId).toBe('all');
  });

  it('leaves null unchanged', async () => {
    await addPlan('u1', { planName: 'P', planModules: [{ moduleId: null }] });
    expect(mockInsertedDoc.planModules[0].moduleId).toBeNull();
  });

  it('leaves undefined unchanged', async () => {
    await addPlan('u1', { planName: 'P', planModules: [{ moduleName: 'broken' }] });
    expect(mockInsertedDoc.planModules[0].moduleId).toBeUndefined();
  });

  it('handles empty planModules', async () => {
    await addPlan('u1', { planName: 'P', planModules: [] });
    expect(mockInsertedDoc.planModules).toEqual([]);
  });

  it('handles undefined planModules', async () => {
    await addPlan('u1', { planName: 'P' });
    expect(mockInsertedDoc.planModules).toEqual([]);
  });

  it('mixed: valid hex → ObjectId, "all" stays string, null stays null', async () => {
    const h1 = validHex(); const h2 = validHex();
    await addPlan('u1', { planName: 'Mixed', planModules: [
      { moduleId: h1, moduleName: 'hrm' }, { moduleId: 'all' },
      { moduleId: null }, { moduleId: h2, moduleName: 'crm' },
    ] });
    expect(mockInsertedDoc.planModules[0].moduleId).toBeInstanceOf(ObjectId);
    expect(mockInsertedDoc.planModules[1].moduleId).toBe('all');
    expect(mockInsertedDoc.planModules[2].moduleId).toBeNull();
    expect(mockInsertedDoc.planModules[3].moduleId).toBeInstanceOf(ObjectId);
  });
});

describe('addPlan', () => {
  beforeEach(() => { mockInsertedDoc = null; });

  it('returns done=true', async () => {
    const r = await addPlan('u1', { planName: 'P', planModules: [] });
    expect(r.done).toBe(true);
  });

  it('auto-generates 24-char plan_id', async () => {
    await addPlan('u1', { planName: 'P', planModules: [] });
    expect(mockInsertedDoc.plan_id).toHaveLength(24);
  });

  it('sets subscribers=0', async () => {
    await addPlan('u1', { planName: 'P', planModules: [] });
    expect(mockInsertedDoc.subscribers).toBe(0);
  });
});

describe('updatePlan', () => {
  beforeEach(() => { mockUpdatedDoc = null; });

  it('returns done=true', async () => {
    const r = await updatePlan({ plan_id: 'existing-plan-id', planModules: [] });
    expect(r.done).toBe(true);
  });

  it('stores BSON ObjectId', async () => {
    const h = validHex();
    await updatePlan({ plan_id: 'existing-plan-id', planModules: [{ moduleId: h }] });
    expect(mockUpdatedDoc.planModules[0].moduleId).toBeInstanceOf(ObjectId);
  });

  it('preserves existing fields', async () => {
    await updatePlan({ plan_id: 'existing-plan-id', planName: 'Kept', price: 99, planModules: [] });
    expect(mockUpdatedDoc.planName).toBe('Kept');
    expect(mockUpdatedDoc.price).toBe(99);
    expect(mockUpdatedDoc.created_by).toBe('user-1');
  });

  it('"null" string stays as string', async () => {
    const h = validHex();
    await updatePlan({ plan_id: 'existing-plan-id', planModules: [
      { moduleId: h }, { moduleId: 'null' }
    ]});
    expect(mockUpdatedDoc.planModules[0].moduleId).toBeInstanceOf(ObjectId);
    expect(mockUpdatedDoc.planModules[1].moduleId).toBe('null');
  });
});
