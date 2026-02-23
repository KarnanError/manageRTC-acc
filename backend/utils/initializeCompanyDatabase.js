// backend/utils/initializeCompanyDatabase.js
import { client } from "../config/db.js";

/**
 * Default leave types to seed for every new company
 */
const getDefaultLeaveTypes = (companyId) => {
  const now = new Date();
  const ts = Date.now();
  return [
    {
      leaveTypeId: `LT-EARNED-${ts}`,
      companyId,
      name: "Annual Leave",
      code: "EARNED",
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
      color: "#52c41a",
      icon: "ti ti-calendar",
      description: "Annual earned leave for employees",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-SICK-${ts + 1}`,
      companyId,
      name: "Sick Leave",
      code: "SICK",
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
      acceptableDocuments: ["Medical Certificate", "Doctor's Note"],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: "#f5222d",
      icon: "ti ti-first-aid-kit",
      description: "Leave for illness or medical appointments",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-CASUAL-${ts + 2}`,
      companyId,
      name: "Casual Leave",
      code: "CASUAL",
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
      color: "#1890ff",
      icon: "ti ti-briefcase",
      description: "Casual leave for personal reasons",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-MATERNITY-${ts + 3}`,
      companyId,
      name: "Maternity Leave",
      code: "MATERNITY",
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
      acceptableDocuments: ["Medical Certificate", "Doctor's Letter"],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: "#eb2f96",
      icon: "ti ti-heart",
      description: "Maternity leave for female employees",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-PATERNITY-${ts + 4}`,
      companyId,
      name: "Paternity Leave",
      code: "PATERNITY",
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
      acceptableDocuments: ["Birth Certificate", "Hospital Document"],
      accrualRate: 0,
      accrualMonth: 1,
      accrualWaitingPeriod: 0,
      color: "#722ed1",
      icon: "ti ti-users",
      description: "Paternity leave for male employees",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-BEREAVEMENT-${ts + 5}`,
      companyId,
      name: "Bereavement Leave",
      code: "BEREAVEMENT",
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
      color: "#8c8c8c",
      icon: "ti ti-flower",
      description: "Leave for bereavement of immediate family members",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-COMPENSATORY-${ts + 6}`,
      companyId,
      name: "Compensatory Off",
      code: "COMPENSATORY",
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
      color: "#fa8c16",
      icon: "ti ti-clock",
      description: "Compensatory off for overtime work",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-UNPAID-${ts + 7}`,
      companyId,
      name: "Loss of Pay",
      code: "UNPAID",
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
      color: "#faad14",
      icon: "ti ti-currency-dollar",
      description: "Unpaid leave - Loss of Pay",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      leaveTypeId: `LT-SPECIAL-${ts + 8}`,
      companyId,
      name: "Special Leave",
      code: "SPECIAL",
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
      color: "#13c2c2",
      icon: "ti ti-star",
      description: "Special leave for extraordinary circumstances",
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

/**
 * Initialize a new database for a company with default collections and data
 * @param {string} companyId - The company's _id to use as database name
 * @returns {Promise<{done: boolean, error?: any}>}
 */
export const initializeCompanyDatabase = async (companyId) => {
  try {
    // Use company ID as database name
    const db = client.db(companyId);

    // Create essential collections with initial schema validation or indexes
    const collectionsToCreate = [
      "employees",
      "departments",
      "designations",
      "projects",
      "clients",
      "tasks",
      "attendance",
      "leaves",
      "leaveTypes",
      "leaveRequests",
      "invoices",
      "deals",
      "activities",
      "todos",
      "schedules",
      "assets",
      "assetCategories",
      "taskstatus",
      "holidays",
      "meetings",
      "notifications",
      "skills",
      "salaryHistory",
      "pipelines",
      "stages",
      "conversations",
      "messages",
      "socialFeeds",
      "follows",
      "hashtags",
      "permissions",
      "policy",
      "notes",
      "candidates",
      "jobApplications",
      "performanceIndicators",
      "performanceAppraisals",
      "performanceReviews",
      "termination",
      "resignation",
      "stats",
      "shifts",
      "timeEntries",
      "overtimeRequests",
    ];

    // Create all collections
    for (const collectionName of collectionsToCreate) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName} in database: ${companyId}`);
      } catch (error) {
        // Collection might already exist, ignore the error
        if (error.code !== 48) {
          // 48 = NamespaceExists
          console.warn(`Warning creating ${collectionName}:`, error.message);
        }
      }
    }

    // Note: No default departments, designations, leave types, or asset categories are created
    // These should be added by the company admin as needed

    // Initialize default task statuses
    const taskStatusCollection = db.collection("taskstatus");
    const defaultTaskStatuses = [
      { key: "todo", name: "To do", colorName: "purple", colorHex: "#6f42c1", order: 1, active: true, createdAt: new Date() },
      { key: "pending", name: "Pending", colorName: "pink", colorHex: "#d63384", order: 2, active: true, createdAt: new Date() },
      { key: "inprogress", name: "Inprogress", colorName: "blue", colorHex: "#0d6efd", order: 3, active: true, createdAt: new Date() },
      { key: "onhold", name: "Onhold", colorName: "yellow", colorHex: "#ffc107", order: 4, active: true, createdAt: new Date() },
      { key: "completed", name: "Completed", colorName: "green", colorHex: "#198754", order: 5, active: true, createdAt: new Date() },
      { key: "review", name: "Review", colorName: "orange", colorHex: "#fd7e14", order: 6, active: true, createdAt: new Date() },
      { key: "cancelled", name: "Cancelled", colorName: "red", colorHex: "#dc3545", order: 7, active: true, createdAt: new Date() },
    ];

    try {
      const existingCount = await taskStatusCollection.countDocuments({});
      if (existingCount === 0) {
        await taskStatusCollection.insertMany(defaultTaskStatuses);
        console.log(`✅ Inserted default task statuses for company: ${companyId}`);
      } else {
        console.log(`ℹ️ Task statuses already present for company: ${companyId}`);
      }
    } catch (err) {
      console.warn(`Warning inserting default task statuses for ${companyId}:`, err?.message);
    }

    // Initialize stats collection with default values
    const statsCollection = db.collection("stats");
    await statsCollection.insertOne({
      totalEmployees: 0,
      activeEmployees: 0,
      totalProjects: 0,
      totalClients: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Initialized stats for company: ${companyId}`);

    // Initialize default shifts
    const shiftsCollection = db.collection("shifts");
    const now = new Date();
    const year = now.getFullYear();

    // Default shift templates
    const defaultShifts = [
      {
        // Day Shift - Regular business hours
        shiftId: `SHF-${year}-0001`,
        name: "Day Shift",
        code: "DS",
        companyId: companyId,
        startTime: "09:00",
        endTime: "18:00",
        duration: 8,
        timezone: "UTC",
        gracePeriod: 15,
        earlyDepartureAllowance: 15,
        minHoursForFullDay: 8,
        halfDayThreshold: 4,
        type: "regular",
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        color: "#52c41a", // Green
        overtime: {
          enabled: true,
          threshold: 8,
          multiplier: 1.5
        },
        breakSettings: {
          enabled: true,
          mandatory: false,
          duration: 60,
          maxDuration: 90
        },
        flexibleHours: {
          enabled: false
        },
        isNightShift: false,
        isActive: true,
        isDefault: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        // Night Shift - Overnight hours
        shiftId: `SHF-${year}-0002`,
        name: "Night Shift",
        code: "NS",
        companyId: companyId,
        startTime: "21:00",
        endTime: "06:00",
        duration: 8,
        timezone: "UTC",
        gracePeriod: 15,
        earlyDepartureAllowance: 15,
        minHoursForFullDay: 8,
        halfDayThreshold: 4,
        type: "night",
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        color: "#722ed1", // Purple
        overtime: {
          enabled: true,
          threshold: 8,
          multiplier: 1.5
        },
        breakSettings: {
          enabled: true,
          mandatory: false,
          duration: 60,
          maxDuration: 90
        },
        flexibleHours: {
          enabled: false
        },
        isNightShift: true,
        isActive: true,
        isDefault: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        // General Shift - Default shift for company
        shiftId: `SHF-${year}-0003`,
        name: "General Shift",
        code: "GS",
        companyId: companyId,
        startTime: "08:00",
        endTime: "17:00",
        duration: 8,
        timezone: "UTC",
        gracePeriod: 15,
        earlyDepartureAllowance: 15,
        minHoursForFullDay: 8,
        halfDayThreshold: 4,
        type: "regular",
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        color: "#1890ff", // Blue
        overtime: {
          enabled: true,
          threshold: 8,
          multiplier: 1.5
        },
        breakSettings: {
          enabled: true,
          mandatory: false,
          duration: 60,
          maxDuration: 90
        },
        flexibleHours: {
          enabled: false
        },
        isNightShift: false,
        isActive: true,
        isDefault: true, // This is the default shift
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      },
      {
        // Flexible Shift - For employees with flexible hours
        shiftId: `SHF-${year}-0004`,
        name: "Flexible Shift",
        code: "FS",
        companyId: companyId,
        startTime: "06:00",
        endTime: "22:00",
        duration: 8,
        timezone: "UTC",
        gracePeriod: 0,
        earlyDepartureAllowance: 0,
        minHoursForFullDay: 8,
        halfDayThreshold: 4,
        type: "flexible",
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
        color: "#faad14", // Orange
        overtime: {
          enabled: true,
          threshold: 8,
          multiplier: 1.5
        },
        breakSettings: {
          enabled: true,
          mandatory: false,
          duration: 60,
          maxDuration: 90
        },
        flexibleHours: {
          enabled: true,
          windowStart: "06:00",
          windowEnd: "22:00",
          minHoursInOffice: 8
        },
        isNightShift: false,
        isActive: true,
        isDefault: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    try {
      const existingShiftsCount = await shiftsCollection.countDocuments({});
      if (existingShiftsCount === 0) {
        await shiftsCollection.insertMany(defaultShifts);
        console.log(`✅ Inserted ${defaultShifts.length} default shifts for company: ${companyId}`);
      } else {
        console.log(`ℹ️ Shifts already present for company: ${companyId}`);
      }
    } catch (err) {
      console.warn(`Warning inserting default shifts for ${companyId}:`, err?.message);
    }

    // Seed default leave types into the company's own database (leaveTypes collection)
    try {
      const leaveTypesCollection = db.collection('leaveTypes');
      const existingLeaveTypes = await leaveTypesCollection.countDocuments({ companyId });
      if (existingLeaveTypes === 0) {
        const defaultLeaveTypes = getDefaultLeaveTypes(companyId);
        await leaveTypesCollection.insertMany(defaultLeaveTypes);
        console.log(`✅ Inserted ${defaultLeaveTypes.length} default leave types for company: ${companyId}`);
      } else {
        console.log(`ℹ️ Leave types already present for company: ${companyId} (${existingLeaveTypes} found)`);
      }
    } catch (err) {
      console.warn(`Warning inserting default leave types for ${companyId}:`, err?.message);
    }

    return {
      done: true,
      message: `Database ${companyId} initialized successfully`,
    };
  } catch (error) {
    console.error(`❌ Error initializing database for company ${companyId}:`, error);
    return {
      done: false,
      error: error.message,
    };
  }
};
