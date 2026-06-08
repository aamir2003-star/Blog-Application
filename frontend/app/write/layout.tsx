import { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO({
  title: 'Write Story',
  noIndex: true,
});

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
