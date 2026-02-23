// API Route: Get User Profile
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get quiz statistics
    const { data: quizResults, error: quizError } = await supabase
      .from('quiz_results')
      .select('id, personality_type, completed_at')
      .eq('user_id', user.id);

    if (quizError) {
      console.error('Quiz results fetch error:', quizError);
    }

    return NextResponse.json(
      {
        profile: {
          ...profile,
          email: user.email,
        },
        statistics: {
          total_quizzes: quizResults?.length || 0,
          last_quiz_date: quizResults?.[0]?.completed_at || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

