// API Route: Resume In-Progress Quiz
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find most recent quiz result for this user
    // Note: quiz_results doesn't have created_at, using id DESC (UUID v4 includes timestamp)
    const { data: results, error: resultsError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(1);

    if (resultsError) {
      console.error('Resume fetch error:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch quiz state' },
        { status: 500 }
      );
    }

    // No quiz found
    if (!results || results.length === 0) {
      return NextResponse.json({
        has_quiz: false,
        state: 'not_started',
        message: 'No quiz found. Start a new quiz.',
      });
    }

    const result = results[0];

    // Check if quiz is completed
    // Must have both completed_at AND final_juz to be truly completed
    if (result.completed_at && result.final_juz) {
      return NextResponse.json({
        has_quiz: true,
        state: 'completed',
        result_id: result.id,
        final_juz: result.final_juz,
        message: 'Quiz already completed. View your result.',
      });
    }

    // If completed_at exists but no final_juz, it's a bug - treat as in-progress
    if (result.completed_at && !result.final_juz) {
      console.warn('Bug detected: completed_at set but no final_juz. Treating as in-progress.', result.id);
    }

    // Quiz is in progress - determine current layer
    let current_layer = 1;
    let branch_category = null;

    // Layer 1 complete if extraversion_score exists
    if (result.extraversion_score !== null) {
      current_layer = 2;
    }

    // Layer 2 complete if ego_score and neuroticism_score exist
    if (result.ego_score !== null && result.neuroticism_score !== null) {
      current_layer = 3;
      
      // Determine branch category from scores
      const isHighEgo = result.ego_score >= 3;
      const isHighNeuro = result.neuroticism_score >= 3;
      
      if (isHighEgo && isHighNeuro) branch_category = 'EHNH';
      else if (isHighEgo && !isHighNeuro) branch_category = 'EHNL';
      else if (!isHighEgo && isHighNeuro) branch_category = 'ELNH';
      else branch_category = 'ELNL';
    }

    // Check if juz_scores exist (Layer 3 complete, waiting for tiebreaker)
    if (result.juz_scores && typeof result.juz_scores === 'object') {
      const scores = result.juz_scores as Record<string, number>;
      const scoreValues = Object.values(scores);
      
      if (scoreValues.length > 0) {
        // Check if there's a tie
        const maxScore = Math.max(...scoreValues);
        const topJuzzes = Object.entries(scores)
          .filter(([_, score]) => score === maxScore)
          .map(([juz, _]) => parseInt(juz));

        if (topJuzzes.length > 1) {
          // Tie detected - need tiebreaker (Layer 4)
          current_layer = 4;
          return NextResponse.json({
            has_quiz: true,
            state: 'in_progress',
            result_id: result.id,
            current_layer: 4,
            branch_category,
            tiebreaker_params: {
              juzA: topJuzzes[0],
              juzB: topJuzzes[1],
            },
            message: 'Resume tiebreaker question.',
          });
        }
      }
    }

    // Fetch saved answers to resume from
    const { data: savedAnswers, error: answersError } = await supabase
      .from('quiz_answers')
      .select('question_id, option_id')
      .eq('result_id', result.id);

    if (answersError) {
      console.error('Failed to fetch saved answers:', answersError);
    }

    // Return in-progress state
    return NextResponse.json({
      has_quiz: true,
      state: 'in_progress',
      result_id: result.id,
      current_layer,
      branch_category,
      extraversion_score: result.extraversion_score,
      ego_score: result.ego_score,
      neuroticism_score: result.neuroticism_score,
      juz_scores: result.juz_scores,
      saved_answers: savedAnswers || [],
      message: `Resume from Layer ${current_layer}.`,
    });
  } catch (error: any) {
    console.error('Resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
