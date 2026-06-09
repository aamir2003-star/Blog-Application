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

  if (!title.trim()) {
    newErrors.title = 'Title is required';
  } else if (title.trim().length < 5) {
    newErrors.title = 'Title must be at least 5 characters';
  } else if (title.trim().length > 200) {
    newErrors.title = 'Title cannot exceed 200 characters';
  }

  ['category', 'coverImage', 'excerpt', 'keywords'].forEach((req) => {
    if (!activeBlocks.includes(req as MetadataBlockType)) {
      newErrors[`block_${req}`] = `Workspace requires the ${req} block.`;
    }
  });

  if (activeBlocks.includes('category') && !category) {
    newErrors.category = 'Please select a category';
  }
  if (activeBlocks.includes('coverImage') && !coverImage.trim()) {
    newErrors.coverImage = 'Cover image URL is required';
  }
  if (activeBlocks.includes('excerpt') && !excerpt.trim()) {
    newErrors.excerpt = 'Excerpt is required';
  }
  if (activeBlocks.includes('keywords') && !keywords.trim()) {
    newErrors.keywords = 'SEO keywords are required';
  }

  const textOnly = compileCanvasBlocks(canvasBlocks).replace(/<[^>]*>/g, '').trim();
  if (!textOnly) {
    newErrors.canvas = 'Writing canvas content is required.';
  } else if (textOnly.length < 15) {
    newErrors.canvas = 'Content must be at least 15 characters';
  }

  canvasBlocks.forEach((block, idx) => {
    if (block.type === 'image_block' && !block.value.trim()) {
      newErrors[`block_${block.id}`] = `Image Block #${idx + 1} has no image config.`;
    }
  });

  return newErrors;
}
