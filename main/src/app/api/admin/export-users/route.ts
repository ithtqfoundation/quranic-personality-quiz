import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';

export async function GET() {
  const admin = await verifyAdmin();

  if (!admin) {
    return adminUnauthorizedResponse();
  }

  try {
    const supabase = createAdminClient();

    const { data: users, error } = await supabase
      .from('users')
      .select(`
  *,
  quiz_results (
    final_juz,
    completed_at
  )
`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const headers = [
  'Name',
  'Email',
  'Age',
  'Whatsapp',
  'Final Juz',
  'Quiz Count',
  'Photo URL',
  'Created At',
];

const rows = (users || []).map((u: any) => {
  const latestQuiz =
    u.quiz_results?.sort(
      (a: any, b: any) =>
        new Date(b.completed_at).getTime() -
        new Date(a.completed_at).getTime()
    )[0];

  return [
    `"${u.name || ''}"`,
    `"${u.email || ''}"`,
    `"${u.age || ''}"`,
    `"${u.whatsapp || ''}"`,
    `"${latestQuiz?.final_juz || ''}"`,
    `"${u.quiz_results?.length || 0}"`,
    `"${u.photo_url || ''}"`,
    `"${u.created_at || ''}"`,
  ].join(',');
});

const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users-export.csv"',
      },
    });

  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Export failed' },
      { status: 500 }
    );
  }
}