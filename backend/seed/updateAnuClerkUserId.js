/**
 * Update Anu Arun's Clerk UserId
 * Run: node backend/seed/updateAnuClerkUserId.js <CLERK_USER_ID>
 * Example: node backend/seed/updateAnuClerkUserId.js user_39Bnp8VnoVEGdzU6eo4oNndh9rR
 */

import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

async function updateAnuClerkUserId() {
  const clerkUserId = process.argv[2];

  if (!clerkUserId) {
    console.log('Usage: node seed/updateAnuClerkUserId.js <CLERK_USER_ID>');
    console.log('Example: node seed/updateAnuClerkUserId.js user_39Bnp8VnoVEGdzU6eo4oNndh9rR');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const companyDb = client.db('6982468548550225cc5585a9');

    console.log('============================================');
    console.log('UPDATING ANU ARUN CLERK USER ID');
    console.log('============================================\n');

    const result = await companyDb.collection('employees').updateOne(
      { employeeId: 'EMP-2865' },
      { $set: { clerkUserId: clerkUserId } }
    );

    if (result.matchedCount > 0) {
      console.log('✅ Successfully updated clerkUserId for EMP-2865');
      console.log('   New clerkUserId:', clerkUserId);
      console.log('');
      console.log('Anu Arun should now see the correct leave balance!');
    } else {
      console.log('❌ Employee not found!');
    }

  } finally {
    await client.close();
  }
}

updateAnuClerkUserId().catch(console.error);
