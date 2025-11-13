import { z } from 'zod';

// Define the environment variables schema
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STRIPE_API_KEY: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().refine(
    (val) => {
      if (!val || val === '') return true; // Allow empty
      if (val.startsWith('your_') || val.includes('[yourdomain]')) return true; // Allow placeholders
      return z.string().email().safeParse(val).success; // Validate as email if not placeholder
    },
    { message: "Invalid email address" }
  ).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().optional(),
  CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().optional(),
  STRIPE_PRO_MONTHLY_PLAN_ID: z.string().optional(),
  EXPO_PUBLIC_APP_URL: z.string().min(1).default('http://localhost:8081'),
  EXPO_PUBLIC_API_URL: z.string().optional(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_HOST: z.string().optional(),
});

// Load environment variables directly from process.env (works with Expo)
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  NODE_ENV: process.env.NODE_ENV || 'development',
  STRIPE_API_KEY: process.env.STRIPE_API_KEY || undefined,
  UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET || undefined,
  UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID || undefined,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || undefined,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  STRIPE_PRO_MONTHLY_PLAN_ID: process.env.STRIPE_PRO_MONTHLY_PLAN_ID || undefined,

  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || undefined,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || undefined,
  CLERK_SIGN_IN_FORCE_REDIRECT_URL: process.env.CLERK_SIGN_IN_FORCE_REDIRECT_URL || '/',
  CLERK_SIGN_UP_FORCE_REDIRECT_URL: process.env.CLERK_SIGN_UP_FORCE_REDIRECT_URL || '/',

  EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081',
  // Allow fallback to undefined so platform-specific defaults can be used
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || undefined,
  EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY || undefined,
  EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST || undefined,
};

// Validate environment variables
envSchema.parse(env);

export default env;
