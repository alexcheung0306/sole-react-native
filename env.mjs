import { z } from 'zod';
import { config } from 'react-native-dotenv';

// Define the environment variables schema
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  STRIPE_API_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.union([z.string().email(), z.literal(''), z.literal('mail@[yourdomain]')]).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_MONTHLY_PLAN_ID: z.string().optional(),
  EXPO_PUBLIC_APP_URL: z.string().min(1),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().optional(),
});

// Load environment variables from .env file
export const env = {
  DATABASE_URL: config.DATABASE_URL,
  NODE_ENV: config.NODE_ENV,
  STRIPE_API_KEY: config.STRIPE_API_KEY,
  CLERK_SECRET_KEY: config.CLERK_SECRET_KEY,
  UPLOADTHING_SECRET: config.UPLOADTHING_SECRET,
  UPLOADTHING_APP_ID: config.UPLOADTHING_APP_ID,
  RESEND_API_KEY: config.RESEND_API_KEY,
  EMAIL_FROM_ADDRESS: config.EMAIL_FROM_ADDRESS,
  STRIPE_WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET,
  CLERK_WEBHOOK_SECRET: config.CLERK_WEBHOOK_SECRET,
  STRIPE_PRO_MONTHLY_PLAN_ID: config.STRIPE_PRO_MONTHLY_PLAN_ID,
  EXPO_PUBLIC_APP_URL: config.EXPO_PUBLIC_APP_URL,
  EXPO_PUBLIC_API_URL: config.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: config.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_POSTHOG_KEY: config.EXPO_PUBLIC_POSTHOG_KEY,
  EXPO_PUBLIC_POSTHOG_HOST: config.EXPO_PUBLIC_POSTHOG_HOST,
};

// Validate environment variables
envSchema.parse(env);

export default env;