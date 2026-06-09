import { CanvasBlock, MetadataBlockType } from './CanvasBlocks';
import { compileCanvasBlocks } from './write-utils';

interface ValidatePostParams {
  title: string;
  category: string;
  coverImage: string;
  excerpt: string;
  keywords: string;
  activeBlocks: MetadataBlockType[];
  canvasBlocks: CanvasBlock[];
}

export function validatePost({
  title,
  category,
  coverImage,
  excerpt,
  keywords,
  activeBlocks,
  canvasBlocks,
}: ValidatePostParams): Record<string, string> {
  const newErrors: Record<string, string> = {};

  // ── Title ──
  if (!title.trim()) {
    newErrors.title = 'Please add a title before publishing.';
  } else if (title.trim().length < 5) {
    newErrors.title = 'Title is too short — needs at least 5 characters.';
  } else if (title.trim().length > 200) {
    newErrors.title = 'Title is too long — keep it under 200 characters.';
  }

  // ── Required metadata blocks not added yet ──
  const missingBlockLabels: Record<string, string> = {
    category:   'Category — helps readers find your article',
    coverImage: 'Cover image — makes your article stand out',
    excerpt:    'Short summary — shown as a preview in the feed',
    keywords:   'SEO keywords — helps search engines discover your article',
  };

  (['category', 'coverImage', 'excerpt', 'keywords'] as MetadataBlockType[]).forEach((req) => {
    if (!activeBlocks.includes(req)) {
      newErrors[`block_${req}`] = missingBlockLabels[req];
    }
  });

  // ── Metadata blocks added but left empty ──
  if (activeBlocks.includes('category') && !category) {
    newErrors.category = 'Please pick a category for your article.';
  }
  if (activeBlocks.includes('coverImage') && !coverImage.trim()) {
    newErrors.coverImage = 'Please upload or paste a cover image URL.';
  }
  if (activeBlocks.includes('excerpt') && !excerpt.trim()) {
    newErrors.excerpt = 'Please write a short summary (excerpt) for your article.';
  }
  if (activeBlocks.includes('keywords') && !keywords.trim()) {
    newErrors.keywords = 'Please add at least one SEO keyword.';
  }

  // ── Article body ──
  const textOnly = compileCanvasBlocks(canvasBlocks).replace(/<[^>]*>/g, '').trim();
  if (!textOnly) {
    newErrors.canvas = 'Your article has no content yet — start writing!';
  } else if (textOnly.length < 15) {
    newErrors.canvas = 'Your article is too short — write a bit more before publishing.';
  }

  // ── Empty image blocks ──
  canvasBlocks.forEach((block, idx) => {
    if (block.type === 'image_block' && !block.value.trim()) {
      newErrors[`block_${block.id}`] = `Image block #${idx + 1} is empty — upload an image or remove it.`;
    }
  });

  return newErrors;
}
