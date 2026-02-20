/**
 * Company Pages Controller
 * Returns the list of pages (routes/names) enabled for the authenticated user's company
 * via the chain: Company → Plan → Modules → Pages
 */

import { Company } from '../../models/superadmin/package.schema.js';
// Must import Module and Page so Mongoose has them registered for populate()
import '../../models/rbac/module.schema.js';
import Page from '../../models/rbac/page.schema.js';

/**
 * GET /api/company/enabled-pages
 * Returns enabled routes and page names for the user's company based on their plan.
 * Superadmin role always gets allEnabled=true (bypasses company/module check).
 *
 * Add ?debug=1 to get step-by-step diagnostic info in the response.
 */
export const getEnabledPages = async (req, res) => {
  try {
    const { companyId, role } = req.user || {};
    const isDebug = req.query.debug === '1';

    // Superadmin bypasses all company/module restrictions
    if (role === 'superadmin') {
      return res.json({
        success: true,
        data: {
          allEnabled: true,
          routes: [],
          pageNames: [],
        },
      });
    }

    if (!companyId) {
      console.warn('[CompanyPages] ❌ No companyId on req.user. role=%s publicMetadata=%j', role, req.user?.publicMetadata);
      return res.json({
        success: true,
        data: {
          allEnabled: false,
          routes: [],
          pageNames: [],
          reason: 'No company assigned to user',
          ...(isDebug && { debug: { role, userId: req.user?.userId, publicMetadata: req.user?.publicMetadata } }),
        },
      });
    }

    // Deep-populate: Company → Plan → Modules → Pages
    const company = await Company.findById(companyId).populate({
      path: 'planId',
      populate: {
        path: 'planModules.moduleId',
        populate: {
          path: 'pages.pageId',
        },
      },
    });

    if (!company) {
      console.warn('[CompanyPages] ❌ Company not found for id=%s', companyId);
      return res.json({
        success: true,
        data: {
          allEnabled: false,
          routes: [],
          pageNames: [],
          reason: 'Company not found',
          ...(isDebug && { debug: { companyId } }),
        },
      });
    }

    const plan = company.planId;
    if (!plan) {
      console.warn('[CompanyPages] ❌ No plan on company=%s (planId field is null/unpopulated)', company.name);
      return res.json({
        success: true,
        data: {
          allEnabled: false,
          routes: [],
          pageNames: [],
          reason: 'No plan assigned to company',
          ...(isDebug && { debug: { companyId, companyName: company.name, rawPlanId: company._doc?.planId } }),
        },
      });
    }

    // Traverse chain and collect enabled routes and page names
    const enabledRoutes = new Set();
    const enabledPageNames = new Set();

    const debugModules = [];

    for (const planModule of plan.planModules || []) {
      const module = planModule.moduleId;
      const debugEntry = {
        moduleId: planModule.moduleId?._id || planModule.moduleId,
        moduleName: module?.name,
        planModuleIsActive: planModule.isActive,
        moduleIsActive: module?.isActive,
        pagesCount: module?.pages?.length ?? 0,
        pagesCollected: 0,
        skippedPages: [],
      };

      // Treat missing/undefined isActive as true — old planModule entries pre-date the isActive field
      if (planModule.isActive === false) {
        debugEntry.skipped = 'planModule.isActive=false';
        if (isDebug) debugModules.push(debugEntry);
        continue;
      }

      if (!module || module.isActive === false) {
        debugEntry.skipped = !module ? 'moduleId not populated (null / string ID not migrated)' : 'module.isActive=false';
        if (isDebug) debugModules.push(debugEntry);
        continue;
      }

      for (const pageRef of module.pages || []) {
        const page = pageRef.pageId;
        // Treat missing/undefined isActive as true for backward compat
        if (pageRef.isActive === false) {
          if (isDebug) debugEntry.skippedPages.push({ name: page?.name || pageRef.name, reason: 'pageRef.isActive=false' });
          continue;
        }
        if (!page || page.isActive === false) {
          if (isDebug) debugEntry.skippedPages.push({ name: pageRef.name, reason: !page ? 'pageId not populated' : 'page.isActive=false' });
          continue;
        }

        if (page.route) enabledRoutes.add(page.route);
        if (page.name) enabledPageNames.add(page.name);
        debugEntry.pagesCollected++;
      }

      if (isDebug) debugModules.push(debugEntry);
    }

    // Always include pages marked enabledForAll (e.g. auth pages: login, register, forgot-password)
    // These are never restricted regardless of company plan or module assignments
    const publicPages = await Page.find(
      { 'featureFlags.enabledForAll': true, isActive: true },
      'name route'
    ).lean();
    for (const p of publicPages) {
      if (p.route) enabledRoutes.add(p.route);
      if (p.name) enabledPageNames.add(p.name);
    }

    console.log(
      '[CompanyPages] ✅ company=%s plan=%s modules=%d routes=%d (incl. %d public)',
      company.name, plan.planName,
      (plan.planModules || []).length,
      enabledRoutes.size,
      publicPages.length
    );

    return res.json({
      success: true,
      data: {
        allEnabled: false,
        routes: Array.from(enabledRoutes),
        pageNames: Array.from(enabledPageNames),
        planName: plan.planName,
        companyName: company.name,
        ...(isDebug && {
          debug: {
            companyId,
            planId: plan._id,
            planName: plan.planName,
            totalPlanModules: (plan.planModules || []).length,
            totalRoutes: enabledRoutes.size,
            modules: debugModules,
          },
        }),
      },
    });
  } catch (error) {
    console.error('[CompanyPages] Error fetching enabled pages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company enabled pages',
    });
  }
};

export default { getEnabledPages };
