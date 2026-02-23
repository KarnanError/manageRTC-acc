/**
 * Get Full Details of Leave Pages
 *
 * Run: node seed/getLeavePagesDetails.js
 */

import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    // Get all leave pages with full details
    const leavePages = await db.collection('pages').find({
      $or: [
        { code: { $regex: 'leave', $options: 'i' } },
        { name: { $regex: 'leave', $options: 'i' } },
        { route: { $regex: 'leave', $options: 'i' } }
      ]
    }).toArray();

    console.log(`Full details of existing leave pages (${leavePages.length} found):\n`);

    for (const page of leavePages) {
      const parentPageId = page.parentPage ? page.parentPage.toString() : 'none';
      const categoryId = page.category ? page.category.toString() : 'none';
      const isMenuGroup = page.isMenuGroup || false;
      const menuGroupLevel = page.menuGroupLevel || 'none';
      console.log(`Name: ${page.name}`);
      console.log(`Code: ${page.code}`);
      console.log(`Route: ${page.route}`);
      console.log(`Parent Page ID: ${parentPageId}`);
      console.log(`Category ID: ${categoryId}`);
      console.log(`Is Menu Group: ${isMenuGroup}`);
      console.log(`Menu Group Level: ${menuGroupLevel}`);
      console.log(`Level: ${page.level || 'none'}`);
      console.log(`Description: ${page.description || 'none'}`);
      console.log(`---`);
    }

    // Get categories
    const categories = await db.collection('pagecategories').find({}).toArray();
    console.log('\nAvailable Categories:');
    for (const cat of categories) {
      console.log(`  - ${cat.identifier} (${cat.name}): ${cat._id.toString()}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
};

main();
