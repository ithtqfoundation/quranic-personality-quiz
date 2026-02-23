// API Route: Get Tie-Breaker Question
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const juzA = searchParams.get('juzA');
    const juzB = searchParams.get('juzB');

    if (!juzA || !juzB) {
      return NextResponse.json(
        { error: 'Both juzA and juzB parameters are required' },
        { status: 400 }
      );
    }

    const juzANum = parseInt(juzA);
    const juzBNum = parseInt(juzB);

    if (isNaN(juzANum) || isNaN(juzBNum)) {
      return NextResponse.json(
        { error: 'juzA and juzB must be valid numbers' },
        { status: 400 }
      );
    }

    if (juzANum < 1 || juzANum > 30 || juzBNum < 1 || juzBNum > 30) {
      return NextResponse.json(
        { error: 'Juz numbers must be between 1 and 30' },
        { status: 400 }
      );
    }

    if (juzANum === juzBNum) {
      return NextResponse.json(
        { error: 'juzA and juzB cannot be the same' },
        { status: 400 }
      );
    }

    // Fetch tie-breaker question (order doesn't matter, check both directions)
    const { data: tiebreakerData, error } = await supabase
      .from('tiebreaker_questions')
      .select('*')
      .or(`and(juz_a.eq.${juzANum},juz_b.eq.${juzBNum}),and(juz_a.eq.${juzBNum},juz_b.eq.${juzANum})`)
      .single();

    if (error) {
      console.error('Tie-breaker fetch error:', error);
      
      // If no tie-breaker exists for this combination, return helpful message
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { 
            error: 'No tie-breaker question found for this Juz combination',
            message: `Please contact admin to add tie-breaker for Juz ${juzANum} vs Juz ${juzBNum}`,
            fallback: 'system_will_choose_first' // Fallback strategy
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch tie-breaker question' },
        { status: 500 }
      );
    }

    // Normalize response so juzA always matches request parameter
    const normalizedQuestion = {
      id: tiebreakerData.id,
      question_text: tiebreakerData.question_text,
      juz_a: tiebreakerData.juz_a === juzANum ? tiebreakerData.juz_a : tiebreakerData.juz_b,
      juz_b: tiebreakerData.juz_a === juzANum ? tiebreakerData.juz_b : tiebreakerData.juz_a,
      option_a_description: tiebreakerData.juz_a === juzANum 
        ? tiebreakerData.option_a_description 
        : tiebreakerData.option_b_description,
      option_b_description: tiebreakerData.juz_a === juzANum 
        ? tiebreakerData.option_b_description 
        : tiebreakerData.option_a_description,
      created_at: tiebreakerData.created_at
    };

    return NextResponse.json(
      {
        tiebreaker: normalizedQuestion,
        layer: 4,
        description: 'Choose the description that resonates more with you'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get tie-breaker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
