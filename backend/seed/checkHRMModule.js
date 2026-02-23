/**
 * Check HRM Module Configuration
 *
 * Run: node seed/checkHRMModule.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('AmasQIS');

    // Get the HRM module
    const hrmModule = await db.collection('modules').findOne({ code: 'hrm' });

    if (hrmModule) {
      console.log('HRM Module:');
      console.log('  Name:', hrmModule.name);
      console.log('  Code:', hrmModule.code);
      console.log('  Pages count:', hrmModule.pages.length);

      // Check if new leave pages are in the module
      const newLeavePageIds = [
        'hrm.team-leaves',
        'hrm.leave-calendar',
        'hrm.leave-ledger'
      ];

      const modulePageNames = hrmModule.pages.map(p => p.name || p.pageName);
      console.log('\nCurrent pages in module:');
      for (const page of hrmModule.pages) {
        const isNew = newLeavePageIds.includes(page.name || page.pageName);
        console.log(`  ${isNew ? '🆕' : '  '} - ${page.name || page.pageName} (${page.pageId.toString()})`);
      }

      const missing = newLeavePageIds.filter(name => !modulePageNames.includes(name));
      if (missing.length > 0) {
        console.log('\n⚠️ New leave pages NOT in module:', missing);
      } else {
        console.log('\n✅ All new leave pages are in the module');
      }
    } else {
      console.log('❌ HRM module not found');
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
