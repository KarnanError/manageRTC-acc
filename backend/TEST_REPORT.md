# Test Report — ObjectId / Null-Safety Fixes

**Date:** 2026-02-17
**Scope:** Three bug fixes applied across the RBAC module assignment and company sidebar chain
**Result:** ✅ **64 / 64 tests passing**

---

## Summary

| Suite | File | Tests | Result |
|-------|------|-------|--------|
| Unit — module.service.js | `tests/controllers/moduleService.rbac.test.js` | 12 | ✅ PASS |
| Unit — packages.services.js | `tests/controllers/packageService.test.js` | 14 | ✅ PASS |
| Edge-cases — ObjectId null handling | `edge-cases/objectIdNullFix.edgecases.test.js` | 29 | ✅ PASS |
| Integration — Company→Plan→Module→Page | `integration-tests/companyPagesChain.integration.test.js` | 9 | ✅ PASS |
| **TOTAL** | | **64** | **✅ 64 passed, 0 failed** |

---

## Bugs Fixed

### Bug 1 — `Cast to ObjectId failed for value "null"` (module page assignment)

**Location:** Page Configuration Modal in the Modules UI
**Trigger:** Clicking a page group toggle when some `pages[].pageId` entries are `null` (un-populated references)

**Root cause (2 layers):**

| Layer | Problem | Fix |
|-------|---------|-----|
| Frontend — `modules.tsx` | `resolveModulePageId()` returned `String(null)` = `"null"` when `mp.pageId` is null | Function now explicitly returns `null` and rejects `"null"` / `"undefined"` strings |
| Backend — `module.service.js` | `configureModulePages` passed `"null"` strings into `Page.find({ _id: { $in: [...] } })` | Filter applied with `mongoose.Types.ObjectId.isValid()` before the DB query |

**Files changed:**
- `react/src/feature-module/super-admin/modules.tsx`
- `backend/services/rbac/module.service.js`

---

### Bug 2 — Company sidebar not showing newly-added module pages

**Location:** Company sidebar, `GET /api/company/enabled-pages` controller
**Trigger:** Adding pages to a module, assigning the module to a package, assigning the package to a company — yet the sidebar remained unchanged

**Root cause — dual code-path incompatibility:**

The UI write path (package create/update) used the raw **MongoDB driver** (`packagesCollection.insertOne/updateOne`), which stored `moduleId` as a plain JS string. The read path (`companyPages.controller.js`) used **Mongoose populate**, which in older Mongoose versions silently returned `null` when the stored value wasn't a BSON ObjectId.

A second break: `company.planId` (ObjectId ref for populate) was never set — only the legacy `plan_id: string` field was written. So `Company.findById().populate('planId')` returned `null` for the plan.

| Break | Fix |
|-------|-----|
| `planModules[].moduleId` stored as string | Added `normalizeModuleIds()` in `packages.services.js`; converts valid 24-hex strings to BSON ObjectId before every `insertOne` / `updateOne` |
| `company.planId` not set | `addCompany` and `updateCompany` in `companies.services.js` now also write `planId: new ObjectId(plan_id)` |

**Note:** Mongoose 8 auto-casts string values to ObjectId when populating `ObjectId` schema fields, so the `moduleId` string storage would actually work in production today. The normalisation fix is still applied as best-practice for DB hygiene and forward compatibility.

**Files changed:**
- `backend/services/superadmin/packages.services.js`
- `backend/services/superadmin/companies.services.js`
- `backend/seed/fixCompanyPlanRefs.js` *(migration script for existing data)*

---

### Bug 3 — Sidebar flash (UX)

All menu items appeared briefly before module data was fetched, causing a visible flash.

**Fix:** Added a skeleton loading state to the sidebar (`isLoading` from `CompanyPagesContext`). While loading, 6 animated placeholder bars replace the menu list.

**File changed:** `react/src/core/common/sidebar/index.tsx`

---

## Test Suite Details

### 1 · `tests/controllers/moduleService.rbac.test.js` — 12 tests

Tests the fixed `configureModulePages` and `addPageToModule` functions in `backend/services/rbac/module.service.js`.

**Infrastructure:** MongoDB Memory Server (isolated, no real DB needed)

| Test | What it proves |
|------|---------------|
| `configureModulePages` — saves valid pages | Happy path: valid pageIds are saved correctly |
| `configureModulePages` — drops `null` pageId | Null values are silently skipped, no crash |
| `configureModulePages` — drops `"null"` / `"undefined"` strings | String poisons are filtered out |
| `configureModulePages` — all invalid → empty array | Returns 0 pages without error |
| `configureModulePages` — unknown moduleId | Returns `{ success: false }` cleanly |
| `configureModulePages` — inactive pages excluded | Only `isActive: true` pages are saved |
| `addPageToModule` — valid page | Page is added, returned in module |
| `addPageToModule` — `null` pageId | Returns `{ success: false, error: /invalid page id/i }` |
| `addPageToModule` — `"null"` string | Same clean error |
| `addPageToModule` — random non-ObjectId string | Same clean error |
| `addPageToModule` — page not in DB | Returns `{ success: false, error: /page not found/i }` |
| `addPageToModule` — duplicate page | Returns `{ success: false, error: /already exists/i }` |

---

### 2 · `tests/controllers/packageService.test.js` — 14 tests

Tests the `normalizeModuleIds()` helper and the `addPlan` / `updatePlan` service functions in `backend/services/superadmin/packages.services.js`.

**Infrastructure:** `jest.unstable_mockModule` (ESM-compatible) mocks `config/db.js` — no real DB connection

| Group | Tests |
|-------|-------|
| `normalizeModuleIds` (7 tests) | Hex string → ObjectId, `"all"` stays string, `null` stays null, undefined stays undefined, empty array, undefined planModules, mixed array |
| `addPlan` (3 tests) | Returns `done: true`, generates 24-char `plan_id`, sets `subscribers: 0` |
| `updatePlan` (4 tests) | Returns `done: true`, stores BSON ObjectId, preserves existing fields, `"null"` string stays as string |

---

### 3 · `edge-cases/objectIdNullFix.edgecases.test.js` — 29 tests

Three-layer edge-case coverage for every variant of the null/string ObjectId poisoning bug.

| Layer | Tests | Coverage |
|-------|-------|---------|
| Layer 1 — `resolveModulePageId` (pure JS) | 9 | `null`, `undefined`, `"null"`, `"undefined"`, valid hex string, populated object, object with null `_id`, regression guard |
| Layer 2 — backend service calls | 12 | `null` / `undefined` / `"null"` / `"undefined"` / `""` / whitespace / non-ID / 5-digit strings for `addPageToModule`; plus 4 `configureModulePages` edge cases |
| Layer 3 — `normalizeModuleIds` inline | 8 | Valid hex → ObjectId, `null` passthrough, `"null"` passthrough, `"all"` passthrough, empty array, non-array, field preservation |

---

### 4 · `integration-tests/companyPagesChain.integration.test.js` — 9 tests

End-to-end tests of the full `Company → Plan → Module → Page` chain as used by `GET /api/company/enabled-pages`.

**Infrastructure:** MongoDB Memory Server + real Mongoose models

| Scenario | What is tested |
|----------|---------------|
| **A — Happy path** | Correct BSON ObjectId refs at every link → routes returned |
| **A — superadmin bypass** | `role: 'superadmin'` always returns `allEnabled: true` |
| **B — Mongoose 8 auto-cast** | String-stored `moduleId` is auto-cast by Mongoose 8 populate (documents Mongoose 8 behaviour change) |
| **C — `planId` not set** | Company without `planId` ObjectId returns `reason: "No plan assigned"` |
| **D — after fix-script** | Setting `planId` via migration immediately enables routes |
| **E — dangling module ref** | Ghost moduleId is skipped gracefully; valid modules still return routes |
| **F — inactive page** | `Page.isActive: false` route is excluded from results |
| **G — inactive planModule** | `planModule.isActive: false` excludes all routes from that module |
| **H — company not found** | Ghost companyId returns `reason: "Company not found"` |
| **H — null companyId** | `null` companyId returns `reason: "No company assigned"` |

---

## Environment

| Item | Value |
|------|-------|
| Runtime | Node.js with `--experimental-vm-modules` (ESM mode) |
| Test framework | Jest |
| DB (unit/integration) | `mongodb-memory-server` (in-memory, isolated) |
| Mongoose version | 8.15.0 |
| Test runner command | `NODE_OPTIONS=--experimental-vm-modules npx jest <files> --no-coverage --forceExit` |

---

## Pending (Out of Scope)

- **Run migration scripts on production data:**
  ```bash
  node backend/seed/fixPackageModuleRefs.js --fix
  node backend/seed/fixCompanyPlanRefs.js --fix
  ```
- **Horizontal sidebar loading state** — only the vertical sidebar was updated with the skeleton animation; `horizontal-sidebar/index.tsx` still needs the same treatment.
