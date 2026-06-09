import { CanvasBlock } from './CanvasBlocks';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const compileCanvasBlocks = (blocks: CanvasBlock[]): string => {
  return blocks
    .map((block) => {
      if (block.type === 'content') return `<!-- block:content -->\n${block.value}`;
      if (block.type === 'image_block') {
        const captionEncoded = encodeURIComponent(block.caption || '');
        return `<!-- block:image_block caption:${captionEncoded} -->\n<figure class="my-6 text-center"><img src="${block.value}" alt="${block.caption || 'Image'}" class="rounded-lg max-w-full mx-auto" />${block.caption ? `<figcaption class="text-xs text-on-surface-variant/80 mt-2 font-body-md">${block.caption}</figcaption>` : ''}</figure>`;
      }
      if (block.type === 'code_block') {
        const lang = block.language || 'javascript';
        return `<!-- block:code_block language:${lang} -->\n<pre><code class="language-${lang}">${block.value}</code></pre>`;
      }
      return '';
    })
    .join('\n\n');
};

export const parseHtmlToBlocks = (html: string): CanvasBlock[] => {
  if (!html) return [];
  if (!html.includes('<!-- block:')) {
    return [{ id: `content_${Math.random().toString(36).slice(2, 9)}`, type: 'content', value: html }];
  }
  const blocks: CanvasBlock[] = [];
  const parts = html.split('<!-- block:');
  
  if (parts[0].trim()) {
    blocks.push({ id: `content_${Math.random().toString(36).slice(2, 9)}`, type: 'content', value: parts[0].trim() });
  }

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const closeCommentIdx = part.indexOf('-->');
    if (closeCommentIdx === -1) continue;

    const header = part.slice(0, closeCommentIdx).trim();
    const content = part.slice(closeCommentIdx + 3).trim();
    const id = `${header.split(' ')[0]}_${Math.random().toString(36).slice(2, 9)}`;

    if (header === 'content') {
      blocks.push({ id, type: 'content', value: content });
    } else if (header.startsWith('image_block')) {
      let caption = '';
      const captionMatch = header.match(/caption:([^ ]+)/);
      if (captionMatch) caption = decodeURIComponent(captionMatch[1]);
      const srcMatch = content.match(/src="([^"]+)"/);
      blocks.push({ id, type: 'image_block', value: srcMatch ? srcMatch[1] : '', caption });
    } else if (header.startsWith('code_block')) {
      let language = 'javascript';
      const langMatch = header.match(/language:([^ ]+)/);
      if (langMatch) language = langMatch[1];
      const codeMatch = content.match(/<code[^>]*>([\s\S]*?)<\/code>/);
      blocks.push({ id, type: 'code_block', value: codeMatch ? codeMatch[1] : '', language });
    }
  }
  return blocks;
};
