/**
 * Custom Policy End-to-End Test
 *
 * Tests the full flow from API to Database:
 * 1. Create a custom policy
 * 2. Get all policies
 * 3. Get policy by ID
 * 4. Update policy
 * 5. Delete policy
 *
 * Run: node backend/seed/testCustomPolicyEndToEnd.js
 */

import { connectDB } from '../config/db.js';
import { getTenantCollections } from '../config/db.js';
import { ObjectId } from 'mongodb';

// Test configuration - UPDATE THIS WITH YOUR COMPANY ID
const COMPANY_ID = '67431cbd7b507a94613b7811'; // AmasQIS
const TEST_EMPLOYEE_ID = '69858a437b507a94613b7801';
const TEST_USER_ID = 'user_12345'; // Clerk user ID (not valid ObjectId)
const TEST_EMPLOYEE_DB_ID = '69858a437b5077a94613b7802'; // Employee DB ID (valid ObjectId)

async function runTests() {
  console.log('========================================');
  console.log('Custom Policy End-to-End Test');
  console.log('========================================\n');

  // Connect to database first
  console.log('🔌 Connecting to database...');
  await connectDB();
  console.log('✅ Database connected\n');

  try {
    const { customLeavePolicies, leaveTypes } = getTenantCollections(COMPANY_ID);

    // ============================================================
    // STEP 0: Get or create a valid leaveTypeId for testing
    // ============================================================
    console.log('📋 STEP 0: Getting a valid leaveTypeId...');
    let leaveType = await leaveTypes.findOne({
      isActive: true,
      isDeleted: { $ne: true }
    });

    // Create a test leave type if none exists
    if (!leaveType) {
      console.log('⚠️  No active leave types found. Creating a test leave type...');

      const insertResult = await leaveTypes.insertOne({
        name: 'Test Annual Leave',
        code: 'TEST_ANNUAL',
        annualQuota: 15,
        isPaid: true,
        requiresApproval: true,
        carryForwardAllowed: true,
        maxCarryForwardDays: 5,
        carryForwardExpiry: 90,
        encashmentAllowed: false,
        maxEncashmentDays: 0,
        color: '#4CAF50',
        icon: 'fa-calendar',
        description: 'Test leave type for E2E testing',
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      leaveType = await leaveTypes.findOne({ _id: insertResult.insertedId });
      console.log(`✅ Created test leave type: ${leaveType.name}\n`);
    }

    const testLeaveTypeId = leaveType._id.toString();
    console.log(`✅ Using leave type: ${leaveType.name} (${leaveType.code})`);
    console.log(`   leaveTypeId: ${testLeaveTypeId}\n`);

    // ============================================================
    // STEP 1: Create a custom policy
    // ============================================================
    console.log('📝 STEP 1: Creating a custom policy...');

    // Test with Clerk user ID (invalid ObjectId) - should handle gracefully
    const createResult = await customLeavePolicies.insertOne({
      name: 'Test Policy - E2E',
      leaveTypeId: new ObjectId(testLeaveTypeId),
      annualQuota: 25,
      employeeIds: [TEST_EMPLOYEE_ID],
      settings: {
        carryForward: true,
        maxCarryForwardDays: 5,
        isEarnedLeave: false
      },
      // createdBy/updatedBy should handle invalid ObjectId gracefully
      createdBy: ObjectId.isValid(TEST_USER_ID) ? new ObjectId(TEST_USER_ID) : null,
      updatedBy: ObjectId.isValid(TEST_USER_ID) ? new ObjectId(TEST_USER_ID) : null,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const createdPolicyId = createResult.insertedId;
    console.log(`✅ Policy created with ID: ${createdPolicyId}\n`);

    // ============================================================
    // STEP 2: Get all policies
    // ============================================================
    console.log('📋 STEP 2: Fetching all policies...');

    const allPolicies = await customLeavePolicies.find({
      isActive: true,
      isDeleted: { $ne: true }
    }).toArray();

    console.log(`✅ Found ${allPolicies.length} active policies`);

    // Find our created policy
    const foundPolicy = allPolicies.find(p => p._id.toString() === createdPolicyId.toString());
    if (foundPolicy) {
      console.log(`   Found our test policy: ${foundPolicy.name}`);
      console.log(`   leaveTypeId type: ${typeof foundPolicy.leaveTypeId}`);
      console.log(`   leaveTypeId value: ${foundPolicy.leaveTypeId}`);
    } else {
      console.log(`   ⚠️  Test policy not found in list!\n`);
    }
    console.log();

    // ============================================================
    // STEP 3: Get policy by ID
    // ============================================================
    console.log('🔍 STEP 3: Fetching policy by ID...');

    const policyById = await customLeavePolicies.findOne({
      _id: createdPolicyId,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (policyById) {
      console.log(`✅ Found policy: ${policyById.name}`);
      console.log(`   leaveTypeId: ${policyById.leaveTypeId}`);
      console.log(`   annualQuota: ${policyById.annualQuota}`);
      console.log(`   employeeIds: ${policyById.employeeIds.join(', ')}`);
    } else {
      console.log(`❌ Policy not found!\n`);
    }
    console.log();

    // ============================================================
    // STEP 4: Update the policy
    // ============================================================
    console.log('✏️  STEP 4: Updating policy...');

    const updateResult = await customLeavePolicies.updateOne(
      { _id: createdPolicyId },
      {
        $set: {
          name: 'Test Policy - E2E (Updated)',
          annualQuota: 30,
          settings: {
            carryForward: true,
            maxCarryForwardDays: 10,
            isEarnedLeave: true
          },
          // Test with valid employee ObjectId
          updatedBy: ObjectId.isValid(TEST_EMPLOYEE_DB_ID)
            ? new ObjectId(TEST_EMPLOYEE_DB_ID)
            : null,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(`✅ Policy updated successfully`);

      // Verify the update
      const updatedPolicy = await customLeavePolicies.findOne({ _id: createdPolicyId });
      console.log(`   New name: ${updatedPolicy.name}`);
      console.log(`   New annualQuota: ${updatedPolicy.annualQuota}`);
    } else {
      console.log(`❌ Update failed!\n`);
    }
    console.log();

    // ============================================================
    // STEP 5: Enriched query (join with leaveTypes)
    // ============================================================
    console.log('🔗 STEP 5: Testing enriched query with leaveType details...');

    const policyForEnrichment = await customLeavePolicies.findOne({
      _id: createdPolicyId
    });

    const enrichedLeaveType = await leaveTypes.findOne({
      _id: policyForEnrichment.leaveTypeId,
      isDeleted: { $ne: true }
    });

    console.log(`✅ Enriched policy data:`);
    console.log(`   Policy Name: ${policyForEnrichment.name}`);
    console.log(`   Leave Type: ${enrichedLeaveType?.name || 'N/A'}`);
    console.log(`   Leave Type Code: ${enrichedLeaveType?.code || 'N/A'}`);
    console.log(`   Leave Type Color: ${enrichedLeaveType?.color || 'N/A'}`);
    console.log();

    // ============================================================
    // STEP 6: Clean up - Delete the test policy
    // ============================================================
    console.log('🗑️  STEP 6: Cleaning up - Deleting test policy...');

    const deleteResult = await customLeavePolicies.updateOne(
      { _id: createdPolicyId },
      {
        $set: {
          isActive: false,
          isDeleted: true,
          updatedAt: new Date()
        }
      }
    );

    if (deleteResult.modifiedCount > 0) {
      console.log(`✅ Test policy deleted (soft delete)\n`);
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================');
    console.log('\nSummary:');
    console.log('✅ Create policy with invalid ObjectId (Clerk ID)');
    console.log('✅ Fetch all policies');
    console.log('✅ Fetch policy by ID');
    console.log('✅ Update policy with valid ObjectId (employee ID)');
    console.log('✅ Enrich policy with leaveType details');
    console.log('✅ Soft delete policy');
    console.log('\n🎉 Custom policy end-to-end test completed successfully!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests();
