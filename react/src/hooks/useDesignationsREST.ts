/**
 * Designations REST API Hook
 * Replaces Socket.IO-based designation operations with REST API calls
 * Real-time updates still use Socket.IO listeners
 */

import { useState, useCallback } from 'react';
import { message } from 'antd';
import { get, buildParams, ApiResponse } from '../services/api';

export interface Designation {
  _id: string;
  designation: string;
  departmentId: string;
  department?: string; // Populated by backend
  status: 'Active' | 'Inactive' | 'On Notice' | 'Resigned' | 'Terminated' | 'On Leave';
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignationFilters {
  departmentId?: string;
  status?: string;
}

/**
 * Designations REST API Hook
 */
export const useDesignationsREST = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all designations with optional filters
   * REST API: GET /api/designations
   */
  const fetchDesignations = useCallback(async (filters: DesignationFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Designation[]> = await get('/designations', { params });

      if (response.success && response.data) {
        setDesignations(response.data);
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

  return {
    designations,
    loading,
    error,
    fetchDesignations
  };
};

export default useDesignationsREST;
