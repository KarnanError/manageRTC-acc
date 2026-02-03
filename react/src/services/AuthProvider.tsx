/**
 * Authentication Provider
 * Manages Clerk authentication token for API requests
 *
 * NOTE: Company ID is extracted server-side from the JWT token's public metadata
 * by the backend authentication middleware (same pattern as Socket.IO).
 * The frontend only needs to send the Authorization Bearer token.
 *
 * This provider must wrap the entire application
 */

import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { setAuthToken, setTokenRefreshCallback } from './api';

/**
 * AuthProvider Component
 * Wraps the app to provide authentication token to API service
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);

  // Create a stable callback for token refresh
  const refreshToken = useCallback(async () => {
    try {
      console.log('[AuthProvider] Refreshing token...');
      const token = await getToken({ skipCache: true });
      console.log('[AuthProvider] Token refreshed successfully');
      return token;
    } catch (error) {
      console.error('[AuthProvider] Token refresh failed:', error);
      return null;
    }
  }, [getToken]);

  useEffect(() => {
    // Set the token refresh callback for API interceptor
    setTokenRefreshCallback(refreshToken);

    return () => {
      setTokenRefreshCallback(null);
    };
  }, [refreshToken]);

  useEffect(() => {
    // Don't proceed if auth is not loaded or user is not signed in
    if (!isLoaded || !isSignedIn) {
      console.log('[AuthProvider] User not signed in or auth not loaded');
      setAuthToken(null);
      setTokenReady(false);
      return;
    }

    // Function to update token
    const updateToken = async () => {
      try {
        console.log('[AuthProvider] Requesting fresh token...');
        const token = await getToken({ skipCache: true }); // Force fresh token
        setAuthToken(token);
        setTokenReady(true); // Mark token as ready
        console.log('[AuthProvider] Token updated successfully');
      } catch (error) {
        console.error('[AuthProvider] Failed to get token:', error);
        setAuthToken(null);
        setTokenReady(false);
      }
    };

    // Get initial token
    updateToken();

    // Update token more frequently (every 30 seconds) to avoid expiration
    // Clerk tokens typically expire in 60 seconds
    const interval = setInterval(updateToken, 30 * 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [getToken, isSignedIn, isLoaded]);

  // Don't render children until token is ready for authenticated users
  if (isLoaded && isSignedIn && !tokenReady) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Loading authentication...</div>
    </div>;
  }

  return <>{children}</>;
};

export default AuthProvider;
