import { Platform } from 'react-native';

export const SHADOWS = {
  none: {},

  xs: Platform.select({
    ios: {
      shadowColor: '#0D1B3E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
  }),

  sm: Platform.select({
    ios: {
      shadowColor: '#0D1B3E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
  }),

  md: Platform.select({
    ios: {
      shadowColor: '#0D1B3E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    android: { elevation: 4 },
  }),

  lg: Platform.select({
    ios: {
      shadowColor: '#0D1B3E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
  }),

  xl: Platform.select({
    ios: {
      shadowColor: '#0D1B3E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
  }),

  // Colored shadows
  primary: Platform.select({
    ios: {
      shadowColor: '#1565C0',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),

  success: Platform.select({
    ios: {
      shadowColor: '#2E7D32',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),

  gold: Platform.select({
    ios: {
      shadowColor: '#F9A825',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    android: { elevation: 5 },
  }),

  // Bottom tab bar
  tabBar: Platform.select({
    ios: {
      shadowColor: '#0D1B3E',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 12 },
  }),
};
