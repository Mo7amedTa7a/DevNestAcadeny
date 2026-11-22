import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAccessToken, clearAccessToken } from '@/lib/axios';
import { loginUser, logoutUser, getMe, refreshToken } from '../api/auth.api';

/**
 * Auth context providing user state, login, logout, and silent refresh.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Initial auth check
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Attempt silent refresh on app mount to restore session.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await refreshToken();
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        // No valid refresh token — user is not logged in
        clearAccessToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login with identifier (email or student code) + password.
   */
  const login = useCallback(async (identifier, password) => {
    const response = await loginUser(identifier, password);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response;
  }, []);

  /**
   * Logout — clear session on server and client.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Fetch and refresh the current user profile.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await getMe();
      setUser(response.data.user);
    } catch {
      // If this fails, the interceptor will handle redirect
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
