/**
 * useSuperAdminUsers Hook
 * Custom hook for managing Super Admin users
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface SuperAdminUser {
  _id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  profileImage?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdBy?: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  loginCount?: number;
}

interface SuperAdminStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  recentlyCreated: number;
}

interface CreateSuperAdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  profileImage?: string;
  address?: string;
  sendEmail: boolean;
}

interface UpdateSuperAdminData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  profileImage?: string;
  address?: string;
  status?: string;
}

export function useSuperAdminUsers() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get auth headers
  const getAuthHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, [getToken]);

  // Fetch all superadmin users
  const fetchUsers = useCallback(async (filters?: { status?: string; search?: string }) => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters?.search) {
        queryParams.append('search', filters.search);
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users?${queryParams}`, {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching superadmin users:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/stats`, {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders]);

  // Create superadmin user
  const createUser = useCallback(async (userData: CreateSuperAdminData) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        await fetchUsers();
        await fetchStats();
        return { success: true, data: data.data, message: data.message };
      } else {
        const errorMsg = data.error?.message || 'Failed to create user';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error creating superadmin user:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders, fetchUsers, fetchStats]);

  // Update superadmin user
  const updateUser = useCallback(async (id: string, userData: UpdateSuperAdminData) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        await fetchUsers();
        return { success: true, data: data.data, message: data.message };
      } else {
        const errorMsg = data.error?.message || 'Failed to update user';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error updating superadmin user:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders, fetchUsers]);

  // Delete superadmin user
  const deleteUser = useCallback(async (id: string) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        await fetchUsers();
        await fetchStats();
        return { success: true, message: data.message };
      } else {
        const errorMsg = data.error?.message || 'Failed to delete user';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error deleting superadmin user:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders, fetchUsers, fetchStats]);

  // Reset user password
  const resetPassword = useCallback(async (id: string, newPassword: string, sendEmail = true) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/${id}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: newPassword, sendEmail }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        const errorMsg = data.error?.message || 'Failed to reset password';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders]);

  // Toggle user status
  const toggleStatus = useCallback(async (id: string, status: string) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        await fetchUsers();
        await fetchStats();
        return { success: true, message: data.message };
      } else {
        const errorMsg = data.error?.message || 'Failed to update status';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders, fetchUsers, fetchStats]);

  // Resend invitation
  const resendInvite = useCallback(async (id: string) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/${id}/resend-invite`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        const errorMsg = data.error?.message || 'Failed to resend invitation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error resending invite:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders]);

  // Refresh user metadata from Clerk
  const refreshMetadata = useCallback(async (id: string) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setSaving(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/superadmin/users/${id}/refresh-metadata`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh users list
        await fetchUsers();
        return { success: true, message: data.message, data: data.data };
      } else {
        const errorMsg = data.error?.message || 'Failed to refresh metadata';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      const errorMsg = 'Failed to connect to server';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [isLoaded, isSignedIn, getAuthHeaders, fetchUsers]);

  // Load data on mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUsers();
      fetchStats();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchUsers, fetchStats]);

  return {
    users,
    stats,
    loading,
    saving,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleStatus,
    resendInvite,
    refreshMetadata,
  };
}
