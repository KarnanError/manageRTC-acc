/**
 * CompanyPagesContext
 *
 * Provides the list of pages (routes / page names) that are enabled for the
 * current user's company via the chain:
 *   Company → Plan → Modules → Pages
 *
 * Usage:
 *   const { isRouteEnabled, isPageEnabled, allEnabled, isLoading } = useCompanyPages();
 *
 * Rules:
 *   - superadmin role → allEnabled = true (bypasses all checks)
 *   - hr / employee   → only pages in company's active plan modules are enabled
 *   - If API fails    → falls back to allEnabled = true (graceful degradation)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CompanyPagesData {
  allEnabled: boolean;
  routes: string[];
  pageNames: string[];
  planName?: string;
  companyName?: string;
  reason?: string;
}

interface CompanyPagesContextValue {
  /** True while fetching from backend */
  isLoading: boolean;
  /** True if every route is allowed (superadmin or API fallback) */
  allEnabled: boolean;
  /** Check whether a route path is enabled for this company */
  isRouteEnabled: (route: string) => boolean;
  /** Check whether a page name (e.g. 'hrm.employees') is enabled */
  isPageEnabled: (pageName: string) => boolean;
  /** Re-fetch (call after plan changes) */
  refresh: () => void;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const CompanyPagesContext = createContext<CompanyPagesContextValue>({
  isLoading: true,
  allEnabled: true,
  isRouteEnabled: () => true,
  isPageEnabled: () => true,
  refresh: () => {},
});

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export const CompanyPagesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [enabledRoutes, setEnabledRoutes] = useState<Set<string>>(new Set());
  const [enabledPageNames, setEnabledPageNames] = useState<Set<string>>(new Set());
  const [allEnabled, setAllEnabled] = useState(true);

  // Prevent double-fetching on StrictMode re-render
  const fetchedRef = useRef(false);

  const fetchEnabledPages = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        // No token → keep allEnabled=true as safe fallback
        setAllEnabled(true);
        return;
      }

      const response = await fetch(`${API_BASE}/api/company/enabled-pages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // API error → fallback to showing everything (don't block the user)
        console.warn('[CompanyPages] API returned non-OK status:', response.status);
        setAllEnabled(true);
        return;
      }

      const json = await response.json();
      if (!json.success) {
        console.warn('[CompanyPages] API reported failure:', json.error);
        setAllEnabled(true);
        return;
      }

      const data: CompanyPagesData = json.data;

      if (data.allEnabled) {
        // Superadmin – no filtering needed
        setAllEnabled(true);
        setEnabledRoutes(new Set());
        setEnabledPageNames(new Set());
      } else {
        setAllEnabled(false);
        // Normalize routes: always ensure leading '/' so they match all_routes.tsx values
        // DB seed stores routes without leading '/' (e.g. 'employees') but
        // all_routes.tsx uses leading '/' (e.g. '/employees')
        const normalizeRoute = (r: string) =>
          r && !r.startsWith('/') ? `/${r}` : r;
        const normalizedRoutes = data.routes.flatMap((r) => [
          r,                   // original (for any exact-match case)
          normalizeRoute(r),   // normalized with leading /
        ]);
        setEnabledRoutes(new Set(normalizedRoutes));
        setEnabledPageNames(new Set(data.pageNames));
      }
    } catch (err) {
      console.error('[CompanyPages] Failed to fetch enabled pages:', err);
      // On network error, fall back to showing everything
      setAllEnabled(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      // Not signed in → loading done, show nothing
      setAllEnabled(false);
      setIsLoading(false);
      return;
    }
    // Fetch once per login session (fetchedRef prevents StrictMode double-fetch)
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchEnabledPages();
    }
  }, [isLoaded, isSignedIn, fetchEnabledPages]);

  /**
   * Check if a route path is enabled for this company.
   * Normalizes trailing slashes for consistent matching.
   */
  const isRouteEnabled = useCallback(
    (route: string): boolean => {
      if (allEnabled) return true;
      if (!route || route === '#' || route === 'index') return false;
      const normalized = route.replace(/\/$/, '').toLowerCase();
      return enabledRoutes.has(normalized) || enabledRoutes.has(route);
    },
    [allEnabled, enabledRoutes]
  );

  /**
   * Check if a page name (e.g. 'hrm.employees') is enabled for this company.
   */
  const isPageEnabled = useCallback(
    (pageName: string): boolean => {
      if (allEnabled) return true;
      return enabledPageNames.has(pageName);
    },
    [allEnabled, enabledPageNames]
  );

  const refresh = useCallback(() => {
    fetchedRef.current = false;
    fetchEnabledPages();
  }, [fetchEnabledPages]);

  return (
    <CompanyPagesContext.Provider
      value={{ isLoading, allEnabled, isRouteEnabled, isPageEnabled, refresh }}
    >
      {children}
    </CompanyPagesContext.Provider>
  );
};

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export const useCompanyPages = (): CompanyPagesContextValue => {
  return useContext(CompanyPagesContext);
};

export default CompanyPagesContext;
