/**
 * Script to clean up duplicate or soft-deleted employee records
 * Run with: node scripts/cleanup-duplicate-employee.js <email>
 */

import dotenv from 'dotenv';
import { connectDB, getTenantCollections } from '../config/db.js';

dotenv.config();

const cleanupEmployeeByEmail = async (email) => {
  try {
    console.log(`\n=== Cleaning up employee records for: ${email} ===\n`);

    // Connect to database
    await connectDB();

    // Get all companies and check each one
    const { client } = await connectDB();
    const db = client.db('managertcdev');
    const companies = await db.collection('companies').find({}).toArray();

    console.log(`Found ${companies.length} companies to check...\n`);

    let totalFound = 0;
    let totalDeleted = 0;

    for (const company of companies) {
      const companyId = company._id.toString();
      console.log(`\nChecking company: ${company.companyName} (${companyId})`);

      // Get tenant collections for this company
      const collections = getTenantCollections(companyId);

      // Find all employees with this email (including soft-deleted)
      const employees = await collections.employees.find({
        'contact.email': email
      }).toArray();

      if (employees.length > 0) {
        console.log(`  Found ${employees.length} employee record(s):`);

        for (const emp of employees) {
          console.log(`    - ID: ${emp._id}`);
          console.log(`      Name: ${emp.firstName} ${emp.lastName}`);
          console.log(`      Email: ${emp.contact?.email}`);
          console.log(`      Employee ID: ${emp.employeeId}`);
          console.log(`      Status: ${emp.status}`);
          console.log(`      IsDeleted: ${emp.isDeleted || false}`);
          console.log(`      Created: ${emp.createdAt}`);
          totalFound++;
        }

        // Delete ALL records (including soft-deleted ones)
        const deleteResult = await collections.employees.deleteMany({
          'contact.email': email
        });

        console.log(`  ✓ Permanently deleted ${deleteResult.deletedCount} record(s)`);
        totalDeleted += deleteResult.deletedCount;
      } else {
        console.log(`  No records found`);
      }
    }

    console.log(`\n=== Cleanup Summary ===`);
    console.log(`Total records found: ${totalFound}`);
    console.log(`Total records deleted: ${totalDeleted}`);
    console.log(`\nThe email ${email} is now available for use.\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up employee:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Error: Please provide an email address');
  console.log('Usage: node scripts/cleanup-duplicate-employee.js <email>');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Error: Invalid email format');
  process.exit(1);
}

// Run cleanup
cleanupEmployeeByEmail(email);
