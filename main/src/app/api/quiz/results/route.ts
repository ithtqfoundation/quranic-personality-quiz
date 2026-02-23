// API Route: Get Quiz Results
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Get all results for current user
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('id');

    // Get specific result if ID provided
    if (resultId) {
      const { data: result, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('id', resultId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Result fetch error:', error);
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        );
      }

      // Fetch personality details if result has final_juz
      let personality = null;
      if (result.final_juz) {
        const { data: personalityData } = await supabase
          .from('personality_types')
          .select('*')
          .eq('juz_number', result.final_juz)
          .single();
        
        personality = personalityData;
      }

      return NextResponse.json({ 
        result: {
          ...result,
          personality
        } 
      }, { status: 200 });
    }

    // Get all results for user
    const { data: results, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Results fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        results,
        total: results?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

