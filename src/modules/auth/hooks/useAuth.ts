import { useState, useCallback } from 'react';
import { authApi } from '../../../services/api';
import { tokenUtils } from '../../../utils/token';
import type { RegisterRequest, LoginRequest, LoginResponse } from '../../../types/api';

interface UseAuthReturn {
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isAuthenticated = !!tokenUtils.getAccessToken();

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Registration failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.logout();
      tokenUtils.clearAll();
    } catch (err) {

      tokenUtils.clearAll();
      setError(err instanceof Error ? err : new Error('Logout failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    clearError,
  };
}
