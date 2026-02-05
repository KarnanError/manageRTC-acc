/**
 * Attendance Migration Script
 *
 * This script migrates existing attendance records to populate:
 * - employee: ObjectId reference to Employee collection
 * - employeeId: String ID (e.g., "EMP-2026-0001")
 * - employeeName: Denormalized employee name
 *
 * Run this script once after deploying the schema changes to ensure
 * all existing records have the correct field structure.
 *
 * Usage:
 *   node backend/migrations/migrateAttendanceEmployeeFields.js
 */

import { ObjectId } from 'mongodb';
import { connectDB, getTenantCollections } from '../config/db.js';

/**
 * Migrate attendance records for a single tenant (company)
 */
async function migrateTenantAttendance(tenantDbName) {
  console.log(`\n========================================`);
  console.log(`Migrating attendance for tenant: ${tenantDbName}`);
  console.log(`========================================`);

  const collections = getTenantCollections(tenantDbName);

  // Find all attendance records missing the 'employee' field
  const attendanceMissingEmployee = await collections.attendance.find({
    employee: { $exists: false },
    isDeleted: { $ne: true }
  }).toArray();

  console.log(`Found ${attendanceMissingEmployee.length} attendance records missing 'employee' field`);

  if (attendanceMissingEmployee.length === 0) {
    console.log('No migration needed for this tenant');
    return { success: true, migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  // Process each attendance record
  for (const attendance of attendanceMissingEmployee) {
    try {
      // Skip if no employeeId
      if (!attendance.employeeId) {
        console.warn(`  ⚠️  Attendance ${attendance._id} has no employeeId - skipping`);
        errors++;
        continue;
      }

      // Find the employee document by employeeId string
      const employee = await collections.employees.findOne({
        employeeId: attendance.employeeId,
        isDeleted: { $ne: true }
      });

      if (!employee) {
        console.warn(`  ⚠️  Employee not found for employeeId: ${attendance.employeeId} - attendance ${attendance._id}`);
        errors++;
        continue;
      }

      // Build update object
      const updateObj = {
        employee: employee._id
      };

      // Also update employeeName if missing or incorrect
      if (!attendance.employeeName) {
        updateObj.employeeName = `${employee.firstName} ${employee.lastName}`;
      }

      // Update the attendance record
      const result = await collections.attendance.updateOne(
        { _id: attendance._id },
        { $set: updateObj }
      );

      if (result.modifiedCount > 0) {
        migrated++;
        console.log(`  ✅ Updated attendance ${attendance._id} (${attendance.employeeId}) → employee: ${employee._id}`);
      } else {
        console.warn(`  ⚠️  No changes made to attendance ${attendance._id}`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing attendance ${attendance._id}:`, error.message);
      errors++;
    }
  }

  console.log(`\nTenant migration complete:`);
  console.log(`  ✅ Migrated: ${migrated}`);
  console.log(`  ❌ Errors: ${errors}`);

  return { success: true, migrated, errors };
}

/**
 * Main migration function
 * Migrates attendance across all tenants or a specific tenant
 */
async function runMigration(tenantDbName = null) {
  console.log('==========================================');
  console.log('Attendance Employee Field Migration');
  console.log('==========================================');
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    let totalMigrated = 0;
    let totalErrors = 0;

    if (tenantDbName) {
      // Migrate specific tenant
      const result = await migrateTenantAttendance(tenantDbName);
      totalMigrated = result.migrated;
      totalErrors = result.errors;
    } else {
      // Get all company databases
      const { getsuperadminCollections } = await import('../config/db.js');
      const superAdminCollections = getsuperadminCollections();

      // Get all companies
      const companies = await superAdminCollections.companiesCollection
        .find({ isActive: true, isDeleted: { $ne: true } })
        .toArray();

      console.log(`\nFound ${companies.length} active companies to migrate`);

      // Migrate each tenant
      for (const company of companies) {
        const result = await migrateTenantAttendance(company.dbName || company.companyId);
        totalMigrated += result.migrated;
        totalErrors += result.errors;
      }
    }

    console.log('\n==========================================');
    console.log('Migration Summary');
    console.log('==========================================');
    console.log(`Total records migrated: ${totalMigrated}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Completed at: ${new Date().toISOString()}`);

    if (totalErrors === 0) {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Migration completed with some errors. Review logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
const tenantArg = process.argv[2]; // Optional: pass tenant DB name as argument
runMigration(tenantArg);
