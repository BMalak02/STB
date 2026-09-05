import { axiosClient } from './axiosClient';
import { ICreditRequest, IPersonalData } from '../types';

export const agentApi = {
  login: async (email: string, password: string) => {
    return await axiosClient.post('/auth/login', { email, password });
  },

  getProfile: async () => {
    return await axiosClient.get('/auth/me');
  },

  getAllCreditRequests: async (): Promise<ICreditRequest[]> => {
    return await axiosClient.get('/credit-requests/agent/all');
  },

  getCreditRequestDetails: async (requestId: string): Promise<ICreditRequest> => {
    return await axiosClient.get(`/credit-requests/${requestId}`);
  },

  getAgentCreditRequestDetails: async (requestId: string): Promise<ICreditRequest> => {
    return await axiosClient.get(`/credit-requests/agent/${requestId}`);
  },

  updateRequestStatus: async (requestId: string, status: string, notes?: string): Promise<ICreditRequest> => {
    return await axiosClient.put(`/credit-requests/${requestId}/status`, { status, notes });
  },

  updatePersonalData: async (requestId: string, personalData: IPersonalData): Promise<ICreditRequest> => {
    return await axiosClient.put(`/credit-requests/${requestId}/personal-data`, personalData);
  },

  evaluateScore: async (requestId: string): Promise<{ score: number; status: string }> => {
    return await axiosClient.post(`/credit-requests/${requestId}/score`);
  },
};
