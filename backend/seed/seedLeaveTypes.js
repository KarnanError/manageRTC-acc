/**
 * Seed Default Leave Types for Existing Companies
 *
 * Run: node seed/seedLeaveTypes.js [companyId]
 *
 * If companyId is not provided, seeds for all companies found in AmasQIS.companies
 * If companyId is provided, seeds only for that company
 *
 * Leave types are stored in each company's own database (named by companyId)
 * in the leaveTypes collection.
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';

const getDefaultLeaveTypes = (companyId) => {
  const now = new Date();
  const ts = Date.now();
  return [
    {
      leaveTypeId: `LT-EARNED-${ts}`,
      companyId,
      name: 'Annual Leave',
      code: 'EARNED',
      annualQuota: 15,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: true,
      maxCarryForwardDays: 5,
      carryForwardExpiry: 90,
      encashmentAllowed: true,
      maxEncashmentDays: 10,
      encashmentRatio: 1,
      minNoticeDays: 1,
      maxConsecutiveDays: 0,
      requiresDocument: false,
      acceptableDocuments: [],
      accrualRate: 1.25,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#52c41a',
      icon: 'ti ti-calendar',
      description: 'Annual earned leave for employees',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-SICK-${ts + 1}`,
      companyId,
      name: 'Sick Leave',
      code: 'SICK',
      annualQuota: 10,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 0,
      maxConsecutiveDays: 0,
      requiresDocument: true,
      acceptableDocuments: ['Medical Certificate', "Doctor's Note"],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#f5222d',
      icon: 'ti ti-first-aid-kit',
      description: 'Leave for illness or medical appointments',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-CASUAL-${ts + 2}`,
      companyId,
      name: 'Casual Leave',
      code: 'CASUAL',
      annualQuota: 12,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 1,
      maxConsecutiveDays: 3,
      requiresDocument: false,
      acceptableDocuments: [],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#1890ff',
      icon: 'ti ti-briefcase',
      description: 'Casual leave for personal reasons',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-MATERNITY-${ts + 3}`,
      companyId,
      name: 'Maternity Leave',
      code: 'MATERNITY',
      annualQuota: 90,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 30,
      maxConsecutiveDays: 90,
      requiresDocument: true,
      acceptableDocuments: ['Medical Certificate', "Doctor's Letter"],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#eb2f96',
      icon: 'ti ti-heart',
      description: 'Maternity leave for female employees',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-PATERNITY-${ts + 4}`,
      companyId,
      name: 'Paternity Leave',
      code: 'PATERNITY',
      annualQuota: 5,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 7,
      maxConsecutiveDays: 5,
      requiresDocument: true,
      acceptableDocuments: ['Birth Certificate', 'Hospital Document'],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#722ed1',
      icon: 'ti ti-users',
      description: 'Paternity leave for male employees',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-BEREAVEMENT-${ts + 5}`,
      companyId,
      name: 'Bereavement Leave',
      code: 'BEREAVEMENT',
      annualQuota: 3,
      isPaid: true,
      requiresApproval: false,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 0,
      maxConsecutiveDays: 3,
      requiresDocument: false,
      acceptableDocuments: [],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#8c8c8c',
      icon: 'ti ti-flower',
      description: 'Leave for bereavement of immediate family members',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-COMPENSATORY-${ts + 6}`,
      companyId,
      name: 'Compensatory Off',
      code: 'COMPENSATORY',
      annualQuota: 0,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: true,
      maxCarryForwardDays: 5,
      carryForwardExpiry: 30,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 0,
      maxConsecutiveDays: 0,
      requiresDocument: false,
      acceptableDocuments: [],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#fa8c16',
      icon: 'ti ti-clock',
      description: 'Compensatory off for overtime work',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-UNPAID-${ts + 7}`,
      companyId,
      name: 'Loss of Pay',
      code: 'UNPAID',
      annualQuota: 0,
      isPaid: false,
      requiresApproval: true,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 0,
      maxConsecutiveDays: 0,
      requiresDocument: false,
      acceptableDocuments: [],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#faad14',
      icon: 'ti ti-currency-dollar',
      description: 'Unpaid leave - Loss of Pay',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-SPECIAL-${ts + 8}`,
      companyId,
      name: 'Special Leave',
      code: 'SPECIAL',
      annualQuota: 5,
      isPaid: true,
      requiresApproval: true,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0,
      carryForwardExpiry: 90,
      encashmentAllowed: false,
      maxEncashmentDays: 0,
      encashmentRatio: 0,
      minNoticeDays: 1,
      maxConsecutiveDays: 0,
      requiresDocument: false,
      acceptableDocuments: [],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: '#13c2c2',
      icon: 'ti ti-star',
      description: 'Special leave for extraordinary circumstances',
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const seedLeaveTypesForCompany = async (client, companyId) => {
  try {
    // Use the company's own database
    const companyDb = client.db(companyId);
    const leaveTypesCollection = companyDb.collection('leaveTypes');
    const existing = await leaveTypesCollection.countDocuments({ companyId, isDeleted: { $ne: true } });
    if (existing > 0) {
      console.log(`  ⏭️  Skipping ${companyId} - already has ${existing} leave types`);
      return { skipped: true, count: existing };
    }
    const types = getDefaultLeaveTypes(companyId);
    await leaveTypesCollection.insertMany(types);
    console.log(`  ✅ Seeded ${types.length} leave types for company: ${companyId}`);
    return { skipped: false, count: types.length };
  } catch (error) {
    console.log(`  ❌ Error seeding for ${companyId}:`, error.message);
    return { skipped: true, count: 0, error: error.message };
  }
};

const main = async () => {
  const targetCompanyId = process.argv[2];
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const amasDb = client.db('AmasQIS');
    const companiesCollection = amasDb.collection('companies');

    if (targetCompanyId) {
      // Seed for a specific company
      console.log(`\n🌱 Seeding leave types for company: ${targetCompanyId}`);
      const result = await seedLeaveTypesForCompany(client, targetCompanyId);
      console.log(`\n✅ Done. Result:`, result);
    } else {
      // Seed for all companies
      const companies = await companiesCollection.find({ isDeleted: { $ne: true } }).toArray();
      console.log(`\n🌱 Seeding leave types for ${companies.length} companies...`);

      let seeded = 0;
      let skipped = 0;

      for (const company of companies) {
        const companyId = company._id.toString();
        const result = await seedLeaveTypesForCompany(client, companyId);
        if (!result.skipped) {
          seeded++;
        } else {
          skipped++;
        }
      }

      console.log(`\n✅ Done. Seeded: ${seeded} companies, Skipped: ${skipped} companies`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
};

main();
