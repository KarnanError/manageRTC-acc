/**
 * Milestones REST API Hook
 * Provides milestone management functionality via REST API
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, patch, buildParams, ApiResponse } from '../services/api';

export interface Milestone {
  _id: string;
  milestoneId: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  dueDate: string;
  completedDate?: string;
  progress: number;
  dependencies: string[];
  deliverables: string[];
  attachments: Array<{
    filename: string;
    url: string;
    uploadedAt: string;
  }>;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  isOverdue?: boolean;
  daysUntilDue?: number;
  projectDetails?: {
    projectId: string;
    name: string;
    status: string;
  };
}

export interface MilestoneFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface MilestoneStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  priorityDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

/**
 * Milestones REST API Hook
 */
export const useMilestonesREST = () => {
  const socket = useSocket();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch milestones with optional filters
   */
  const fetchMilestones = useCallback(async (filters: MilestoneFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Milestone[]> = await get('/milestones', { params });

      if (response.success && response.data) {
        setMilestones(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch milestones');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch milestones';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response: ApiResponse<MilestoneStats> = await get('/milestones/stats');

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('[useMilestonesREST] Failed to fetch stats:', err);
    }
  }, []);

  /**
   * Get milestone by ID
   */
  const getMilestoneById = useCallback(async (milestoneId: string): Promise<Milestone | null> => {
    try {
      const response: ApiResponse<Milestone> = await get(`/milestones/${milestoneId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch milestone');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch milestone';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get milestones by project
   */
  const getMilestonesByProject = useCallback(async (projectId: string, filters: Omit<MilestoneFilters, 'projectId'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Milestone[]> = await get(`/milestones/project/${projectId}`, { params });

      if (response.success && response.data) {
        setMilestones(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch project milestones');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch project milestones';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create milestone
   */
  const createMilestone = useCallback(async (milestoneData: Partial<Milestone>): Promise<boolean> => {
    try {
      const response: ApiResponse<Milestone> = await post('/milestones', milestoneData);

      if (response.success && response.data) {
        message.success('Milestone created successfully!');
        setMilestones(prev => [...prev, response.data!]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create milestone');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create milestone';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update milestone
   */
  const updateMilestone = useCallback(async (milestoneId: string, updateData: Partial<Milestone>): Promise<boolean> => {
    try {
      const response: ApiResponse<Milestone> = await put(`/milestones/${milestoneId}`, updateData);

      if (response.success && response.data) {
        message.success('Milestone updated successfully!');
        setMilestones(prev =>
          prev.map(milestone => (milestone._id === milestoneId ? { ...milestone, ...response.data! } : milestone))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update milestone');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update milestone';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Delete milestone
   */
  const deleteMilestone = useCallback(async (milestoneId: string): Promise<boolean> => {
    try {
      const response: ApiResponse = await del(`/milestones/${milestoneId}`);

      if (response.success) {
        message.success('Milestone deleted successfully!');
        setMilestones(prev => prev.filter(milestone => milestone._id !== milestoneId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete milestone');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete milestone';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Mark milestone as complete
   */
  const markComplete = useCallback(async (milestoneId: string): Promise<boolean> => {
    try {
      const response: ApiResponse<Milestone> = await patch(`/milestones/${milestoneId}/complete`);

      if (response.success && response.data) {
        message.success('Milestone marked as complete!');
        setMilestones(prev =>
          prev.map(milestone => (milestone._id === milestoneId ? { ...milestone, ...response.data! } : milestone))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to mark milestone as complete');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to mark milestone as complete';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update milestone progress
   */
  const updateProgress = useCallback(async (milestoneId: string, progress: number): Promise<boolean> => {
    try {
      const response: ApiResponse<Milestone> = await patch(`/milestones/${milestoneId}/progress`, { progress });

      if (response.success && response.data) {
        message.success('Milestone progress updated!');
        setMilestones(prev =>
          prev.map(milestone => (milestone._id === milestoneId ? { ...milestone, ...response.data! } : milestone))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update progress');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update progress';
      message.error(errorMessage);
      return false;
    }
  }, []);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleMilestoneCreated = (data: Milestone) => {
      console.log('[useMilestonesREST] Milestone created via broadcast:', data);
      setMilestones(prev => [...prev, data]);
    };

    const handleMilestoneUpdated = (data: Milestone) => {
      console.log('[useMilestonesREST] Milestone updated via broadcast:', data);
      setMilestones(prev =>
        prev.map(milestone => (milestone._id === data._id ? { ...milestone, ...data } : milestone))
      );
    };

    const handleMilestoneCompleted = (data: Milestone) => {
      console.log('[useMilestonesREST] Milestone completed via broadcast:', data);
      setMilestones(prev =>
        prev.map(milestone => (milestone._id === data._id ? { ...milestone, ...data } : milestone))
      );
    };

    const handleMilestoneProgressUpdated = (data: Milestone) => {
      console.log('[useMilestonesREST] Milestone progress updated via broadcast:', data);
      setMilestones(prev =>
        prev.map(milestone => (milestone._id === data._id ? { ...milestone, ...data } : milestone))
      );
    };

    const handleMilestoneDeleted = (data: { milestoneId: string; projectId: string }) => {
      console.log('[useMilestonesREST] Milestone deleted via broadcast:', data);
      setMilestones(prev => prev.filter(milestone => milestone.milestoneId !== data.milestoneId));
    };

    socket.on('milestone:created', handleMilestoneCreated);
    socket.on('milestone:updated', handleMilestoneUpdated);
    socket.on('milestone:completed', handleMilestoneCompleted);
    socket.on('milestone:progress_updated', handleMilestoneProgressUpdated);
    socket.on('milestone:deleted', handleMilestoneDeleted);

    return () => {
      socket.off('milestone:created', handleMilestoneCreated);
      socket.off('milestone:updated', handleMilestoneUpdated);
      socket.off('milestone:completed', handleMilestoneCompleted);
      socket.off('milestone:progress_updated', handleMilestoneProgressUpdated);
      socket.off('milestone:deleted', handleMilestoneDeleted);
    };
  }, [socket]);

  return {
    milestones,
    stats,
    loading,
    error,
    fetchMilestones,
    fetchStats,
    getMilestoneById,
    getMilestonesByProject,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    markComplete,
    updateProgress
  };
};

export default useMilestonesREST;
