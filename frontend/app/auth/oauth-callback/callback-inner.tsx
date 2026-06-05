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

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider') ?? 'OAuth';
    const error = searchParams.get('error');

    if (error) {
      setErrorMsg(`${provider} authentication failed. Please try again.`);
      setStatus('error');
      return;
    }

    if (!token) {
      setErrorMsg('No token received from the server.');
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
        setErrorMsg('Failed to fetch your profile. Please try again.');
        setStatus('error');
      });
  }, [searchParams, setTokenFromOAuth, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-white">Authentication Failed</h2>
          <p className="text-gray-400 text-sm">{errorMsg}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Completing sign-in…</p>
    </div>
  );
}
