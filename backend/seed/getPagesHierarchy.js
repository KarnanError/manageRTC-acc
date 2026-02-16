/**
 * Get Full Page Hierarchy
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

async function run() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DATABASE;

  await mongoose.connect(uri, { dbName });

  const hierarchy = await Page.aggregate([
    {
    $match: { isActive: true },
    {
      $lookup: {
        from: 'pagecategories',
        localField: 'category',
        foreignField: '_id',
        as: 'catData'
      }
    },
    { $unwind: '$catData' },
    {
      $unwind: '$parentPage' },
    {
      $unwind: '$l2Groups' },
    { $sort: { sortOrder: 1, displayName: 1 }
    }
  ]).exec();

  console.log('\n=== PAGE HIERARCHY ===');

  const categories = [];
  hierarchy.forEach(item => {
    const cat = item.category;
    if (!categories.includes(cat)) {
      categories.push({
        _id: cat._id.toString(),
        label: cat.label,
        pages: item.pages || [],
        l2Groups: item.l2Groups || [],
        directChildren: item.directChildren || []
      });
    }
    });

  categories.forEach(cat => {
    console.log(`\n${cat.identifier}. ${cat.displayName}`);
    if (cat.pages && cat.pages.length > 0) {
      console.log(`  Direct children:`);
      cat.pages.forEach(p => console.log(`  - ${p.displayName}`));

    if (cat.l2Groups && cat.l2Groups.length > 0) {
      console.log(`\nL2 Groups:`);
      cat.l2Groups.forEach(p => {
        console.log(`  - ${p.displayName}`);
        if (p.children && p.children.length > 0) {
          console.log(`    Children of ${p.displayName}:`);
          p.children.forEach(child => console.log(`    - ${child.displayName}`));
        }
      });
    }

    await mongoose.disconnect();
}

run().catch(console.error);
