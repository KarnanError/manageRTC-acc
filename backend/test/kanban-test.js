import { io } from "socket.io-client";

/**
 * Usage:
 * 1. Start the backend server (npm run dev or npm start).
 * 2. Export TEST_SERVER_URL and TOKEN env variables, then run:
 *      node backend/test/kanban-test.js
 *
 * TOKEN must be a valid Clerk JWT that maps to companyId 68443081dcdfe43152aebf80
 * (or whichever tenant DB you want to target) and a role that can access leads/kanban.
 */

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:5000";
const TOKEN = process.env.TOKEN || "";

if (!TOKEN) {
  console.warn(
    "⚠️  Please set TOKEN env var to a valid Clerk JWT before running this test."
  );
}

const socket = io(TEST_SERVER_URL, {
  auth: { token: TOKEN },
});

let cachedBoard = null;
let cachedColumns = [];
let firstCard = null;
let secondCard = null;

const once = (event) =>
  new Promise((resolve) => {
    socket.once(event, resolve);
  });

async function fetchKanbanBoard() {
  console.log("🔄 Fetching kanban board...");
  socket.emit("kanban/board/get-data", { filters: {} });
  const response = await once("kanban/board/get-data-response");
  if (!response.done) {
    throw new Error(`Board fetch failed: ${response.error}`);
  }

  cachedBoard = response.data.board;
  cachedColumns = response.data.columns || [];

  console.log(
    `✅ Board fetched: ${cachedBoard.name} | Columns: ${cachedColumns.length}`
  );

  for (const column of cachedColumns) {
    if (column.cards?.length) {
      if (!firstCard) {
        firstCard = column.cards[0];
      } else if (!secondCard && column.cards[1]) {
        secondCard = column.cards[1];
      }
    }
  }

  if (!firstCard) {
    console.warn("⚠️  No kanban cards available to test stage updates.");
  } else {
    console.log("ℹ️  Using card:", firstCard._id, "currently in", firstCard.columnKey);
  }
}

async function updateSingleCardStage() {
  if (!firstCard || cachedColumns.length < 2) {
    console.warn("⚠️  Skipping single card update (insufficient data).");
    return;
  }

  const destination =
    cachedColumns.find((column) => column.key !== firstCard.columnKey) ||
    cachedColumns[0];

  console.log(
    `🔄 Moving card ${firstCard._id} to ${destination.key}...`
  );
  socket.emit("kanban/card/update-stage", {
    cardId: firstCard._id,
    destinationKey: destination.key,
    order: Date.now(),
    reason: "Automated test move",
  });

  const response = await once("kanban/card/update-stage-response");
  if (!response.done) {
    throw new Error(`Card stage update failed: ${response.error}`);
  }
  firstCard = response.data;
  console.log("✅ Card moved:", firstCard.columnKey);
}

async function bulkMoveCards() {
  const cardsToMove = [];
  cachedColumns.forEach((column) => {
    if (column.cards?.length) {
      cardsToMove.push(
        ...column.cards.slice(0, 2).map((card) => ({
          cardId: card._id,
          currentColumn: column.key,
        }))
      );
    }
  });

  const ids = [...new Set(cardsToMove.map((c) => c.cardId))];
  if (ids.length < 2 || cachedColumns.length < 2) {
    console.warn("⚠️  Skipping bulk move (need at least 2 cards).");
    return;
  }

  const destination =
    cachedColumns.find((column) => column.key !== cardsToMove[0].currentColumn) ||
    cachedColumns[0];

  console.log(
    `🔄 Bulk moving ${ids.length} cards to ${destination.key}...`
  );
  socket.emit("kanban/card/bulk-update-stage", {
    cardIds: ids,
    destinationKey: destination.key,
    startingOrder: Date.now(),
  });

  const response = await once("kanban/card/bulk-update-stage-response");
  if (!response.done) {
    throw new Error(`Bulk update failed: ${response.error}`);
  }

  console.log("✅ Bulk move complete:", response.data.length, "cards updated");
}

async function reorderColumn() {
  const columnWithCards = cachedColumns.find(
    (column) => column.cards && column.cards.length >= 2
  );
  if (!columnWithCards) {
    console.warn("⚠️  Skipping reorder (need a column with ≥2 cards).");
    return;
  }

  const reorderedIds = [...columnWithCards.cards]
    .reverse()
    .map((card) => card._id);

  console.log(
    `🔄 Reordering column ${columnWithCards.label} (${columnWithCards.key})...`
  );
  socket.emit("kanban/card/reorder", {
    columnKey: columnWithCards.key,
    orderedCardIds: reorderedIds,
  });

  const response = await once("kanban/card/reorder-response");
  if (!response.done) {
    throw new Error(`Reorder failed: ${response.error}`);
  }
  console.log("✅ Column reorder applied");
}

async function saveColumns() {
  if (!cachedColumns.length) {
    console.warn("⚠️  Skipping column save (no columns loaded).");
    return;
  }

  const updated = cachedColumns.map((column, index) => ({
    ...column,
    color: column.color || "#3B82F6",
    order: index,
  }));

  console.log("🔄 Saving column configuration...");
  socket.emit("kanban/columns/save", { columns: updated });

  const response = await once("kanban/columns/save-response");
  if (!response.done) {
    throw new Error(`Column save failed: ${response.error}`);
  }
  console.log("✅ Column configuration saved");
}

async function runTests() {
  try {
    console.log("🧪 Starting Kanban socket tests...\n");
    await fetchKanbanBoard();
    await updateSingleCardStage();
    await bulkMoveCards();
    await reorderColumn();
    await saveColumns();
    console.log("\n🎉 Kanban tests finished successfully");
  } catch (error) {
    console.error("\n❌ Kanban tests failed:", error.message);
  } finally {
    socket.disconnect();
  }
}

socket.on("connect", () => {
  console.log("✅ Connected to server, socket id:", socket.id);
  runTests();
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

