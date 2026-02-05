/**
 * Overtime REST API Hook
 * Connects frontend overtime components to backend REST API
 */

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { get, post, put, del as apiDel, buildParams, ApiResponse } from '../services/api';
import { useSocket } from '../SocketContext';

// Overtime Types
export type OvertimeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface OvertimeRequest {
  _id: string;
  overtimeId?: string;
  employeeId?: string;
  employeeName?: string;
  date: string;
  hours: number;
  reason?: string;
  description?: string;
  project?: string;
  status: OvertimeStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface OvertimeStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
}

export interface OvertimeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OvertimeStatus;
  employee?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Status display mapping for UI
export const statusDisplayMap: Record<OvertimeStatus, { label: string; color: string; badgeClass: string }> = {
  pending: { label: 'Pending', color: 'warning', badgeClass: 'badge-warning' },
  approved: { label: 'Accepted', color: 'success', badgeClass: 'badge-success' },
  rejected: { label: 'Rejected', color: 'danger', badgeClass: 'badge-danger' },
  cancelled: { label: 'Cancelled', color: 'default', badgeClass: 'badge-secondary' },
};

/**
 * Transform backend overtime data to frontend format
 */
const transformOvertimeData = (backendOvertime: any): OvertimeRequest => {
  return {
    ...backendOvertime,
    status: backendOvertime.status || 'pending',
  };
};

/**
 * Overtime REST API Hook
 */
export const useOvertimeREST = () => {
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [myOvertimeRequests, setMyOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [stats, setStats] = useState<OvertimeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const socket = useSocket();

  /**
   * Fetch all overtime requests (Admin/HR view)
   */
  const fetchOvertimeRequests = useCallback(async (filters: OvertimeFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = buildParams(filters);
      const response: ApiResponse<OvertimeRequest[]> = await get('/overtime', { params: queryParams });

      if (response.success && response.data) {
        setOvertimeRequests(response.data.map(transformOvertimeData));
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch overtime requests');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch overtime requests';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch current user's overtime requests
   */
  const fetchMyOvertimeRequests = useCallback(async (filters: OvertimeFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = buildParams(filters);
      const response: ApiResponse<OvertimeRequest[]> = await get('/overtime/my', { params: queryParams });

      if (response.success && response.data) {
        setMyOvertimeRequests(response.data.map(transformOvertimeData));
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch your overtime requests');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch your overtime requests';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get single overtime request by ID
   */
  const getOvertimeRequestById = useCallback(async (id: string): Promise<OvertimeRequest | null> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<OvertimeRequest> = await get(`/overtime/${id}`);

      if (response.success && response.data) {
        return transformOvertimeData(response.data);
      }
      throw new Error(response.error?.message || 'Failed to fetch overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new overtime request
   */
  const createOvertimeRequest = useCallback(async (overtimeData: Partial<OvertimeRequest>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...overtimeData,
        date: overtimeData.date ? new Date(overtimeData.date).toISOString() : undefined,
      };

      const response: ApiResponse<OvertimeRequest> = await post('/overtime', payload);

      if (response.success && response.data) {
        message.success('Overtime request submitted successfully!');
        setMyOvertimeRequests(prev => [...prev, transformOvertimeData(response.data!)]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update overtime request
   */
  const updateOvertimeRequest = useCallback(async (overtimeId: string, updateData: Partial<OvertimeRequest>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...updateData,
        date: updateData.date ? new Date(updateData.date).toISOString() : undefined,
      };

      const response: ApiResponse<OvertimeRequest> = await put(`/overtime/${overtimeId}`, payload);

      if (response.success && response.data) {
        message.success('Overtime request updated successfully!');
        setOvertimeRequests(prev =>
          prev.map(req => req._id === overtimeId ? { ...req, ...transformOvertimeData(response.data!) } : req)
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Approve overtime request
   */
  const approveOvertimeRequest = useCallback(async (overtimeId: string, comments?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<OvertimeRequest> = await post(`/overtime/${overtimeId}/approve`, { comments });

      if (response.success && response.data) {
        message.success('Overtime request approved successfully!');
        setOvertimeRequests(prev =>
          prev.map(req => req._id === overtimeId ? { ...req, ...transformOvertimeData(response.data!) } : req)
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to approve overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to approve overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reject overtime request
   */
  const rejectOvertimeRequest = useCallback(async (overtimeId: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!reason || !reason.trim()) {
        message.error('Rejection reason is required');
        return false;
      }

      const response: ApiResponse<OvertimeRequest> = await post(`/overtime/${overtimeId}/reject`, { reason });

      if (response.success && response.data) {
        message.warning('Overtime request rejected');
        setOvertimeRequests(prev =>
          prev.map(req => req._id === overtimeId ? { ...req, ...transformOvertimeData(response.data!) } : req)
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to reject overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to reject overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancel overtime request
   */
  const cancelOvertimeRequest = useCallback(async (overtimeId: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<OvertimeRequest> = await post(`/overtime/${overtimeId}/cancel`, { reason });

      if (response.success && response.data) {
        message.info('Overtime request cancelled');
        setMyOvertimeRequests(prev =>
          prev.map(req => req._id === overtimeId ? { ...req, ...transformOvertimeData(response.data!) } : req)
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to cancel overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to cancel overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete overtime request (soft delete)
   */
  const deleteOvertimeRequest = useCallback(async (overtimeId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<{ overtimeId: string; isDeleted: boolean }> = await apiDel(`/overtime/${overtimeId}`);

      if (response.success) {
        message.success('Overtime request deleted successfully');
        setOvertimeRequests(prev => prev.filter(req => req._id !== overtimeId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete overtime request');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete overtime request';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get overtime statistics
   */
  const fetchStats = useCallback(async (): Promise<OvertimeStats | null> => {
    try {
      const response: ApiResponse<OvertimeStats> = await get('/overtime/stats');

      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error('[useOvertimeREST] Failed to fetch stats:', err);
      return null;
    }
  }, []);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleOvertimeCreated = (data: any) => {
      console.log('[useOvertimeREST] Overtime created via broadcast:', data);
      setOvertimeRequests(prev => [...prev, transformOvertimeData(data)]);
      message.info(`New overtime request from ${data.employeeName || 'Employee'}`);
    };

    const handleOvertimeUpdated = (data: any) => {
      console.log('[useOvertimeREST] Overtime updated via broadcast:', data);
      setOvertimeRequests(prev =>
        prev.map(req => req._id === data._id || req.overtimeId === data.overtimeId ? { ...req, ...transformOvertimeData(data) } : req)
      );
    };

    const handleOvertimeApproved = (data: any) => {
      console.log('[useOvertimeREST] Overtime approved via broadcast:', data);
      setOvertimeRequests(prev =>
        prev.map(req => req._id === data._id || req.overtimeId === data.overtimeId ? { ...req, ...transformOvertimeData(data) } : req)
      );
      message.success(`Overtime request approved for ${data.employeeName || 'Employee'}`);
    };

    const handleOvertimeRejected = (data: any) => {
      console.log('[useOvertimeREST] Overtime rejected via broadcast:', data);
      setOvertimeRequests(prev =>
        prev.map(req => req._id === data._id || req.overtimeId === data.overtimeId ? { ...req, ...transformOvertimeData(data) } : req)
      );
      message.warning(`Overtime request rejected for ${data.employeeName || 'Employee'}`);
    };

    const handleOvertimeDeleted = (data: any) => {
      console.log('[useOvertimeREST] Overtime deleted via broadcast:', data);
      setOvertimeRequests(prev => prev.filter(req => req._id !== data._id && req.overtimeId !== data.overtimeId));
      message.info('Overtime request deleted');
    };

    socket.on('overtime:created', handleOvertimeCreated);
    socket.on('overtime:updated', handleOvertimeUpdated);
    socket.on('overtime:approved', handleOvertimeApproved);
    socket.on('overtime:rejected', handleOvertimeRejected);
    socket.on('overtime:deleted', handleOvertimeDeleted);

    return () => {
      socket.off('overtime:created', handleOvertimeCreated);
      socket.off('overtime:updated', handleOvertimeUpdated);
      socket.off('overtime:approved', handleOvertimeApproved);
      socket.off('overtime:rejected', handleOvertimeRejected);
      socket.off('overtime:deleted', handleOvertimeDeleted);
    };
  }, [socket]);

  return {
    // Data
    overtimeRequests,
    myOvertimeRequests,
    stats,
    loading,
    error,
    pagination,

    // Methods
    fetchOvertimeRequests,
    fetchMyOvertimeRequests,
    getOvertimeRequestById,
    createOvertimeRequest,
    updateOvertimeRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    cancelOvertimeRequest,
    deleteOvertimeRequest,
    fetchStats,
  };
};

export default useOvertimeREST;
