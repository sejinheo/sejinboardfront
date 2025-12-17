import { apiClient } from './client';
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
} from '../../types/api';

export const authApi = {
  
  register: async (data: RegisterRequest): Promise<void> => {
    await apiClient.post('/auth/register', data);
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    
    if (response && response.name) {
      localStorage.setItem('userName', response.name);
      console.log('✅ User name saved to localStorage:', response.name);
    }
    
    return response;
  },

  refresh: async (): Promise<void> => {
    await apiClient.post('/auth/refresh');
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
