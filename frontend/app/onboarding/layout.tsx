import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Onboarding',
  noIndex: true,
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
