// Admin Authentication API — email + password login
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in with email + password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Email atau password salah' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login gagal' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const role = data.user.user_metadata?.role;
    if (role !== 'admin') {
      // Sign out the non-admin user
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Akun ini tidak memiliki akses admin' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
