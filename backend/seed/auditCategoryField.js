/**
 * Audit the category field in pages collection vs pagecategories
 */
import { config } from 'dotenv';
config();
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'AmasQIS';

async function run() {
  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;

  // 1. All page categories
  const cats = await db.collection('pagecategories').find({}).toArray();
  console.log(`\n=== pagecategories (${cats.length}) ===`);
  cats.forEach(c => console.log(`  ${c._id}  label=${c.label}  display=${c.displayName}`));

  // 2. Sample pages with category field
  const pages = await db.collection('pages').find({}, {
    projection: { name: 1, category: 1, moduleCategory: 1, isMenuGroup: 1 }
  }).toArray();

  let nullCat = 0, objectIdCat = 0, otherCat = 0;
  const catIdSet = new Set(cats.map(c => String(c._id)));

  for (const p of pages) {
    const cat = p.category;
    if (cat == null) {
      nullCat++;
    } else {
      const str = String(cat);
      if (str.length === 24 && /^[a-f0-9]+$/i.test(str)) {
        objectIdCat++;
      } else {
        otherCat++;
      }
    }
  }

  console.log(`\n=== category field audit (${pages.length} pages total) ===`);
  console.log(`  null/undefined  : ${nullCat}`);
  console.log(`  ObjectId string : ${objectIdCat}`);
  console.log(`  other           : ${otherCat}`);

  // 3. Check if ObjectId refs actually match pagecategories documents
  let matched = 0, dangling = 0;
  const danglingIds = new Set();
  for (const p of pages) {
    if (p.category == null) continue;
    const str = String(p.category);
    if (catIdSet.has(str)) {
      matched++;
    } else {
      dangling++;
      danglingIds.add(str);
    }
  }
  console.log(`  matched to pagecategories : ${matched}`);
  console.log(`  dangling (no matching cat): ${dangling}`);
  if (danglingIds.size > 0) {
    console.log(`  dangling IDs: ${[...danglingIds].join(', ')}`);
  }

  // 4. Show pages with no category
  if (nullCat > 0) {
    const noCat = pages.filter(p => p.category == null);
    console.log(`\n=== ${nullCat} pages with null category ===`);
    noCat.slice(0, 10).forEach(p => console.log(`  ${p.name}  moduleCategory=${p.moduleCategory}`));
    if (noCat.length > 10) console.log(`  ... and ${noCat.length - 10} more`);
  }

  // 5. Show pages where category ObjectId doesn't match any pagecategory
  if (dangling > 0) {
    const danglingPages = pages.filter(p => p.category && !catIdSet.has(String(p.category)));
    console.log(`\n=== ${dangling} pages with dangling category ref ===`);
    danglingPages.slice(0, 10).forEach(p => console.log(`  ${p.name}  category=${p.category}`));
  }

  // 6. Show what the category ObjectIds actually resolve to
  console.log('\n=== pages per category (by ObjectId) ===');
  for (const cat of cats) {
    const count = pages.filter(p => String(p.category) === String(cat._id)).length;
    console.log(`  ${cat.label.padEnd(25)} ${count} pages`);
  }

  // 7. Test Mongoose populate
  console.log('\n=== Testing Mongoose populate ===');
  await import('../models/rbac/pageCategory.schema.js');
  const Page = (await import('../models/rbac/page.schema.js')).default;
  const sample = await Page.findOne({ category: { $ne: null } })
    .populate('category', 'displayName label sortOrder')
    .lean();
  if (sample) {
    console.log(`  Page: ${sample.name}`);
    console.log(`  category field after populate:`, sample.category);
    console.log(`  typeof category:`, typeof sample.category);
  } else {
    console.log('  No pages with category found!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
