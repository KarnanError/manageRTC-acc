/**
 * Script to fix employeeId in Clerk metadata
 * Finds employees by email and updates their Clerk publicMetadata with employeeId
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/clerk-sdk-node';
dotenv.config();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai

async function fixEmployeeMetadata() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(COMPANY_ID);
    const employees = db.collection('employees');

    // Find all employees
    const allEmployees = await employees.find({ isDeleted: { $ne: true } }).toArray();

    console.log(`=== Found ${allEmployees.length} employees ===\n`);

    let updated = 0;
    let notFound = 0;

    for (const emp of allEmployees) {
      const email = emp.email;
      const employeeId = emp.employeeId;
      const firstName = emp.firstName;
      const lastName = emp.lastName;

      console.log(`Checking: ${firstName} ${lastName} (${employeeId}) - ${email}`);

      try {
        // Find user by email in Clerk
        const userList = await clerk.users.getUserList({
          emailAddress: [email]
        });

        if (userList.data && userList.data.length > 0) {
          const clerkUser = userList.data[0];
          const currentMetadata = clerkUser.publicMetadata || {};

          console.log(`  Clerk user found: ${clerkUser.id}`);

          // Check if employeeId is missing or incorrect
          if (currentMetadata.employeeId !== employeeId) {
            console.log(`  ❌ Missing/incorrect employeeId: "${currentMetadata.employeeId}"`);
            console.log(`  ✅ Should be: "${employeeId}"`);

            // Update Clerk user metadata
            await clerk.users.updateUser(clerkUser.id, {
              publicMetadata: {
                ...currentMetadata,
                employeeId: employeeId,
                companyId: COMPANY_ID,
                role: currentMetadata.role || 'employee'
              }
            });

            console.log(`  ✅ Updated Clerk metadata for ${email}`);
            updated++;
          } else {
            console.log(`  ✅ Already correct (${employeeId})`);
          }
        } else {
          console.log(`  ⚠️  No Clerk user found with email: ${email}`);
          notFound++;
        }
      } catch (clerkError) {
        console.log(`  ❌ Error updating ${email}: ${clerkError.message}`);
        notFound++;
      }

      console.log('');
    }

    console.log('=== SUMMARY ===');
    console.log(`Total employees: ${allEmployees.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Not found in Clerk: ${notFound}`);
    console.log('\n✅ Done!');

    console.log('\n⚠️  IMPORTANT: After metadata update, users may need to:');
    console.log('   1. Sign out and sign back in OR');
    console.log('   2. Or use the "Refresh Metadata" button in their profile');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixEmployeeMetadata();
