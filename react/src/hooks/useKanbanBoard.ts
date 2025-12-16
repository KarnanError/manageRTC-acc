import { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../SocketContext";

export interface KanbanCard {
  _id: string;
  columnKey: string;
  order: number;
  projectId: string;
  title: string;
  tags: string[];
  priority: "High" | "Medium" | "Low" | string;
  budget: number;
  tasks: {
    completed: number;
    total: number;
  };
  dueDate: string | null;
  teamMembers: Array<{
    name: string;
    avatar?: string;
  }>;
  chatCount: number;
  attachmentCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KanbanColumn {
  _id: string;
  key: string;
  label: string;
  color?: string;
  order: number;
  cards: KanbanCard[];
  totals?: {
    count: number;
    budget: number;
  };
}

export interface KanbanBoard {
  _id: string;
  name: string;
  description?: string;
}

export interface KanbanFilters {
  priority?: "High" | "Medium" | "Low" | "all";
  search?: string;
  client?: string;
  status?: string;
  createDate?: {
    start: Date;
    end: Date;
  };
  dueDate?: {
    start: Date;
    end: Date;
  };
}

const REQUEST_TIMEOUT = 15000;

export const useKanbanBoard = () => {
  const socket = useSocket();
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<KanbanFilters>({
    priority: "all",
  });

  const emitWithAck = useCallback(
    <T,>(emitEvent: string, responseEvent: string, payload: Record<string, unknown>) =>
      new Promise<T>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket not connected"));
          return;
        }

        const timer = setTimeout(() => {
          socket.off(responseEvent, handler);
          reject(new Error("Request timed out"));
        }, REQUEST_TIMEOUT);

        const handler = (response: { done: boolean; data?: T; error?: string }) => {
          clearTimeout(timer);
          socket.off(responseEvent, handler);
          if (response.done) {
            resolve(response.data as T);
          } else {
            reject(new Error(response.error || "Request failed"));
          }
        };

        socket.on(responseEvent, handler);
        socket.emit(emitEvent, payload);
      }),
    [socket]
  );

  const refreshBoard = useCallback(
    async (overrideFilters?: KanbanFilters) => {
      if (!socket) return;
      setLoading(true);
      try {
        const data = await emitWithAck<{ board: KanbanBoard; columns: KanbanColumn[] }>(
          "kanban/board/get-data",
          "kanban/board/get-data-response",
          { filters: overrideFilters ?? filters }
        );
        setBoard(data.board);
        setColumns(data.columns || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load kanban board");
      } finally {
        setLoading(false);
      }
    },
    [emitWithAck, filters, socket]
  );

  useEffect(() => {
    if (!socket) {
      setLoading(false);
      return;
    }
    refreshBoard();
  }, [socket, refreshBoard]);

  useEffect(() => {
    if (!socket) return;

    const handleExternalUpdate = () => refreshBoard();
    socket.on("kanban/card/created", handleExternalUpdate);
    socket.on("kanban/card/updated", handleExternalUpdate);
    socket.on("kanban/card/deleted", handleExternalUpdate);
    socket.on("kanban/card/bulk-updated", handleExternalUpdate);

    return () => {
      socket.off("kanban/card/created", handleExternalUpdate);
      socket.off("kanban/card/updated", handleExternalUpdate);
      socket.off("kanban/card/deleted", handleExternalUpdate);
      socket.off("kanban/card/bulk-updated", handleExternalUpdate);
    };
  }, [socket, refreshBoard]);

  const updateFilters = useCallback(
    (nextFilters: KanbanFilters) => {
      setFilters(nextFilters);
      refreshBoard(nextFilters);
    },
    [refreshBoard]
  );

  const moveCard = useCallback(
    async (cardId: string, destinationKey: string, order: number) => {
      await emitWithAck(
        "kanban/card/update-stage",
        "kanban/card/update-stage-response",
        {
          cardId,
          destinationKey,
          order,
          reason: "Drag and drop move",
        }
      );
      await refreshBoard();
    },
    [emitWithAck, refreshBoard]
  );

  const reorderColumn = useCallback(
    async (columnKey: string, orderedCardIds: string[]) => {
      await emitWithAck(
        "kanban/card/reorder",
        "kanban/card/reorder-response",
        {
          columnKey,
          orderedCardIds,
        }
      );
      await refreshBoard();
    },
    [emitWithAck, refreshBoard]
  );

  const createCard = useCallback(
    async (cardData: Partial<KanbanCard>) => {
      await emitWithAck(
        "kanban/card/create",
        "kanban/card/create-response",
        { cardData }
      );
      await refreshBoard();
    },
    [emitWithAck, refreshBoard]
  );

  const updateCard = useCallback(
    async (cardId: string, cardData: Partial<KanbanCard>) => {
      await emitWithAck(
        "kanban/card/update",
        "kanban/card/update-response",
        { cardId, cardData }
      );
      await refreshBoard();
    },
    [emitWithAck, refreshBoard]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      await emitWithAck(
        "kanban/card/delete",
        "kanban/card/delete-response",
        { cardId }
      );
      await refreshBoard();
    },
    [emitWithAck, refreshBoard]
  );

  const stats = useMemo(() => {
    const totalCards = columns.reduce((sum, column) => sum + column.cards.length, 0);
    const totalBudget = columns.reduce(
      (sum, column) => sum + column.cards.reduce((inner, card) => inner + (card.budget || 0), 0),
      0
    );

    const tasks = columns.reduce(
      (acc, column) => {
        column.cards.forEach((card) => {
          acc.total += card.tasks?.total || 0;
          acc.completed += card.tasks?.completed || 0;
        });
        return acc;
      },
      { total: 0, completed: 0 }
    );

    return {
      totalCards,
      totalBudget,
      tasks,
    };
  }, [columns]);

  return {
    board,
    columns,
    loading,
    error,
    stats,
    filters,
    updateFilters,
    refreshBoard,
    moveCard,
    reorderColumn,
    createCard,
    updateCard,
    deleteCard,
  };
};

export default useKanbanBoard;

