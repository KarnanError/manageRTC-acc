/**
 * Fix clerkUserId for Anu Arun
 * This ensures the backend can find the employee when she logs in
 */

import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function fixClerkUserId() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const companyDb = client.db('6982468548550225cc5585a9');

    console.log('============================================');
    console.log('FIXING CLERK USER ID FOR ANU ARUN');
    console.log('============================================\n');

    // Get Anu Arun's employee record
    const anu = await companyDb.collection('employees').findOne({
      employeeId: 'EMP-2865'
    });

    if (!anu) {
      console.log('❌ Employee not found!');
      return;
    }

    console.log('Current employee data:');
    console.log('  - employeeId:', anu.employeeId);
    console.log('  - _id:', anu._id?.toString());
    console.log('  - clerkUserId:', anu.clerkUserId || 'NOT SET');
    console.log('  - userId:', anu.userId || 'NOT SET');
    console.log('  - firstName:', anu.firstName);
    console.log('  - lastName:', anu.lastName);
    console.log('  - email:', anu.email);
    console.log('');

    // Note: The actual Clerk userId needs to be obtained from the Clerk Dashboard
    // For now, we'll ensure the clerkUserId is set correctly
    // User will need to get their Clerk userId from the browser console

    console.log('============================================');
    console.log('INSTRUCTIONS TO FIX');
    console.log('============================================');
    console.log('');
    console.log('1. Have Anu Arun log in to the application');
    console.log('2. Open browser console and run:');
    console.log('   window.Clerk.user.id');
    console.log('');
    console.log('3. Note down the Clerk userId (starts with user_)');
    console.log('');
    console.log('4. Update the employee record with:');
    console.log('   db.employees.updateOne(');
    console.log('     { employeeId: "EMP-2865" },');
    console.log('     { $set: { clerkUserId: "<ACTUAL_CLERK_USER_ID>" } }');
    console.log('   );');
    console.log('');
    console.log('Or use the script below after getting the Clerk userId:');
    console.log('');
    console.log('node backend/seed/updateAnuClerkUserId.js <CLERK_USER_ID>');

  } finally {
    await client.close();
  }
}

fixClerkUserId().catch(console.error);
