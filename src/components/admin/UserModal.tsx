'use client';

import { useState, useEffect } from 'react';
import type { UserRow } from '@/lib/users';

interface CreateProps {
  mode: 'create';
  user?: undefined;
  currentUserId: string;
  onClose: () => void;
  onSuccess: (user: UserRow) => void;
}

interface EditProps {
  mode: 'edit';
  user: UserRow;
  currentUserId: string;
  onClose: () => void;
  onSuccess: (user: UserRow) => void;
}

type UserModalProps = CreateProps | EditProps;

export default function UserModal({ mode, user, currentUserId, onClose, onSuccess }: UserModalProps) {
  const isSelf = mode === 'edit' && user?.id === currentUserId;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setRole(user.role);
    }
  }, [mode, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (mode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), email: email.trim(), password, role }),
        });
        const data = await res.json() as UserRow & { error?: string };
        if (!res.ok) { setError(data.error ?? 'Failed to create user'); return; }
        onSuccess(data);
      } else {
        const body: { role: 'admin' | 'user'; password?: string } = { role };
        if (newPassword) body.password = newPassword;

        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json() as UserRow & { error?: string };
        if (!res.ok) { setError(data.error ?? 'Failed to update user'); return; }
        onSuccess(data);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-(--color-surface) border border-(--color-border) rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <h2 className="text-sm font-semibold text-(--color-text)">
            {mode === 'create' ? 'New User' : `Edit ${user.username}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'create' && (
            <>
              <div>
                <label className="block text-xs font-medium text-(--color-text) mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
                  placeholder="jsmith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-(--color-text) mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
                  placeholder="jsmith@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-(--color-text) mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-(--color-text) mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              disabled={isSelf}
              className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus:border-(--color-accent) disabled:opacity-50"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && (
              <p className="mt-1 text-xs text-(--color-text-muted)">Cannot change your own role.</p>
            )}
          </div>

          {mode === 'edit' && (
            <div className="pt-1 border-t border-(--color-border)">
              <label className="block text-xs font-medium text-(--color-text) mb-1.5 mt-3">
                Reset password
                <span className="text-(--color-text-muted) font-normal ml-1">(leave blank to keep unchanged)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-(--color-bg) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--color-accent)"
                placeholder="New temporary password"
              />
              {newPassword && (
                <p className="mt-1 text-xs text-amber-400">
                  User will be prompted to change this password on next login.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-(--color-button) text-(--color-button-text) text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
