/**
 * Migration Script: Add Ledger Entries for Existing Approved/Cancelled Leaves
 * This script creates ledger entries for leaves that were approved/cancelled
 * BEFORE Phase 2 implementation (when ledger entries were not created)
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai

async function migrateExistingLeaves() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(COMPANY_ID);
    const leaves = db.collection('leaves');
    const leaveLedger = db.collection('leaveLedger');
    const employees = db.collection('employees');

    console.log('=== MIGRATING EXISTING LEAVES TO LEDGER ===\n');

    // STEP 1: Migrate APPROVED leaves
    console.log('STEP 1: Migrating APPROVED leaves...');
    const approvedLeaves = await leaves.find({
      status: 'approved',
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`  Found ${approvedLeaves.length} approved leave(s) to migrate\n`);

    let approvedMigrated = 0;
    let approvedSkipped = 0;

    for (const leave of approvedLeaves) {
      // Check if ledger entry already exists
      const existingEntry = await leaveLedger.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType?.toLowerCase(),
        transactionType: 'used',
        leaveRequestId: leave._id.toString(),
        isDeleted: { $ne: true }
      });

      if (existingEntry) {
        console.log(`  ⏭️  Skipping ${leave._id.toString().slice(-8)}: Ledger entry already exists`);
        approvedSkipped++;
        continue;
      }

      // Get employee to find approver name
      const approver = await employees.findOne({
        employeeId: leave.updatedBy || leave.approvedBy
      });

      const approverName = approver
        ? `${approver.firstName} ${approver.lastName}`
        : 'System';

      // Get latest ledger entry before this leave approval
      const latestEntry = await leaveLedger.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType?.toLowerCase(),
        isDeleted: { $ne: true }
      }, {
        sort: { transactionDate: -1 }
      });

      const balanceBefore = latestEntry ? latestEntry.balanceAfter : 0;
      const balanceAfter = balanceBefore - leave.duration;
      const now = new Date();
      const year = now.getFullYear();

      // Create the ledger entry
      const entry = {
        employeeId: leave.employeeId,
        companyId: COMPANY_ID,
        leaveType: leave.leaveType?.toLowerCase(),
        transactionType: 'used',
        amount: -leave.duration,
        balanceBefore,
        balanceAfter,
        leaveRequestId: leave._id.toString(),
        transactionDate: leave.updatedAt || leave.approvedAt || now,
        financialYear: `FY${year}-${year + 1}`,
        year,
        month: now.getMonth() + 1,
        description: `Leave approved by ${approverName}`,
        details: {
          startDate: leave.startDate,
          endDate: leave.endDate,
          duration: leave.duration
        },
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        migrated: true, // Flag to indicate this was migrated
        migrationDate: now
      };

      await leaveLedger.insertOne(entry);
      approvedMigrated++;
      console.log(`  ✅ Migrated ${leave._id.toString().slice(-8)}: ${leave.leaveType} -${leave.duration} days (balance: ${balanceBefore} → ${balanceAfter})`);
    }

    console.log(`\n  APPROVED: ${approvedMigrated} migrated, ${approvedSkipped} skipped\n`);

    // STEP 2: Migrate CANCELLED leaves (that were previously approved)
    console.log('STEP 2: Migrating CANCELLED leaves...');
    const cancelledLeaves = await leaves.find({
      status: 'cancelled',
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`  Found ${cancelledLeaves.length} cancelled leave(s) to check\n`);

    let cancelledMigrated = 0;
    let cancelledSkipped = 0;

    for (const leave of cancelledLeaves) {
      // Check if restoration entry already exists
      const existingEntry = await leaveLedger.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType?.toLowerCase(),
        transactionType: 'restored',
        leaveRequestId: leave._id.toString(),
        isDeleted: { $ne: true }
      });

      if (existingEntry) {
        console.log(`  ⏭️  Skipping ${leave._id.toString().slice(-8)}: Restoration entry already exists`);
        cancelledSkipped++;
        continue;
      }

      // Only restore if there was a corresponding 'used' entry
      // (i.e., the leave was approved before being cancelled)
      const usedEntry = await leaveLedger.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType?.toLowerCase(),
        transactionType: 'used',
        leaveRequestId: leave._id.toString(),
        isDeleted: { $ne: true }
      });

      if (!usedEntry) {
        console.log(`  ⏭️  Skipping ${leave._id.toString().slice(-8)}: Was never approved (no 'used' entry to restore)`);
        cancelledSkipped++;
        continue;
      }

      // Get latest ledger entry (which should be the 'used' entry)
      const latestEntry = await leaveLedger.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType?.toLowerCase(),
        isDeleted: { $ne: true }
      }, {
        sort: { transactionDate: -1 }
      });

      const balanceBefore = latestEntry ? latestEntry.balanceAfter : 0;
      const balanceAfter = balanceBefore + leave.duration;
      const now = new Date();
      const year = now.getFullYear();

      // Create the restoration entry
      const entry = {
        employeeId: leave.employeeId,
        companyId: COMPANY_ID,
        leaveType: leave.leaveType?.toLowerCase(),
        transactionType: 'restored',
        amount: leave.duration,
        balanceBefore,
        balanceAfter,
        leaveRequestId: leave._id.toString(),
        transactionDate: leave.updatedAt || leave.cancelledAt || now,
        financialYear: `FY${year}-${year + 1}`,
        year,
        month: now.getMonth() + 1,
        description: 'Leave cancelled - balance restored',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        migrated: true,
        migrationDate: now
      };

      await leaveLedger.insertOne(entry);
      cancelledMigrated++;
      console.log(`  ✅ Migrated ${leave._id.toString().slice(-8)}: ${leave.leaveType} +${leave.duration} days restored (balance: ${balanceBefore} → ${balanceAfter})`);
    }

    console.log(`\n  CANCELLED: ${cancelledMigrated} migrated, ${cancelledSkipped} skipped\n`);

    // STEP 3: Verify final state
    console.log('=== FINAL VERIFICATION ===\n');

    const totalLedgerEntries = await leaveLedger.countDocuments({
      isDeleted: { $ne: true }
    });

    const openingEntries = await leaveLedger.countDocuments({
      transactionType: 'opening',
      isDeleted: { $ne: true }
    });

    const usedEntries = await leaveLedger.countDocuments({
      transactionType: 'used',
      isDeleted: { $ne: true }
    });

    const restoredEntries = await leaveLedger.countDocuments({
      transactionType: 'restored',
      isDeleted: { $ne: true }
    });

    console.log(`Total ledger entries: ${totalLedgerEntries}`);
    console.log(`  Opening balance entries: ${openingEntries}`);
    console.log(`  Usage entries (approved leaves): ${usedEntries}`);
    console.log(`  Restoration entries (cancelled leaves): ${restoredEntries}`);
    console.log('');

    // SUMMARY
    console.log('=== MIGRATION SUMMARY ===\n');
    console.log(`✅ APPROVED leaves: ${approvedMigrated} migrated successfully`);
    console.log(`✅ CANCELLED leaves: ${cancelledMigrated} migrated successfully`);
    console.log(`⏭️  Skipped: ${approvedSkipped + cancelledSkipped} (already had entries or never approved)`);
    console.log('');

    console.log('Next Steps:');
    console.log('  1. Run validation script: node backend/seed/validatePhase2LedgerIntegration.js');
    console.log('  2. Test NEW leave approval/cancellation (after backend restart)');
    console.log('  3. Verify ledger entries appear in frontend');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

migrateExistingLeaves();
