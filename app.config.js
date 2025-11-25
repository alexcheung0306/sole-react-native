const path = require('path');
const fs = require('fs');

module.exports = ({ config }) => {
  // Determine which environment to use
  // Priority: APP_ENV > NODE_ENV > default to 'development'
  const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';

  // Load environment-specific .env file
  const envFile = `.env.${APP_ENV}`;
  const envPath = path.resolve(__dirname, envFile);

  // Check if environment file exists
  if (fs.existsSync(envPath)) {
    console.log(`📦 Loading environment from: ${envFile}`);

    // Parse .env file manually (simple parser)
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } else {
    console.warn(`⚠️  Warning: ${envFile} not found, using existing environment variables`);
  }

  // Load environment variables
  const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
  const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const EXPO_PUBLIC_POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const EXPO_PUBLIC_POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  const EXPO_PUBLIC_APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081';

  console.log('🚀 App Config - Environment Configuration:');
  console.log('  Environment:', APP_ENV);
  console.log('  Config File:', envFile);
  console.log('  EXPO_PUBLIC_API_URL:', EXPO_PUBLIC_API_URL);
  console.log('  EXPO_PUBLIC_APP_URL:', EXPO_PUBLIC_APP_URL);
  console.log('  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:', EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Loaded ✅' : 'Missing ❌');

  return {
    ...config,
    name: "sole-native",
    slug: "sole-native",
    version: "1.0.0",
    scheme: "sole-native",
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-secure-store",
      "expo-font"
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    extra: {
      // Make environment variables available via expo-constants
      EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_APP_URL,
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      EXPO_PUBLIC_POSTHOG_KEY,
      EXPO_PUBLIC_POSTHOG_HOST,
    }
  };
};

