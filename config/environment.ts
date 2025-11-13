/**
 * Environment Configuration
 * 
 * This module provides runtime access to environment-specific configuration.
 * It automatically detects the environment and provides the correct API endpoints.
 * 
 * Usage:
 *   import { ENV, getApiUrl } from '~/config/environment';
 *   const apiUrl = getApiUrl();
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { env } from '~/env.mjs';

export type Environment = 'development' | 'staging' | 'production';

/**
 * Get the current environment
 */
export const getCurrentEnvironment = (): Environment => {
  // Check expo config first (set during EAS build)
  const appEnv = Constants.expoConfig?.extra?.APP_ENV;
  if (appEnv) return appEnv;
  
  // Fallback to NODE_ENV from env.mjs
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging') return 'staging';
  
  // Default to development
  return 'development';
};

/**
 * Environment configuration object
 */
export const ENV = {
  current: getCurrentEnvironment(),
  
  isDevelopment: getCurrentEnvironment() === 'development',
  isStaging: getCurrentEnvironment() === 'staging',
  isProduction: getCurrentEnvironment() === 'production',
  
  // API Configuration
  api: {
    baseUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || env.EXPO_PUBLIC_API_URL,
    timeout: 30000, // 30 seconds
  },
  
  // App Configuration
  app: {
    url: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_URL || env.EXPO_PUBLIC_APP_URL,
    name: 'Sole',
    version: Constants.expoConfig?.version || '1.0.0',
  },
  
  // Auth Configuration
  auth: {
    clerkPublishableKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  
  // Analytics Configuration
  analytics: {
    posthogKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_POSTHOG_KEY || env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: Constants.expoConfig?.extra?.EXPO_PUBLIC_POSTHOG_HOST || env.EXPO_PUBLIC_POSTHOG_HOST,
    enabled: getCurrentEnvironment() !== 'development',
  },
  
  // Feature Flags
  features: {
    enableDebugLogs: getCurrentEnvironment() === 'development',
    enableAnalytics: getCurrentEnvironment() !== 'development',
    enableCrashReporting: getCurrentEnvironment() === 'production',
  },
};

/**
 * Get the API base URL with proper fallbacks
 */
export const getApiUrl = (): string => {
  const environment = getCurrentEnvironment();
  
  // Try to get from Constants (set in app.config.js)
  const fromConfig = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
  if (fromConfig) {
    return fromConfig;
  }
  
  // Try to get from env.mjs
  const fromEnv = env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }
  
  // Environment-specific defaults
  switch (environment) {
    case 'production':
      return 'https://api.yoursoleapp.com';
    case 'staging':
      return 'https://staging-api.yoursoleapp.com';
    case 'development':
    default:
      // Platform-specific localhost handling
      if (Platform.OS === 'android') {
        // Android emulator uses 10.0.2.2 to reach host machine
        return 'http://10.0.2.2:8080';
      } else if (Platform.OS === 'ios') {
        // iOS simulator can use localhost
        return 'http://localhost:8080';
      }
      return 'http://localhost:8080';
  }
};

/**
 * Get the full API endpoint with /api suffix
 */
export const getApiBaseUrl = (): string => {
  const baseUrl = getApiUrl();
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

/**
 * Check if we're running in a simulator/emulator
 */
export const isSimulator = (): boolean => {
  return !Constants.isDevice;
};

/**
 * Check if we're running on a physical device
 */
export const isPhysicalDevice = (): boolean => {
  return Constants.isDevice;
};

/**
 * Log environment information (development only)
 */
export const logEnvironmentInfo = () => {
  if (ENV.features.enableDebugLogs) {
    console.log('🌍 Environment Configuration:');
    console.log('  Current:', ENV.current);
    console.log('  API URL:', getApiBaseUrl());
    console.log('  App Version:', ENV.app.version);
    console.log('  Platform:', Platform.OS);
    console.log('  Device Type:', isPhysicalDevice() ? 'Physical Device' : 'Simulator/Emulator');
    console.log('  Debug Logs:', ENV.features.enableDebugLogs ? 'Enabled' : 'Disabled');
    console.log('  Analytics:', ENV.features.enableAnalytics ? 'Enabled' : 'Disabled');
  }
};

// Log on module load (development only)
if (ENV.isDevelopment) {
  logEnvironmentInfo();
}

export default ENV;

