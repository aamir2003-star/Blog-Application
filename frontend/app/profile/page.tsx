import Link from 'next/link';
import TopNavBar from '@/components/layout/TopNavBar';
import ProfilePageClient from '@/components/profile/ProfilePageClient';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 md:px-6 relative w-full max-w-[1280px] md:w-[80%] mx-auto">
        {/* Desktop Back Link */}
        <Link 
          href="/feed" 
          className="absolute hidden md:flex top-8 left-4 md:left-6 items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent decoration-none"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Feed
        </Link>

        {/* Mobile Back Link */}
        <div className="w-full max-w-[480px] md:hidden mb-4">
          <Link 
            href="/feed" 
            className="flex items-center gap-2 font-label-caps text-sm text-secondary hover:text-on-surface transition-colors cursor-pointer border-none bg-transparent decoration-none w-fit"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Feed
          </Link>
        </div>

        <ProfilePageClient />
      </main>
    </div>
  );
}
