// API Route: Google OAuth Callback Handler
// Handles redirect from Google after user authorizes
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/register';

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
    }

    const supabase = await createClient();

    // Exchange code for session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('[ERROR] Session exchange error:', sessionError);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (!sessionData.user) {
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    console.log('[SUCCESS] Google OAuth successful for user:', sessionData.user.id);

    // ============================================
    // STEP 1: Check if user profile exists
    // ============================================
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, name, gender, date_of_birth, photo_url')
      .eq('id', sessionData.user.id)
      .single();

    // If user doesn't exist or profile incomplete, redirect to register
    if (userError || !existingUser || !existingUser.name || !existingUser.gender || !existingUser.date_of_birth) {
      console.log('[REDIRECT] New user or incomplete profile -> /register');
      return NextResponse.redirect(`${origin}/register`);
    }

    console.log('[SUCCESS] Profile complete');

    // ============================================
    // STEP 2: Check if user has completed quiz
    // ============================================
    const { data: quizResults, error: quizError } = await supabase
      .from('quiz_results')
      .select('id, final_juz, completed_at')
      .eq('user_id', sessionData.user.id)
      .not('completed_at', 'is', null) // Only get completed quizzes
      .order('completed_at', { ascending: false })
      .limit(1);

    // If quiz completed, redirect to results (use query param format)
    if (!quizError && quizResults && quizResults.length > 0) {
      const latestResult = quizResults[0];
      console.log('[REDIRECT] Quiz already completed -> /result?id=' + latestResult.id);
      return NextResponse.redirect(`${origin}/result?id=${latestResult.id}`);
    }

    // If profile complete but quiz not done, redirect to test
    console.log('[REDIRECT] Profile complete but quiz not done -> /test/1');
    return NextResponse.redirect(`${origin}/test/1`);
    
  } catch (error: any) {
    console.error('[ERROR] Callback error:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=server_error`);
  }
}
