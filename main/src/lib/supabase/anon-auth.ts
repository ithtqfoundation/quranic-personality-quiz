// Supabase Anonymous Authentication Helper
// Manages Supabase anonymous sessions for quiz submission

import { createClient } from './server';

/**
 * Create or get Supabase anonymous session
 * This allows anonymous users to save data to Supabase
 */
export async function ensureAnonSession() {
  const supabase = await createClient();

  // Check if there's already an authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !user.is_anonymous) {
    // Already logged in with real account
    return { user, isAnonymous: false };
  }

  if (user && user.is_anonymous) {
    // Already has anonymous session
    return { user, isAnonymous: true };
  }

  // Create new anonymous session
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Failed to create anonymous session:', error);
    throw new Error('Could not create anonymous session');
  }

  return { user: data.user, isAnonymous: true };
}

/**
 * Check if current user is anonymous
 */
export async function isCurrentUserAnonymous(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.is_anonymous || false;
}

/**
 * Convert anonymous user to registered user
 * Links anonymous data to the new registered account
 */
export async function convertAnonToRegistered(email: string, password: string) {
  const supabase = await createClient();

  // Get current anonymous user
  const {
    data: { user: anonUser },
  } = await supabase.auth.getUser();

  if (!anonUser || !anonUser.is_anonymous) {
    throw new Error('No anonymous user session found');
  }

  // Update the anonymous user to a registered user
  // Note: Supabase allows converting anonymous users by updating their email/password
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) {
    console.error('Failed to convert anonymous user:', error);
    throw error;
  }

  return data;
}

/**
 * Get all quiz results for anonymous user by anon_user_id
 * Used for migrating data when converting to registered user
 */
export async function getAnonUserResults(anonUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('anon_user_id', anonUserId)
    .eq('is_anonymous', true);

  if (error) {
    console.error('Failed to fetch anonymous results:', error);
    return [];
  }

  return data || [];
}
