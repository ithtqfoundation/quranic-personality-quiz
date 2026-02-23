// API Route: Submit Quiz Answers - 4-Layer System
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface SubmitRequest {
  layer: number;
  answers: { question_id: number; option_id: number }[];
  resultId?: string; // For continuing existing quiz
  tiebreakerAnswer?: 'A' | 'B'; // For Layer 4
}

export async function POST(request: Request) {
  try {
    const body: SubmitRequest = await request.json();
    const { layer, answers, resultId, tiebreakerAnswer } = body;

    // Validation
    if (!layer || layer < 1 || layer > 4) {
      return NextResponse.json(
        { error: 'Layer must be between 1 and 4' },
        { status: 400 }
      );
    }

    // Layer 4 (tie-breaker) doesn't need answers array, just tiebreakerAnswer
    if (layer !== 4 && (!answers || !Array.isArray(answers) || answers.length === 0)) {
      return NextResponse.json(
        { error: 'Answers array is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated (required for quiz)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please register first.' },
        { status: 401 }
      );
    }

    // Fetch option values to calculate scores (skip for Layer 4 - tie-breaker)
    let options: any[] = [];
    if (layer !== 4) {
      const optionIds = answers.map((a) => a.option_id);
      const { data: fetchedOptions, error: optionsError } = await supabase
        .from('quiz_options')
        .select('id, option_value, points')
        .in('id', optionIds);

      if (optionsError) {
        console.error('Options fetch error:', optionsError);
        return NextResponse.json(
          { error: 'Failed to fetch answer options' },
          { status: 500 }
        );
      }

      options = fetchedOptions || [];
    }

    // Process based on layer
    if (layer === 1) {
      // Layer 1: Extraversion (data collection only)
      const extraversionScore = options.filter((opt) => opt.option_value === 'E').length;

      // Create new quiz result (authenticated user only)
      const resultData: any = {
        user_id: user.id,
        extraversion_score: extraversionScore,
        completed_at: null, // Explicitly set to NULL (quiz not completed yet)
      };

      const { data: result, error: resultError } = await supabase
        .from('quiz_results')
        .insert([resultData])
        .select()
        .single();

      if (resultError) {
        console.error('Result creation error:', resultError);
        return NextResponse.json(
          { error: 'Failed to create quiz result', details: resultError.message },
          { status: 500 }
        );
      }

      // Save answers
      await saveAnswers(supabase, result.id, answers, layer);

      return NextResponse.json(
        {
          message: 'Layer 1 completed',
          result_id: result.id,
          extraversion_score: extraversionScore,
          next_layer: 2,
        },
        { status: 201 }
      );
    } else if (layer === 2) {
      // Layer 2: Ego + Neuroticism (determines branch)
      if (!resultId) {
        return NextResponse.json(
          { error: 'resultId is required for Layer 2' },
          { status: 400 }
        );
      }

      const egoScore = options.filter((opt) => opt.option_value === 'EGO-H').length;
      const neuroScore = options.filter((opt) => opt.option_value === 'NEURO-H').length;

      // Determine levels (threshold: 3 out of 5)
      const egoLevel = egoScore >= 3 ? 'HIGH' : 'LOW';
      const neuroLevel = neuroScore >= 3 ? 'HIGH' : 'LOW';

      // Determine branch category
      const branchCategory = `E${egoLevel[0]}N${neuroLevel[0]}`; // EHNH, EHNL, ELNH, ELNL

      // Update quiz result
      const { error: updateError } = await supabase
        .from('quiz_results')
        .update({
          ego_score: egoScore,
          ego_level: egoLevel,
          neuro_score: neuroScore,
          neuro_level: neuroLevel,
          branch_category: branchCategory,
        })
        .eq('id', resultId)
        .eq('user_id', user.id); // Security: ensure user owns this result

      if (updateError) {
        console.error('Result update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update quiz result' },
          { status: 500 }
        );
      }

      // Save answers
      await saveAnswers(supabase, resultId, answers, layer);

      return NextResponse.json(
        {
          message: 'Layer 2 completed',
          result_id: resultId,
          ego_score: egoScore,
          ego_level: egoLevel,
          neuro_score: neuroScore,
          neuro_level: neuroLevel,
          branch_category: branchCategory,
          next_layer: 3,
        },
        { status: 200 }
      );
    } else if (layer === 3) {
      // Layer 3: Branch-specific questions (determines Juz)
      if (!resultId) {
        return NextResponse.json(
          { error: 'resultId is required for Layer 3' },
          { status: 400 }
        );
      }

      // Calculate Juz scores from answers
      const juzScores: { [key: number]: number } = {};
      options.forEach((opt) => {
        if (opt.option_value.startsWith('JUZ_')) {
          const juzNum = parseInt(opt.option_value.split('_')[1]);
          juzScores[juzNum] = (juzScores[juzNum] || 0) + (opt.points || 1);
        }
      });

      // Find top 2 Juz
      const sortedJuz = Object.entries(juzScores)
        .sort(([, a], [, b]) => b - a)
        .map(([juz, score]) => ({ juz: parseInt(juz), score }));

      const topJuz1 = sortedJuz[0];
      const topJuz2 = sortedJuz[1];

      // Check for tie
      const hasTie = topJuz1 && topJuz2 && topJuz1.score === topJuz2.score;

      // Update quiz result
      const { error: updateError } = await supabase
        .from('quiz_results')
        .update({
          juz_scores: juzScores,
          top_juz_1: topJuz1?.juz,
          top_juz_2: topJuz2?.juz,
          had_tie: hasTie,
          final_juz: hasTie ? null : topJuz1?.juz, // Only set if no tie
        })
        .eq('id', resultId)
        .eq('user_id', user.id); // Security: ensure user owns this result

      if (updateError) {
        console.error('Result update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update quiz result' },
          { status: 500 }
        );
      }

      // Save answers
      await saveAnswers(supabase, resultId, answers, layer);

      if (hasTie) {
        // Need tie-breaker (Layer 4)
        return NextResponse.json(
          {
            message: 'Layer 3 completed - tie detected',
            result_id: resultId,
            juz_scores: juzScores,
            top_juz_1: topJuz1.juz,
            top_juz_2: topJuz2.juz,
            had_tie: true,
            next_layer: 4,
            next_action: 'fetch_tiebreaker',
            tiebreaker_params: {
              juzA: topJuz1.juz,
              juzB: topJuz2.juz,
            },
          },
          { status: 200 }
        );
      } else {
        // Quiz complete! Fetch final personality
        const personality = await fetchPersonality(supabase, topJuz1.juz);

        // Mark completed
        await supabase
          .from('quiz_results')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', resultId)
          .eq('user_id', user.id); // Security: ensure user owns this result

        return NextResponse.json(
          {
            message: 'Quiz completed successfully',
            result_id: resultId,
            final_juz: topJuz1.juz,
            juz_scores: juzScores,
            personality,
            completed: true,
          },
          { status: 200 }
        );
      }
    } else if (layer === 4) {
      // Layer 4: Tie-breaker
      if (!resultId || !tiebreakerAnswer) {
        return NextResponse.json(
          { error: 'resultId and tiebreakerAnswer (A or B) are required for Layer 4' },
          { status: 400 }
        );
      }

      // Fetch current result to get top 2 Juz
      const { data: currentResult, error: fetchError } = await supabase
        .from('quiz_results')
        .select('top_juz_1, top_juz_2')
        .eq('id', resultId)
        .single();

      if (fetchError || !currentResult) {
        return NextResponse.json(
          { error: 'Failed to fetch quiz result' },
          { status: 500 }
        );
      }

      // Determine final Juz based on tie-breaker answer
      const finalJuz =
        tiebreakerAnswer === 'A' ? currentResult.top_juz_1 : currentResult.top_juz_2;

      // Update quiz result
      const { error: updateError } = await supabase
        .from('quiz_results')
        .update({
          tiebreaker_answer: tiebreakerAnswer,
          final_juz: finalJuz,
          completed_at: new Date().toISOString(),
        })
        .eq('id', resultId)
        .eq('user_id', user.id); // Security: ensure user owns this result

      if (updateError) {
        console.error('Result update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update quiz result' },
          { status: 500 }
        );
      }

      // Fetch final personality
      const personality = await fetchPersonality(supabase, finalJuz);

      return NextResponse.json(
        {
          message: 'Quiz completed successfully',
          result_id: resultId,
          final_juz: finalJuz,
          tiebreaker_answer: tiebreakerAnswer,
          personality,
          completed: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid layer' }, { status: 400 });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Save quiz answers
async function saveAnswers(
  supabase: any,
  resultId: string,
  answers: { question_id: number; option_id: number }[],
  layer: number
) {
  const answerRecords = answers.map((a) => ({
    result_id: resultId,
    question_id: a.question_id,
    option_id: a.option_id,
    layer,
  }));

  const { error } = await supabase.from('quiz_answers').insert(answerRecords);

  if (error) {
    console.error('Answers save error:', error);
  }
}

// Helper: Fetch personality details
async function fetchPersonality(supabase: any, juzNumber: number) {
  const { data, error } = await supabase
    .from('personality_types')
    .select('*')
    .eq('juz_number', juzNumber)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Personality fetch error:', error);
    return null;
  }

  return {
    juz_number: data.juz_number,
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    strengths: data.strengths,
    challenges: data.challenges,
    suitable_traits: {
      label: 'Sifat yang Sesuai Denganmu',
      items: data.strengths || []
    },
    unsuitable_traits: {
      label: 'Sifat yang Tidak Sesuai Denganmu',
      items: data.challenges || []
    }
  };
}

