/**
 * Custom useAuth Hook
 * Wraps Clerk authentication and provides user role for permission checks
 */

import { useUser } from '@clerk/clerk-react';

export interface UseAuthReturn {
  role: string;
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  companyId: string | null;
  employeeId: string | null;
}

/**
 * useAuth - Custom hook for authentication and role-based access
 *
 * Returns the user's role, companyId, and employeeId from Clerk user metadata
 * These values are stored in user.publicMetadata by the backend during authentication
 *
 * @example
 * const { role, isSignedIn, employeeId, companyId } = useAuth();
 * if (role === 'admin') { ... }
 * if (employeeId) { fetchEmployeeData(employeeId); }
 */
export const useAuth = (): UseAuthReturn => {
  const { user, isLoaded, isSignedIn } = useUser();

  // Get role from Clerk user metadata (set by backend during authentication)
  const getRole = (): string => {
    if (!user) return 'guest';

    // Role is stored in publicMetadata by the backend
    const role = (user.publicMetadata?.role as string) || 'employee';
    return role.toLowerCase();
  };

  return {
    role: getRole(),
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: user?.id ?? null,
    companyId: (user?.publicMetadata?.companyId as string) ?? null,
    employeeId: (user?.publicMetadata?.employeeId as string) ?? null,
  };
};

export default useAuth;
