import { tokenUtils } from '../../utils/token';
import { authApi } from './auth';
import type { ErrorResponse } from '../../types/api';

const envBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envBase ? envBase.replace(/\/$/, '') : '';

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async refreshToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = authApi.refresh().catch((error) => {

      tokenUtils.clearAll();
      throw error;
    }).finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const accessToken = tokenUtils.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh') || endpoint.includes('/auth/register');
    if (accessToken && !isAuthEndpoint) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      console.log(`🌐 [API] ${options.method || 'GET'} ${endpoint}`);
      if (options.body) {
        console.log('   요청 본문:', options.body);
      }
      const response = await fetch(url, config);
      console.log(`   응답 상태: ${response.status} ${response.statusText}`);

      if (response.status === 401 && !isAuthEndpoint && retry) {
        console.warn('401 Unauthorized, attempting token refresh...');

        const refreshToken = tokenUtils.getRefreshToken();
        const currentAccessToken = tokenUtils.getAccessToken();
        console.log('Current access token:', currentAccessToken ? currentAccessToken.substring(0, 20) + '...' : 'none');
        console.log('Refresh token:', refreshToken ? 'exists' : 'none');
        
        if (refreshToken) {
          try {
            await this.refreshToken();
            const newToken = tokenUtils.getAccessToken();
            console.log('Token refreshed, new token:', newToken ? newToken.substring(0, 20) + '...' : 'none');

            return this.request<T>(endpoint, options, false);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            tokenUtils.clearAll();

            let errorMessage = '인증에 실패했습니다. 다시 로그인해주세요.';
            try {
              const errorData = await response.clone().json();
              if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (e) {

            }
            throw new Error(errorMessage);
          }
        } else {

          console.warn('No refresh token available, redirecting to login');
          tokenUtils.clearAll();
          let errorMessage = '로그인이 필요합니다.';
          try {
            const errorData = await response.clone().json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {

          }
          throw new Error(errorMessage);
        }
      }

      if (response.status === 204) {
        return null as T;
      }

      let accessToken: string | null = null;
      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh')) {

        console.log('🔍 [LOGIN] Processing login/refresh response...');
        console.log('   Response status:', response.status);
        console.log('   Response OK?', response.ok);
        
        const allHeaders = Array.from(response.headers.entries());
        console.log('📋 All response headers:', allHeaders);
        
        let authHeader = response.headers.get('Authorization');
        if (!authHeader) {

          authHeader = response.headers.get('authorization');
        }
        console.log('   🔍 Authorization header exists?', !!authHeader);
        
        if (authHeader) {
          console.log('   📝 Header value (first 50 chars):', authHeader.substring(0, 50) + '...');
          console.log('   📝 Header starts with "Bearer "?', authHeader.startsWith('Bearer '));
          
          if (authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
            console.log('   ✅ Extracted token, length:', accessToken.length);
            
            tokenUtils.setAccessToken(accessToken);
            console.log('   💾 Token saved to localStorage');
            
            const saved = tokenUtils.getAccessToken();
            if (saved && saved === accessToken) {
              console.log('   ✅ Verification: Token saved correctly');
              console.log('   📝 Token preview:', saved.substring(0, 30) + '...');
            } else {
              console.error('   ❌ Verification failed!');
              console.log('   Expected length:', accessToken.length);
              console.log('   Got:', saved ? `length ${saved.length}` : 'null');
              if (saved) {
                console.log('   Expected start:', accessToken.substring(0, 20));
                console.log('   Got start:', saved.substring(0, 20));
              }
            }
          } else {
            console.warn('   ⚠️ Header does not start with "Bearer "');
            console.log('   📝 Full header value:', authHeader);
          }
        } else {
          console.error('   ❌ Authorization header is null or undefined');
          const exposedHeaders = response.headers.get('Access-Control-Expose-Headers');
          console.log('   📋 Exposed headers:', exposedHeaders);
        }
      }

      const contentType = response.headers.get('content-type');
      let data: any = null;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {

          data = {};
        }
      } else {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return null as T;
      }

      if (!response.ok) {
        const error: ErrorResponse = data;
        console.error(`❌ [API] ${options.method || 'GET'} ${endpoint} 실패`);
        console.error('   상태 코드:', response.status);
        console.error('   에러 응답:', data);
        const errorMessage = error.message || `HTTP error! status: ${response.status}`;
        console.error('   에러 메시지:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log(`✅ [API] ${options.method || 'GET'} ${endpoint} 성공`);

      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh')) {
        
        if (!accessToken && data && typeof data === 'object') {
          console.log('🔍 [LOGIN] Checking response body for token');
          console.log('📋 Response body keys:', Object.keys(data));
          if (data.accessToken && typeof data.accessToken === 'string') {
            accessToken = data.accessToken;
            tokenUtils.setAccessToken(data.accessToken);
            console.log('✅ Access token saved from body (accessToken field)');
          } else if (data.token && typeof data.token === 'string') {
            accessToken = data.token;
            tokenUtils.setAccessToken(data.token);
            console.log('✅ Access token saved from body (token field)');
          } else if (data.access_token && typeof data.access_token === 'string') {
            accessToken = data.access_token;
            tokenUtils.setAccessToken(data.access_token);
            console.log('✅ Access token saved from body (access_token field)');
          } else {
            console.log('📋 Full response body:', JSON.stringify(data, null, 2));
          }
        }
        
        if (data && typeof data === 'object' && data.name) {
          localStorage.setItem('userName', data.name);
          console.log('✅ [LOGIN] User name saved from response:', data.name);
        }
        
        if (accessToken) {
          const savedToken = tokenUtils.getAccessToken();
          if (savedToken === accessToken) {
            console.log('✅ [LOGIN] Access token successfully saved and verified');
          } else {
            console.error('❌ [LOGIN] Token saved but verification failed');
          }
        } else {
          console.error('❌ [LOGIN] No access token found in response');
          console.log('   Response status:', response.status);
        }
        
        setTimeout(() => {
          const refreshTokenInCookie = tokenUtils.getRefreshToken();
          if (refreshTokenInCookie) {
            console.log('✅ Refresh token received in cookie');
          } else {
            console.log('ℹ️ Refresh token may be httpOnly (set by server via Set-Cookie)');
          }
        }, 100);
      }

      return data;
    } catch (error) {
      console.error(`❌ [API] ${options.method || 'GET'} ${endpoint} 예외 발생`);
      console.error('   에러:', error);
      if (error instanceof Error) {
        console.error('   에러 메시지:', error.message);
        console.error('   에러 스택:', error.stack);
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
