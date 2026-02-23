/**
 * Check the companies collection for database name mapping
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb://localhost:27017';

async function checkCompanies() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // Check all possible databases for companies collection
    const dbNames = ['AmasQIS', 'amasQIS', 'manageRTC', 'managerteam'];

    console.log('=== LOOKING FOR COMPANIES COLLECTION ===\n');

    for (const dbName of dbNames) {
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();

      if (collections.some(c => c.name === 'companies')) {
        console.log(`📁 Found 'companies' collection in database: ${dbName}\n`);

        const companies = await db.collection('companies').find({}).toArray();

        console.log(`Found ${companies.length} companies:\n`);

        companies.forEach(company => {
          console.log(`🏢 ${company.companyName || company.name || 'Unnamed'}`);
          console.log(`   _id: ${company._id}`);
          console.log(`   companyId: ${company.companyId || 'N/A'}`);
          console.log(`   dbName: ${company.dbName || 'N/A'}`);
          console.log(`   databaseName: ${company.databaseName || 'N/A'}`);
          console.log(`   tenantDbName: ${company.tenantDbName || 'N/A'}`);
          console.log(`   email: ${company.email || 'N/A'}`);
          console.log('');
        });
      }
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkCompanies();
