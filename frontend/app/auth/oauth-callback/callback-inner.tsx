'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function OAuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setTokenFromOAuth } = useAuth();

  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Delayed visibility — the spinner only appears after 600ms.
  // If the redirect completes in under 600ms (the normal case on a good connection),
  // the user sees nothing at all and transitions seamlessly to onboarding.
  // Only on unusually slow responses (e.g. Render cold start) does the spinner appear.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider') ?? 'OAuth';
    const error = searchParams.get('error');

    if (error) {
      setErrorMsg(`${provider} sign-in was cancelled or failed. Please try again.`);
      setStatus('error');
      return;
    }

    if (!token) {
      setErrorMsg('No token received from the server. Please try again.');
      setStatus('error');
      return;
    }

    // Clear sensitive params from the URL immediately (security)
    window.history.replaceState({}, '', '/auth/oauth-callback');

    setTokenFromOAuth(token)
      .then(() => {
        const target = sessionStorage.getItem('auth_redirect') || '/onboarding';
        sessionStorage.removeItem('auth_redirect');
        router.replace(target);
      })
      .catch(() => {
        setErrorMsg('We couldn\'t load your profile. Please try signing in again.');
        setStatus('error');
      });
  }, [searchParams, setTokenFromOAuth, router]);

  // ── Error state — fully branded to Writen design system ──────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-error-container/30 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-error text-[28px]">error</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-on-surface font-headline-md">
              Sign-in Failed
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm rounded-full transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  // ── Loading state — invisible until 600ms, then fades in branded spinner ─
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <div
        className={`flex flex-col items-center gap-4 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-primary text-[44px] animate-spin select-none">
          progress_activity
        </span>
        <p className="text-on-surface-variant text-sm font-medium select-none">
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}
