/**
 * Simple Pages Sync Test
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();
import Page from '../models/rbac/page.schema.js';
import PageCategory from '../models/rbac/pageCategory.schema.js';
import Permission from '../models/rbac/permission.schema.js';

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  console.log('Connecting to:', dbName);
  await mongoose.connect(uri, { dbName });
  console.log('Connected!');

  // Count all
  const pageCount = await Page.countDocuments();
  const categoryCount = await PageCategory.countDocuments();
  const permCount = await Permission.countDocuments();

  console.log('Pages:', pageCount);
  console.log('Categories:', categoryCount);
  console.log('Permissions:', permCount);

  // Sync
  const pages = await Page.find({ isActive: true }).lean();
  console.log('Active pages:', pages.length);

  let created = 0;
  for (const page of pages) {
    const existing = await Permission.findOne({ pageId: page._id });
    if (!existing) {
      await Permission.create({
        pageId: page._id,
        module: page.name,
        displayName: page.displayName,
        category: 'other',
        availableActions: page.availableActions || ['read', 'create', 'write', 'delete'],
        isActive: true,
      });
      created++;
      console.log('Created:', page.displayName);
    }
  }

  console.log('Total permissions created:', created);

  await mongoose.disconnect();
}

main().catch(console.error);
