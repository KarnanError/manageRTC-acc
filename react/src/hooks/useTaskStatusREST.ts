/**
 * Task Status REST API Hook
 * Manages task status boards (kanban columns) via REST API
 */

import { message } from 'antd';
import { useCallback, useState } from 'react';
import { ApiResponse, get, post, put } from '../services/api';

// Default task statuses as fallback if API fails
export const DEFAULT_TASK_STATUSES: TaskStatus[] = [
  { _id: 'todo', key: 'todo', name: 'To do', colorName: 'purple', colorHex: '#6f42c1', order: 1 },
  { _id: 'inprogress', key: 'inprogress', name: 'In Progress', colorName: 'info', colorHex: '#0dcaf0', order: 2 },
  { _id: 'review', key: 'review', name: 'Review', colorName: 'warning', colorHex: '#ffc107', order: 3 },
  { _id: 'completed', key: 'completed', name: 'Completed', colorName: 'success', colorHex: '#198754', order: 4 },
  { _id: 'onhold', key: 'onhold', name: 'On Hold', colorName: 'secondary', colorHex: '#6c757d', order: 5 },
  { _id: 'cancelled', key: 'cancelled', name: 'Cancelled', colorName: 'danger', colorHex: '#dc3545', order: 6 },
];

export interface TaskStatus {
  _id: string;
  key: string;
  name: string;
  colorName: string;
  colorHex: string;
  order: number;
}

export interface CreateTaskStatusData {
  name: string;
  colorName: string;
  colorHex: string;
}

export interface UpdateTaskStatusData {
  name?: string;
  colorName?: string;
  colorHex?: string;
  order?: number;
}

/**
 * Task Status REST API Hook
 */
export const useTaskStatusREST = () => {
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskStatuses = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<TaskStatus[]> = await get('/tasks/statuses');

      if (response.success && response.data) {
        setStatuses(response.data);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to fetch task statuses');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message || err.message || 'Failed to fetch task statuses';
      setError(errorMessage);

      // Use default statuses as fallback
      console.warn('[useTaskStatusREST] Using default task statuses as fallback:', errorMessage);
      setStatuses(DEFAULT_TASK_STATUSES);

      // Don't show error message to user since we have a fallback
      // message.error(errorMessage); // Commented out - we have a fallback
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTaskStatus = useCallback(async (data: CreateTaskStatusData): Promise<boolean> => {
    try {
      const response: ApiResponse<TaskStatus> = await post('/tasks/statuses', data);

      if (response.success && response.data) {
        message.success('Status board created successfully!');
        setStatuses((prev) => [...prev, response.data!].sort((a, b) => a.order - b.order));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create status board');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message || err.message || 'Failed to create status board';
      message.error(errorMessage);
      return false;
    }
  }, []);

  const updateTaskStatus = useCallback(
    async (statusId: string, data: UpdateTaskStatusData): Promise<boolean> => {
      try {
        const response: ApiResponse<TaskStatus> = await put(`/tasks/statuses/${statusId}`, data);

        if (response.success && response.data) {
          message.success('Status board updated successfully!');
          setStatuses((prev) =>
            prev
              .map((status) =>
                status._id === statusId ? { ...status, ...response.data! } : status
              )
              .sort((a, b) => a.order - b.order)
          );
          return true;
        }
        throw new Error(response.error?.message || 'Failed to update status board');
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error?.message || err.message || 'Failed to update status board';
        message.error(errorMessage);
        return false;
      }
    },
    []
  );

  return {
    statuses,
    loading,
    error,
    fetchTaskStatuses,
    createTaskStatus,
    updateTaskStatus,
  };
};

export default useTaskStatusREST;
