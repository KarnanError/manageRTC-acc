/**
 * Check all companies for custom policies
 */

import { MongoClient } from 'mongodb';

const COMPANY_DB_URI = 'mongodb://localhost:27017';

const COMPANIES = [
  { id: '698195cc0afbe3284fd5aa60', name: 'manageRTC' },
  { id: '6982468548550225cc5585a9', name: 'amasQIS.ai' },
  { id: '6982d04e31086341a9788aed', name: 'Zeninzo' },
  { id: '698856b731b9532153c96c3e', name: 'ABC' },
];

async function checkAllCompanies() {
  const client = new MongoClient(COMPANY_DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    console.log('=== CHECKING ALL COMPANIES FOR CUSTOM POLICIES ===\n');

    for (const company of COMPANIES) {
      console.log(`\n🏢 Company: ${company.name} (${company.id})`);
      console.log('─'.repeat(60));

      const db = client.db(`company_${company.id}`);
      const customLeavePolicies = db.collection('customleavepolicies');
      const employees = db.collection('employees');

      // Check custom policies
      const policiesCount = await customLeavePolicies.countDocuments({
        companyId: company.id,
        isActive: true,
        isDeleted: { $ne: true }
      });

      const policies = await customLeavePolicies.find({
        companyId: company.id,
        isActive: true,
        isDeleted: { $ne: true }
      }).toArray();

      console.log(`   Custom Policies: ${policiesCount}`);

      if (policiesCount > 0) {
        console.log('\n   📋 Policies:');
        policies.forEach(policy => {
          console.log(`      - ${policy.name || 'Unnamed'}`);
          console.log(`        Leave Type: ${policy.leaveType}, Days: ${policy.days}`);
          console.log(`        Employees (${policy.employeeIds?.length || 0}): ${policy.employeeIds?.join(', ') || 'None'}`);
        });
      }

      // Check employees count
      const employeesCount = await employees.countDocuments({
        companyId: company.id,
        isDeleted: { $ne: true }
      });
      console.log(`   Total Employees: ${employeesCount}`);
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkAllCompanies();
