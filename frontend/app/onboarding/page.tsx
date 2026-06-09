'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
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

  return (
    <AnimatePresence>
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
    </AnimatePresence>
  );
}
