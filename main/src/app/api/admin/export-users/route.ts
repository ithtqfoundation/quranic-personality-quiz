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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const csvRows = [
      [
        'Name',
        'Email',
        'Age',
        'Whatsapp',
        'Photo URL',
        'Created At'
      ].join(',')
    ];

    (users || []).forEach((u) => {
      csvRows.push([
        `"${u.name || ''}"`,
        `"${u.email || ''}"`,
        `"${u.age || ''}"`,
        `"${u.whatsapp || ''}"`,
        `"${u.photo_url || ''}"`,
        `"${u.created_at || ''}"`
      ].join(','));
    });

    const csv = csvRows.join('\n');

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