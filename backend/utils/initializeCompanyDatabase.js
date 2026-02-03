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
