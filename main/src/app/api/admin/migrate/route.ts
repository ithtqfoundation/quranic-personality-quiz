// Migration endpoint — creates landing_content table via Supabase SQL API
// Run via: POST http://localhost:3000/api/admin/migrate
// DELETE THIS FILE after migration is complete!

import { NextResponse } from 'next/server';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in .env' },
      { status: 500 }
    );
  }

  // Extract project ref from URL (e.g., "afmgxvvilahmovicnifp" from "https://afmgxvvilahmovicnifp.supabase.co")
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

  const sql = `
    CREATE TABLE IF NOT EXISTS landing_content (
      id SERIAL PRIMARY KEY,
      section VARCHAR(50) NOT NULL,
      key VARCHAR(100) NOT NULL,
      content_type VARCHAR(20) NOT NULL DEFAULT 'text',
      value TEXT,
      order_number INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(section, key)
    );

    CREATE INDEX IF NOT EXISTS idx_landing_content_section ON landing_content(section);

    ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'landing_content' AND policyname = 'Anyone can read landing content'
      ) THEN
        CREATE POLICY "Anyone can read landing content"
          ON landing_content FOR SELECT USING (true);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'landing_content' AND policyname = 'Service role can manage landing content'
      ) THEN
        CREATE POLICY "Service role can manage landing content"
          ON landing_content FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;

  try {
    // Method 1: Try Supabase Management API (pg/query endpoint)
    const mgmtRes = await fetch(`https://${projectRef}.supabase.co/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (mgmtRes.ok) {
      // Notify PostgREST to reload schema cache
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      });

      return NextResponse.json({
        message: '✅ Migration completed! Table landing_content created.',
        method: 'pg/query',
      });
    }

    // Method 2: Try via rpc if pg/query is not available
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (rpcRes.ok) {
      return NextResponse.json({
        message: '✅ Migration completed via rpc!',
        method: 'rpc',
      });
    }

    // If both fail, provide the SQL to run manually
    return NextResponse.json({
      error: 'Automated migration failed. Please run the SQL manually.',
      instructions: [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Copy the SQL below and click Run',
      ],
      sql: sql.trim(),
      debug: {
        pg_status: mgmtRes.status,
        pg_body: await mgmtRes.text().catch(() => 'N/A'),
        rpc_status: rpcRes.status,
        rpc_body: await rpcRes.text().catch(() => 'N/A'),
      },
    }, { status: 422 });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      instructions: ['Run the SQL manually in Supabase Dashboard → SQL Editor'],
      sql: sql.trim(),
    }, { status: 500 });
  }
}
