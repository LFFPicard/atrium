'use client';

import { useState } from 'react';
import type { UserRow } from '@/lib/users';
import UserModal from './UserModal';

const avatarColors = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-orange-600', 'bg-pink-600', 'bg-cyan-600',
];

function Avatar({ username }: { username: string }) {
  const color = avatarColors[username.charCodeAt(0) % avatarColors.length];
  return (
    <div className={`w-8 h-8 text-xs ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none`}>
      {username[0].toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }: { role: 'admin' | 'user' }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-(--color-accent)/15 text-(--color-accent) border border-(--color-accent)/25">
      admin
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-(--color-surface) text-(--color-text-muted) border border-(--color-border)">
      user
    </span>
  );
}

function SSOBadge({ user }: { user: UserRow }) {
  if (user.plexToken) {
    return <span className="text-xs text-(--color-text-muted)">Plex</span>;
  }
  if (user.jellyfinUserId) {
    return <span className="text-xs text-(--color-text-muted)">Jellyfin</span>;
  }
  return <span className="text-xs text-(--color-text-muted)">Local</span>;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface UserTableProps {
  initialUsers: UserRow[];
  currentUserId: string;
}

export default function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditingUser(null);
    setModalMode('create');
  }

  function openEdit(user: UserRow) {
    setEditingUser(user);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingUser(null);
  }

  function handleSuccess(updated: UserRow) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    closeModal();
  }

  async function handleDelete(user: UserRow) {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-(--color-text)">Users</h1>
          <p className="text-sm text-(--color-text-muted) mt-0.5">{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New User
        </button>
      </div>

      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--color-border)">
                <th className="text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider px-4 py-3 hidden md:table-cell">Account</th>
                <th className="text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-(--color-bg) transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar username={user.username} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-(--color-text) truncate">{user.username}</span>
                          {user.mustChangePassword && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-400/15 text-amber-400 border border-amber-400/25 shrink-0">
                              temp pw
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-(--color-text-muted) sm:hidden truncate block">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted) hidden sm:table-cell">
                    <span className="truncate block max-w-50">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <SSOBadge user={user} />
                  </td>
                  <td className="px-4 py-3 text-(--color-text-muted) hidden lg:table-cell whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
                        title="Edit user"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUserId || deletingId === user.id}
                        className="p-1.5 rounded-md text-(--color-text-muted) hover:text-red-400 hover:bg-(--color-bg) transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.id === currentUserId ? 'Cannot delete your own account' : 'Delete user'}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-(--color-text-muted)">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode === 'create' && (
        <UserModal
          mode="create"
          currentUserId={currentUserId}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
      {modalMode === 'edit' && editingUser && (
        <UserModal
          mode="edit"
          user={editingUser}
          currentUserId={currentUserId}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
