// Auth Helper for Anonymous User Management
// This utility manages anonymous user sessions for hybrid quiz support

import { v4 as uuidv4 } from 'uuid';

const ANON_USER_KEY = 'htq_anon_user_id';
const ANON_RESULTS_KEY = 'htq_anon_results';

export interface AnonymousUser {
  id: string;
  createdAt: string;
}

export interface LocalQuizResult {
  resultId: string;
  personalityType: string;
  juzResult: number;
  title: string;
  completedAt: string;
  syncedToServer: boolean;
}

/**
 * Generate a simple UUID v4
 * Lightweight alternative to uuid package
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create anonymous user ID
 * This ID is used to track anonymous quiz submissions
 */
export function getOrCreateAnonUserId(): string {
  if (typeof window === 'undefined') {
    return ''; // Server-side, return empty
  }

  let anonUserId = localStorage.getItem(ANON_USER_KEY);
  
  if (!anonUserId) {
    anonUserId = `anon_${generateUUID()}`;
    localStorage.setItem(ANON_USER_KEY, anonUserId);
  }

  return anonUserId;
}

/**
 * Get anonymous user data
 */
export function getAnonUser(): AnonymousUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const anonUserId = localStorage.getItem(ANON_USER_KEY);
  
  if (!anonUserId) {
    return null;
  }

  return {
    id: anonUserId,
    createdAt: new Date().toISOString(), // Simplified - you could store this separately
  };
}

/**
 * Check if user is anonymous
 */
export function isAnonymousUser(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(ANON_USER_KEY) !== null;
}

/**
 * Save quiz result to localStorage (backup/fallback)
 */
export function saveLocalQuizResult(result: LocalQuizResult): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existingResults = getLocalQuizResults();
    existingResults.push(result);
    localStorage.setItem(ANON_RESULTS_KEY, JSON.stringify(existingResults));
  } catch (error) {
    console.error('Failed to save local quiz result:', error);
  }
}

/**
 * Get all local quiz results
 */
export function getLocalQuizResults(): LocalQuizResult[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const results = localStorage.getItem(ANON_RESULTS_KEY);
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Failed to get local quiz results:', error);
    return [];
  }
}

/**
 * Mark a local result as synced to server
 */
export function markResultAsSynced(resultId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const results = getLocalQuizResults();
    const updated = results.map(r => 
      r.resultId === resultId ? { ...r, syncedToServer: true } : r
    );
    localStorage.setItem(ANON_RESULTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to mark result as synced:', error);
  }
}

/**
 * Get unsynced local results
 */
export function getUnsyncedResults(): LocalQuizResult[] {
  return getLocalQuizResults().filter(r => !r.syncedToServer);
}

/**
 * Clear anonymous user data (used after successful registration/login)
 */
export function clearAnonUserData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ANON_USER_KEY);
  // Keep results for potential migration
}

/**
 * Clear all local quiz results
 */
export function clearLocalQuizResults(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ANON_RESULTS_KEY);
}

/**
 * Get anonymous user ID for API calls
 * Returns null if no anonymous session exists
 */
export function getAnonUserIdForApi(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(ANON_USER_KEY);
}
