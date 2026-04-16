import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Admin Panel — HTQ Personality Quiz',
  description: 'Content management system for HTQ Personality Quiz',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current pathname from middleware header
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Allow /admin/login page to render without auth
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Server-side admin check for all other /admin routes
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    redirect('/admin/login?error=forbidden');
  }

  const adminUser = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email || 'Admin',
    role: 'admin',
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden">
      <AdminSidebar adminUser={adminUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader adminUser={adminUser} />
        <main className="flex-1 overflow-y-auto bg-[#161923] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
