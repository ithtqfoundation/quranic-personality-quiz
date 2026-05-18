'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { Eye } from 'lucide-react';
import Image from 'next/image';

interface UserRow {
  id: string;
  name: string;
  email: string;
  age: number | null;
  whatsapp: string | null;
  photo_url: string | null;
  created_at: string;
  quiz_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loadDetail, setLoadDetail] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users?limit=1000', {
  credentials: 'include'
});
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const viewDetail = async (userId: string) => {
    setLoadDetail(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSelectedUser(data.user);
      setUserResults(data.quizResults || []);
    } catch {
      console.error('Failed to load user detail');
    } finally {
      setLoadDetail(false);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: 'photo_url',
      label: '',
      className: 'w-12',
      render: (r) =>
        r.photo_url ? (
           <a
    href={r.photo_url}
    target="_blank"
    rel="noopener noreferrer"
  >
    <Image
      src={r.photo_url}
      alt=""
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-cover hover:scale-110 transition"
      unoptimized
    />
  </a>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
            {r.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        ),
    },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (r) => <span className="text-gray-400 text-xs">{r.email}</span>,
    },
    {
      key: 'age',
      label: 'Age',
      sortable: true,
      className: 'w-16',
      render: (r) => <span className="text-gray-400">{r.age || '—'}</span>,
    },
    {
      key: 'quiz_count',
      label: 'Quizzes',
      sortable: true,
      className: 'w-24',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            r.quiz_count > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'
          }`}
        >
          {r.quiz_count}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      className: 'w-28',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {r.created_at
            ? new Date(r.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={users}
        searchKeys={['name', 'email']}
        searchPlaceholder="Search users..."
        loading={loading}
        emptyMessage="No users found"
        actions={(row) => (
          <button
            onClick={() => viewDetail(row.id)}
            className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Eye size={14} />
          </button>
        )}
      />

      <FormModal open={detailOpen} onClose={() => setDetailOpen(false)} title="User Detail" maxWidth="max-w-lg">
        {loadDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-500 border-t-emerald-400" />
          </div>
        ) : selectedUser ? (
          <div className="space-y-5">
            {/* User Info */}
            <div className="flex items-center gap-4">
              {selectedUser.photo_url ? (
                <Image
                  src={selectedUser.photo_url}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-bold text-white">{selectedUser.name}</p>
                <p className="text-sm text-gray-400">{selectedUser.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#0f1117] rounded-lg p-3">
                <span className="text-gray-500 text-xs">Age</span>
                <p className="text-white font-medium">{selectedUser.age || '—'}</p>
              </div>
              <div className="bg-[#0f1117] rounded-lg p-3">
                <span className="text-gray-500 text-xs">WhatsApp</span>
                <p className="text-white font-medium">{selectedUser.whatsapp || '—'}</p>
              </div>
            </div>

            {/* Quiz History */}
            {userResults.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">
                  Quiz History ({userResults.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userResults.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between bg-[#0f1117] rounded-lg p-3">
                      <div>
                        <p className="text-sm text-white font-medium">
                          {r.final_juz ? `Juz ${r.final_juz}` : 'Incomplete'}
                        </p>
                        <p className="text-[10px] text-gray-500">{r.branch_category || '—'}</p>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {r.completed_at ? new Date(r.completed_at).toLocaleDateString('id-ID') : 'In progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">User not found</p>
        )}
      </FormModal>
    </div>
  );
}
