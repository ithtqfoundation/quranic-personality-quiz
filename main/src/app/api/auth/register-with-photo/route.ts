// API Route: Sequential Registration with Photo Upload
// Step 1: Register user (no password)
// Step 2: Upload photo if provided (automatic)
// Returns: Complete user profile with photo_url
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse form data (supports file upload)
    const formData = await request.formData();
    
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const date_of_birth = formData.get('date_of_birth') as string;
    const file = formData.get('file') as File | null;

    // ============================================
    // STEP 1: VALIDATION
    // ============================================
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

    // Validate file if provided
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
          { status: 400 }
        );
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size too large. Maximum 5MB allowed.' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // ============================================
    // STEP 2: REGISTER USER (No Photo Yet)
    // ============================================
    console.log('[Step 1] Registering user...');
    
    // Generate random password
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: randomPassword,
      options: {
        data: { name, date_of_birth },
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      console.error('[ERROR] Auth error:', authError);
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

    const userId = authData.user.id;
    console.log('[Step 1 Complete] User created with ID:', userId);

    // Insert into users table (without photo_url initially)
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: authData.user.email,
          name,
          date_of_birth,
          photo_url: null, // Will be updated in Step 3 if file exists
        },
      ]);

    if (profileError) {
      console.error('[ERROR] Profile creation error:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Auto-login user
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: randomPassword,
    });

    if (sessionError) {
      console.warn('[WARNING] Auto-login failed:', sessionError);
    }

    // ============================================
    // STEP 3: UPLOAD PHOTO (If Provided)
    // ============================================
    let photo_url: string | null = null;

    if (file) {
      console.log('[Step 2] Uploading photo...');

      // Use authenticated client if session exists, otherwise anon
      const uploadClient = sessionData?.session 
        ? supabase  // Authenticated (after auto-login)
        : createAnonClient(  // Fallback to anon if auto-login failed
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await uploadClient.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[ERROR] Upload error:', uploadError);
        // Don't fail registration if photo upload fails
        console.warn('[WARNING] Photo upload failed, but user registration succeeded');
      } else {
        // Get public URL
        const { data: { publicUrl } } = uploadClient.storage
          .from('avatars')
          .getPublicUrl(filePath);

        photo_url = publicUrl;
        console.log('[Step 2 Complete] Photo uploaded:', photo_url);

        // Update user profile with photo URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ photo_url, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) {
          console.error('[ERROR] Photo URL update error:', updateError);
        } else {
          console.log('[Step 3 Complete] Photo URL updated in database');
        }
      }
    } else {
      console.log('[INFO] No photo provided, skipping Step 2');
    }

    // ============================================
    // FINAL RESPONSE
    // ============================================
    return NextResponse.json(
      {
        message: 'Registration successful. You can now start the quiz.',
        user: {
          id: userId,
          email: authData.user.email,
          name,
          date_of_birth,
          photo_url,
        },
        session: sessionData?.session || null,
        steps_completed: {
          registration: true,
          photo_upload: file ? (photo_url ? true : false) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ERROR] Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
