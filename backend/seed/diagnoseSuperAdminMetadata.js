/**
 * Diagnostic Script to Check Clerk Metadata for SuperAdmin Users
 * Run: node backend/seed/diagnoseSuperAdminMetadata.js
 */

import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: join(__dirname, '../.env') });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function diagnose() {
  console.log('=== DIAGNOSING SUPERADMIN METADATA ===\n');

  // Connect to MongoDB directly
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db('AmasQIS');

  // Get all superadmin users from database
  const dbUsers = await db.collection('superadminusers').find({ isDeleted: false }).toArray();

  console.log(`Found ${dbUsers.length} superadmin users in database:\n`);

  for (const dbUser of dbUsers) {
    console.log('---');
    console.log(`Name: ${dbUser.firstName} ${dbUser.lastName}`);
    console.log(`Email: ${dbUser.email}`);
    console.log(`Clerk User ID: ${dbUser.clerkUserId}`);

    try {
      // Fetch user from Clerk
      const clerkUser = await clerk.users.getUser(dbUser.clerkUserId);

      console.log('\nClerk Metadata:');
      console.log(`  publicMetadata.role: "${clerkUser.publicMetadata?.role}"`);
      console.log(`  publicMetadata.type: ${typeof clerkUser.publicMetadata?.role}`);
      console.log(`  unsafeMetadata.accountType: "${clerkUser.unsafeMetadata?.accountType}"`);

      // Check if role matches expected value
      const expectedRole = 'superadmin';
      const actualRole = clerkUser.publicMetadata?.role;
      const matches = actualRole?.toLowerCase() === expectedRole;

      console.log(`\nRole Check:`);
      console.log(`  Expected: "${expectedRole}"`);
      console.log(`  Actual: "${actualRole}"`);
      console.log(`  Match: ${matches ? '✅ YES' : '❌ NO'}`);

      if (!matches) {
        console.log(`  ⚠️ MISMATCH DETECTED! User will NOT see superadmin menu items!`);
      }

    } catch (clerkError) {
      console.log(`  ❌ Error fetching from Clerk: ${clerkError.message}`);
    }

    console.log('');
  }

  console.log('=== END DIAGNOSIS ===');
  await client.close();
}

diagnose().catch(console.error);
