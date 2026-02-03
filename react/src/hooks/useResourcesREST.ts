/**
 * Resources REST API Hook
 * Provides resource allocation functionality via REST API
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, buildParams, ApiResponse } from '../services/api';

export interface ResourceAllocation {
  _id: string;
  allocationId: string;
  projectId: string;
  taskId?: string;
  resourceId: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
  hourlyRate: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  skills: string[];
  companyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  durationDays?: number;
  projectDetails?: {
    projectId: string;
    name: string
  };
  taskDetails?: {
    title: string;
    status: string
  };
  resourceDetails?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
}

export interface ResourceFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  taskId?: string;
  resourceId?: string;
  status?: string;
  skills?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AvailableResource {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  skills: string[];
}

export interface ResourceUtilization {
  resourceId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalAvailableHours: number;
  totalAllocationHours: number;
  utilizationPercentage: number;
  allocations: Array<{
    allocationId: string;
    projectId: string;
    taskId: string;
    allocationPercentage: number;
    startDate: string;
    endDate: string;
    days: number;
    hours: number;
  }>;
  isOverUtilized: boolean;
  availableHours: number;
}

/**
 * Resources REST API Hook
 */
export const useResourcesREST = () => {
  const socket = useSocket();
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [availableResources, setAvailableResources] = useState<AvailableResource[]>([]);
  const [utilization, setUtilization] = useState<ResourceUtilization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch resource allocations with optional filters
   */
  const fetchAllocations = useCallback(async (filters: ResourceFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<ResourceAllocation[]> = await get('/resources', { params });

      if (response.success && response.data) {
        setAllocations(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch resource allocations');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch resource allocations';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get allocation by ID
   */
  const getAllocationById = useCallback(async (allocationId: string): Promise<ResourceAllocation | null> => {
    try {
      const response: ApiResponse<ResourceAllocation> = await get(`/resources/${allocationId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch allocation');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch allocation';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get allocations by project
   */
  const getAllocationsByProject = useCallback(async (projectId: string, filters: Omit<ResourceFilters, 'projectId'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<ResourceAllocation[]> = await get(`/resources/project/${projectId}`, { params });

      if (response.success && response.data) {
        setAllocations(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch project resources');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch project resources';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get available resources
   */
  const fetchAvailableResources = useCallback(async (startDate: string, endDate: string, skills: string[] = []) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { startDate, endDate };
      if (skills && skills.length > 0) {
        params.skills = skills.join(',');
      }

      const response: ApiResponse<AvailableResource[]> = await get('/resources/available', { params });

      if (response.success && response.data) {
        setAvailableResources(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch available resources');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch available resources';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get resource utilization
   */
  const fetchUtilization = useCallback(async (resourceId: string, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = { resourceId, startDate, endDate };
      const response: ApiResponse<ResourceUtilization> = await get('/resources/utilization', { params });

      if (response.success && response.data) {
        setUtilization(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch resource utilization');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch resource utilization';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check for conflicts
   */
  const checkConflicts = useCallback(async (resourceId: string, startDate: string, endDate: string) => {
    try {
      const params = { resourceId, startDate, endDate };
      const response: ApiResponse<{ hasConflict: boolean; conflicts: any[] }> = await get('/resources/conflicts', { params });

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to check conflicts');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to check conflicts';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Allocate resource
   */
  const allocateResource = useCallback(async (allocationData: Partial<ResourceAllocation>): Promise<boolean> => {
    try {
      const response: ApiResponse<ResourceAllocation> = await post('/resources/allocate', allocationData);

      if (response.success && response.data) {
        message.success('Resource allocated successfully!');
        setAllocations(prev => [...prev, response.data!]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to allocate resource');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to allocate resource';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update allocation
   */
  const updateAllocation = useCallback(async (allocationId: string, updateData: Partial<ResourceAllocation>): Promise<boolean> => {
    try {
      const response: ApiResponse<ResourceAllocation> = await put(`/resources/${allocationId}`, updateData);

      if (response.success && response.data) {
        message.success('Resource allocation updated successfully!');
        setAllocations(prev =>
          prev.map(allocation => (allocation._id === allocationId ? { ...allocation, ...response.data! } : allocation))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update allocation');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update allocation';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Deallocate resource
   */
  const deallocateResource = useCallback(async (allocationId: string, reason?: string): Promise<boolean> => {
    try {
      const response: ApiResponse = await del(`/resources/${allocationId}`, { reason });

      if (response.success) {
        message.success('Resource deallocated successfully!');
        setAllocations(prev => prev.filter(allocation => allocation._id !== allocationId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to deallocate resource');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to deallocate resource';
      message.error(errorMessage);
      return false;
    }
  }, []);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleResourceAllocated = (data: ResourceAllocation) => {
      console.log('[useResourcesREST] Resource allocated via broadcast:', data);
      setAllocations(prev => [...prev, data]);
    };

    const handleResourceUpdated = (data: ResourceAllocation) => {
      console.log('[useResourcesREST] Resource allocation updated via broadcast:', data);
      setAllocations(prev =>
        prev.map(allocation => (allocation._id === data._id ? { ...allocation, ...data } : allocation))
      );
    };

    const handleResourceDeallocated = (data: { allocationId: string }) => {
      console.log('[useResourcesREST] Resource deallocated via broadcast:', data);
      setAllocations(prev => prev.filter(allocation => allocation.allocationId !== data.allocationId));
    };

    socket.on('resource:allocated', handleResourceAllocated);
    socket.on('resource:updated', handleResourceUpdated);
    socket.on('resource:deallocated', handleResourceDeallocated);

    return () => {
      socket.off('resource:allocated', handleResourceAllocated);
      socket.off('resource:updated', handleResourceUpdated);
      socket.off('resource:deallocated', handleResourceDeallocated);
    };
  }, [socket]);

  return {
    allocations,
    availableResources,
    utilization,
    loading,
    error,
    fetchAllocations,
    getAllocationById,
    getAllocationsByProject,
    fetchAvailableResources,
    fetchUtilization,
    checkConflicts,
    allocateResource,
    updateAllocation,
    deallocateResource
  };
};

export default useResourcesREST;
