import { ObjectId } from "mongodb";

export const DEFAULT_KANBAN_COLUMNS = [
  {
    key: "new",
    label: "New",
    color: "#EC4899", // Pink
    order: 0,
  },
  {
    key: "inprogress",
    label: "Inprogress",
    color: "#3B82F6", // Blue
    order: 1,
  },
  {
    key: "on_hold",
    label: "On-hold",
    color: "#EF4444", // Red
    order: 2,
  },
  {
    key: "completed",
    label: "Completed",
    color: "#22C55E", // Green
    order: 3,
  },
];

export const DEFAULT_STAGE_MAPPING = {
  new: "new",
  "in progress": "inprogress",
  inprogress: "inprogress",
  "in-progress": "inprogress",
  "on hold": "on_hold",
  on_hold: "on_hold",
  "on-hold": "on_hold",
  completed: "completed",
  done: "completed",
  finished: "completed",
};

export const createDefaultBoardDoc = (companyId) => {
  const now = new Date();
  return {
    _id: new ObjectId(),
    companyId,
    name: "Kanban Board",
    description: "Default kanban board for task management",
    settings: {
      allowBulkDrag: true,
      allowCustomColumns: true,
      filters: {},
    },
    createdAt: now,
    updatedAt: now,
  };
};

export const createDefaultColumnDocs = (boardId) => {
  const now = new Date();
  return DEFAULT_KANBAN_COLUMNS.map((column) => ({
    _id: new ObjectId(),
    boardId,
    key: column.key,
    label: column.label,
    color: column.color,
    order: column.order,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }));
};

export const normalizeStageKey = (stage = "") => {
  const normalized = stage.toLowerCase().trim();
  return DEFAULT_STAGE_MAPPING[normalized] || "new";
};

export const toClientId = (value) =>
  typeof value === "string" ? value : value?.toString();

export const ensureKanbanIndexes = async (collections) => {
  await collections.kanbanBoards.createIndex({ companyId: 1 }, { unique: true });
  await collections.kanbanColumns.createIndex(
    { boardId: 1, order: 1 },
    { background: true }
  );
  await collections.kanbanCards.createIndex(
    { boardId: 1, columnKey: 1, order: 1 },
    { background: true }
  );
  await collections.kanbanCards.createIndex(
    { companyId: 1, boardId: 1 },
    { background: true }
  );
};
