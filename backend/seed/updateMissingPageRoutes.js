/**
 * Update Missing Page Routes
 *
 * This script updates pages in the database that are missing routes
 * based on the actual routes found in all_routes.tsx
 *
 * Run: node backend/seed/updateMissingPageRoutes.js
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import Page from '../models/rbac/page.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

// Route mappings found from all_routes.tsx
const ROUTE_MAPPINGS = {
  // Training
  'hrm.training-list': 'training/training-list',
  'hrm.trainers': 'training/trainers',
  'hrm.training-type': 'training/training-type',

  // Employee Lifecycle
  'hrm.promotions': 'promotion',
  'hrm.resignation': 'resignation',
  'hrm.termination': 'termination',

  // Recruitment
  'recruitment.jobs': 'job-grid',
  'recruitment.candidates': 'candidates-grid',
  'recruitment.referrals': 'referrals', // Added based on pattern

  // CRM
  'crm.contacts': 'contact-grid',
  'crm.companies': 'companies-grid',
  'crm.deals': 'deals-grid',
  'crm.leads': 'leads-grid',
  'crm.pipeline': 'pipeline',
  'crm.analytics': 'analytics',
  'crm.activities': 'activities',

  // Finance - Sales
  'finance.estimates': 'estimates',
  'finance.invoices': 'invoices',
  'finance.payments': 'payments',
  'finance.expenses': 'expenses',
  'finance.provident-fund': 'provident-fund',
  'finance.taxes': 'taxes',

  // Finance - Accounting
  'finance.categories': 'accounting/categories',
  'finance.budgets': 'accounting/budgets',
  'finance.budget-expenses': 'accounting/budgets-expenses',
  'finance.budget-revenues': 'accounting/budget-revenues',

  // Finance - Payroll
  'finance.employee-salary': 'employee-salary',
  'finance.payslip': 'payslip',
  'finance.payroll-items': 'payroll',

  // Administration - Assets
  'admin.assets': 'assets',
  'admin.asset-categories': 'asset-categories',

  // Administration - Help & Support
  'admin.knowledge-base': 'knowledgebase',
  'admin.activities': 'activities', // CRM has activities, admin also has one

  // Administration - Reports
  'admin.expense-report': 'expenses-report',
  'admin.invoice-report': 'invoice-report',
  'admin.payment-report': 'payment-report',
  'admin.project-report': 'project-report',
  'admin.task-report': 'task-report',
  'admin.user-report': 'user-report',
  'admin.employee-report': 'employee-report',
  'admin.payslip-report': 'payslip-report',
  'admin.attendance-report': 'attendance-report',
  'admin.leave-report': 'leave-report',
  'admin.daily-report': 'daily-report',

  // Administration - Settings
  'admin.general-settings': 'general-settings/connected-apps',
  'admin.website-settings': 'website-settings/bussiness-settings',
  'admin.app-settings': 'app-settings/custom-fields',
  'admin.system-settings': 'system-settings/email-settings',
  'admin.financial-settings': 'financial-settings/currencies',
  'admin.other-settings': 'other-settings/ban-ip-address',
};

async function updateMissingRoutes() {
  await mongoose.connect(uri, { dbName });

  console.log('🔄 Updating missing page routes...\n');

  let updatedCount = 0;
  let notFoundCount = 0;
  let alreadyHasRouteCount = 0;

  for (const [pageName, route] of Object.entries(ROUTE_MAPPINGS)) {
    try {
      const page = await Page.findOne({ name: pageName });

      if (!page) {
        console.log(`⚠️  Page not found: ${pageName}`);
        notFoundCount++;
        continue;
      }

      if (page.route && page.route !== null) {
        console.log(`ℹ️  ${pageName} already has route: ${page.route}`);
        alreadyHasRouteCount++;
        continue;
      }

      page.route = route;
      await page.save();
      console.log(`✅ Updated: ${pageName} -> ${route}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${pageName}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Already had route: ${alreadyHasRouteCount}`);
  console.log(`  Not found: ${notFoundCount}`);
  console.log('='.repeat(60));

  await mongoose.disconnect();
}

// Run the update
updateMissingRoutes().catch(console.error);
