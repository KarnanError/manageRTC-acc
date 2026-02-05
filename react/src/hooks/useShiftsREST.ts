/**
 * Shifts REST API Hook
 * Replaces Socket.IO-based shift operations with REST API calls
 * Real-time updates still use Socket.IO listeners for broadcasts
 */

import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { ApiResponse, buildParams, del, get, post, put } from '../services/api';
import { useSocket } from '../SocketContext';

export interface Shift {
  _id: string;
  shiftId?: string;
  name: string;
  code?: string;
  companyId: string;
  startTime: string;
  endTime: string;
  duration: number;
  timezone: string;
  gracePeriod: number;
  earlyDepartureAllowance: number;
  minHoursForFullDay: number;
  halfDayThreshold: number;
  overtime: {
    enabled: boolean;
    threshold: number;
    multiplier: number;
  };
  breakSettings: {
    enabled: boolean;
    mandatory: boolean;
    duration: number;
    maxDuration: number;
  };
  flexibleHours: {
    enabled: boolean;
    windowStart?: string;
    windowEnd?: string;
    minHoursInOffice: number;
  };
  isNightShift: boolean;
  type: 'regular' | 'night' | 'rotating' | 'flexible' | 'custom';
  workingDays: number[];
  rotation?: {
    enabled: boolean;
    cycle: 'daily' | 'weekly' | 'monthly';
    rotateAfterDays: number;
  };
  color: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ShiftFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeShift {
  _id: string;
  employeeId: string;
  employeeName?: string;
  shiftId: string;
  shiftName?: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignShiftRequest {
  employeeId: string;
  shiftId: string;
  effectiveDate: string;
  expiryDate?: string;
}

export interface BulkAssignShiftRequest {
  employeeIds: string[];
  shiftId: string;
  effectiveDate?: string;
}

export interface CreateShiftRequest {
  name: string;
  code?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  timezone?: string;
  gracePeriod?: number;
  earlyDepartureAllowance?: number;
  minHoursForFullDay?: number;
  halfDayThreshold?: number;
  overtime?: {
    enabled?: boolean;
    threshold?: number;
    multiplier?: number;
  };
  breakSettings?: {
    enabled?: boolean;
    mandatory?: boolean;
    duration?: number;
    maxDuration?: number;
  };
  flexibleHours?: {
    enabled?: boolean;
    windowStart?: string;
    windowEnd?: string;
    minHoursInOffice?: number;
  };
  type?: 'regular' | 'night' | 'rotating' | 'flexible' | 'custom';
  workingDays?: number[];
  color?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

/**
 * Shifts REST API Hook
 */
export const useShiftsREST = () => {
  const socket = useSocket();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [defaultShift, setDefaultShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch shifts with pagination and filtering
   * REST API: GET /api/shifts
   */
  const fetchShifts = useCallback(async (filters: ShiftFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<Shift[]> = await get('/shifts', { params });

      if (response.success && response.data) {
        setShifts(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch shifts');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch shifts';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get default shift for company
   * REST API: GET /api/shifts/default
   */
  const fetchDefaultShift = useCallback(async () => {
    try {
      const response: ApiResponse<Shift> = await get('/shifts/default');

      if (response.success && response.data) {
        setDefaultShift(response.data);
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error('[useShiftsREST] Failed to fetch default shift:', err);
      return null;
    }
  }, []);

  /**
   * Get all active shifts
   * REST API: GET /api/shifts/active
   */
  const fetchActiveShifts = useCallback(async () => {
    try {
      const response: ApiResponse<Shift[]> = await get('/shifts/active');

      if (response.success && response.data) {
        setShifts(response.data);
        return response.data;
      }
      return [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch active shifts';
      setError(errorMessage);
      message.error(errorMessage);
      return [];
    }
  }, []);

  /**
   * Get single shift by ID
   * REST API: GET /api/shifts/:id
   */
  const getShiftById = useCallback(async (shiftId: string): Promise<Shift | null> => {
    try {
      const response: ApiResponse<Shift> = await get(`/shifts/${shiftId}`);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch shift');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch shift';
      message.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Create new shift
   * REST API: POST /api/shifts
   */
  const createShift = useCallback(async (
    shiftData: CreateShiftRequest
  ): Promise<{ success: boolean; shift?: Shift; error?: any }> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Shift> = await post('/shifts', shiftData);

      if (response.success && response.data) {
        message.success('Shift created successfully!');
        await fetchShifts();
        return { success: true, shift: response.data };
      }
      throw new Error(response.error?.message || 'Failed to create shift');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create shift';
      setError(errorMessage);
      message.error(errorMessage);
      return {
        success: false,
        error: {
          ...err.response?.data?.error,
          message: errorMessage
        }
      };
    } finally {
      setLoading(false);
    }
  }, [fetchShifts]);

  /**
   * Update shift
   * REST API: PUT /api/shifts/:id
   */
  const updateShift = useCallback(async (
    shiftId: string,
    updateData: CreateShiftRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Shift> = await put(`/shifts/${shiftId}`, updateData);

      if (response.success && response.data) {
        message.success('Shift updated successfully!');
        await fetchShifts();
        return true;
      }
      throw new Error(response.error?.message || 'Failed to update shift');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update shift';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchShifts]);

  /**
   * Delete shift
   * REST API: DELETE /api/shifts/:id
   */
  const deleteShift = useCallback(async (shiftId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse = await del(`/shifts/${shiftId}`);

      if (response.success) {
        message.success('Shift deleted successfully!');
        await fetchShifts();
        return true;
      }
      throw new Error(response.error?.message || 'Failed to delete shift');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete shift';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchShifts]);

  /**
   * Set shift as default
   * REST API: PUT /api/shifts/:id/set-default
   */
  const setAsDefault = useCallback(async (shiftId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Shift> = await put(`/shifts/${shiftId}/set-default`, {});

      if (response.success) {
        message.success('Default shift updated successfully!');
        await fetchShifts();
        await fetchDefaultShift();
        return true;
      }
      throw new Error(response.error?.message || 'Failed to set default shift');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to set default shift';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchShifts, fetchDefaultShift]);

  /**
   * Assign shift to employee
   * REST API: POST /api/shifts/assign
   */
  const assignShiftToEmployee = useCallback(async (
    assignmentData: AssignShiftRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<EmployeeShift> = await post('/shifts/assign', assignmentData);

      if (response.success && response.data) {
        message.success('Shift assigned successfully!');
        return true;
      }
      throw new Error(response.error?.message || 'Failed to assign shift');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to assign shift';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bulk assign shifts to employees
   * REST API: POST /api/shifts/bulk-assign
   */
  const bulkAssignShifts = useCallback(async (
    bulkData: BulkAssignShiftRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { employeeIds, shiftId, effectiveDate } = bulkData;
      const response: ApiResponse<any> = await post('/shifts/bulk-assign', {
        employeeIds,
        shiftId,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0]
      });

      if (response.success) {
        message.success(`Successfully assigned shifts to ${employeeIds.length} employees!`);
        return true;
      }
      throw new Error(response.error?.message || 'Failed to bulk assign shifts');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to bulk assign shifts';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get employee's shift assignment
   * REST API: GET /api/shifts/employee/:employeeId
   */
  const getEmployeeShift = useCallback(async (
    employeeId: string
  ): Promise<EmployeeShift | null> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<EmployeeShift> = await get(`/shifts/employee/${employeeId}`);

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch employee shift';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove shift assignment from employee
   * REST API: DELETE /api/shifts/employee/:employeeId
   */
  const removeShiftAssignment = useCallback(async (employeeId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse = await del(`/shifts/employee/${employeeId}`);

      if (response.success) {
        message.success('Shift assignment removed successfully!');
        return true;
      }
      throw new Error(response.error?.message || 'Failed to remove shift assignment');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to remove shift assignment';
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket.IO real-time listeners for broadcast notifications
  useEffect(() => {
    if (!socket) return;

    const handleShiftCreated = (data: any) => {
      console.log('[useShiftsREST] Shift created via broadcast:', data);
      fetchShifts();
    };

    const handleShiftUpdated = (data: any) => {
      console.log('[useShiftsREST] Shift updated via broadcast:', data);
      setShifts(prev =>
        prev.map(shift => (shift._id === data._id ? { ...shift, ...data } : shift))
      );
    };

    const handleShiftDeleted = (data: any) => {
      console.log('[useShiftsREST] Shift deleted via broadcast:', data);
      setShifts(prev => prev.filter(shift => shift._id !== data._id));
    };

    const handleDefaultShiftChanged = (data: any) => {
      console.log('[useShiftsREST] Default shift changed via broadcast:', data);
      fetchShifts();
      fetchDefaultShift();
    };

    socket.on('shift:created', handleShiftCreated);
    socket.on('shift:updated', handleShiftUpdated);
    socket.on('shift:deleted', handleShiftDeleted);
    socket.on('shift:default_changed', handleDefaultShiftChanged);

    return () => {
      socket.off('shift:created', handleShiftCreated);
      socket.off('shift:updated', handleShiftUpdated);
      socket.off('shift:deleted', handleShiftDeleted);
      socket.off('shift:default_changed', handleDefaultShiftChanged);
    };
  }, [socket, fetchShifts, fetchDefaultShift]);

  // Initial data fetch
  useEffect(() => {
    fetchShifts();
    fetchDefaultShift();
  }, []);

  return {
    shifts,
    defaultShift,
    loading,
    error,
    fetchShifts,
    fetchActiveShifts,
    fetchDefaultShift,
    getShiftById,
    createShift,
    updateShift,
    deleteShift,
    setAsDefault,
    assignShiftToEmployee,
    bulkAssignShifts,
    getEmployeeShift,
    removeShiftAssignment
  };
};

export default useShiftsREST;
