/**
 * PageCategory Seed Script
 * Seeds the 12 main navigation categories (I-XII) from page.md
 *
 * Usage: node backend/seed/pageCategories.seed.js
 *
 * Categories:
 * I → Main Menu
 * II → Users & Permissions
 * III → Dashboards
 * IV → HRM
 * V → Recruitment
 * VI → Projects
 * VII → CRM
 * VIII → Applications
 * IX → Finance & Accounts
 * X → Administration
 * XI → Pages
 * XII → Extras
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import PageCategory from '../models/rbac/pageCategory.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

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

const stats = {
  created: 0,
  updated: 0,
  skipped: 0,
};

async function seedCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   Database: ${dbName}`);
    await mongoose.connect(uri, { dbName });
    console.log('✅ Connected!\n');

    console.log('📦 Starting PageCategory Seed...\n');
    console.log('='.repeat(70));

    for (const catDef of categoryDefinitions) {
      try {
        // Check if category already exists
        let category = await PageCategory.findOne({
          $or: [
            { identifier: catDef.identifier },
            { label: catDef.label }
          ]
        });

        if (category) {
          // Update existing category
          category.displayName = catDef.displayName;
          category.description = catDef.description;
          category.icon = catDef.icon;
          category.sortOrder = catDef.sortOrder;
          category.isSystem = catDef.isSystem;
          category.isActive = true;
          await category.save();
          stats.updated++;
          console.log(`✏️  Updated: ${catDef.displayName} (${catDef.identifier} - ${catDef.label})`);
        } else {
          // Create new category
          category = new PageCategory({
            identifier: catDef.identifier,
            displayName: catDef.displayName,
            label: catDef.label,
            description: catDef.description,
            icon: catDef.icon,
            sortOrder: catDef.sortOrder,
            isSystem: catDef.isSystem,
            isActive: true,
          });
          await category.save();
          stats.created++;
          console.log(`✅ Created: ${catDef.displayName} (${catDef.identifier} - ${catDef.label})`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${catDef.identifier}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Created: ${stats.created}`);
    console.log(`✏️  Updated: ${stats.updated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);

    // Verify categories
    console.log('\n📋 Categories in Database:');
    const categories = await PageCategory.find({ isActive: true }).sort({ sortOrder: 1 });
    categories.forEach(cat => {
      console.log(`   ${cat.identifier}. ${cat.displayName} (${cat.label})`);
    });

    console.log('\n✅ PageCategories seed complete!');

    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ Seed Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedCategories();
