'use client';

import { useState } from 'react';

interface PasswordDirectUpdateProps {
  accessToken: string | null;
}

export default function PasswordDirectUpdate({ accessToken }: PasswordDirectUpdateProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password Requirements validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/profile/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password.');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-1.5">
        <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="curr-pass">Current Password</label>
        <input 
          id="curr-pass"
          type="password" 
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm outline-none focus:ring-2 focus:ring-primary/15 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="new-pass">New Password</label>
        <input 
          id="new-pass"
          type="password" 
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm outline-none focus:ring-2 focus:ring-primary/15 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-label-caps text-xs text-on-surface-variant block" htmlFor="conf-pass">Confirm New Password</label>
        <input 
          id="conf-pass"
          type="password" 
          required
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl font-body-md text-sm outline-none focus:ring-2 focus:ring-primary/15 transition-all"
        />
      </div>

      {/* Security checklist */}
      {newPassword.length > 0 && (
        <div className="bg-surface-container/30 border border-outline-variant/20 rounded-xl p-3.5 space-y-2 select-none">
          <p className="font-label-caps text-[9px] text-on-surface-variant tracking-wider block uppercase font-bold">New Password Requirements</p>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className={`material-symbols-outlined text-[14px] ${hasMinLength ? 'text-primary' : 'text-on-surface-variant/40'}`}>
              {hasMinLength ? 'check_circle' : 'circle'}
            </span>
            <span className={hasMinLength ? 'text-on-surface' : 'text-on-surface-variant/75'}>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className={`material-symbols-outlined text-[14px] ${hasUppercase ? 'text-primary' : 'text-on-surface-variant/40'}`}>
              {hasUppercase ? 'check_circle' : 'circle'}
            </span>
            <span className={hasUppercase ? 'text-on-surface' : 'text-on-surface-variant/75'}>Uppercase & lowercase letters</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className={`material-symbols-outlined text-[14px] ${hasNumber ? 'text-primary' : 'text-on-surface-variant/40'}`}>
              {hasNumber ? 'check_circle' : 'circle'}
            </span>
            <span className={hasNumber ? 'text-on-surface' : 'text-on-surface-variant/75'}>At least one digit/number</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium border-t border-outline-variant/20 pt-2 mt-1">
            <span className={`material-symbols-outlined text-[14px] ${passwordsMatch ? 'text-primary' : 'text-on-surface-variant/40'}`}>
              {passwordsMatch ? 'check_circle' : 'circle'}
            </span>
            <span className={passwordsMatch ? 'text-on-surface' : 'text-on-surface-variant/75'}>Passwords match</span>
          </div>
        </div>
      )}

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
        disabled={saving || !isValid}
        className="w-full bg-primary-container text-on-primary-container disabled:opacity-50 py-3 rounded-xl font-label-caps text-xs font-bold uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-none"
      >
        {saving ? (
          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
        ) : 'Change Password'}
      </button>
    </form>
  );
}
