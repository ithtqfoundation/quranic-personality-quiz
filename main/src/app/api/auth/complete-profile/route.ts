// API Route: Complete User Profile After Google OAuth
// Accepts: name, gender, date_of_birth, photo (multipart/form-data)
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login with Google first.' },
        { status: 401 }
      );
    }

    // Parse form data (supports file upload)
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const gender = formData.get('gender') as string;
    const date_of_birth = formData.get('date_of_birth') as string;
    const file = formData.get('file') as File | null;

    // ============================================
    // STEP 1: VALIDATION
    // ============================================
    if (!name || !gender || !date_of_birth) {
      return NextResponse.json(
        { error: 'Name, gender, and date of birth are required' },
        { status: 400 }
      );
    }

    // Validate gender
    const allowedGenders = ['male', 'female', 'other'];
    if (!allowedGenders.includes(gender.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be: male, female, or other' },
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

    // Validate age (must be at least 13 years old)
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (actualAge < 13) {
      return NextResponse.json(
        { error: 'You must be at least 13 years old' },
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

    console.log('[Step 1] Updating user profile for:', user.id);

    // ============================================
    // STEP 2: UPLOAD PHOTO (if provided)
    // ============================================
    let photo_url: string | null = null;

    if (file) {
      console.log('[Step 2] Uploading photo...');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[ERROR] Upload error:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload photo: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      photo_url = urlData.publicUrl;
      console.log('[SUCCESS] Photo uploaded:', photo_url);
    }

    // ============================================
    // STEP 3: UPSERT USER PROFILE
    // ============================================
    console.log('[Step 3] Saving profile to database...');
    console.log('[DEBUG] User ID from auth:', user.id);
    console.log('[DEBUG] User email from auth:', user.email);

    // First check if row exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single();

    console.log('[DEBUG] Existing user in DB:', existingUser);

    // Use UPDATE instead of UPSERT to avoid INSERT policy conflict
    const { data: userData, error: upsertError } = await supabase
      .from('users')
      .update({
        name,
        gender,
        date_of_birth,
        photo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (upsertError) {
      console.error('[ERROR] Database error:', upsertError);
      return NextResponse.json(
        { error: `Failed to save profile: ${upsertError.message}` },
        { status: 500 }
      );
    }

    console.log('[SUCCESS] Profile completed successfully');

    // ============================================
    // STEP 4: RETURN SUCCESS
    // ============================================
    return NextResponse.json({
      message: 'Profile completed successfully',
      user: userData,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ERROR] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current profile status
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, gender, date_of_birth, photo_url, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { 
          profile_completed: false,
          user: {
            id: user.id,
            email: user.email,
            name: null,
            gender: null,
            date_of_birth: null,
            photo_url: null,
          }
        },
        { status: 200 }
      );
    }

    const isComplete = !!(profile.name && profile.gender && profile.date_of_birth);

    return NextResponse.json({
      profile_completed: isComplete,
      user: profile,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ERROR] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
