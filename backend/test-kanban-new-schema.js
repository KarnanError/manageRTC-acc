import { MongoClient, ObjectId } from "mongodb";
import {
  DEFAULT_KANBAN_COLUMNS,
  createDefaultBoardDoc,
  createDefaultColumnDocs,
} from "./models/kaban/kaban.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/";
const TEST_DB_NAME =
  process.env.TEST_DB_NAME || "test_hrms_kanban_new_schema";
const TEST_COMPANY_ID =
  process.env.TEST_COMPANY_ID || "test_company_new_schema_123";

let client;
let db;
let boardsCollection;
let columnsCollection;
let cardsCollection;
let boardDoc;
let columnDocs = [];

const divider = () => console.log("─".repeat(60));

async function connectDB() {
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(TEST_DB_NAME);
  boardsCollection = db.collection("kanbanBoards");
  columnsCollection = db.collection("kanbanColumns");
  cardsCollection = db.collection("kanbanCards");
  console.log("✅ Connected to MongoDB");
}

async function cleanup() {
  await Promise.all([
    boardsCollection.deleteMany({ companyId: TEST_COMPANY_ID }),
    columnsCollection.deleteMany({ companyId: TEST_COMPANY_ID }),
    cardsCollection.deleteMany({ companyId: TEST_COMPANY_ID }),
  ]);
  console.log("🧹 Clean slate ready");
}

async function setupBoardAndColumns() {
  boardDoc = createDefaultBoardDoc(TEST_COMPANY_ID);
  await boardsCollection.insertOne(boardDoc);

  columnDocs = createDefaultColumnDocs(boardDoc._id);
  await columnsCollection.insertMany(columnDocs);

  console.log(
    `✅ Board & columns created (${columnDocs.length} default columns)`
  );
  return { boardDoc, columnDocs };
}

async function testNewSchemaCardCreation() {
  console.log("\n🧪 Testing new schema card creation...");

  const newColumn = columnDocs.find((col) => col.key === "new");
  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

  const newCard = {
    _id: new ObjectId(),
    boardId: boardDoc._id,
    columnId: newColumn._id,
    columnKey: newColumn.key,
    companyId: TEST_COMPANY_ID,
    projectId: "PRJ-001",
    title: "Web Layout Project",
    tags: ["Web Layout", "Frontend"],
    priority: "High",
    budget: 24000,
    tasks: { completed: 12, total: 15 },
    dueDate: dueDate,
    teamMembers: [
      { name: "John Doe", avatar: "avatar-1.jpg" },
      { name: "Jane Smith", avatar: "avatar-2.jpg" },
    ],
    chatCount: 14,
    attachmentCount: 5,
    order: Date.now(),
    history: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  await cardsCollection.insertOne(newCard);
  const stored = await cardsCollection.findOne({ _id: newCard._id });

  const success =
    stored?.projectId === "PRJ-001" &&
    stored?.title === "Web Layout Project" &&
    stored?.tags?.length === 2 &&
    stored?.priority === "High" &&
    stored?.budget === 24000 &&
    stored?.tasks?.completed === 12 &&
    stored?.tasks?.total === 15 &&
    stored?.teamMembers?.length === 2 &&
    stored?.chatCount === 14 &&
    stored?.attachmentCount === 5;

  console.log(
    success
      ? "✅ New schema card created successfully"
      : "❌ New schema card creation failed"
  );
  if (success) {
    console.log("   Project ID:", stored.projectId);
    console.log("   Title:", stored.title);
    console.log("   Budget:", stored.budget);
    console.log("   Tasks:", `${stored.tasks.completed}/${stored.tasks.total}`);
    console.log("   Team Members:", stored.teamMembers.length);
  }
  return success;
}

async function testMultipleCardsWithDifferentPriorities() {
  console.log("\n🧪 Testing multiple cards with different priorities...");

  const priorities = ["High", "Medium", "Low"];
  const cards = [];

  for (let i = 0; i < priorities.length; i++) {
    const column = columnDocs[i % columnDocs.length];
    const card = {
      _id: new ObjectId(),
      boardId: boardDoc._id,
      columnId: column._id,
      columnKey: column.key,
      companyId: TEST_COMPANY_ID,
      projectId: `PRJ-${String(i + 2).padStart(3, "0")}`,
      title: `Project ${priorities[i]} Priority`,
      tags: ["Development"],
      priority: priorities[i],
      budget: (i + 1) * 10000,
      tasks: { completed: i * 3, total: (i + 1) * 5 },
      dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
      teamMembers: [{ name: `Member ${i + 1}`, avatar: `avatar-${i + 1}.jpg` }],
      chatCount: i * 5,
      attachmentCount: i * 2,
      order: Date.now() + i,
      history: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cards.push(card);
  }

  await cardsCollection.insertMany(cards);
  const stored = await cardsCollection
    .find({ _id: { $in: cards.map((c) => c._id) } })
    .toArray();

  const success = stored.length === 3;
  console.log(
    success
      ? `✅ Created ${stored.length} cards with different priorities`
      : "❌ Failed to create multiple cards"
  );
  return success;
}

async function testCardUpdate() {
  console.log("\n🧪 Testing card update with new schema...");

  const card = await cardsCollection.findOne({
    companyId: TEST_COMPANY_ID,
  });

  if (!card) {
    console.log("⚠️  No card found to update");
    return false;
  }

  const updateData = {
    title: "Updated Project Title",
    priority: "Low",
    budget: 50000,
    tasks: { completed: 20, total: 25 },
    chatCount: 25,
    attachmentCount: 10,
    updatedAt: new Date(),
  };

  await cardsCollection.updateOne(
    { _id: card._id },
    { $set: updateData }
  );

  const updated = await cardsCollection.findOne({ _id: card._id });
  const success =
    updated?.title === "Updated Project Title" &&
    updated?.priority === "Low" &&
    updated?.budget === 50000 &&
    updated?.tasks?.completed === 20 &&
    updated?.chatCount === 25;

  console.log(
    success
      ? "✅ Card updated successfully with new schema fields"
      : "❌ Card update failed"
  );
  if (success) {
    console.log("   Updated Title:", updated.title);
    console.log("   Updated Budget:", updated.budget);
    console.log("   Updated Tasks:", `${updated.tasks.completed}/${updated.tasks.total}`);
  }
  return success;
}

async function testCardMoveBetweenColumns() {
  console.log("\n🧪 Testing card move between new columns...");

  const card = await cardsCollection.findOne({
    companyId: TEST_COMPANY_ID,
    columnKey: "new",
  });

  if (!card) {
    console.log("⚠️  No card found in 'new' column");
    return false;
  }

  const targetColumn = columnDocs.find((col) => col.key === "inprogress");
  const now = new Date();

  await cardsCollection.updateOne(
    { _id: card._id },
    {
      $set: {
        columnKey: targetColumn.key,
        columnId: targetColumn._id,
        updatedAt: now,
      },
      $push: {
        history: {
          from: card.columnKey,
          to: targetColumn.key,
          movedAt: now,
          movedBy: "test-user",
        },
      },
    }
  );

  const updated = await cardsCollection.findOne({ _id: card._id });
  const success = updated?.columnKey === "inprogress";

  console.log(
    success
      ? `✅ Card moved from 'new' to 'inprogress'`
      : "❌ Card move failed"
  );
  return success;
}

async function testColumnTotalsWithBudget() {
  console.log("\n🧪 Testing column totals with budget...");

  const totals = await cardsCollection
    .aggregate([
      { $match: { companyId: TEST_COMPANY_ID } },
      {
        $group: {
          _id: "$columnKey",
          count: { $sum: 1 },
          totalBudget: { $sum: "$budget" },
          avgBudget: { $avg: "$budget" },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();

  console.log("📊 Column totals:");
  totals.forEach((total) => {
    const column = columnDocs.find((col) => col.key === total._id);
    console.log(
      `   ${column?.label || total._id}: ${total.count} cards, Budget: $${total.totalBudget.toLocaleString()} (Avg: $${Math.round(total.avgBudget).toLocaleString()})`
    );
  });

  const success = totals.length > 0 && totals.some((t) => t.totalBudget > 0);
  console.log(
    success
      ? "✅ Column totals calculated correctly with budget"
      : "❌ Column totals calculation failed"
  );
  return success;
}

async function testPriorityFilter() {
  console.log("\n🧪 Testing priority filter...");

  const highPriorityCards = await cardsCollection
    .find({
      companyId: TEST_COMPANY_ID,
      priority: "High",
    })
    .toArray();

  const mediumPriorityCards = await cardsCollection
    .find({
      companyId: TEST_COMPANY_ID,
      priority: "Medium",
    })
    .toArray();

  console.log(`   High priority: ${highPriorityCards.length} cards`);
  console.log(`   Medium priority: ${mediumPriorityCards.length} cards`);

  const success = highPriorityCards.length > 0 || mediumPriorityCards.length > 0;
  console.log(
    success
      ? "✅ Priority filter working correctly"
      : "❌ Priority filter failed"
  );
  return success;
}

async function testSearchFunctionality() {
  console.log("\n🧪 Testing search functionality...");

  const searchResults = await cardsCollection
    .find({
      companyId: TEST_COMPANY_ID,
      $or: [
        { title: { $regex: "Project", $options: "i" } },
        { projectId: { $regex: "PRJ", $options: "i" } },
        { tags: { $in: [new RegExp("Development", "i")] } },
      ],
    })
    .toArray();

  console.log(`   Found ${searchResults.length} cards matching search`);
  const success = searchResults.length > 0;
  console.log(
    success
      ? "✅ Search functionality working correctly"
      : "❌ Search functionality failed"
  );
  return success;
}

async function testTasksProgress() {
  console.log("\n🧪 Testing tasks progress calculation...");

  const cards = await cardsCollection
    .find({ companyId: TEST_COMPANY_ID })
    .toArray();

  let totalTasks = 0;
  let completedTasks = 0;

  cards.forEach((card) => {
    if (card.tasks) {
      totalTasks += card.tasks.total || 0;
      completedTasks += card.tasks.completed || 0;
    }
  });

  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  console.log(`   Total Tasks: ${totalTasks}`);
  console.log(`   Completed: ${completedTasks}`);
  console.log(`   Progress: ${progressPercentage}%`);

  const success = totalTasks > 0;
  console.log(
    success
      ? "✅ Tasks progress calculated correctly"
      : "❌ Tasks progress calculation failed"
  );
  return success;
}

async function runAllTests() {
  divider();
  console.log("🚀 Starting New Schema Kanban Test Suite");
  divider();

  try {
    await connectDB();
    await cleanup();
    await setupBoardAndColumns();

    const tests = [
      {
        name: "New schema card creation",
        fn: testNewSchemaCardCreation,
      },
      {
        name: "Multiple cards with different priorities",
        fn: testMultipleCardsWithDifferentPriorities,
      },
      {
        name: "Card update with new schema",
        fn: testCardUpdate,
      },
      {
        name: "Card move between columns",
        fn: testCardMoveBetweenColumns,
      },
      {
        name: "Column totals with budget",
        fn: testColumnTotalsWithBudget,
      },
      {
        name: "Priority filter",
        fn: testPriorityFilter,
      },
      {
        name: "Search functionality",
        fn: testSearchFunctionality,
      },
      {
        name: "Tasks progress calculation",
        fn: testTasksProgress,
      },
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.fn();
        results.push({ test: test.name, result });
      } catch (error) {
        console.error(`❌ ${test.name} crashed:`, error.message);
        results.push({ test: test.name, result: false });
      }
    }

    divider();
    console.log("📋 TEST SUMMARY");
    divider();

    const passed = results.filter((r) => r.result).length;
    results.forEach(({ test, result }) =>
      console.log(`${result ? "✅" : "❌"} ${test}`)
    );

    console.log(
      `\n✅ Passed: ${passed}/${results.length} | ❌ Failed: ${
        results.length - passed
      }`
    );
    console.log(
      `📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`
    );

    if (passed === results.length) {
      console.log("\n🎉 All new schema tests passed!");
    } else {
      console.log("\n⚠️  Some tests failed. Please review the issues above.");
    }
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  } finally {
    divider();
    await cleanup();
    await client?.close();
    console.log("🔌 MongoDB connection closed");
    divider();
  }
}

runAllTests().catch(console.error);

