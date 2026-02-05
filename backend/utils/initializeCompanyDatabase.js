// backend/utils/initializeCompanyDatabase.js
import { client } from "../config/db.js";

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
