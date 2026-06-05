'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useGoogleOneTapLogin, CredentialResponse } from '@react-oauth/google';

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function GoogleOneTap() {
  const { user, loading, setTokenFromOAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState('');

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return;
      try {
        const res = await fetch(`${API}/auth/google/one-tap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credential: credentialResponse.credential }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          await setTokenFromOAuth(data.accessToken);
          const target = sessionStorage.getItem('auth_redirect') || '/onboarding';
          sessionStorage.removeItem('auth_redirect');
          router.push(target);
        } else {
          setError(data.message || 'Google login failed');
        }
      } catch (err) {
        setError('Google One-Tap request failed');
      }
    },
    onError: () => setError('Google One-Tap failed'),
    // Only prompt if we are not loading, have no session, and are on /login or /register
    disabled: loading || user !== null || !isAuthPage,
    use_fedcm_for_prompt: false,
    cancel_on_tap_outside: false,
  });

  if (error) {
    console.error('Google One Tap Error:', error);
  }

  // Hook handles the popup UI automatically; nothing to render inline
  return null;
}

