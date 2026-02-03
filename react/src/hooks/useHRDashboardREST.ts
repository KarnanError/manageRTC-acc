/**
 * HR Dashboard REST API Hook
 * Replaces Socket.IO-based HR Dashboard operations with REST API calls
 */

import { useCallback, useState } from 'react';
import { ApiResponse, buildParams, get, getAuthToken } from '../services/api';

// Dashboard Data Types
export interface HRDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newJoiners: number;
  totalResignations: number;
  resignationsLast30Days: number;
  totalTerminations: number;
  terminationsLast30Days: number;
  // Growth percentages
  employeesGrowth?: number;
  activeGrowth?: number;
  inactiveGrowth?: number;
  joinersGrowth?: number;
}

export interface EmployeeByDepartment {
  department: string;
  count: number;
}

export interface EmployeesByStatus {
  active: number;
  inactive: number;
  onNotice: number;
  terminated: number;
  resigned: number;
}

export interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  recentlyAdded: number;
}

export interface DesignationStats {
  totalDesignations: number;
  activeDesignations: number;
  inactiveDesignations: number;
  departmentWiseCount: Array<{ department: string; count: number }>;
}

export interface PolicyStats {
  totalActivePolicies: number;
  policiesCreatedLast30Days: number;
  policiesAppliedToAll: number;
  policiesSelective: number;
}

export interface HolidayStats {
  totalHolidays: number;
  upcomingHolidays: number;
  holidayTypesCount: number;
}

export interface TrainingStats {
  totalTrainings: number;
  activeTrainings: number;
  totalTrainers: number;
  employeesInTraining: number;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
}

export interface ResourceStats {
  allocatedResources: number;
  availableResources: number;
  overAllocated: number;
  averageTeamSize: number;
}

export interface RecentActivity {
  _id: string;
  action: string;
  description: string;
  createdAt: string;
  actorName: string;
  actorRole: string;
}

export interface LeaveStats {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  onLeaveToday: number;
}

export interface AttendanceStats {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

export interface HolidayEvent {
  _id: string;
  title: string;
  date: string;
  originalDate: string;
  description: string;
  status: string;
  holidayTypeName: string;
  holidayTypeId: string;
  repeatsEveryYear: boolean;
}

export interface BirthdayEvent {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  status: string;
  date: string;
  originalDate: string;
  birthYear: number;
  type: string;
  repeatsYearly: boolean;
}

export interface AnniversaryEvent {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  status: string;
  date: string;
  originalDate: string;
  joiningYear: number;
  yearsWithCompany: number;
  type: 'joined' | 'anniversary';
  repeatsYearly: boolean;
}

export interface CalendarEvent {
  type: 'holiday' | 'birthday' | 'anniversary';
  title: string;
  date: string;
  data?: any;
}

export interface HRDashboardData {
  stats?: HRDashboardStats;
  employeesByDepartment?: EmployeeByDepartment[];
  employeesByStatus?: EmployeesByStatus;
  departmentStats?: DepartmentStats;
  designationStats?: DesignationStats;
  policyStats?: PolicyStats;
  holidayStats?: HolidayStats;
  trainingStats?: TrainingStats;
  projectStats?: ProjectStats;
  resourceStats?: ResourceStats;
  recentActivities?: RecentActivity[];
  departmentWiseProjects?: Array<{ department: string; count: number }>;
  trainingDistribution?: Array<{ type: string; count: number }>;
  upcomingHolidays?: HolidayEvent[];
  todaysHolidays?: HolidayEvent[];
  allActiveHolidays?: HolidayEvent[];
  employeeBirthdays?: BirthdayEvent[];
  employeeAnniversaries?: AnniversaryEvent[];
  leaveStats?: LeaveStats;
  attendanceStats?: AttendanceStats;
  recentBirthdays?: BirthdayEvent[];
  upcomingBirthdays?: BirthdayEvent[];
  recentAnniversaries?: AnniversaryEvent[];
  upcomingAnniversaries?: AnniversaryEvent[];
  calendarEvents?: CalendarEvent[];
}

export interface HRDashboardFilters {
  year?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * HR Dashboard REST API Hook
 */
export const useHRDashboardREST = () => {
  const [dashboardData, setDashboardData] = useState<HRDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch full HR Dashboard statistics
   * REST API: GET /api/hr-dashboard/stats
   */
  const fetchDashboardStats = useCallback(async (filters: HRDashboardFilters = {}) => {
    // Guard: Check for auth token before making request
    // Company ID is extracted server-side from the token's public metadata (same as Socket.IO)
    const token = getAuthToken();

    if (!token) {
      console.log('[useHRDashboardREST] Cannot fetch - missing auth token', { hasToken: !!token });
      setError('Authentication required. Please ensure you are logged in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response: ApiResponse<HRDashboardData> = await get('/hr-dashboard/stats', { params });

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('[useHRDashboardREST] Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch HR Dashboard summary (quick stats)
   * REST API: GET /api/hr-dashboard/summary
   */
  const fetchDashboardSummary = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setError('Authentication required. Please ensure you are logged in.');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Partial<HRDashboardData>> = await get('/hr-dashboard/summary');

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch dashboard summary');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch dashboard summary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch upcoming holidays
   * REST API: GET /api/hr-dashboard/holidays/upcoming
   */
  const fetchUpcomingHolidays = useCallback(async (limit: number = 10) => {
    const token = getAuthToken();

    if (!token) {
      return [];
    }

    try {
      const response: ApiResponse<HolidayEvent[]> = await get('/hr-dashboard/holidays/upcoming', {
        params: { limit }
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      console.error('[useHRDashboardREST] Failed to fetch holidays:', err);
      return [];
    }
  }, []);

  /**
   * Fetch employee birthdays
   * REST API: GET /api/hr-dashboard/birthdays
   */
  const fetchBirthdays = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      return { recent: [], upcoming: [] };
    }

    try {
      const response: ApiResponse<{ recent: BirthdayEvent[]; upcoming: BirthdayEvent[] }> =
        await get('/hr-dashboard/birthdays');

      if (response.success && response.data) {
        return response.data;
      }
      return { recent: [], upcoming: [] };
    } catch (err: any) {
      console.error('[useHRDashboardREST] Failed to fetch birthdays:', err);
      return { recent: [], upcoming: [] };
    }
  }, []);

  /**
   * Fetch employee work anniversaries
   * REST API: GET /api/hr-dashboard/anniversaries
   */
  const fetchAnniversaries = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      return { recent: [], upcoming: [] };
    }

    try {
      const response: ApiResponse<{ recent: AnniversaryEvent[]; upcoming: AnniversaryEvent[] }> =
        await get('/hr-dashboard/anniversaries');

      if (response.success && response.data) {
        return response.data;
      }
      return { recent: [], upcoming: [] };
    } catch (err: any) {
      console.error('[useHRDashboardREST] Failed to fetch anniversaries:', err);
      return { recent: [], upcoming: [] };
    }
  }, []);

  /**
   * Fetch all calendar events (holidays, birthdays, anniversaries)
   * REST API: GET /api/hr-dashboard/calendar-events
   */
  const fetchCalendarEvents = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      return [];
    }

    try {
      const response: ApiResponse<CalendarEvent[]> = await get('/hr-dashboard/calendar-events');

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      console.error('[useHRDashboardREST] Failed to fetch calendar events:', err);
      return [];
    }
  }, []);

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardStats,
    fetchDashboardSummary,
    fetchUpcomingHolidays,
    fetchBirthdays,
    fetchAnniversaries,
    fetchCalendarEvents
  };
};

export default useHRDashboardREST;
