import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  saveToken: async (token: string) => {
    await AsyncStorage.setItem('token', token);
  },
  getToken: async () => {
    return await AsyncStorage.getItem('token');
  },
  removeToken: async () => {
    await AsyncStorage.removeItem('token');
  },
  saveData: async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  getData: async (key: string) => {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
};
