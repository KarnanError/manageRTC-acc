/**
 * Employee Balance Field Diagnostic Script
 * Determines which field name is actually used in the database
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const COMPANY_ID = '6982468548550225cc5585a9'; // amasQIS.ai

async function diagnoseEmployeeBalanceField() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(COMPANY_ID);
    const employees = db.collection('employees');

    // Get a sample employee
    const sampleEmployee = await employees.findOne({
      isDeleted: { $ne: true }
    });

    if (!sampleEmployee) {
      console.log('❌ No employees found in database');
      return;
    }

    console.log('=== EMPLOYEE BALANCE FIELD DIAGNOSTIC ===\n');
    console.log(`Sample Employee: ${sampleEmployee.employeeId} (${sampleEmployee.firstName} ${sampleEmployee.lastName})\n`);

    // Check for different field names
    const hasLeaveBalances = sampleEmployee.hasOwnProperty('leaveBalances');
    const hasLeaveBalance = sampleEmployee.hasOwnProperty('leaveBalance');
    const hasLeaveBalanceBalances = sampleEmployee.leaveBalance?.hasOwnProperty('balances');

    console.log('Field Presence Check:');
    console.log(`  leaveBalances (array):         ${hasLeaveBalances ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`  leaveBalance (object):          ${hasLeaveBalance ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`  leaveBalance.balances (nested): ${hasLeaveBalanceBalances ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log('');

    // Check array length if exists
    if (hasLeaveBalances && Array.isArray(sampleEmployee.leaveBalances)) {
      console.log(`  leaveBalances array length: ${sampleEmployee.leaveBalances.length}`);
      if (sampleEmployee.leaveBalances.length > 0) {
        console.log('  Sample entry:');
        console.log(`    ${JSON.stringify(sampleEmployee.leaveBalances[0], null, 2)}`);
      }
    }

    if (hasLeaveBalanceBalances && Array.isArray(sampleEmployee.leaveBalance?.balances)) {
      console.log(`  leaveBalance.balances array length: ${sampleEmployee.leaveBalance.balances.length}`);
      if (sampleEmployee.leaveBalance.balances.length > 0) {
        console.log('  Sample entry:');
        console.log(`    ${JSON.stringify(sampleEmployee.leaveBalance.balances[0], null, 2)}`);
      }
    }
    console.log('');

    // Count employees with each field type
    const leaveBalancesCount = await employees.countDocuments({
      leaveBalances: { $exists: true, $type: 'array' },
      isDeleted: { $ne: true }
    });

    const leaveBalanceBalancesCount = await employees.countDocuments({
      'leaveBalance.balances': { $exists: true, $type: 'array' },
      isDeleted: { $ne: true }
    });

    const totalEmployees = await employees.countDocuments({
      isDeleted: { $ne: true }
    });

    console.log('Field Usage Across All Employees:');
    console.log(`  Total employees: ${totalEmployees}`);
    console.log(`  Has leaveBalances: ${leaveBalancesCount} (${((leaveBalancesCount/totalEmployees)*100).toFixed(1)}%)`);
    console.log(`  Has leaveBalance.balances: ${leaveBalanceBalancesCount} (${((leaveBalanceBalancesCount/totalEmployees)*100).toFixed(1)}%)`);
    console.log('');

    // RECOMMENDATION
    console.log('=== RECOMMENDATION ===\n');

    if (leaveBalancesCount > leaveBalanceBalancesCount) {
      console.log('✅ RECOMMENDED: Use employee.leaveBalances (array)');
      console.log('   This field exists in more employee documents.');
      console.log('\n   Files to update:');
      console.log('   - backend/services/leaves/leaveLedger.service.js (line 149)');
      console.log('     Change: employee.leaveBalance.balances → employee.leaveBalances');
    } else if (leaveBalanceBalancesCount > leaveBalancesCount) {
      console.log('✅ RECOMMENDED: Use employee.leaveBalance.balances (nested array)');
      console.log('   This field exists in more employee documents.');
      console.log('\n   Files to update:');
      console.log('   - backend/controllers/rest/leave.controller.js (lines 116, 959, 970, etc.)');
      console.log('     Change: employee.leaveBalances → employee.leaveBalance.balances');
    } else if (leaveBalancesCount === 0 && leaveBalanceBalancesCount === 0) {
      console.log('❌ CRITICAL: No balance field found in any employee documents!');
      console.log('   This is why the leave ledger page shows 0/0 for everyone.');
      console.log('\n   FIX REQUIRED: Run the initialization script:');
      console.log('   node backend/seed/initializeLeaveLedger.js');
    } else {
      console.log('⚠️  WARNING: Both fields exist in different documents');
      console.log('   Data inconsistency detected. Standardization required.');
      console.log('\n   RECOMMENDED: Migrate all to employee.leaveBalance.balances');
    }

    console.log('\n=== CODE SEARCH RESULTS ===\n');

    // Search for usage in code
    const fs = await import('fs');
    const path = await import('path');

    const searchInFile = async (filePath, searchTerm) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const matches = [];
        lines.forEach((line, index) => {
          if (line.includes(searchTerm)) {
            matches.push(`${index + 1}: ${line.trim()}`);
          }
        });
        return matches;
      } catch {
        return [];
      }
    };

    const backendPath = 'backend/controllers';

    console.log('Files using "leaveBalances":');
    const filesUsingLeaveBalances = [
      'backend/controllers/rest/leave.controller.js',
    ];

    for (const file of filesUsingLeaveBalances) {
      const matches = await searchInFile(file, 'leaveBalances');
      if (matches.length > 0) {
        console.log(`  ${file}:`);
        matches.slice(0, 3).forEach(m => console.log(`    ${m}`));
        if (matches.length > 3) console.log(`    ... and ${matches.length - 3} more`);
      }
    }

    console.log('\nFiles using "leaveBalance":');
    const filesUsingLeaveBalance = [
      'backend/services/leaves/leaveLedger.service.js',
    ];

    for (const file of filesUsingLeaveBalance) {
      const matches = await searchInFile(file, 'leaveBalance');
      if (matches.length > 0) {
        console.log(`  ${file}:`);
        matches.slice(0, 3).forEach(m => console.log(`    ${m}`));
        if (matches.length > 3) console.log(`    ... and ${matches.length - 3} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

diagnoseEmployeeBalanceField();
