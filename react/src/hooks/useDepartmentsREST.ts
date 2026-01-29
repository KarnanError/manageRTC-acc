/**
 * Departments REST API Hook
 * Replaces Socket.IO-based department operations with REST API calls
 * Real-time updates still use Socket.IO listeners
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, buildParams, ApiResponse } from '../services/api';

export interface Department {
  _id: string;
  department: string;
  companyId?: string;
  employeeCount?: number;
  designationCount?: number;
  policyCount?: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentStats {
  totalDepartments: number;
  activeCount: number;
  inactiveCount: number;
  recentCount: number;
}

export interface DepartmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Departments REST API Hook
 */
export const useDepartmentsREST = () => {
  const socket = useSocket();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all departments with stats
   * REST API: GET /api/departments
   */
  const fetchDepartments = useCallback(async (filters: DepartmentFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Department[]> = await get('/departments', { params });

      if (response.success && response.data) {
        setDepartments(response.data);
        if (response.stats) {
          setStats(response.stats as DepartmentStats);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch departments');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch departments';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get department by ID
   * REST API: GET /api/departments/:id
   */
  const getDepartmentById = useCallback(async (departmentId: string): Promise<Department | null> => {
    try {
      const response: ApiResponse<Department> = await get(`/departments/${departmentId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch department');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch department';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Create new department
   * REST API: POST /api/departments
   */
  const createDepartment = useCallback(async (departmentData: Partial<Department>): Promise<boolean> => {
    try {
      const response: ApiResponse<Department> = await post('/departments', departmentData);

      if (response.success && response.data) {
        message.success('Department created successfully!');
        setDepartments(prev => [...prev, response.data!]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create department');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create department';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update department
   * REST API: PUT /api/departments/:id
   */
  const updateDepartment = useCallback(async (departmentId: string, updateData: Partial<Department>): Promise<boolean> => {
    try {
      const response: ApiResponse<Department> = await put(`/departments/${departmentId}`, updateData);

      if (response.success && response.data) {
        message.success('Department updated successfully!');
        setDepartments(prev =>
          prev.map(dept =>
            dept._id === departmentId ? { ...dept, ...response.data! } : dept
          )
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update department');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update department';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Delete department
   * REST API: DELETE /api/departments/:id
   */
  const deleteDepartment = useCallback(async (departmentId: string): Promise<boolean> => {
    try {
      const response: ApiResponse = await del(`/departments/${departmentId}`);

      if (response.success) {
        message.success('Department deleted successfully!');
        setDepartments(prev => prev.filter(dept => dept._id !== departmentId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete department');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete department';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update department status
   * REST API: PATCH /api/departments/:id/status
   */
  const updateDepartmentStatus = useCallback(async (departmentId: string, status: string): Promise<boolean> => {
    try {
      const response: ApiResponse<Department> = await put(`/departments/${departmentId}/status`, { status });

      if (response.success && response.data) {
        message.success(`Department status updated to ${status}`);
        setDepartments(prev =>
          prev.map(dept =>
            dept._id === departmentId ? { ...dept, ...response.data! } : dept
          )
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update department status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update department status';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Search departments
   * REST API: GET /api/departments (with search parameter)
   */
  const searchDepartments = useCallback(async (searchTerm: string) => {
    return fetchDepartments({ search: searchTerm });
  }, [fetchDepartments]);

  /**
   * Get active departments only
   * REST API: GET /api/departments?status=Active
   */
  const getActiveDepartments = useCallback(async () => {
    return fetchDepartments({ status: 'Active' });
  }, [fetchDepartments]);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleDepartmentCreated = (data: Department) => {
      console.log('[useDepartmentsREST] Department created via broadcast:', data);
      setDepartments(prev => [...prev, data]);
    };

    const handleDepartmentUpdated = (data: Department) => {
      console.log('[useDepartmentsREST] Department updated via broadcast:', data);
      setDepartments(prev =>
        prev.map(dept => (dept._id === data._id ? { ...dept, ...data } : dept))
      );
    };

    const handleDepartmentDeleted = (data: { _id: string }) => {
      console.log('[useDepartmentsREST] Department deleted via broadcast:', data);
      setDepartments(prev => prev.filter(dept => dept._id !== data._id));
    };

    socket.on('department:created', handleDepartmentCreated);
    socket.on('department:updated', handleDepartmentUpdated);
    socket.on('department:deleted', handleDepartmentDeleted);

    return () => {
      socket.off('department:created', handleDepartmentCreated);
      socket.off('department:updated', handleDepartmentUpdated);
      socket.off('department:deleted', handleDepartmentDeleted);
    };
  }, [socket]);

  return {
    departments,
    stats,
    loading,
    error,
    fetchDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    updateDepartmentStatus,
    searchDepartments,
    getActiveDepartments
  };
};

export default useDepartmentsREST;
