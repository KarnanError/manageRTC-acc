/**
 * Sync Anu Arun's clerkUserId between MongoDB and Clerk
 *
 * This script:
 * 1. Reads Anu Arun's email from MongoDB
 * 2. Looks up her actual Clerk user ID by email
 * 3. Updates the MongoDB employee record with the correct clerkUserId
 * 4. Also ensures Clerk metadata has the correct employeeId/companyId
 *
 * Run: node backend/seed/syncAnuClerkUserId.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/clerk-sdk-node';

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9';
const EMPLOYEE_ID = 'EMP-2865';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function syncAnuClerkUserId() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    const db = client.db(COMPANY_ID);

    console.log('============================================');
    console.log('SYNCING ANU ARUN CLERK USER ID');
    console.log('============================================\n');

    // Step 1: Get Anu Arun from MongoDB
    const anu = await db.collection('employees').findOne({ employeeId: EMPLOYEE_ID });

    if (!anu) {
      console.log(`❌ Employee ${EMPLOYEE_ID} not found in MongoDB!`);
      return;
    }

    console.log('MongoDB employee record:');
    console.log(`  employeeId : ${anu.employeeId}`);
    console.log(`  name       : ${anu.firstName} ${anu.lastName}`);
    console.log(`  email      : ${anu.email}`);
    console.log(`  clerkUserId: ${anu.clerkUserId || 'NOT SET'}`);
    console.log(`  userId     : ${anu.userId || 'NOT SET'}`);
    console.log('');

    if (!anu.email) {
      console.log('❌ Employee has no email address — cannot look up in Clerk!');
      return;
    }

    // Step 2: Find the user in Clerk by email
    console.log(`Looking up Clerk user by email: ${anu.email}...`);
    const userList = await clerk.users.getUserList({ emailAddress: [anu.email] });

    if (!userList.data || userList.data.length === 0) {
      console.log(`❌ No Clerk user found with email: ${anu.email}`);
      console.log('');
      console.log('Manual fix: Have Anu Arun log in and run in browser console:');
      console.log('  window.Clerk.user.id');
      console.log('Then run:');
      console.log(`  node backend/seed/updateAnuClerkUserId.js <CLERK_USER_ID>`);
      return;
    }

    const clerkUser = userList.data[0];
    const actualClerkUserId = clerkUser.id;

    console.log(`✅ Found Clerk user: ${actualClerkUserId}`);
    console.log(`   email: ${clerkUser.primaryEmailAddress?.emailAddress}`);
    console.log(`   currentMetadata: ${JSON.stringify(clerkUser.publicMetadata)}`);
    console.log('');

    // Step 3: Update MongoDB employee record if clerkUserId is wrong
    if (anu.clerkUserId === actualClerkUserId) {
      console.log('✅ clerkUserId in MongoDB is already correct — no update needed.');
    } else {
      console.log(`Updating MongoDB: clerkUserId "${anu.clerkUserId}" → "${actualClerkUserId}"`);
      const result = await db.collection('employees').updateOne(
        { employeeId: EMPLOYEE_ID },
        { $set: { clerkUserId: actualClerkUserId, userId: actualClerkUserId } }
      );
      if (result.modifiedCount > 0) {
        console.log('✅ MongoDB employee record updated successfully!');
      } else {
        console.log('⚠️  MongoDB update did not modify any document (may already be correct).');
      }
    }

    // Step 4: Ensure Clerk metadata has correct employeeId and companyId
    const currentMeta = clerkUser.publicMetadata || {};
    const needsMetaUpdate =
      currentMeta.employeeId !== EMPLOYEE_ID ||
      currentMeta.companyId !== COMPANY_ID;

    if (needsMetaUpdate) {
      console.log('');
      console.log('Updating Clerk metadata...');
      console.log(`  Before: ${JSON.stringify(currentMeta)}`);

      await clerk.users.updateUser(actualClerkUserId, {
        publicMetadata: {
          ...currentMeta,
          employeeId: EMPLOYEE_ID,
          companyId: COMPANY_ID,
          role: currentMeta.role || 'employee',
        },
      });

      console.log('✅ Clerk metadata updated!');
      console.log(`  After: employeeId=${EMPLOYEE_ID}, companyId=${COMPANY_ID}, role=${currentMeta.role || 'employee'}`);
    } else {
      console.log('✅ Clerk metadata already correct — no update needed.');
    }

    console.log('');
    console.log('============================================');
    console.log('DONE — Summary');
    console.log('============================================');
    console.log(`  Employee     : ${anu.firstName} ${anu.lastName} (${EMPLOYEE_ID})`);
    console.log(`  Clerk userId : ${actualClerkUserId}`);
    console.log(`  MongoDB updated: clerkUserId is now correct`);
    console.log(`  Clerk updated  : employeeId and companyId are now correct`);
    console.log('');
    console.log('⚠️  Anu Arun should sign out and sign back in to refresh her session.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

syncAnuClerkUserId();
