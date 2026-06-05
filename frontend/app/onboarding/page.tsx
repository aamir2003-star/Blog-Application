'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [redirectUrl, setRedirectUrl] = useState('/feed');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('auth_redirect');
      if (stored) {
        setRedirectUrl(stored);
      }
    }
  }, []);

  // Splash screen timer — give enough time for the full animation, then redirect straight to feed or target
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect');
      }
      router.push(redirectUrl);
    }, 3500);
    return () => clearTimeout(hideTimer);
  }, [router, redirectUrl]);

  const appName = 'Writen';
  const taglineWords = ['Where', 'ideas', 'take', 'shape.'];

  const categories = [
    {
      name: "Engineering",
      icon: "code_blocks",
      tags: ["React", "Node.js", "System Design", "DevOps", "Python", "GraphQL", "WebAssembly", "Rust", "TypeScript", "Docker"]
    },
    {
      name: "Design",
      icon: "palette",
      tags: ["UX", "UI", "Typography", "Figma", "Design Systems", "Accessibility", "Motion Design", "Branding"]
    },
    {
      name: "Product",
      icon: "rocket_launch",
      tags: ["Strategy", "Management", "Agile", "User Research", "Metrics", "Growth", "Analytics"]
    },
    {
      name: "AI & Machine Learning",
      icon: "smart_toy",
      tags: ["LLMs", "Computer Vision", "NLP", "MLOps", "Deep Learning", "Generative AI"]
    }
  ];

  const allTags = categories.flatMap(c => c.tags);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const selectAll = () => setSelectedTags(allTags);
  const clearAll = () => setSelectedTags([]);

  const handleComplete = () => {
    // TODO: send selected tags to backend
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect');
    }
    router.push(redirectUrl);
  };

  // ── Splash Screen ──
  // Rendered via AnimatePresence so we get a smooth exit animation
  if (showSplash) {
    return (
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center overflow-hidden"
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {/* Animated radial glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(0, 109, 56, 0.08) 0%, transparent 55%)'
              }}
            />

            {/* Orbiting decorative ring */}
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full border border-primary/10"
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              transition={{ duration: 3, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary/30 rounded-full"
                animate={{ boxShadow: ['0 0 10px rgba(0,109,56,0.3)', '0 0 25px rgba(0,109,56,0.6)', '0 0 10px rgba(0,109,56,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Inner ring */}
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full border border-outline-variant/20"
              initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
              animate={{ opacity: 0.6, scale: 1, rotate: -180 }}
              transition={{ duration: 3, ease: 'easeOut', delay: 0.3 }}
            />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Letter-by-letter app name */}
              <div className="flex items-baseline overflow-hidden">
                {appName.split('').map((letter, i) => (
                  <motion.span
                    key={i}
                    className="font-headline-lg text-6xl md:text-8xl font-bold text-on-surface inline-block"
                    initial={{ y: 80, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{
                      delay: 0.15 + i * 0.1,
                      duration: 0.7,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>

              {/* Glowing underline sweep */}
              <motion.div
                className="h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mt-2"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '120%', opacity: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
              />

              {/* Tagline — word by word */}
              <div className="flex gap-2 mt-6">
                {taglineWords.map((word, i) => (
                  <motion.span
                    key={i}
                    className="font-body-md text-lg md:text-xl text-secondary italic"
                    initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      delay: 1.4 + i * 0.2,
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              {/* Subtle loading bar */}
              <motion.div
                className="mt-10 h-[2px] bg-outline-variant/20 rounded-full overflow-hidden w-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
              >
                <motion.div
                  className="h-full bg-primary/60 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 2.2, duration: 1.2, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>

            {/* Corner decorative dots */}
            {[
              { className: 'top-[20%] left-[15%]', delay: 0.5 },
              { className: 'top-[30%] right-[18%]', delay: 0.8 },
              { className: 'bottom-[25%] left-[22%]', delay: 1.1 },
              { className: 'bottom-[20%] right-[12%]', delay: 0.7 },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className={`absolute ${dot.className} w-1.5 h-1.5 rounded-full bg-primary/25`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [0, 1.5, 1] }}
                transition={{ delay: dot.delay, duration: 0.6 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── Category Selection ──
  return (
    <div className="min-h-screen bg-surface flex flex-col animate-in fade-in duration-500 fill-mode-both">
      
      {/* Minimal Header */}
      <header className="border-b border-outline-variant/30 py-4 px-6 flex justify-between items-center bg-surface sticky top-0 z-50">
        <Link href="/feed" className="font-headline-lg text-xl font-bold text-on-surface">Writen</Link>
        <span className="font-label-caps text-sm text-on-surface-variant">Personalize your feed</span>
      </header>

      <main className="flex-1 max-w-[800px] w-full mx-auto px-6 py-12 md:py-20">
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
          <h1 className="font-headline-lg text-4xl font-bold text-on-surface mb-4">What are you interested in?</h1>
          <p className="font-body-md text-xl text-on-surface-variant">Choose at least 3 topics to personalize your feed.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={selectAll} className="font-label-caps text-sm text-primary hover:underline transition-colors">Select all</button>
            {selectedTags.length > 0 && (
              <button onClick={clearAll} className="font-label-caps text-sm text-on-surface-variant hover:text-on-surface transition-colors">Clear all</button>
            )}
          </div>
        </div>

        {/* Categories grid */}
        <div className="space-y-12 mb-20">
          {categories.map((category, catIdx) => (
            <div
              key={category.name}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${200 + catIdx * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-2">
                <span className="material-symbols-outlined text-primary text-2xl">{category.icon}</span>
                <h2 className="font-headline-md text-2xl font-semibold text-on-surface">{category.name}</h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {category.tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const isDisabled = false;
                  
                  return (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      disabled={isDisabled}
                      className={`
                        px-5 py-2.5 rounded-full font-body-md text-base transition-all flex items-center gap-2 border
                        ${isSelected 
                          ? 'bg-primary text-on-primary border-primary shadow-md scale-105' 
                          : 'bg-surface border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {tag}
                      {isSelected && <span className="material-symbols-outlined text-[18px]">check</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/30 p-4 transform transition-transform">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div>
            <p className="font-label-caps text-sm text-on-surface-variant">
              <span className={`font-bold ${selectedTags.length >= 3 ? 'text-primary' : 'text-on-surface'}`}>
                {selectedTags.length}
              </span> / {allTags.length} selected {selectedTags.length < 3 && <span className="text-xs">(min 3)</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('auth_redirect');
                }
                router.push(redirectUrl);
              }}
              className="px-6 py-3 rounded-full font-label-caps text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={handleComplete}
              disabled={selectedTags.length < 3}
              className={`px-8 py-3 rounded-full font-label-caps text-sm uppercase transition-all flex items-center gap-2 ${
                selectedTags.length >= 3
                  ? 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-md'
                  : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'
              }`}
            >
              Continue
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
