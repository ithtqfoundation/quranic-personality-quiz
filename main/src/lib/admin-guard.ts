// Admin Authentication Guard
// Server-side utility to verify admin role via Supabase user_metadata

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface AdminCheckResult {
  user: AdminUser;
  isAdmin: true;
}

/**
 * Verify that the current user is an admin (for use in Server Components / layouts).
 * Redirects to '/' if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    redirect('/admin/login?error=forbidden');
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email || 'Admin',
    role: 'admin',
  };
}

/**
 * Verify admin role for API routes.
 * Returns the admin user or null (does NOT redirect).
 */
export async function verifyAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email || 'Admin',
    role: 'admin',
  };
}

/**
 * Create a JSON error response for unauthorized admin access.
 */
export function adminUnauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Admin access required' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
