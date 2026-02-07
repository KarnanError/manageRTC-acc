/**
 * Designations REST API Hook - Complete with CRUD operations
 * Replaces Socket.IO-based designation operations with REST API calls
 * Real-time updates still use Socket.IO listeners for broadcasts
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, buildParams, ApiResponse, getAuthToken } from '../services/api';

export interface Designation {
  _id: string;
  designation: string;
  designationId: string;
  departmentId: string;
  department?: string; // Populated by backend
  status: 'Active' | 'Inactive' | 'On Notice' | 'Resigned' | 'Terminated' | 'On Leave';
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignationStats {
  totalDesignations?: number;
  activeCount?: number;
  inactiveCount?: number;
  recentCount?: number;
}

export interface DesignationFilters {
  departmentId?: string;
  status?: string;
  search?: string;
}

export interface CreateDesignationRequest {
  designation: string;
  departmentId: string;
  status?: string;
  description?: string;
}

export interface DeleteErrorDetails {
  code?: string;
  message: string;
  details?: any;
}

export interface DeleteResult {
  success: boolean;
  error?: DeleteErrorDetails;
}

const buildApiError = (err: any, fallbackMessage: string): DeleteErrorDetails => {
  const apiError = err?.response?.data?.error;
  return {
    code: apiError?.code,
    message: apiError?.message || err?.message || fallbackMessage,
    details: apiError?.details
  };
};

/**
 * Designations REST API Hook
 */
export const useDesignationsREST = () => {
  const socket = useSocket();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [stats, setStats] = useState<DesignationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all designations with optional filters
   * REST API: GET /api/designations
   * Note: Company ID is extracted server-side from the token's public metadata
   * The API interceptor handles token refresh automatically
   */
  const fetchDesignations = useCallback(async (filters: DesignationFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Designation[]> = await get('/designations', { params });

      if (response.success && response.data) {
        setDesignations(response.data);

        // Calculate stats
        const total = response.data.length;
        const activeCount = response.data.filter(d => d.status === 'Active').length;
        const inactiveCount = response.data.filter(d => d.status === 'Inactive').length;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = response.data.filter(d => {
          if (!d.createdAt) return false;
          return new Date(d.createdAt) >= sevenDaysAgo;
        }).length;

        setStats({
          totalDesignations: total,
          activeCount,
          inactiveCount,
          recentCount
        });

        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch designations');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch designations';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get designation by ID
   * REST API: GET /api/designations/:id
   */
  const getDesignationById = useCallback(async (designationId: string): Promise<Designation | null> => {
    try {
      const response: ApiResponse<Designation> = await get(`/designations/${designationId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch designation');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch designation';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Create new designation
   * REST API: POST /api/designations
   */
  const createDesignation = useCallback(async (
    designationData: CreateDesignationRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Designation> = await post('/designations', designationData);

      if (response.success && response.data) {
        message.success('Designation created successfully!');
        await fetchDesignations();
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create designation');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create designation';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDesignations]);

  /**
   * Update designation
   * REST API: PUT /api/designations/:id
   */
  const updateDesignation = useCallback(async (
    designationId: string,
    updateData: Partial<Designation>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Designation> = await put(`/designations/${designationId}`, updateData);

      if (response.success && response.data) {
        message.success('Designation updated successfully!');
        await fetchDesignations();
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update designation');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update designation';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDesignations]);

  /**
   * Delete designation
   * REST API: DELETE /api/designations/:id
   */
  const deleteDesignation = useCallback(async (
    designationId: string,
    reassignToId?: string
  ): Promise<DeleteResult> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse = await del(`/designations/${designationId}`, {
        reassignTo: reassignToId
      });

      if (response.success) {
        message.success('Designation deleted successfully!');
        await fetchDesignations();
        return { success: true };
      }
      throw new Error(response.error?.message || 'Failed to delete designation');
    } catch (err: any) {
      const apiError = buildApiError(err, 'Failed to delete designation');
      if (apiError.code !== 'DEPENDENT_RECORDS') {
        setError(apiError.message);
        message.error(apiError.message);
      }
      return { success: false, error: apiError };
    } finally {
      setLoading(false);
    }
  }, [fetchDesignations]);

  /**
   * Update designation status
   * REST API: PUT /api/designations/:id/status
   */
  const updateDesignationStatus = useCallback(async (
    designationId: string,
    status: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Designation> = await put(`/designations/${designationId}/status`, { status });

      if (response.success && response.data) {
        message.success(`Designation status updated to ${status}`);
        await fetchDesignations();
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update designation status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update designation status';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDesignations]);

  /**
   * Get designation statistics
   * Stats are calculated from fetchDesignations, so we just call that
   */
  const fetchStats = useCallback(async () => {
    // Stats are calculated in fetchDesignations, so just call it to refresh stats
    return fetchDesignations();
  }, [fetchDesignations]);

  /**
   * Search designations
   * REST API: GET /api/designations/search
   */
  const searchDesignations = useCallback(async (searchTerm: string) => {
    return fetchDesignations({ search: searchTerm });
  }, [fetchDesignations]);

  /**
   * Get designations by department
   */
  const getDesignationsByDepartment = useCallback(async (departmentId: string) => {
    return fetchDesignations({ departmentId });
  }, [fetchDesignations]);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleDesignationCreated = (data: Designation) => {
      console.log('[useDesignationsREST] Designation created via broadcast:', data);
      setDesignations(prev => [...prev, data]);
    };

    const handleDesignationUpdated = (data: Designation) => {
      console.log('[useDesignationsREST] Designation updated via broadcast:', data);
      setDesignations(prev =>
        prev.map(desg => (desg._id === data._id ? { ...desg, ...data } : desg))
      );
    };

    const handleDesignationDeleted = (data: { _id: string }) => {
      console.log('[useDesignationsREST] Designation deleted via broadcast:', data);
      setDesignations(prev => prev.filter(desg => desg._id !== data._id));
    };

    socket.on('designation:created', handleDesignationCreated);
    socket.on('designation:updated', handleDesignationUpdated);
    socket.on('designation:deleted', handleDesignationDeleted);

    return () => {
      socket.off('designation:created', handleDesignationCreated);
      socket.off('designation:updated', handleDesignationUpdated);
      socket.off('designation:deleted', handleDesignationDeleted);
    };
  }, [socket]);

  // Initial data fetch - wait for auth token
  // Company ID is extracted server-side from the token's public metadata (same as Socket.IO)
  useEffect(() => {
    const token = getAuthToken();

    // Guard: Don't fetch until token is available
    if (!token) {
      console.log('[useDesignationsREST] Waiting for auth token', { hasToken: !!token });
      return;
    }

    fetchDesignations();
  }, []);

  return {
    designations,
    stats,
    loading,
    error,
    fetchDesignations,
    getDesignationById,
    createDesignation,
    updateDesignation,
    deleteDesignation,
    updateDesignationStatus,
    fetchStats,
    searchDesignations,
    getDesignationsByDepartment
  };
};

export default useDesignationsREST;
