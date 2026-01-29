/**
 * Policies REST API Hook
 * Replaces Socket.IO-based policy operations with REST API calls
 * Real-time updates still use Socket.IO listeners
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, buildParams, ApiResponse } from '../services/api';

export interface PolicyAssignment {
  departmentId: string;
  designationIds: string[];
  departmentName?: string; // Populated by backend for display
}

export interface Policy {
  _id: string;
  policyName: string;
  policyDescription: string;
  effectiveDate: string;
  applyToAll?: boolean;
  assignTo?: PolicyAssignment[];
  companyId?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyStats {
  total: number;
  active: number;
  inactive: number;
  applyToAllCount: number;
}

export interface PolicyFilters {
  department?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Policies REST API Hook
 */
export const usePoliciesREST = () => {
  const socket = useSocket();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [stats, setStats] = useState<PolicyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all policies with optional filters
   * REST API: GET /api/policies
   */
  const fetchPolicies = useCallback(async (filters: PolicyFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Policy[]> = await get('/policies', { params });

      if (response.success && response.data) {
        setPolicies(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch policies');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch policies';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get policy stats
   * REST API: GET /api/policies/stats
   */
  const fetchPolicyStats = useCallback(async () => {
    try {
      const response: ApiResponse<PolicyStats> = await get('/policies/stats');

      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch policy stats');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch policy stats';
      console.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get policy by ID
   * REST API: GET /api/policies/:id
   */
  const getPolicyById = useCallback(async (policyId: string): Promise<Policy | null> => {
    try {
      const response: ApiResponse<Policy> = await get(`/policies/${policyId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch policy');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch policy';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Create new policy
   * REST API: POST /api/policies
   */
  const createPolicy = useCallback(async (policyData: Partial<Policy>): Promise<boolean> => {
    try {
      const response: ApiResponse<Policy> = await post('/policies', policyData);

      if (response.success && response.data) {
        message.success('Policy created successfully!');
        setPolicies(prev => [...prev, response.data!]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create policy');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create policy';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update policy
   * REST API: PUT /api/policies/:id
   */
  const updatePolicy = useCallback(async (policyId: string, updateData: Partial<Policy>): Promise<boolean> => {
    try {
      const response: ApiResponse<Policy> = await put(`/policies/${policyId}`, updateData);

      if (response.success && response.data) {
        message.success('Policy updated successfully!');
        setPolicies(prev =>
          prev.map(policy =>
            policy._id === policyId ? { ...policy, ...response.data! } : policy
          )
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update policy');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update policy';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Delete policy
   * REST API: DELETE /api/policies/:id
   */
  const deletePolicy = useCallback(async (policyId: string): Promise<boolean> => {
    try {
      const response: ApiResponse = await del(`/policies/${policyId}`);

      if (response.success) {
        message.success('Policy deleted successfully!');
        setPolicies(prev => prev.filter(policy => policy._id !== policyId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete policy');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete policy';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Search policies
   * REST API: GET /api/policies/search
   */
  const searchPolicies = useCallback(async (query: string) => {
    try {
      const response: ApiResponse<Policy[]> = await get('/policies/search', {
        params: { q: query }
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      console.error('Error searching policies:', err);
      return [];
    }
  }, []);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handlePolicyCreated = (data: Policy) => {
      console.log('[usePoliciesREST] Policy created via broadcast:', data);
      setPolicies(prev => [...prev, data]);
    };

    const handlePolicyUpdated = (data: Policy) => {
      console.log('[usePoliciesREST] Policy updated via broadcast:', data);
      setPolicies(prev =>
        prev.map(policy => (policy._id === data._id ? { ...policy, ...data } : policy))
      );
    };

    const handlePolicyDeleted = (data: { _id: string }) => {
      console.log('[usePoliciesREST] Policy deleted via broadcast:', data);
      setPolicies(prev => prev.filter(policy => policy._id !== data._id));
    };

    socket.on('policy:created', handlePolicyCreated);
    socket.on('policy:updated', handlePolicyUpdated);
    socket.on('policy:deleted', handlePolicyDeleted);

    return () => {
      socket.off('policy:created', handlePolicyCreated);
      socket.off('policy:updated', handlePolicyUpdated);
      socket.off('policy:deleted', handlePolicyDeleted);
    };
  }, [socket]);

  return {
    policies,
    stats,
    loading,
    error,
    fetchPolicies,
    fetchPolicyStats,
    getPolicyById,
    createPolicy,
    updatePolicy,
    deletePolicy,
    searchPolicies
  };
};

export default usePoliciesREST;
