// API Route: Initiate Google OAuth Login
// Redirects user to Google OAuth consent screen
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the origin from request headers
    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get('next') ?? '/register';

    // Use environment variable for callback URL (or fallback to origin)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    const callbackUrl = `${baseUrl}/api/auth/callback?next=${next}`;
    
    console.log('[OAuth] Initiating OAuth with redirectTo:', callbackUrl);

    // Initiate Google OAuth sign in
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('[ERROR] Google OAuth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.url) {
      return NextResponse.json(
        { error: 'Failed to get OAuth URL' },
        { status: 500 }
      );
    }

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(data.url);
  } catch (error: any) {
    console.error('[ERROR] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
