import { MongoClient, ObjectId } from "mongodb";
import {
  DEFAULT_KANBAN_COLUMNS,
  normalizeStageKey,
} from "./models/kaban/kaban.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/";
const TEST_DB_NAME = process.env.TEST_DB_NAME || "68443081dcdfe43152aebf80";
const TEST_COMPANY_ID =
  process.env.TEST_COMPANY_ID || "68443081dcdfe43152aebf80";

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
  const now = new Date();
  boardDoc = {
    _id: new ObjectId(),
    companyId: TEST_COMPANY_ID,
    name: "Test Kanban Board",
    description: "Board created by kanban DB test suite",
    settings: { allowBulkDrag: true, filters: {} },
    createdAt: now,
    updatedAt: now,
  };

  columnDocs = DEFAULT_KANBAN_COLUMNS.map((column) => ({
    _id: new ObjectId(),
    boardId: boardDoc._id,
    companyId: TEST_COMPANY_ID,
    key: column.key,
    label: column.label,
    color: column.color,
    order: column.order,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }));

  await boardsCollection.insertOne(boardDoc);
  await columnsCollection.insertMany(columnDocs);
  console.log(
    `✅ Board & columns created (${columnDocs.length} default columns)`
  );
  return true;
}

async function seedCards() {
  const now = Date.now();
  const dueDate1 = new Date();
  dueDate1.setDate(dueDate1.getDate() + 15);
  const dueDate2 = new Date();
  dueDate2.setDate(dueDate2.getDate() + 30);
  const dueDate3 = new Date();
  dueDate3.setDate(dueDate3.getDate() + 45);

  const cards = [
    {
      _id: new ObjectId(),
      boardId: boardDoc._id,
      columnId: columnDocs.find((col) => col.key === "new")?._id || columnDocs[0]._id,
      columnKey: "new",
      companyId: TEST_COMPANY_ID,
      projectId: "PRJ-001",
      title: "ACME Corp Website",
      tags: ["Web Layout", "Frontend"],
      priority: "High",
      budget: 250000,
      tasks: { completed: 12, total: 15 },
      dueDate: dueDate1,
      teamMembers: [
        { name: "Alice", avatar: "avatar-1.jpg" },
        { name: "Bob", avatar: "avatar-2.jpg" },
      ],
      chatCount: 14,
      attachmentCount: 5,
      order: now,
      history: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      boardId: boardDoc._id,
      columnId: columnDocs.find((col) => col.key === "inprogress")?._id || columnDocs[1]._id,
      columnKey: "inprogress",
      companyId: TEST_COMPANY_ID,
      projectId: "PRJ-002",
      title: "Globex Ltd Mobile App",
      tags: ["Mobile", "Development"],
      priority: "Medium",
      budget: 90000,
      tasks: { completed: 8, total: 12 },
      dueDate: dueDate2,
      teamMembers: [
        { name: "Charlie", avatar: "avatar-3.jpg" },
      ],
      chatCount: 7,
      attachmentCount: 3,
      order: now + 1,
      history: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      boardId: boardDoc._id,
      columnId: columnDocs.find((col) => col.key === "on_hold")?._id || columnDocs[2]._id,
      columnKey: "on_hold",
      companyId: TEST_COMPANY_ID,
      projectId: "PRJ-003",
      title: "Initech Dashboard",
      tags: ["Dashboard", "Backend"],
      priority: "Low",
      budget: 125000,
      tasks: { completed: 5, total: 10 },
      dueDate: dueDate3,
      teamMembers: [
        { name: "David", avatar: "avatar-4.jpg" },
        { name: "Eve", avatar: "avatar-5.jpg" },
      ],
      chatCount: 3,
      attachmentCount: 2,
      order: now + 2,
      history: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await cardsCollection.insertMany(cards);
  console.log(`✅ Seeded ${cards.length} cards with new schema`);
  return { cards };
}

async function testBoardFetch() {
  const board = await boardsCollection.findOne({ _id: boardDoc._id });
  const columns = await columnsCollection
    .find({ boardId: boardDoc._id })
    .sort({ order: 1 })
    .toArray();
  const cards = await cardsCollection
    .aggregate([
      { $match: { boardId: boardDoc._id } },
      { $group: { _id: "$columnKey", count: { $sum: 1 } } },
    ])
    .toArray();

  console.log("📋 Board:", board?.name);
  console.log(
    "📌 Column distribution:",
    columns.map((col) => `${col.label}`).join(", ")
  );
  console.log("🃏 Cards per column:", cards);
  return !!board && columns.length === DEFAULT_KANBAN_COLUMNS.length;
}

async function testSingleCardMove() {
  const [firstCard] = await cardsCollection
    .find({ boardId: boardDoc._id })
    .sort({ order: 1 })
    .limit(1)
    .toArray();

  if (!firstCard) {
    console.warn("⚠️ No card to move");
    return false;
  }

  const targetColumn =
    columnDocs.find((col) => col.key !== firstCard.columnKey) || columnDocs[0];
  const now = new Date();

  await cardsCollection.updateOne(
    { _id: firstCard._id },
    {
      $set: {
        columnKey: targetColumn.key,
        columnId: targetColumn._id,
        order: now.getTime(),
        updatedAt: now,
      },
      $push: {
        history: {
          from: firstCard.columnKey,
          to: targetColumn.key,
          movedAt: now,
          movedBy: "kanban-db-test",
        },
      },
    }
  );

  const updated = await cardsCollection.findOne({ _id: firstCard._id });
  console.log(
    `🔄 Card ${firstCard.title} moved to ${targetColumn.label} (${targetColumn.key})`
  );
  return updated?.columnKey === targetColumn.key;
}

async function testBulkMove() {
  const cards = await cardsCollection
    .find({ boardId: boardDoc._id })
    .sort({ order: 1 })
    .limit(3)
    .toArray();

  if (cards.length < 2) {
    console.warn("⚠️ Not enough cards for bulk move");
    return false;
  }

  const target = columnDocs.find((col) => col.key === "proposal") || columnDocs[0];
  const baseOrder = Date.now();

  await cardsCollection.updateMany(
    { _id: { $in: cards.map((card) => card._id) } },
    {
      $set: {
        columnKey: target.key,
        columnId: target._id,
      },
    }
  );

  // assign incremental order
  await Promise.all(
    cards.map((card, index) =>
      cardsCollection.updateOne(
        { _id: card._id },
        { $set: { order: baseOrder + index, updatedAt: new Date() } }
      )
    )
  );

  const verify = await cardsCollection
    .find({ _id: { $in: cards.map((card) => card._id) } })
    .toArray();

  console.log(
    `👥 Bulk moved ${verify.length} cards to column ${target.label}`
  );
  return verify.every((card) => card.columnKey === target.key);
}

async function testReorderColumn() {
  // Find a column that has at least 2 cards
  let column = null;
  let cards = [];
  
  for (const col of columnDocs) {
    const colCards = await cardsCollection
      .find({ columnKey: col.key, boardId: boardDoc._id })
      .sort({ order: 1 })
      .toArray();
    
    if (colCards.length >= 2) {
      column = col;
      cards = colCards;
      break;
    }
  }

  if (!column || cards.length < 2) {
    console.warn("⚠️ Need at least two cards in a column to reorder");
    return false;
  }

  // Reverse the order of cards
  const reversedOrders = cards
    .map((card) => card._id.toString())
    .reverse()
    .map((id, index) => ({ id, order: Date.now() + index }));

  await Promise.all(
    reversedOrders.map(({ id, order }) =>
      cardsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { order, updatedAt: new Date() } }
      )
    )
  );

  const reordered = await cardsCollection
    .find({ columnKey: column.key, boardId: boardDoc._id })
    .sort({ order: 1 })
    .toArray();

  const firstCardAfterReorder = reordered[0];
  const lastCardBeforeReorder = cards[cards.length - 1];

  console.log(
    `🔀 Column ${column.label} reordered. First card is now ${firstCardAfterReorder.title}`
  );
  
  return firstCardAfterReorder._id.toString() === lastCardBeforeReorder._id.toString();
}

async function testColumnCustomization() {
  const updates = columnDocs.map((column, index) => ({
    ...column,
    color: "#3B82F6",
    order: index,
  }));

  await Promise.all(
    updates.map((column) =>
      columnsCollection.updateOne(
        { _id: column._id },
        { $set: { color: column.color, order: column.order } }
      )
    )
  );

  const updatedColumns = await columnsCollection
    .find({ boardId: boardDoc._id })
    .sort({ order: 1 })
    .toArray();

  const allBlue = updatedColumns.every((column) => column.color === "#3B82F6");
  console.log("🎨 Column customization applied");
  return allBlue;
}

async function testAnalyticsSnapshot() {
  const totals = await cardsCollection
    .aggregate([
      { $match: { boardId: boardDoc._id } },
      {
        $group: {
          _id: "$columnKey",
          count: { $sum: 1 },
          budget: { $sum: "$budget" },
        },
      },
      { $sort: { budget: -1 } },
    ])
    .toArray();

  console.log("📊 Snapshot:", totals);
  return totals.length > 0;
}

async function runKanbanDbTests() {
  divider();
  console.log("🧪 Starting Kanban DB Test Suite (no socket token required)");
  divider();

  try {
    await connectDB();
    await cleanup();

    const results = [];

    results.push({
      test: "Board & column initialization",
      result: await setupBoardAndColumns(),
    });
    results.push({
      test: "Card seeding",
      result: !!(await seedCards()),
    });
    results.push({
      test: "Board fetch & distribution",
      result: await testBoardFetch(),
    });
    results.push({
      test: "Single card move",
      result: await testSingleCardMove(),
    });
    results.push({
      test: "Bulk move",
      result: await testBulkMove(),
    });
    results.push({
      test: "Column reorder",
      result: await testReorderColumn(),
    });
    results.push({
      test: "Column customization save",
      result: await testColumnCustomization(),
    });
    results.push({
      test: "Analytics snapshot",
      result: await testAnalyticsSnapshot(),
    });

    divider();
    console.log("📋 TEST SUMMARY");
    divider();
    const passed = results.filter((r) => r.result).length;
    results.forEach(({ test, result }) => {
      console.log(`${result ? "✅" : "❌"} ${test}`);
    });
    console.log(
      `\n✅ Passed: ${passed}/${results.length} | ❌ Failed: ${
        results.length - passed
      }`
    );
    console.log(
      `📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`
    );
    if (passed === results.length) {
      console.log("\n🎉 Kanban DB tests completed successfully");
    } else {
      console.log("\n⚠️ Review the failed tests above for details");
    }
  } catch (error) {
    console.error("❌ Kanban DB Test Suite crashed:", error);
  } finally {
    divider();
//    await cleanup();
    await client?.close();
    console.log("🔌 MongoDB connection closed");
    divider();
  }
}

runKanbanDbTests();

