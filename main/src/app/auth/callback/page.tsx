'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the code from URL
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/register';

    if (code) {
      // Forward to API route for proper handling
      console.log('🔄 Forwarding to /api/auth/callback with code:', code);
      window.location.href = `/api/auth/callback?code=${code}&next=${next}`;
    } else {
      // No code, redirect to login with error
      console.error('❌ No code found in callback URL');
      router.push('/auth/login?error=no_code');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Completing login...</h2>
        <p className="text-gray-600 mt-2">Please wait while we process your authentication.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
