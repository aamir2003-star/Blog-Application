import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DEFAULT_TITLE = 'Writen | Share Your Engineering Voice';
const DEFAULT_DESCRIPTION = 'Where software engineers and developers share their stories, projects, and insights.';
const DEFAULT_IMAGE = '/assets/default-og.png';
const DEFAULT_KEYWORDS = ['software engineering', 'programming', 'web development', 'system design', 'tech blog'];

interface SEOParams {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  canonical?: string;
}

export function generateSEO({
  title,
  description,
  path = '/',
  image,
  keywords,
  noIndex = false,
  canonical,
}: SEOParams = {}): Metadata {
  const fullUrl = new URL(path, BASE_URL).toString();
  const finalTitle = title ? `${title} | Writen` : DEFAULT_TITLE;
  const finalDesc = description || DEFAULT_DESCRIPTION;
  const finalImage = image || DEFAULT_IMAGE;
  const finalKeywords = [
    ...new Set([...(keywords || []), ...DEFAULT_KEYWORDS]),
  ];

  return {
    title: finalTitle,
    description: finalDesc,
    keywords: finalKeywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonical || fullUrl,
    },
    openGraph: {
      title: finalTitle,
      description: finalDesc,
      url: fullUrl,
      siteName: 'Writen',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: title || 'Writen',
        },
      ],
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}
