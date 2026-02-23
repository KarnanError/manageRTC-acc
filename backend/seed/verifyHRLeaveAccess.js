/**
 * Quick verification of HR leave page access
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const main = async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('AmasQIS');

  const hrRole = await db.collection('roles').findOne({ name: 'hr' });
  const pages = await db.collection('pages').find({
    name: { $in: ['hrm.leaves-menu', 'hrm.attendance-leave-menu', 'hrm.team-leaves', 'hrm.leave-calendar', 'hrm.leave-ledger'] }
  }).toArray();

  console.log('HR Role Permissions for Leave Pages:');
  console.log('='.repeat(50));

  for (const page of pages) {
    const perm = await db.collection('permissions').findOne({ pageId: page._id });
    const rp = await db.collection('role_permissions').findOne({ roleId: hrRole._id, permissionId: perm._id });
    const status = rp ? 'HAS ACCESS' : 'NO ACCESS';
    console.log(`${page.displayName}: ${status}`);
  }

  await client.close();
};
main().catch(console.error);
