// Admin API Route: Landing Page Image Upload to Supabase Storage
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === 'landing-assets');

  if (!exists) {
    const { error } = await supabase.storage.createBucket('landing-assets', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Ensure bucket exists (auto-create on first upload)
    await ensureBucket(supabase);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `landing/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from('landing-assets')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('landing-assets')
      .getPublicUrl(filename);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filename,
      message: 'Image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from('landing-assets')
      .remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
