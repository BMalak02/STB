import { axiosClient } from '../../../services/axiosClient';
import { AuthResponse } from '../types';

export const authService = {
  login: async (credentials: any): Promise<AuthResponse> => {
    return axiosClient.post('/auth/login', credentials);
  },
  register: async (data: any): Promise<AuthResponse> => {
    return axiosClient.post('/auth/register', data);
  },
  getProfile: async (): Promise<any> => {
    return axiosClient.get('/auth/me');
  },
};
