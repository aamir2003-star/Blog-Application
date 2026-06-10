'use client';

import { Suspense } from 'react';
import OAuthCallbackInner from './callback-inner';

export default function OAuthCallbackPage() {
  return (
    // Suspense fallback is an invisible blank screen that matches the app background.
    // The actual redirect to onboarding happens in milliseconds on a normal connection,
    // so there is no benefit to showing a spinner here — a blank screen is far better
    // than a flash of foreign-coloured UI.
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
