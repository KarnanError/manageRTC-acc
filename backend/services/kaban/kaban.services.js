import { ObjectId } from "mongodb";
import { getTenantCollections } from "../../config/db.js";
import {
  createDefaultBoardDoc,
  createDefaultColumnDocs,
  DEFAULT_KANBAN_COLUMNS,
  ensureKanbanIndexes,
  normalizeStageKey,
  toClientId,
} from "../../models/kaban/kaban.model.js";

const DEFAULT_PAGE_SIZE = 100;

const serializeBoard = (board) => ({
  ...board,
  _id: toClientId(board._id),
});

const serializeColumn = (column) => ({
  ...column,
  _id: toClientId(column._id),
  boardId: toClientId(column.boardId),
});

const serializeCard = (card) => {
  return {
    _id: toClientId(card._id),
    cardId: toClientId(card._id),
    boardId: toClientId(card.boardId),
    columnId: card.columnId ? toClientId(card.columnId) : null,
    columnKey: card.columnKey,
    order: card.order,
    projectId: card.projectId || "",
    title: card.title || "Untitled Project",
    tags: card.tags || [],
    priority: card.priority || "Medium", // High, Medium, Low
    budget: card.budget ?? 0,
    tasks: card.tasks || { completed: 0, total: 0 },
    dueDate: card.dueDate || null,
    teamMembers: card.teamMembers || [],
    chatCount: card.chatCount ?? 0,
    attachmentCount: card.attachmentCount ?? 0,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    metadata: card.metadata || {},
    history: card.history || [],
  };
};

const buildSortOptions = (sortBy) => {
  switch (sortBy) {
    case "ascending":
      return { title: 1 };
    case "descending":
      return { title: -1 };
    case "lastMonth": {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return { updatedAt: -1, createdAt: -1 };
    }
    case "last7Days":
      return { updatedAt: -1, createdAt: -1 };
    case "recentlyAdded":
    default:
      return { order: 1, createdAt: -1 };
  }
};

const buildCardQuery = (boardId, filters = {}) => {
  const query = {
    boardId,
  };

  if (filters.columnKeys?.length) {
    query.columnKey = { $in: filters.columnKeys };
  }

  // Priority filter (High, Medium, Low, or "all")
  if (filters.priority && filters.priority !== "all") {
    query.priority = filters.priority;
  }

  // Create date filter
  if (filters.createDate) {
    query.createdAt = {
      $gte: new Date(filters.createDate.start),
      $lte: new Date(filters.createDate.end),
    };
  }

  // Due date filter
  if (filters.dueDate) {
    query.dueDate = {
      $gte: new Date(filters.dueDate.start),
      $lte: new Date(filters.dueDate.end),
    };
  }

  // Client filter (if teamMembers contains client)
  if (filters.client) {
    query["teamMembers.name"] = { $regex: filters.client, $options: "i" };
  }

  // Status filter (maps to columnKey)
  if (filters.status && filters.status !== "all") {
    query.columnKey = filters.status;
  }

  // Search filter (searches title, projectId, tags)
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { projectId: { $regex: filters.search, $options: "i" } },
      { tags: { $in: [new RegExp(filters.search, "i")] } },
    ];
  }

  return query;
};

const ensureBoardSetup = async (companyId) => {
  const collections = getTenantCollections(companyId);
  await ensureKanbanIndexes(collections);

  let board = await collections.kanbanBoards.findOne({ companyId });

  if (!board) {
    board = createDefaultBoardDoc(companyId);
    await collections.kanbanBoards.insertOne(board);
    const defaultColumns = createDefaultColumnDocs(board._id);
    await collections.kanbanColumns.insertMany(defaultColumns);
    board.columns = defaultColumns;
    return { board, columns: defaultColumns };
  }

  const columns = await collections.kanbanColumns
    .find({ boardId: board._id })
    .sort({ order: 1 })
    .toArray();

  if (!columns.length) {
    const defaultColumns = createDefaultColumnDocs(board._id);
    await collections.kanbanColumns.insertMany(defaultColumns);
    return { board, columns: defaultColumns };
  }

  board.columns = columns;
  return { board, columns };
};

const buildColumnPayload = (columns) =>
  columns.reduce((acc, column) => {
    acc[column.key] = {
      ...serializeColumn(column),
      cards: [],
      totals: {
        count: 0,
        budget: 0,
      },
    };
    return acc;
  }, {});

export const getKanbanBoardData = async (companyId, filters = {}) => {
  const { board, columns } = await ensureBoardSetup(companyId);

  const collections = getTenantCollections(companyId);
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit =
    Number(filters.limit) > 0 ? Number(filters.limit) : DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const query = buildCardQuery(board._id, filters);
  const sortOptions = buildSortOptions(filters.sortBy);

  const [totalCards, cards] = await Promise.all([
    collections.kanbanCards.countDocuments(query),
    collections.kanbanCards
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  const columnPayload = buildColumnPayload(columns);

  cards.forEach((card) => {
    const bucket = columnPayload[card.columnKey];
    const payload = serializeCard(card);
    if (bucket) {
      bucket.cards.push(payload);
      bucket.totals.count += 1;
      bucket.totals.budget += payload.budget || 0;
    }
  });

  return {
    board: serializeBoard(board),
    columns: Object.values(columnPayload),
    pagination: {
      total: totalCards,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCards / limit)),
    },
    filtersApplied: filters,
  };
};

export const updateCardStage = async (
  companyId,
  { cardId, destinationKey, order, reason = null },
  actor
) => {
  if (!cardId || !destinationKey) {
    throw new Error("Card ID and destination column are required");
  }

  const { board, columns } = await ensureBoardSetup(companyId);
  const column = columns.find((col) => col.key === destinationKey);
  if (!column) {
    throw new Error("Destination column not found");
  }

  const collections = getTenantCollections(companyId);
  const cardObjectId =
    cardId instanceof ObjectId ? cardId : new ObjectId(cardId);
  const card = await collections.kanbanCards.findOne({
    _id: cardObjectId,
    boardId: board._id,
  });

  if (!card) {
    throw new Error("Card not found");
  }

  const now = new Date();
  await collections.kanbanCards.updateOne(
    { _id: cardObjectId },
    {
      $set: {
        columnKey: destinationKey,
        columnId: column._id,
        order: typeof order === "number" ? order : now.getTime(),
        updatedAt: now,
      },
      $push: {
        history: {
          from: card.columnKey,
          to: destinationKey,
          movedBy: actor?.userId || "system",
          reason,
          movedAt: now,
        },
      },
    }
  );

  const updatedCard = await collections.kanbanCards.findOne({
    _id: cardObjectId,
  });

  return serializeCard(updatedCard);
};

export const bulkUpdateCardStage = async (
  companyId,
  { cardIds = [], destinationKey, startingOrder },
  actor
) => {
  if (!cardIds.length || !destinationKey) {
    throw new Error("Card IDs and destination column are required");
  }

  const { board, columns } = await ensureBoardSetup(companyId);
  const column = columns.find((col) => col.key === destinationKey);
  if (!column) {
    throw new Error("Destination column not found");
  }

  const collections = getTenantCollections(companyId);
  const now = new Date();
  const updates = [];
  const normalizedIds = cardIds.map((id) =>
    id instanceof ObjectId ? id : new ObjectId(id)
  );

  const cards = await collections.kanbanCards
    .find({
      _id: { $in: normalizedIds },
      boardId: board._id,
    })
    .toArray();

  let orderCounter = typeof startingOrder === "number" ? startingOrder : now.getTime();

  for (const card of cards) {
    await collections.kanbanCards.updateOne(
      { _id: card._id },
      {
        $set: {
          columnKey: destinationKey,
          columnId: column._id,
          order: orderCounter,
          updatedAt: now,
        },
        $push: {
          history: {
            from: card.columnKey,
            to: destinationKey,
            movedBy: actor?.userId || "system",
            movedAt: now,
          },
        },
      }
    );
    orderCounter += 1;
  }

  const updatedCards = await collections.kanbanCards
    .find({ _id: { $in: normalizedIds } })
    .toArray();

  return updatedCards.map((card) => serializeCard(card));
};

export const reorderColumnCards = async (
  companyId,
  { columnKey, orderedCardIds = [] }
) => {
  if (!columnKey || !orderedCardIds.length) {
    throw new Error("Column key and ordered card IDs are required");
  }

  const { board } = await ensureBoardSetup(companyId);
  const collections = getTenantCollections(companyId);
  const normalizedIds = orderedCardIds.map((id) =>
    id instanceof ObjectId ? id : new ObjectId(id)
  );

  const bulkOps = normalizedIds.map((cardId, idx) => ({
    updateOne: {
      filter: {
        _id: cardId,
        boardId: board._id,
      },
      update: {
        $set: {
          order: idx,
          updatedAt: new Date(),
        },
      },
    },
  }));

  if (bulkOps.length) {
    await collections.kanbanCards.bulkWrite(bulkOps);
  }

  return { done: true };
};

export const saveColumnConfiguration = async (
  companyId,
  { columns = [] }
) => {
  if (!columns.length) {
    throw new Error("Columns payload is required");
  }

  const { board } = await ensureBoardSetup(companyId);
  const collections = getTenantCollections(companyId);

  const bulkOps = columns.map((column, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(column._id), boardId: board._id },
      update: {
        $set: {
          label: column.label,
          color: column.color,
          order: typeof column.order === "number" ? column.order : index,
          updatedAt: new Date(),
        },
      },
    },
  }));

  if (bulkOps.length) {
    await collections.kanbanColumns.bulkWrite(bulkOps);
  }

  const updatedColumns = await collections.kanbanColumns
    .find({ boardId: board._id })
    .sort({ order: 1 })
    .toArray();

  return updatedColumns.map(serializeColumn);
};

export const createCard = async (companyId, cardData, actor) => {
  const { board, columns } = await ensureBoardSetup(companyId);
  const collections = getTenantCollections(companyId);

  const columnKey = cardData.columnKey || "new";
  const column = columns.find((col) => col.key === columnKey) || columns[0];

  if (!column) {
    throw new Error("Column not found");
  }

  const now = new Date();
  const newCard = {
    _id: new ObjectId(),
    boardId: board._id,
    columnId: column._id,
    columnKey: column.key,
    companyId,
    projectId: cardData.projectId || "",
    title: cardData.title || "Untitled Project",
    tags: cardData.tags || [],
    priority: cardData.priority || "Medium", // High, Medium, Low
    budget: cardData.budget ?? 0,
    tasks: cardData.tasks || { completed: 0, total: 0 },
    dueDate: cardData.dueDate ? new Date(cardData.dueDate) : null,
    teamMembers: cardData.teamMembers || [],
    chatCount: cardData.chatCount ?? 0,
    attachmentCount: cardData.attachmentCount ?? 0,
    order: cardData.order ?? Date.now(),
    history: [],
    metadata: cardData.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  await collections.kanbanCards.insertOne(newCard);

  return serializeCard(newCard);
};

export const updateCard = async (companyId, cardId, cardData, actor) => {
  const { board } = await ensureBoardSetup(companyId);
  const collections = getTenantCollections(companyId);

  const cardObjectId =
    cardId instanceof ObjectId ? cardId : new ObjectId(cardId);

  const existingCard = await collections.kanbanCards.findOne({
    _id: cardObjectId,
    boardId: board._id,
  });

  if (!existingCard) {
    throw new Error("Card not found");
  }

  const updateFields = {
    updatedAt: new Date(),
  };

  if (cardData.projectId !== undefined) updateFields.projectId = cardData.projectId;
  if (cardData.title !== undefined) updateFields.title = cardData.title;
  if (cardData.tags !== undefined) updateFields.tags = cardData.tags;
  if (cardData.priority !== undefined) updateFields.priority = cardData.priority;
  if (cardData.budget !== undefined) updateFields.budget = cardData.budget;
  if (cardData.tasks !== undefined) updateFields.tasks = cardData.tasks;
  if (cardData.dueDate !== undefined) {
    updateFields.dueDate = cardData.dueDate ? new Date(cardData.dueDate) : null;
  }
  if (cardData.teamMembers !== undefined) updateFields.teamMembers = cardData.teamMembers;
  if (cardData.chatCount !== undefined) updateFields.chatCount = cardData.chatCount;
  if (cardData.attachmentCount !== undefined) updateFields.attachmentCount = cardData.attachmentCount;
  if (cardData.metadata !== undefined) updateFields.metadata = cardData.metadata;

  await collections.kanbanCards.updateOne(
    { _id: cardObjectId },
    { $set: updateFields }
  );

  const updatedCard = await collections.kanbanCards.findOne({
    _id: cardObjectId,
  });

  return serializeCard(updatedCard);
};

export const deleteCard = async (companyId, cardId) => {
  const { board } = await ensureBoardSetup(companyId);
  const collections = getTenantCollections(companyId);

  const cardObjectId =
    cardId instanceof ObjectId ? cardId : new ObjectId(cardId);

  const result = await collections.kanbanCards.deleteOne({
    _id: cardObjectId,
    boardId: board._id,
  });

  if (result.deletedCount === 0) {
    throw new Error("Card not found");
  }

  return { done: true };
};

export default {
  getKanbanBoardData,
  createCard,
  updateCard,
  deleteCard,
  updateCardStage,
  bulkUpdateCardStage,
  reorderColumnCards,
  saveColumnConfiguration,
};
