'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AvatarUpload from './AvatarUpload';
import ProfileForm from './ProfileForm';
import PasswordDirectUpdate from './PasswordDirectUpdate';
import PasswordOtpUpdate from './PasswordOtpUpdate';

export default function ProfilePageClient() {
  const router = useRouter();
  const { user, accessToken, loading, refreshUser } = useAuth();
  const [passwordMethod, setPasswordMethod] = useState<'direct' | 'otp'>('direct');

  // Redirect guest users to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 select-none">
        <span className="material-symbols-outlined animate-spin text-primary text-[44px]">progress_activity</span>
        <p className="font-label-caps text-xs text-on-surface-variant font-bold tracking-widest uppercase animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const isEmailUser = !user.googleId && !user.githubId;

  return (
    <div className="w-full max-w-[480px] space-y-6">
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 md:p-8 shadow-xl relative z-10">
        
        {/* Avatar Upload Area */}
        <AvatarUpload 
          user={user} 
          accessToken={accessToken} 
          refreshUser={refreshUser} 
        />

        {/* User Quick Info */}
        <div className="text-center mb-8 select-none">
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface truncate">{user.name}</h1>
          <p className="font-body-md text-sm text-on-surface-variant truncate">{user.email}</p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-[10px] font-bold font-label-caps uppercase tracking-wider text-primary">
            {user.role}
          </div>
        </div>

        {/* Profile Info Details Form */}
        <ProfileForm 
          user={user} 
          accessToken={accessToken} 
          refreshUser={refreshUser} 
        />

        {/* Change Password Block */}
        <div className="mt-6">
          {!isEmailUser ? (
            <div className="p-4 bg-surface-container/30 border border-outline-variant/20 rounded-xl text-center select-none">
              <span className="material-symbols-outlined text-primary text-[24px] mb-1">link</span>
              <p className="text-xs text-on-surface-variant/80 font-medium">
                This account is authenticated via Google or GitHub. You do not need a password.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tab Selector */}
              <div className="flex border border-outline-variant/30 rounded-xl overflow-hidden p-0.5 bg-surface-container-low select-none">
                <button 
                  type="button"
                  onClick={() => setPasswordMethod('direct')}
                  className={`flex-1 py-2 text-xs font-bold font-label-caps uppercase rounded-lg border-none transition-all cursor-pointer ${
                    passwordMethod === 'direct'
                      ? 'bg-surface text-primary shadow-sm font-bold'
                      : 'bg-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Direct Update
                </button>
                <button 
                  type="button"
                  onClick={() => setPasswordMethod('otp')}
                  className={`flex-1 py-2 text-xs font-bold font-label-caps uppercase rounded-lg border-none transition-all cursor-pointer ${
                    passwordMethod === 'otp'
                      ? 'bg-surface text-primary shadow-sm font-bold'
                      : 'bg-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Verify via Email
                </button>
              </div>

              {/* Password update form methods */}
              {passwordMethod === 'direct' ? (
                <PasswordDirectUpdate accessToken={accessToken} />
              ) : (
                <PasswordOtpUpdate user={user} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
