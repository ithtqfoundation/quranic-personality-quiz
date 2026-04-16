// Admin User Seeder — creates a test admin user for development
// Run via: POST http://localhost:3000/api/admin/seed
// DELETE THIS FILE after admin user is created!

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seeding is not allowed in production' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in .env' },
      { status: 500 }
    );
  }

  // Use service role client (can manage users)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminEmail = 'admin@htqfoundation.com';
  const adminPassword = 'admin123456';
  const adminName = 'HTQ Admin';

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === adminEmail);

    if (existing) {
      // Update existing user to have admin role
      const { data, error } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          user_metadata: { role: 'admin', name: adminName },
          email_confirm: true,
        }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        message: '✅ Existing user updated to admin',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: adminName,
          role: 'admin',
        },
        credentials: {
          email: adminEmail,
          password: '(unchanged — use existing password or reset)',
        },
      });
    }

    // Create new admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email verification
      user_metadata: {
        role: 'admin',
        name: adminName,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also create entry in users table
    await supabase.from('users').upsert({
      id: data.user.id,
      email: adminEmail,
      name: adminName,
    }, { onConflict: 'id' });

    return NextResponse.json({
      message: '✅ Admin user created successfully!',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: adminName,
        role: 'admin',
      },
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
      note: '⚠️ Ganti password setelah login pertama! Hapus file seed ini setelah selesai.',
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
