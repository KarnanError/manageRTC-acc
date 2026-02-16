/**
 * Phase 1: Fix Uncategorized Pages
 * Assigns appropriate categories based on page name patterns
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';

// Category mapping rules based on page name patterns
const categoryRules = [
  // Super Admin
  { pattern: /^super-admin\./, category: 'super-admin' },

  // User Management (admin pages, roles, permissions)
  { pattern: /^admin\./, category: 'administration' },
  { pattern: /^roles-permissions/, category: 'users-permissions' },
  { pattern: /^permission$/, category: 'users-permissions' },
  { pattern: /^roles$/, category: 'users-permissions' },

  // Dashboards
  { pattern: /dashboard$/, category: 'dashboards' },

  // HRM
  { pattern: /^hrm\./, category: 'hrm' },
  { pattern: /^employees$/, category: 'users-permissions' },  // Employee list
  { pattern: /^departments$/, category: 'users-permissions' },
  { pattern: /^designations$/, category: 'users-permissions' },
  { pattern: /^leaves$/, category: 'users-permissions' },
  { pattern: /^attendance/, category: 'users-permissions' },
  { pattern: /^shifts/, category: 'users-permissions' },
  { pattern: /^holidays/, category: 'users-permissions' },
  { pattern: /^policies$/, category: 'users-permissions' },
  { pattern: /^assets$/, category: 'administration' },
  { pattern: /^reports$/, category: 'administration' },
  { pattern: /^help$/, category: 'administration' },
  { pattern: /^settings$/, category: 'administration' },

  // Projects
  { pattern: /^projects\./, category: 'projects' },
  { pattern: /^clients$/, category: 'projects' },
  { pattern: /^tasks$/, category: 'projects' },

  // CRM
  { pattern: /^crm\./, category: 'crm' },
  { pattern: /^deals/, category: 'crm' },
  { pattern: /^leads$/, category: 'crm' },

  // Recruitment
  { pattern: /^recruitment\./, category: 'recruitment' },
  { pattern: /^candidates$/, category: 'recruitment' },

  // Finance
  { pattern: /^finance\./, category: 'finance-accounts' },
  { pattern: /^accounting$/, category: 'finance-accounts' },
  { pattern: /^payroll$/, category: 'finance-accounts' },
  { pattern: /^expenses$/, category: 'finance-accounts' },
  { pattern: /^invoices$/, category: 'finance-accounts' },

  // Applications
  { pattern: /^applications\./, category: 'applications' },

  // Pages
  { pattern: /^pages$/, category: 'pages' },
  { pattern: /^blogs$/, category: 'pages' },

  // Extras
  { pattern: /^extras\./, category: 'extras' },
  { pattern: /^documentation$/, category: 'extras' },
];

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== PHASE 1: FIX UNCATEGORIZED PAGES ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get all uncategorized pages
  const uncategorizedPages = await Page.find({ moduleCategory: null }).lean();
  console.log(`Found ${uncategorizedPages.length} uncategorized pages`);

  let updated = 0;
  let skipped = 0;

  for (const page of uncategorizedPages) {
    // Find matching category rule
    const rule = categoryRules.find(r => r.pattern.test(page.name));

    if (rule) {
      await Page.updateOne(
        { _id: page._id },
        { $set: { moduleCategory: rule.category } }
      );
      updated++;
      console.log(`✓ Updated: ${page.name} → ${rule.category}`);
    } else {
      skipped++;
      console.log(`⚠ Skipped: ${page.name} (no matching rule)`);
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Updated: ${updated} pages`);
  console.log(`Skipped: ${skipped} pages (no matching rule)`);

  // Show remaining uncategorized
  const remaining = await Page.countDocuments({ moduleCategory: null });
  console.log(`Remaining uncategorized: ${remaining}`);

  await mongoose.disconnect();
  console.log('\n✓ Phase 1 complete!');
}

main().catch(console.error);
