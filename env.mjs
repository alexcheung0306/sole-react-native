import { z } from 'zod';
import { config } from 'react-native-dotenv';

// Define the environment variables schema
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STRIPE_API_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.union([z.string().email(), z.literal(''), z.literal('mail@[yourdomain]')]).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_MONTHLY_PLAN_ID: z.string().optional(),
  EXPO_PUBLIC_APP_URL: z.string().min(1).default('http://localhost:8081'),
  EXPO_PUBLIC_API_URL: z.string().optional(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().optional(),
});

// Load environment variables from .env file
export const env = {
  DATABASE_URL: config.DATABASE_URL || undefined,
  NODE_ENV: config.NODE_ENV || 'development',
  STRIPE_API_KEY: config.STRIPE_API_KEY || undefined,
  CLERK_SECRET_KEY: config.CLERK_SECRET_KEY || undefined,
  UPLOADTHING_SECRET: config.UPLOADTHING_SECRET || undefined,
  UPLOADTHING_APP_ID: config.UPLOADTHING_APP_ID || undefined,
  RESEND_API_KEY: config.RESEND_API_KEY || undefined,
  EMAIL_FROM_ADDRESS: config.EMAIL_FROM_ADDRESS || undefined,
  STRIPE_WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET || undefined,
  CLERK_WEBHOOK_SECRET: config.CLERK_WEBHOOK_SECRET || undefined,
  STRIPE_PRO_MONTHLY_PLAN_ID: config.STRIPE_PRO_MONTHLY_PLAN_ID || undefined,
  EXPO_PUBLIC_APP_URL: config.EXPO_PUBLIC_APP_URL || 'http://localhost:8081',
  EXPO_PUBLIC_API_URL: config.EXPO_PUBLIC_API_URL || undefined,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: config.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || undefined,
  EXPO_PUBLIC_POSTHOG_KEY: config.EXPO_PUBLIC_POSTHOG_KEY || undefined,
  EXPO_PUBLIC_POSTHOG_HOST: config.EXPO_PUBLIC_POSTHOG_HOST || undefined,
};

// Validate environment variables
envSchema.parse(env);

export default env;