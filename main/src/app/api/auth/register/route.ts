// API Route: Register (Start Quiz)
// User fills basic info (name, email, DOB, photo) and starts quiz immediately
// No password required - system generates one automatically
import { createClient } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, date_of_birth, photo_url } = await request.json();

    // Validation
    if (!email || !name || !date_of_birth) {
      return NextResponse.json(
        { error: 'Email, name, and date of birth are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate date_of_birth format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate a random secure password (user doesn't need to know it)
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: randomPassword,
      options: {
        data: {
          name,
          date_of_birth,
          photo_url: photo_url || null,
        },
        emailRedirectTo: undefined, // Skip email confirmation for quiz flow
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Insert user profile into users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          name,
          date_of_birth,
          photo_url: photo_url || null,
        },
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Auth user is created but profile failed - log this
    }

    // Auto-login the user by setting session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: randomPassword,
    });

    if (sessionError) {
      console.error('Auto-login error:', sessionError);
      // User created but auto-login failed - they can still proceed
    }

    return NextResponse.json(
      {
        message: 'Registration successful. You can now start the quiz.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name,
          date_of_birth,
          photo_url: photo_url || null,
        },
        session: sessionData?.session || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

