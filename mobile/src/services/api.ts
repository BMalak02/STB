import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

export const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'bypass-tunnel-reminder': 'true', // bypass localtunnel click-through
    'ngrok-skip-browser-warning': 'true', // bypass ngrok warning page
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
