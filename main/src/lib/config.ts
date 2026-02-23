// Environment Configuration Helper
// Provides type-safe access to environment variables

// Helper function to get environment variable (client-safe)
function getEnvVar(key: string, defaultValue?: string): string {
  // Only access NEXT_PUBLIC_ variables on client and server
  if (key.startsWith('NEXT_PUBLIC_')) {
    return process.env[key] || defaultValue || '';
  }
  
  // Server-only variables (check if we're on server)
  if (typeof window === 'undefined') {
    return process.env[key] || defaultValue || '';
  }
  
  return defaultValue || '';
}

// Helper function to check if required env var exists
function requireEnvVar(key: string): string {
  const value = getEnvVar(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// ============================================
// SUPABASE CONFIGURATION
// ============================================

export const SUPABASE_URL = requireEnvVar('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// ============================================
// APP CONFIGURATION
// ============================================

export const APP_URL = getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
export const NODE_ENV = getEnvVar('NODE_ENV', 'development');

// ============================================
// OPTIONAL CONFIGURATIONS
// ============================================

export const REDIS_URL = getEnvVar('REDIS_URL', 'redis://redis:6379');
export const ANALYTICS_ID = getEnvVar('NEXT_PUBLIC_GA_ID');
export const SENTRY_DSN = getEnvVar('SENTRY_DSN');

// ============================================
// ENVIRONMENT CHECKS
// ============================================

export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// ============================================
// TYPE-SAFE CONFIG OBJECT
// ============================================

export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  app: {
    url: APP_URL,
    nodeEnv: NODE_ENV,
    isProduction: IS_PRODUCTION,
    isDevelopment: IS_DEVELOPMENT,
    isTest: IS_TEST,
  },
  redis: {
    url: REDIS_URL,
  },
  analytics: {
    googleAnalyticsId: ANALYTICS_ID,
  },
  monitoring: {
    sentryDsn: SENTRY_DSN,
  },
} as const;

// ============================================
// VALIDATION
// ============================================

// Validate required environment variables on module load
export function validateEnv(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !getEnvVar(key));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Please check your .env or .env.local file.'
    );
  }
}

// Auto-validate in development
if (IS_DEVELOPMENT && typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
  }
}

// ============================================
// EXPORT FOR BACKWARD COMPATIBILITY
// ============================================

export default config;
