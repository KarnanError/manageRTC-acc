/**
 * Test API Response for Tree Structure
 * Simulates what the frontend receives
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('=== TESTING TREE STRUCTURE RESPONSE ===');
  console.log('Database:', dbName);
  console.log('');

  await mongoose.connect(uri, { dbName });
  console.log('✓ Connected\n');

  // Get categories
  const categories = await PageCategory.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .lean();

  console.log('--- CATEGORY TYPE CHECK ---');
  console.log('Category _id type:', typeof categories[0]._id);
  console.log('Category _id value:', categories[0]._id);
  console.log('Category _id toString():', categories[0]._id.toString());
  console.log('');

  // Get first L1 group (try any category)
  const l1Group = await Page.findOne({
    isMenuGroup: true,
    menuGroupLevel: 1,
  }).lean();

  if (l1Group) {
    console.log('--- L1 GROUP TYPE CHECK ---');
    console.log('L1 _id type:', typeof l1Group._id);
    console.log('L1 _id value:', l1Group._id);
    console.log('L1 _id toString():', l1Group._id.toString());
    console.log('');

    // Get L1's direct children
    const l1DirectChildren = await Page.find({
      parentPage: l1Group._id,
      isMenuGroup: false,
    }).lean();

    if (l1DirectChildren.length > 0) {
      const child = l1DirectChildren[0];
      console.log('--- L1 DIRECT CHILD TYPE CHECK ---');
      console.log('Child _id type:', typeof child._id);
      console.log('Child _id value:', child._id);
      console.log('Child _id toString():', child._id.toString());
      console.log('');

      // Test JSON serialization
      console.log('--- JSON SERIALIZATION TEST ---');
      const jsonString = JSON.stringify(child);
      console.log('JSON string:', jsonString);
      console.log('');

      const parsed = JSON.parse(jsonString);
      console.log('Parsed _id type:', typeof parsed._id);
      console.log('Parsed _id value:', parsed._id);
      console.log('');

      // Test Map lookup
      console.log('--- MAP LOOKUP TEST ---');
      const map = new Map();
      const pageIdStr = child._id.toString();
      map.set(pageIdStr, ['all']);

      console.log('Map key type:', typeof Array.from(map.keys())[0]);
      console.log('Looking up with string:', map.get(pageIdStr) ? 'FOUND ✓' : 'NOT FOUND');

      // This is what happens on frontend
      const frontendPageId = parsed._id; // After JSON parse
      console.log('Looking up with parsed._id (type:', typeof frontendPageId, '):', map.get(frontendPageId) ? 'FOUND ✓' : 'NOT FOUND');
    }
  }

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(console.error);
