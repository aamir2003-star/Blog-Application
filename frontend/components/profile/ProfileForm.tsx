'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';

interface ProfileFormProps {
  user: User;
  accessToken: string | null;
  refreshUser: () => Promise<void>;
}

export default function ProfileForm({ user, accessToken, refreshUser }: ProfileFormProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Initialize Name from user context once loaded
  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.patch('/auth/profile', { name: name.trim() });
      await refreshUser();
      setSuccess('Profile name updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdateName} className="space-y-4 pb-6 border-b border-outline-variant/20">
      <div className="space-y-1.5">
        <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="profile-name">Display Name</label>
        <input 
          id="profile-name"
          type="text" 
          required
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Display Name" 
          className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm outline-none focus:ring-2 focus:ring-primary/15 transition-all"
        />
      </div>

      <div className="space-y-1.5 opacity-60">
        <label className="font-label-caps text-xs text-on-surface-variant block">Email Address (Read-Only)</label>
        <input 
          type="email" 
          disabled 
          value={user.email} 
          className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/35 rounded-xl font-body-md text-sm cursor-not-allowed outline-none"
        />
      </div>

      {success && (
        <p className="text-xs text-primary font-semibold text-center mt-2 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          {success}
        </p>
      )}

      {error && (
        <p className="text-xs text-error font-semibold text-center mt-2 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </p>
      )}

      <button 
        type="submit" 
        disabled={saving || name.trim() === user.name}
        className="w-full bg-primary-container text-on-primary-container disabled:opacity-50 py-3 rounded-xl font-label-caps text-xs font-bold uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-none"
      >
        {saving ? (
          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
        ) : 'Update Display Name'}
      </button>
    </form>
  );
}
