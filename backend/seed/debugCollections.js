/**
 * Debug script to check current collection state
 */
import { config } from 'dotenv';
config();

import mongoose from 'mongoose';
import PageCategory from '../models/rbac/pageCategory.schema.js';
import Page from '../models/rbac/page.schema.js';
import Permission from '../models/rbac/permission.schema.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

async function debug() {
  try {
    console.log('Connecting to MongoDB...');
    console.log(`   Database: ${dbName}`);
    await mongoose.connect(uri, { dbName });
    console.log('✅ Connected!\n');

    // Check Categories
    console.log('📁 PageCategories:');
    const categories = await PageCategory.find({}).lean();
    console.log(`   Total: ${categories.length}`);
    categories.forEach(c => {
      console.log(`   - ${c.identifier}. ${c.displayName} (${c.label}) - _id: ${c._id}`);
    });

    // Check Pages
    console.log('\n📄 Pages (first 10):');
    const pages = await Page.find({}).limit(10).lean();
    console.log(`   Total in DB: ${await Page.countDocuments()}`);
    pages.forEach(p => {
      const catId = p.category?._id?.toString() || p.category?.toString() || 'null';
      const catLabel = p.category?.label || 'N/A';
      console.log(`   - ${p.name}`);
      console.log(`     displayName: ${p.displayName}`);
      console.log(`     category._id: ${catId}`);
      console.log(`     category.label: ${catLabel}`);
    });

    // Check Permissions
    console.log('\n🔑 Permissions (first 10):');
    const permissions = await Permission.find({}).limit(10).lean();
    console.log(`   Total in DB: ${await Permission.countDocuments()}`);
    permissions.forEach(p => {
      console.log(`   - ${p.module || p.pageId}`);
      console.log(`     displayName: ${p.displayName}`);
      console.log(`     category: ${p.category}`);
      console.log(`     pageId: ${p.pageId?.toString() || 'null'}`);
    });

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
