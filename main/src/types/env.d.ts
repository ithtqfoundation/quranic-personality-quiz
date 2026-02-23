// Environment Variables Type Definitions

declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    
    // App
    NEXT_PUBLIC_APP_URL?: string;
    NODE_ENV: 'development' | 'production' | 'test';
    
    // Optional
    REDIS_URL?: string;
    NEXT_PUBLIC_GA_ID?: string;
    SENTRY_DSN?: string;
  }
}

// Extend global process
declare const process: {
  env: NodeJS.ProcessEnv;
};
