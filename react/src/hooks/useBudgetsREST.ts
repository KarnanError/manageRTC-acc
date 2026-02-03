/**
 * Budgets REST API Hook
 * Provides budget management functionality via REST API
 */

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { message } from 'antd';
import { get, post, put, del, buildParams, ApiResponse } from '../services/api';

export interface Budget {
  _id: string;
  budgetId: string;
  projectId: string;
  name: string;
  description?: string;
  totalBudget: number;
  allocatedBudget: number;
  spentAmount: number;
  remainingBudget: number;
  budgetType: 'Project' | 'Phase' | 'Task' | 'Milestone';
  status: 'Draft' | 'Active' | 'Approved' | 'Exceeded';
  fiscalYear?: string;
  startDate: string;
  endDate: string;
  budgetCategories: Array<{
    category: string;
    allocated: number;
    spent: number;
  }>;
  approvals: Array<{
    userId: string;
    approvedAt: string;
    comments?: string;
  }>;
  approvedBy?: string;
  approvedDate?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  utilizationPercentage?: number;
  isOverBudget?: boolean;
  isNearLimit?: boolean;
  projectDetails?: {
    projectId: string;
    name: string;
    status: string;
  };
}

export interface BudgetFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: string;
  budgetType?: string;
  fiscalYear?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BudgetTracking {
  budgetId: string;
  name: string;
  totalBudget: number;
  allocatedBudget: number;
  spentAmount: number;
  remainingBudget: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  status: string;
  budgetCategories: Array<{
    category: string;
    allocated: number;
    spent: number;
  }>;
  variance: number;
  startDate: string;
  endDate: string;
}

export interface BudgetStats {
  total: number;
  draft: number;
  active: number;
  approved: number;
  exceeded: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  typeDistribution: Array<{
    _id: string;
    count: number;
  }>;
  overallUtilization: number;
}

/**
 * Budgets REST API Hook
 */
export const useBudgetsREST = () => {
  const socket = useSocket();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [tracking, setTracking] = useState<BudgetTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch budgets with optional filters
   */
  const fetchBudgets = useCallback(async (filters: BudgetFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Budget[]> = await get('/budgets', { params });

      if (response.success && response.data) {
        setBudgets(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch budgets');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch budgets';
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
      const response: ApiResponse<BudgetStats> = await get('/budgets/stats');

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('[useBudgetsREST] Failed to fetch stats:', err);
    }
  }, []);

  /**
   * Get budget by ID
   */
  const getBudgetById = useCallback(async (budgetId: string): Promise<Budget | null> => {
    try {
      const response: ApiResponse<Budget> = await get(`/budgets/${budgetId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch budget');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch budget';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get budgets by project
   */
  const getBudgetsByProject = useCallback(async (projectId: string, filters: Omit<BudgetFilters, 'projectId'> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Budget[]> = await get(`/budgets/project/${projectId}`, { params });

      if (response.success && response.data) {
        setBudgets(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch project budgets');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch project budgets';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get budget tracking
   */
  const getBudgetTracking = useCallback(async (budgetId: string): Promise<BudgetTracking | null> => {
    try {
      const response: ApiResponse<BudgetTracking> = await get(`/budgets/${budgetId}/tracking`);

      if (response.success && response.data) {
        setTracking(response.data);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch budget tracking');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch budget tracking';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Create budget
   */
  const createBudget = useCallback(async (budgetData: Partial<Budget>): Promise<boolean> => {
    try {
      const response: ApiResponse<Budget> = await post('/budgets', budgetData);

      if (response.success && response.data) {
        message.success('Budget created successfully!');
        setBudgets(prev => [...prev, response.data!]);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to create budget');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create budget';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Update budget
   */
  const updateBudget = useCallback(async (budgetId: string, updateData: Partial<Budget>): Promise<boolean> => {
    try {
      const response: ApiResponse<Budget> = await put(`/budgets/${budgetId}`, updateData);

      if (response.success && response.data) {
        message.success('Budget updated successfully!');
        setBudgets(prev =>
          prev.map(budget => (budget._id === budgetId ? { ...budget, ...response.data! } : budget))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update budget');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update budget';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Delete budget
   */
  const deleteBudget = useCallback(async (budgetId: string): Promise<boolean> => {
    try {
      const response: ApiResponse = await del(`/budgets/${budgetId}`);

      if (response.success) {
        message.success('Budget deleted successfully!');
        setBudgets(prev => prev.filter(budget => budget._id !== budgetId));
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete budget');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete budget';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Add expense to budget
   */
  const addExpense = useCallback(async (budgetId: string, amount: number, category?: string): Promise<boolean> => {
    try {
      const response: ApiResponse<Budget> = await post(`/budgets/${budgetId}/expense`, { amount, category });

      if (response.success && response.data) {
        message.success(`Expense of $${amount} added successfully!`);
        // Update the budget in state
        setBudgets(prev =>
          prev.map(budget => (budget._id === budgetId ? { ...budget, ...response.data! } : budget))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to add expense');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to add expense';
      message.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Approve budget
   */
  const approveBudget = useCallback(async (budgetId: string, comment?: string): Promise<boolean> => {
    try {
      const response: ApiResponse<Budget> = await post(`/budgets/${budgetId}/approve`, { comment });

      if (response.success && response.data) {
        message.success('Budget approved successfully!');
        setBudgets(prev =>
          prev.map(budget => (budget._id === budgetId ? { ...budget, ...response.data! } : budget))
        );
        return true;
      }
      throw new Error(response.error?.message || 'Failed to approve budget');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to approve budget';
      message.error(errorMessage);
      return false;
    }
  }, []);

  // Socket.IO real-time listeners (limited for budgets)
  useEffect(() => {
    if (!socket) return;

    const handleBudgetUpdated = (data: Budget) => {
      console.log('[useBudgetsREST] Budget updated via broadcast:', data);
      setBudgets(prev =>
        prev.map(budget => (budget._id === data._id ? { ...budget, ...data } : budget))
      );
    };

    socket.on('budget:updated', handleBudgetUpdated);

    return () => {
      socket.off('budget:updated', handleBudgetUpdated);
    };
  }, [socket]);

  return {
    budgets,
    stats,
    tracking,
    loading,
    error,
    fetchBudgets,
    fetchStats,
    getBudgetById,
    getBudgetsByProject,
    getBudgetTracking,
    createBudget,
    updateBudget,
    deleteBudget,
    addExpense,
    approveBudget
  };
};

export default useBudgetsREST;
