/**
 * Change Request REST API Hook
 * Phase 1: Manages employee-submitted change requests for sensitive profile fields
 * - Create change request (bank details, name, phone, address, emergency contact)
 * - View my own requests
 * - HR: View all requests, approve, reject
 */

import { useCallback, useState } from 'react';
import { get, patch, post } from '../services/api';
import { handleApiError } from '../services/api';
import { message } from 'antd';

// ─────────────────────────────────────────────────────────────────────────────
// Types for Change Request Data
// ─────────────────────────────────────────────────────────────────────────────

export type ChangeRequestType =
  | 'bankDetails'
  | 'name'
  | 'phone'
  | 'address'
  | 'emergencyContact'
  | 'other';

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ChangeRequest {
  _id: string;
  companyId: string;
  employeeId: string;
  employeeObjectId: string;
  employeeName: string;
  requestType: ChangeRequestType;
  fieldChanged: string; // dot-notation path, e.g. "bankDetails.accountNumber"
  fieldLabel: string; // human-readable label
  oldValue: any;
  newValue: any;
  reason: string;
  status: ChangeRequestStatus;
  requestedAt: string | Date;
  reviewedBy?: string | null; // ObjectId of HR who reviewed
  reviewerName?: string | null;
  reviewedAt?: string | Date | null;
  reviewNote?: string | null;
  isDeleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ChangeRequestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Input types
export interface CreateChangeRequestInput {
  requestType: ChangeRequestType;
  fieldChanged: string; // dot-notation path
  fieldLabel?: string; // human-readable label (optional, defaults to fieldChanged)
  newValue: any;
  reason: string; // minimum 5 characters
}

export interface ChangeRequestFilters {
  status?: ChangeRequestStatus;
  requestType?: ChangeRequestType;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface ReviewChangeRequestInput {
  reviewNote: string; // minimum 5 characters for rejection
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Change Request Hook
 * Manages change requests for sensitive profile field updates
 */
export const useChangeRequestREST = () => {
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ChangeRequest[]>([]);
  const [pagination, setPagination] = useState<ChangeRequestPagination | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new change request
  const createChangeRequest = useCallback(async (input: CreateChangeRequestInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useChangeRequestREST] Creating change request:', input);

      const response = await post<{ message: string; data?: ChangeRequest }>(
        '/change-requests',
        input
      );

      if (response.success) {
        message.success('Change request submitted successfully. HR will review it shortly.');
        return true;
      } else {
        const errorMsg = response.error?.message || 'Failed to submit change request';
        message.error(errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      message.error(`Failed to submit change request: ${errorMsg}`);
      setError(errorMsg);
      console.error('[useChangeRequestREST] Error creating change request:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch my own change requests
  const fetchMyRequests = useCallback(async (filters?: ChangeRequestFilters) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.page) queryParams.append('page', String(filters.page));
      if (filters?.limit) queryParams.append('limit', String(filters.limit));

      const queryString = queryParams.toString();
      const response = await get<ChangeRequest[]>(
        `/change-requests/my${queryString ? `?${queryString}` : ''}`
      );

      if (response.success && response.data) {
        setMyRequests(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch change requests');
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      console.error('[useChangeRequestREST] Error fetching my requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all change requests (HR/Admin only)
  const fetchAllRequests = useCallback(async (filters?: ChangeRequestFilters) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.requestType) queryParams.append('requestType', filters.requestType);
      if (filters?.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters?.page) queryParams.append('page', String(filters.page));
      if (filters?.limit) queryParams.append('limit', String(filters.limit));

      const queryString = queryParams.toString();
      const response = await get<ChangeRequest[]>(
        `/change-requests${queryString ? `?${queryString}` : ''}`
      );

      if (response.success && response.data) {
        setAllRequests(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch change requests');
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      console.error('[useChangeRequestREST] Error fetching all requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve a change request (HR/Admin only)
  const approveChangeRequest = useCallback(async (
    id: string,
    input?: ReviewChangeRequestInput
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useChangeRequestREST] Approving change request:', id);

      const response = await patch<{ message: string }>(
        `/change-requests/${id}/approve`,
        input || {}
      );

      if (response.success) {
        message.success(response.message || 'Change request approved successfully.');
        // Refresh the list
        await fetchAllRequests();
        return true;
      } else {
        const errorMsg = response.error?.message || 'Failed to approve change request';
        message.error(errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      message.error(`Failed to approve change request: ${errorMsg}`);
      setError(errorMsg);
      console.error('[useChangeRequestREST] Error approving change request:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAllRequests]);

  // Reject a change request (HR/Admin only)
  const rejectChangeRequest = useCallback(async (
    id: string,
    input: ReviewChangeRequestInput
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useChangeRequestREST] Rejecting change request:', id);

      // Validate review note
      if (!input.reviewNote || input.reviewNote.trim().length < 5) {
        message.error('Rejection reason is required (minimum 5 characters)');
        return false;
      }

      const response = await patch<{ message: string }>(
        `/change-requests/${id}/reject`,
        input
      );

      if (response.success) {
        message.success('Change request rejected.');
        // Refresh the list
        await fetchAllRequests();
        return true;
      } else {
        const errorMsg = response.error?.message || 'Failed to reject change request';
        message.error(errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      message.error(`Failed to reject change request: ${errorMsg}`);
      setError(errorMsg);
      console.error('[useChangeRequestREST] Error rejecting change request:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAllRequests]);

  // Check if there's a pending request for a specific field
  const hasPendingRequestForField = useCallback((fieldChanged: string): boolean => {
    return myRequests.some(
      req => req.fieldChanged === fieldChanged && req.status === 'pending'
    );
  }, [myRequests]);

  return {
    // Data
    myRequests,
    allRequests,
    pagination,

    // State
    loading,
    error,

    // Employee operations
    createChangeRequest,
    fetchMyRequests,
    hasPendingRequestForField,

    // HR/Admin operations
    fetchAllRequests,
    approveChangeRequest,
    rejectChangeRequest,
  };
};
