/**
 * Time Tracking REST API Hook
 * Provides time tracking functionality via REST API
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, buildParams, ApiResponse } from '../services/api';

export interface TimeEntry {
  _id: string;
  timeEntryId: string;
  projectId: string;
  taskId?: string;
  milestoneId?: string;
  userId: string;
  description: string;
  duration: number;
  billable: boolean;
  billRate: number;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  isEditable?: boolean;
  isOverdue?: boolean;
  billedAmount?: number;
  projectDetails?: {
    projectId: string;
    name: string;
  };
  taskDetails?: {
    title: string;
    status: string;
  };
}

export interface TimeEntryFilters {
  page?: number;
  limit?: number;
  userId?: string;
  projectId?: string;
  taskId?: string;
  status?: string;
  billable?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface TimesheetData {
  entries: TimeEntry[];
  groupedByDate: Record<string, TimeEntry[]>;
  totals: {
    totalHours: number;
    billableHours: number;
    totalEntries: number;
    billedAmount: number;
  };
}

export interface TimeTrackingStats {
  totalHours: number;
  billableHours: number;
  totalEntries: number;
  draftEntries: number;
  submittedEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  totalBilledAmount: number;
  topUsers: Array<{
    _id: string;
    totalHours: number;
    entryCount: number;
  }>;
}

/**
 * Time Tracking REST API Hook
 */
export const useTimeTrackingREST = () => {
  const socket = useSocket();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<TimeTrackingStats | null>(null);
  const [timesheet, setTimesheet] = useState<TimesheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch time entries with optional filters
   */
  const fetchTimeEntries = useCallback(async (filters: TimeEntryFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<TimeEntry[]> = await get('/timetracking', { params });

      if (response.success && response.data) {
        setTimeEntries(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch time entries');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch time entries';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch statistics
   */
  const fetchStats = useCallback(async (filters: Omit<TimeEntryFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'> = {}) => {
    try {
      const params = buildParams(filters);
      const response: ApiResponse<TimeTrackingStats> = await get('/timetracking/stats', { params });

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('[useTimeTrackingREST] Failed to fetch stats:', err);
    }
  }, []);

  /**
   * Get time entry by ID
   */
  const getTimeEntryById = useCallback(async (timeEntryId: string): Promise<TimeEntry | null> => {
    try {
      const response: ApiResponse<TimeEntry> = await get(`/timetracking/${timeEntryId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch time entry');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch time entry';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get time entries by user
   */
  const getTimeEntriesByUser = useCallback(async (userId: string, filters: Omit<TimeEntryFilters, 'userId'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<TimeEntry[]> = await get(`/timetracking/user/${userId}`, { params });

      if (response.success && response.data) {
        setTimeEntries(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch user time entries');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch user time entries';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get time entries by project
   */
  const getTimeEntriesByProject = useCallback(async (projectId: string, filters: Omit<TimeEntryFilters, 'projectId'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<TimeEntry[]> = await get(`/timetracking/project/${projectId}`, { params });

      if (response.success && response.data) {
        setTimeEntries(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch project time entries');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch project time entries';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get time entries by task
   */
  const getTimeEntriesByTask = useCallback(async (taskId: string, filters: Omit<TimeEntryFilters, 'taskId'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<TimeEntry[]> = await get(`/timetracking/task/${taskId}`, { params });

      if (response.success && response.data) {
        setTimeEntries(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch task time entries');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch task time entries';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get timesheet
   */
  const getTimesheet = useCallback(async (userId: string, startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response: ApiResponse<TimesheetData> = await get(`/timetracking/timesheet/${userId}`, { params });

      if (response.success && response.data) {
        setTimesheet(response.data);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch timesheet');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch timesheet';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create time entry
   */
  const createTimeEntry = useCallback(async (timeEntryData: Partial<TimeEntry>): Promise<boolean> => {
    try {
      const response: ApiResponse<TimeEntry> = await post('/timetracking', timeEntryData);

      if (response.success && response.data) {
        message.success('Time entry created successfully!');
        setTimeEntries(prev => [...prev, response.data!]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create time entry');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create time entry';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update time entry
   */
  const updateTimeEntry = useCallback(async (timeEntryId: string, updateData: Partial<TimeEntry>): Promise<boolean> => {
    try {
      const response: ApiResponse<TimeEntry> = await put(`/timetracking/${timeEntryId}`, updateData);

      if (response.success && response.data) {
        message.success('Time entry updated successfully!');
        setTimeEntries(prev =>
          prev.map(entry => (entry._id === timeEntryId ? { ...entry, ...response.data! } : entry))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update time entry');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update time entry';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Delete time entry
   */
  const deleteTimeEntry = useCallback(async (timeEntryId: string): Promise<boolean> => {
    try {
      const response: ApiResponse = await del(`/timetracking/${timeEntryId}`);

      if (response.success) {
        message.success('Time entry deleted successfully!');
        setTimeEntries(prev => prev.filter(entry => entry._id !== timeEntryId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete time entry');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete time entry';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Submit timesheet
   */
  const submitTimesheet = useCallback(async (timeEntryIds?: string[]): Promise<boolean> => {
    try {
      const response: ApiResponse<{ submittedCount: number }> = await post('/timetracking/submit', { timeEntryIds });

      if (response.success) {
        message.success(`Timesheet submitted successfully! (${response.data?.submittedCount || 0} entries)`);
        // Update the status of submitted entries
        if (timeEntryIds && timeEntryIds.length > 0) {
          setTimeEntries(prev =>
            prev.map(entry =>
              timeEntryIds.includes(entry._id) ? { ...entry, status: 'Submitted' as const } : entry
            )
          );
        } else {
          // All entries were submitted
          setTimeEntries(prev =>
            prev.map(entry => ({ ...entry, status: 'Submitted' as const }))
          );
        }
        return true;
      }
      throw new Error(response.error?.message || 'Failed to submit timesheet');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to submit timesheet';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Approve timesheet (admin only)
   */
  const approveTimesheet = useCallback(async (userId: string, timeEntryIds?: string[]): Promise<boolean> => {
    try {
      const response: ApiResponse<{ approvedCount: number }> = await post('/timetracking/approve', { userId, timeEntryIds });

      if (response.success) {
        message.success(`Timesheet approved successfully! (${response.data?.approvedCount || 0} entries)`);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to approve timesheet');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to approve timesheet';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Reject timesheet (admin only)
   */
  const rejectTimesheet = useCallback(async (userId: string, timeEntryIds?: string[], reason?: string): Promise<boolean> => {
    try {
      const response: ApiResponse<{ rejectedCount: number }> = await post('/timetracking/reject', { userId, timeEntryIds, reason });

      if (response.success) {
        message.success(`Timesheet rejected successfully! (${response.data?.rejectedCount || 0} entries)`);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to reject timesheet');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to reject timesheet';
      message.error(errorMessage);
      return false;
    }
  }, []);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleTimeEntryCreated = (data: TimeEntry) => {
      console.log('[useTimeTrackingREST] Time entry created via broadcast:', data);
      setTimeEntries(prev => [...prev, data]);
    };

    const handleTimeEntryUpdated = (data: TimeEntry) => {
      console.log('[useTimeTrackingREST] Time entry updated via broadcast:', data);
      setTimeEntries(prev =>
        prev.map(entry => (entry._id === data._id ? { ...entry, ...data } : entry))
      );
    };

    const handleTimesheetSubmitted = (data: { submittedCount: number }) => {
      console.log('[useTimeTrackingREST] Timesheet submitted via broadcast:', data);
      // Update status of all draft entries to submitted
      setTimeEntries(prev =>
        prev.map(entry => (entry.status === 'Draft' ? { ...entry, status: 'Submitted' as const } : entry))
      );
    };

    const handleTimesheetApproved = (data: { approvedCount: number }) => {
      console.log('[useTimeTrackingREST] Timesheet approved via broadcast:', data);
    };

    const handleTimesheetRejected = (data: { rejectedCount: number; reason?: string }) => {
      console.log('[useTimeTrackingREST] Timesheet rejected via broadcast:', data);
    };

    const handleTimeEntryDeleted = (data: { timeEntryId: string }) => {
      console.log('[useTimeTrackingREST] Time entry deleted via broadcast:', data);
      setTimeEntries(prev => prev.filter(entry => entry.timeEntryId !== data.timeEntryId));
    };

    socket.on('timeentry:created', handleTimeEntryCreated);
    socket.on('timeentry:updated', handleTimeEntryUpdated);
    socket.on('timesheet:submitted', handleTimesheetSubmitted);
    socket.on('timesheet:approved', handleTimesheetApproved);
    socket.on('timesheet:rejected', handleTimesheetRejected);
    socket.on('timeentry:deleted', handleTimeEntryDeleted);

    return () => {
      socket.off('timeentry:created', handleTimeEntryCreated);
      socket.off('timeentry:updated', handleTimeEntryUpdated);
      socket.off('timesheet:submitted', handleTimesheetSubmitted);
      socket.off('timesheet:approved', handleTimesheetApproved);
      socket.off('timesheet:rejected', handleTimesheetRejected);
      socket.off('timeentry:deleted', handleTimeEntryDeleted);
    };
  }, [socket]);

  return {
    timeEntries,
    stats,
    timesheet,
    loading,
    error,
    fetchTimeEntries,
    fetchStats,
    getTimeEntryById,
    getTimeEntriesByUser,
    getTimeEntriesByProject,
    getTimeEntriesByTask,
    getTimesheet,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    submitTimesheet,
    approveTimesheet,
    rejectTimesheet
  };
};

export default useTimeTrackingREST;
