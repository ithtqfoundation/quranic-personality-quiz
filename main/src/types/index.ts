// Type definitions index
// Re-export all types for easy importing

export * from './database';
export * from './api';

// Additional utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type Awaited<T> = T extends Promise<infer U> ? U : T;
