// API Route: Delete In-Progress Quiz
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE() {
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

    // Delete ALL quiz results for this user (both completed and in-progress)
    // This allows fresh restart from result page
    const { data: deleted, error: deleteError } = await supabase
      .from('quiz_results')
      .delete()
      .eq('user_id', user.id)
      .select();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete in-progress quiz', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`Deleted ${deleted?.length || 0} quiz result(s) for user ${user.id}`);

    return NextResponse.json({
      success: true,
      deleted_count: deleted?.length || 0,
      message: 'Quiz results deleted successfully',
    });
  } catch (error: any) {
    console.error('Restart quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
