// Manual company database initialization script
// Run this after manually creating a company record in AmasQIS.companies

import { initializeCompanyDatabase } from './utils/initializeCompanyDatabase.js';
import { seedDatabase } from './utils/seedDatabase.js';
import { connectDB } from './config/db.js';

const manualInitCompany = async () => {
  try {
    // The company ID from your AmasQIS.companies record
    const companyId = "697109fed7babdfc38d0305c";

    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Step 1: Initialize database structure (collections + default data)
    console.log(`\n🔧 Initializing database for company: ${companyId}`);
    const initResult = await initializeCompanyDatabase(companyId);
    
    if (!initResult.done) {
      console.error(`❌ Database initialization failed:`, initResult.error);
      process.exit(1);
    }
    
    console.log(`✅ ${initResult.message}`);
    console.log('   - Created 56 collections');
    console.log('   - Added default departments');
    console.log('   - Added default leave types');
    console.log('   - Added default asset categories');
    console.log('   - Added default task statuses');

    // Step 2: Ask if user wants to seed mock data
    console.log(`\n📦 Seeding mock data for company: ${companyId}`);
    const seedResult = await seedDatabase(companyId);
    
    if (seedResult.done) {
      console.log('✅ Mock data seeded successfully!');
      console.log('   Summary:', seedResult.summary);
    } else {
      console.log('⚠️ Seeding skipped or failed:', seedResult.error);
    }

    console.log('\n🎉 Company database setup complete!');
    console.log(`\nCompany ID: ${companyId}`);
    console.log('Database Name: 697109fed7babdfc38d0305c');
    console.log('\n📝 Next steps:');
    console.log('1. Assign this companyId to a Clerk user via public metadata');
    console.log('2. User metadata should include: { "companyId": "697109fed7babdfc38d0305c", "role": "admin" }');
    console.log('3. User can now login and access their company database');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

manualInitCompany();
