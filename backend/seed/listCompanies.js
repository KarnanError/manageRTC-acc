/**
 * List all companies with their IDs
 * Run: node backend/seed/listCompanies.js
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
    const companies = await db.collection('companies')
      .find({ isDeleted: { $ne: true } })
      .toArray();

    console.log(`📋 Found ${companies.length} companies:\n`);

    companies.forEach((c, index) => {
      console.log(`${index + 1}. ${c.name || 'Unnamed'}`);
      console.log(`   Company ID: ${c._id}`);
      console.log(`   Email: ${c.email || 'N/A'}`);
      console.log(`   Status: ${c.status || 'Active'}`);
      console.log('');
    });

    console.log('\n📝 Copy one of these IDs and add it to your Clerk user metadata as "companyId"');
    console.log('    Or set it as DEV_COMPANY_ID in your .env file for development\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
};

main();
