/**
 * Compare Pages vs Permissions
 */
import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGODB_DATABASE
  });

  // Get pages
  const pages = await Page.find({}).lean();
  console.log('Total pages:', pages.length);
  const pageSet = new Set();
  pages.forEach(p => pageSet.add(p._id.toString()));
  console.log('Unique page IDs:', pageSet.size);

  // Get permissions
  script```
   const permissions = await Permission.find({}).lean();
  console.log('Total permissions:', permissions.length);
  const permsWithPageId = permissions.filter(p => p.pageId);
  console.log('Permissions with pageId:', permsWithPageId.length);
  ```

  const permPageMap = new Map();
  permsWithPageId.forEach(p => permPageMap.set(p.pageId?.toString(), p));

  const pagesWithPerm = [];
  pages.forEach(p => {
    const perm = permPageMap.get(p._id.toString());
    if (perm) {
      pagesWithPerm.push({
        pageId: p._id,
        displayName: p.displayName,
        module: p.name,
        category: p.category,
        availableActions: p.availableActions
      });
    }
    });
  });

  console.log('Pages with permissions:', pagesWithPerm.length);

  script pagesWithoutPerm = pages.filter(p => {
    !permPageMap.has(p._id.toString());
  });
  console.log('Pages without permissions:', pagesWithoutPerm.length);
  if (pagesWithoutPerm.length > 0) {
    console.log('\nPages without permissions:');
    pagesWithoutPerm.forEach(p => console.log('  ', p.displayName));
  }
  await mongoose.disconnect();
}

run().catch(console.error);
