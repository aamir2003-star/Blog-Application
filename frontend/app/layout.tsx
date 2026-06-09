import type { Metadata } from 'next';
import { Inter, Newsreader, JetBrains_Mono } from 'next/font/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import GoogleOneTap from '@/components/GoogleOneTap';
import Providers from '@/lib/providers';
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

import { generateSEO } from '@/lib/seo';

export const metadata: Metadata = generateSEO();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} bg-surface text-on-surface font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary-container`}>
        <NextTopLoader
          color="#006d38"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #006d38,0 0 5px #006d38"
        />
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <Providers>
              <GoogleOneTap />
              {children}
            </Providers>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
