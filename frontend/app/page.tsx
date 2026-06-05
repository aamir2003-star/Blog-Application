'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/feed');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return null; // Avoid flashing content before redirect

  return (
    <div className="min-h-screen flex flex-col bg-surface selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Decorative Grid Mesh Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(0, 109, 56, 0.03) 0, transparent 50%), 
            radial-gradient(at 50% 0%, rgba(0, 109, 56, 0.05) 0, transparent 50%), 
            radial-gradient(at 100% 0%, rgba(0, 109, 56, 0.03) 0, transparent 50%)
          `
        }}
      />

      {/* Top Navigation Bar */}
      <header 
        className={`sticky top-0 z-50 flex justify-between items-center w-full px-6 max-w-[1280px] mx-auto backdrop-blur-md transition-all duration-500 ease-in-out border-b ${
          isScrolled 
            ? 'py-3 bg-surface/85 border-outline-variant/30 shadow-[0_4px_30px_rgba(0,0,0,0.03)]' 
            : 'py-4 bg-transparent border-transparent'
        }`}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="font-headline-md text-2xl font-bold text-on-surface">
            Writen
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block font-body-md text-base text-secondary hover:text-on-surface px-4 py-2 transition-colors duration-300">
            Sign in
          </Link>
          <Link href="/register" className="bg-primary text-on-primary font-body-md text-base px-6 py-2 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 duration-300">
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 relative z-10 flex items-center py-10 sm:py-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden w-full">
          <div 
            className="absolute inset-0 -z-10"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 109, 56, 0.05) 0%, rgba(249, 249, 247, 0) 70%)'
            }}
          />
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
              <h1 className="font-headline-lg md:font-display-xl text-4xl sm:text-5xl md:text-6xl font-bold text-on-surface max-w-2xl leading-[1.1] tracking-tight">
                Human stories & ideas
              </h1>
              <p className="font-headline-md text-xl sm:text-2xl md:text-[28px] text-secondary max-w-xl italic font-medium">
                A place to read, write, and deepen your understanding of software craftsmanship.
              </p>
              <Link href="/register" className="inline-block bg-on-surface text-surface font-body-lg text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-full hover:opacity-90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                Start reading
              </Link>
            </div>

            {/* Abstract Graphic */}
            <div className="hidden lg:flex justify-center relative animate-in fade-in zoom-in duration-1000 delay-300 fill-mode-both">
              <div className="w-full aspect-square relative max-w-lg animate-[float_6s_ease-in-out_infinite]">
                {/* Abstract Animated Graphic */}
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
                
                <div className="absolute inset-4 border border-outline-variant/40 rounded-full flex items-center justify-center">
                  <div className="w-[80%] h-[80%] border-2 border-primary/20 rounded-full flex items-center justify-center animate-[spin_30s_linear_infinite]">
                    <div className="w-4 h-4 bg-primary rounded-full absolute -top-2 shadow-[0_0_15px_rgba(0,109,56,0.5)]"></div>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div className="grid grid-cols-8 grid-rows-8 gap-4 w-full h-full opacity-10">
                    {/* Decorative Grid */}
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-outline-variant"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full mt-auto py-6 z-20 border-t border-outline-variant/10 animate-in fade-in duration-1000 delay-500 fill-mode-both">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body-md text-sm text-secondary text-center sm:text-left">
            &copy; {new Date().getFullYear()} Created by Aamir
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="https://github.com/aamir2003-star" target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-secondary hover:text-on-surface transition-colors">
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/shaikh-aamir-38973024a/" target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-secondary hover:text-on-surface transition-colors">
              LinkedIn
            </a>
            <a href="https://www.instagram.com/_aamir_shaikh_004/" target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-secondary hover:text-on-surface transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
