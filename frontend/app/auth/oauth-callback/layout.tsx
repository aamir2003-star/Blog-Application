import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Completing Sign-In',
  noIndex: true,
});

export default function OAuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
