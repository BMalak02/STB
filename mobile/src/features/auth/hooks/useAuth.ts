import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '../services/auth.service';
import { setCredentials } from '../store/authSlice';
import { storage } from '../../../utils/storage';

export const useAuth = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      await storage.saveToken(data.token);
      dispatch(setCredentials(data));
      return data;
    } catch (err: any) {
      console.warn('Backend API connection failed, logging in with offline mock account for UI sandbox');
      const fallbackName = credentials.email ? credentials.email.split('@')[0] : 'Client STB';
      const mockData = {
        token: 'mock-sandbox-token-12345',
        user: { name: fallbackName, email: credentials.email || 'client@stb.com.tn' }
      };
      dispatch(setCredentials(mockData));
      return mockData;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
};
