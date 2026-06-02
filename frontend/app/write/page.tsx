'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import ProfileDropdown from '@/components/layout/ProfileDropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Dynamically import TipTap editor (it uses browser APIs)
const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant text-sm">
      Loading editor…
    </div>
  ),
});

const CATEGORIES = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'System Design',
  'DevOps',
  'Databases',
  'Cloud & AWS',
  'Security',
  'Algorithms & DSA',
  'Career & Growth',
  'Open Source',
  'Other',
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

type MetadataBlockType = 'category' | 'coverImage' | 'excerpt' | 'keywords';

interface CanvasBlock {
  id: string;
  type: 'content' | 'image_block' | 'code_block';
  value: string;
  caption?: string; // only for image_block
  language?: string; // only for code_block
}

// ─── Dual Input Image Uploader Component ─────────────────────────────────────
function DualImageUploader({
  value,
  onChange,
  token,
  label
}: {
  value: string;
  onChange: (url: string) => void;
  token: string | null;
  label: string;
}) {
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>(value && !value.includes('cloudinary') ? 'url' : 'file');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('taskType', 'blog_images');

    try {
      const res = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        onChange(data.url);
      } else {
        setUploadError(data.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error(err);
      setUploadError('Failed to connect to backend upload portal.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`px-3 py-1.5 text-[11px] rounded-full border font-label-caps transition-all cursor-pointer ${
            uploadMode === 'file'
              ? 'bg-primary/10 border-primary/30 text-primary font-bold'
              : 'border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Upload Local File
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`px-3 py-1.5 text-[11px] rounded-full border font-label-caps transition-all cursor-pointer ${
            uploadMode === 'url'
              ? 'bg-primary/10 border-primary/30 text-primary font-bold'
              : 'border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Paste Image URL
        </button>
      </div>

      {uploadMode === 'url' ? (
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a direct image URL (e.g. https://unsplash.com/...)"
            className="bg-surface-container-lowest border-outline-variant/40 font-body-md pr-10 h-11 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">link</span>
        </div>
      ) : (
        <div className="border border-dashed border-outline-variant/50 hover:border-primary/50 rounded-xl p-6 bg-surface-container-lowest flex flex-col items-center justify-center relative cursor-pointer transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
              <span className="text-xs text-on-surface-variant font-medium">Saving to Cloudinary...</span>
            </div>
          ) : value ? (
            <div className="text-center space-y-1">
              <span className="material-symbols-outlined text-[28px] text-primary">cloud_done</span>
              <p className="text-xs text-primary font-semibold">Uploaded Successfully!</p>
              <p className="text-[9px] text-on-surface-variant/80 truncate max-w-xs px-4 mx-auto">{value}</p>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <span className="material-symbols-outlined text-[28px] text-outline-variant">cloud_upload</span>
              <p className="text-xs font-semibold text-on-surface">Click or drag local file to upload</p>
              <p className="text-[10px] text-on-surface-variant/60">Supports PNG, JPG, JPEG up to 5MB</p>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-error text-xs font-medium mt-1">{uploadError}</p>
      )}

      {value && (
        <div className="aspect-video rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container relative group">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Write Page Component ───────────────────────────────────────────────
export default function WritePage() {
  const { user, accessToken, refreshUser } = useAuth();
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Form State ──
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/posts/categories`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategoriesList(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [keywords, setKeywords] = useState('');

  // ── Canvas Dynamic Blocks State ──
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);

  // ── Active Metadata Blocks State ──
  const [activeBlocks, setActiveBlocks] = useState<MetadataBlockType[]>([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ── Publish States ──
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);
  const [showPreview, setShowPreview] = useState(false);
  const [createdPost, setCreatedPost] = useState<any>(null);

  // ── Auto-Save and Draft States ──
  const [postId, setPostId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'offline_saved' | 'error'>('idle');
  const [showManualSavedTick, setShowManualSavedTick] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const lastSavedRef = useRef<string>('');
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreMenu]);

  // ── HTML Compiler & Reconstructor Utilities ──
  const compileCanvasBlocks = (blocks: CanvasBlock[]): string => {
    return blocks
      .map((block) => {
        if (block.type === 'content') {
          return `<!-- block:content -->\n${block.value}`;
        }
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

  const parseHtmlToBlocks = (html: string): CanvasBlock[] => {
    if (!html) return [];
    
    // Backwards compatibility: load legacy posts directly inside a single Rich Editor
    if (!html.includes('<!-- block:')) {
      return [{ id: `content_${Math.random().toString(36).slice(2, 9)}`, type: 'content', value: html }];
    }

    const blocks: CanvasBlock[] = [];
    const parts = html.split('<!-- block:');
    
    if (parts[0].trim()) {
      blocks.push({
        id: `content_${Math.random().toString(36).slice(2, 9)}`,
        type: 'content',
        value: parts[0].trim()
      });
    }

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const closeCommentIdx = part.indexOf('-->');
      if (closeCommentIdx === -1) continue;

      const header = part.slice(0, closeCommentIdx).trim();
      let content = part.slice(closeCommentIdx + 3).trim();

      const id = `${header.split(' ')[0]}_${Math.random().toString(36).slice(2, 9)}`;

      if (header === 'content') {
        blocks.push({
          id,
          type: 'content',
          value: content
        });
      } else if (header.startsWith('image_block')) {
        let caption = '';
        const captionMatch = header.match(/caption:([^ ]+)/);
        if (captionMatch) {
          caption = decodeURIComponent(captionMatch[1]);
        }

        const srcMatch = content.match(/src="([^"]+)"/);
        const src = srcMatch ? srcMatch[1] : '';

        blocks.push({
          id,
          type: 'image_block',
          value: src,
          caption
        });
      } else if (header.startsWith('code_block')) {
        let language = 'javascript';
        const langMatch = header.match(/language:([^ ]+)/);
        if (langMatch) {
          language = langMatch[1];
        }

        const codeMatch = content.match(/<code[^>]*>([\s\S]*?)<\/code>/);
        const codeText = codeMatch ? codeMatch[1] : '';

        blocks.push({
          id,
          type: 'code_block',
          value: codeText,
          language
        });
      }
    }

    return blocks;
  };

  // ── Database Fetch Draft Routine ──
  const fetchPostFromDatabase = async (id: string) => {
    if (!accessToken) return;
    setSyncStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const resData = await res.json();

      if (resData.success) {
        const post = resData.data;
        setPostId(post._id);
        setTitle(post.title || '');
        setCategory(post.category === 'Other' ? '' : (post.category || ''));
        setCoverImage(post.coverImage || '');
        setExcerpt(post.excerpt === 'Draft excerpt...' ? '' : (post.excerpt || ''));
        setKeywords(post.seoKeywords || '');
        
        // Dynamic block restoration
        const parsed = parseHtmlToBlocks(post.htmlContent || '');
        setCanvasBlocks(parsed);
        
        const metadataBlocks: MetadataBlockType[] = [];
        if (post.category && post.category !== 'Other') metadataBlocks.push('category');
        if (post.coverImage) metadataBlocks.push('coverImage');
        if (post.excerpt && post.excerpt !== 'Draft excerpt...') metadataBlocks.push('excerpt');
        if (post.seoKeywords) metadataBlocks.push('keywords');
        setActiveBlocks(metadataBlocks);

        lastSavedRef.current = JSON.stringify({
          title: post.title || '',
          category: post.category || '',
          coverImage: post.coverImage || '',
          excerpt: post.excerpt || '',
          keywords: post.seoKeywords || '',
          content: post.htmlContent || '',
        });
        setSyncStatus('saved');
      } else {
        setErrors({ submit: resData.message || 'Failed to load article draft.' });
        setSyncStatus('error');
      }
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Failed to connect to backend server. Draft could not be loaded.' });
      setSyncStatus('error');
    }
  };

  // Load draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      
      if (id) {
        if (accessToken) {
          fetchPostFromDatabase(id);
        }
      } else {
        const savedDraft = localStorage.getItem('writen_offline_draft');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.title || draft.content) {
              const confirmRestore = window.confirm('We found an unsaved draft in your browser. Would you like to restore it?');
              if (confirmRestore) {
                setPostId(draft.postId ?? null);
                setTitle(draft.title ?? '');
                setCategory(draft.category ?? '');
                setCoverImage(draft.coverImage ?? '');
                setExcerpt(draft.excerpt ?? '');
                setKeywords(draft.keywords ?? '');
                
                if (draft.canvasBlocks) {
                  setCanvasBlocks(draft.canvasBlocks);
                } else if (draft.content) {
                  setCanvasBlocks([{ id: 'restored_content_block', type: 'content', value: draft.content }]);
                }
                
                setActiveBlocks(draft.activeBlocks ?? []);
                lastSavedRef.current = JSON.stringify({
                  title: draft.title,
                  category: draft.category,
                  coverImage: draft.coverImage,
                  excerpt: draft.excerpt,
                  keywords: draft.keywords,
                  content: draft.content,
                });
                setSyncStatus('saved');
              } else {
                localStorage.removeItem('writen_offline_draft');
              }
            }
          } catch (e) {
            console.error('Error restoring draft:', e);
          }
        }
      }
    }
  }, [accessToken]);

  // Auto-generated slug
  const slug = useMemo(() => slugify(title), [title]);

  // Keyword chips
  const keywordChips = useMemo(
    () => keywords.split(',').map(k => k.trim()).filter(Boolean),
    [keywords]
  );

  // Dynamic Reading time calculator across all visual canvas blocks
  const readingTime = useMemo(() => {
    const htmlStr = compileCanvasBlocks(canvasBlocks);
    const text = htmlStr.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [canvasBlocks]);

  const isWorkspaceCompletelyEmpty = (): boolean => {
    const htmlStr = compileCanvasBlocks(canvasBlocks);
    const textOnly = htmlStr.replace(/<[^>]*>/g, '').trim();
    const hasAnyBlockContent = canvasBlocks.some(b => {
      if (b.type === 'content' && b.value.replace(/<[^>]*>/g, '').trim()) return true;
      if (b.type === 'image_block' && b.value.trim()) return true;
      if (b.type === 'code_block' && b.value.trim()) return true;
      return false;
    });

    return (
      !title.trim() &&
      !coverImage.trim() &&
      !excerpt.trim() &&
      !keywords.trim() &&
      (!category.trim() || category === 'Other') &&
      !hasAnyBlockContent
    );
  };

  // ── Canvas Dynamic Blocks Handlers ──
  const addCanvasBlock = (type: 'content' | 'image_block' | 'code_block') => {
    const newBlock: CanvasBlock = {
      id: `${type}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      value: '',
      caption: '',
      language: 'javascript'
    };
    setCanvasBlocks([...canvasBlocks, newBlock]);
    setShowToolbar(false);
  };

  const deleteCanvasBlock = (id: string) => {
    setCanvasBlocks(canvasBlocks.filter(b => b.id !== id));
  };

  const updateCanvasBlock = (id: string, updates: Partial<CanvasBlock>) => {
    setCanvasBlocks(canvasBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const moveCanvasBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...canvasBlocks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    setCanvasBlocks(newBlocks);
  };

  // ── Metadata Blocks Handlers ──
  const handleMetadataBlockAction = (blockType: MetadataBlockType) => {
    if (activeBlocks.includes(blockType)) {
      setShowToolbar(false);
      const el = document.getElementById(`block-card-${blockType}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary/45');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary/45'), 1500);
      }
      const inputEl = document.getElementById(`input-${blockType}`);
      if (inputEl) inputEl.focus();
      return;
    }

    setActiveBlocks([...activeBlocks, blockType]);
    setShowToolbar(false);
    
    if (errors[`block_${blockType}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`block_${blockType}`];
        return next;
      });
    }

    setTimeout(() => {
      const el = document.getElementById(`input-${blockType}`);
      if (el) el.focus();
    }, 100);
  };

  const deleteMetadataBlock = (blockType: MetadataBlockType) => {
    setActiveBlocks(activeBlocks.filter(b => b !== blockType));
    setErrors(prev => {
      const next = { ...prev };
      delete next[blockType];
      delete next[`block_${blockType}`];
      return next;
    });
  };

  // ── Dynamic Validations ──
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    const requiredMetadata: MetadataBlockType[] = ['category', 'coverImage', 'excerpt', 'keywords'];
    requiredMetadata.forEach(req => {
      if (!activeBlocks.includes(req)) {
        newErrors[`block_${req}`] = `This workspace requires the ${req.replace(/([A-Z])/g, ' $1')} block to be configured.`;
      }
    });

    if (activeBlocks.includes('category')) {
      if (!category) newErrors.category = 'Please select a category';
    }
    
    if (activeBlocks.includes('coverImage')) {
      if (!coverImage.trim()) {
        newErrors.coverImage = 'Cover image URL is required';
      }
    }
    
    if (activeBlocks.includes('excerpt')) {
      if (!excerpt.trim()) {
        newErrors.excerpt = 'Excerpt is required';
      } else if (excerpt.trim().length > 500) {
        newErrors.excerpt = 'Excerpt cannot exceed 500 characters';
      }
    }
    
    if (activeBlocks.includes('keywords')) {
      if (!keywords.trim()) newErrors.keywords = 'SEO keywords are required';
    }
    
    // Canvas Content validations
    const compiledContent = compileCanvasBlocks(canvasBlocks);
    const textOnly = compiledContent.replace(/<[^>]*>/g, '').trim();
    if (!textOnly) {
      newErrors.canvas = 'Writing canvas content is required. Please type some stories!';
    } else if (textOnly.length < 15) {
      newErrors.canvas = 'Your canvas stories are too short (must be at least 15 characters)';
    }

    // Inline image block validations
    canvasBlocks.forEach((block, idx) => {
      if (block.type === 'image_block' && !block.value.trim()) {
        newErrors[`block_${block.id}`] = `Inline Image Block #${idx + 1} has no image uploaded or configured.`;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.title) {
        titleInputRef.current?.focus();
      } else if (newErrors.canvas) {
        const firstCanvasEl = document.getElementById('canvas-container');
        if (firstCanvasEl) firstCanvasEl.scrollIntoView({ behavior: 'smooth' });
      }
      return false;
    }
    return true;
  };

  // ── API Publish Hook ──
  const handlePublish = async () => {
    if (publishingRef.current) return;
    if (!validate()) return;
    publishingRef.current = true;
    setPublishing(true);
    setSyncStatus('saving');

    const compiledContent = compileCanvasBlocks(canvasBlocks);

    try {
      const url = postId ? `${API_BASE}/posts/${postId}` : `${API_BASE}/posts`;
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          htmlContent: compiledContent,
          category,
          excerpt,
          coverImage,
          seoKeywords: keywords,
          status: 'PUBLISHED',
        }),
      });

      const resData = await res.json();

      if (resData.success) {
        setCreatedPost(resData.data);
        setShowPreview(true);
        setSyncStatus('saved');
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('writen_offline_draft');
        }

        if (resData.roleUpgraded) {
          await refreshUser();
        }
      } else {
        setSyncStatus('error');
        if (resData.errors && Array.isArray(resData.errors)) {
          const newErrors: Record<string, string> = {};
          resData.errors.forEach((err: any) => {
            newErrors[err.field] = err.message;
          });
          setErrors(newErrors);
        } else {
          setErrors({ submit: resData.message || 'Failed to publish post.' });
        }
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setErrors({ submit: 'An unexpected connection error occurred. Make sure the backend server is running.' });
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  // ── Auto-Save Draft Handler ──
  const autoSaveDraft = async () => {
    if (publishingRef.current) return;
    if (!postId && isWorkspaceCompletelyEmpty()) return;

    const compiledContent = compileCanvasBlocks(canvasBlocks);
    const currentPayload = JSON.stringify({
      title,
      category,
      coverImage,
      excerpt,
      keywords,
      content: compiledContent,
    });
    
    if (currentPayload === lastSavedRef.current) return;

    setSyncStatus('saving');

    const payload = {
      title: title.trim() || 'Untitled Draft',
      htmlContent: compiledContent,
      category: category || 'Other',
      excerpt: excerpt || 'Draft excerpt...',
      coverImage: coverImage,
      seoKeywords: keywords,
      status: 'DRAFT',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('writen_offline_draft', JSON.stringify({
        postId,
        title,
        category,
        coverImage,
        excerpt,
        keywords,
        canvasBlocks,
        activeBlocks,
      }));
    }

    try {
      const url = postId ? `${API_BASE}/posts/${postId}` : `${API_BASE}/posts`;
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (resData.success) {
        if (!postId && resData.data?._id) {
          setPostId(resData.data._id);
        }
        lastSavedRef.current = currentPayload;
        setSyncStatus('saved');
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('writen_offline_draft', JSON.stringify({
            postId: resData.data?._id || postId,
            title,
            category,
            coverImage,
            excerpt,
            keywords,
            canvasBlocks,
            activeBlocks,
          }));
        }
      } else {
        setSyncStatus('offline_saved');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('offline_saved');
    }
  };

  // ── Manual Save Draft Trigger ──
  const handleSaveDraft = async () => {
    if (syncStatus === 'saving') return;
    if (!postId && isWorkspaceCompletelyEmpty()) return;
    setSyncStatus('saving');

    const compiledContent = compileCanvasBlocks(canvasBlocks);
    const currentPayload = JSON.stringify({
      title,
      category,
      coverImage,
      excerpt,
      keywords,
      content: compiledContent,
    });

    const payload = {
      title: title.trim() || 'Untitled Draft',
      htmlContent: compiledContent,
      category: category || 'Other',
      excerpt: excerpt || 'Draft excerpt...',
      coverImage: coverImage,
      seoKeywords: keywords,
      status: 'DRAFT',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('writen_offline_draft', JSON.stringify({
        postId,
        title,
        category,
        coverImage,
        excerpt,
        keywords,
        canvasBlocks,
        activeBlocks,
      }));
    }

    try {
      const url = postId ? `${API_BASE}/posts/${postId}` : `${API_BASE}/posts`;
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (resData.success) {
        if (!postId && resData.data?._id) {
          setPostId(resData.data._id);
        }
        lastSavedRef.current = currentPayload;
        setSyncStatus('saved');
        setShowManualSavedTick(true);
        setTimeout(() => {
          setShowManualSavedTick(false);
        }, 2000);
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('offline_saved');
      setShowManualSavedTick(true);
      setTimeout(() => {
        setShowManualSavedTick(false);
      }, 2000);
    }
  };

  // ── Auto-Save Effect Watcher ──
  useEffect(() => {
    if (publishing) return;
    if (!postId && isWorkspaceCompletelyEmpty()) return;

    const timer = setTimeout(() => {
      autoSaveDraft();
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, category, coverImage, excerpt, keywords, canvasBlocks, publishing, postId]);

  const insertOptions = [
    { type: 'category' as any, icon: 'category', label: 'Category Picker', category: 'metadata' },
    { type: 'coverImage' as any, icon: 'image', label: 'Featured Cover', category: 'metadata' },
    { type: 'excerpt' as any, icon: 'description', label: 'Short Excerpt', category: 'metadata' },
    { type: 'keywords' as any, icon: 'tag', label: 'SEO Keywords', category: 'metadata' },
    { type: 'content' as any, icon: 'edit_note', label: 'Rich Editor', category: 'canvas' },
    { type: 'image_block' as any, icon: 'add_photo_alternate', label: 'Inline Image', category: 'canvas' },
    { type: 'code_block' as any, icon: 'code_blocks', label: 'Code Snippet', category: 'canvas' },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface relative pb-32">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/feed" className="font-headline-lg text-xl font-bold text-on-surface tracking-tight hover:opacity-90">
            Writen
          </Link>
          
          {syncStatus === 'idle' && (
            <span className="font-label-caps text-xs text-on-surface-variant px-2.5 py-0.5 bg-surface-container rounded-md border border-outline-variant/10 select-none">
              Draft
            </span>
          )}
          {syncStatus === 'saving' && (
            <span className="font-label-caps text-xs text-on-surface-variant/80 px-2.5 py-0.5 bg-surface-container rounded-md border border-outline-variant/10 select-none flex items-center gap-1.5 animate-pulse">
              <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
              Saving...
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="font-label-caps text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20 select-none flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[15px]">cloud_done</span>
              Saved to cloud
            </span>
          )}
          {syncStatus === 'offline_saved' && (
            <span className="font-label-caps text-xs text-tertiary bg-tertiary/10 px-2.5 py-0.5 rounded-md border border-tertiary/20 select-none flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[15px]">offline_pin</span>
              Saved locally (offline)
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="font-label-caps text-xs text-error bg-error/10 px-2.5 py-0.5 rounded-md border border-error/20 select-none flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              Save failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-primary text-on-primary font-label-caps text-xs px-5 py-2 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 shadow-sm font-semibold animate-none cursor-pointer"
          >
            {publishing ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : null}
            Publish
          </button>
          
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer active:scale-95"
              title="More Actions"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-11 w-48 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 animate-none">
                <Link
                  href="/feed"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">home</span>
                  Home
                </Link>
                
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleSaveDraft();
                  }}
                  disabled={syncStatus === 'saving' || publishing}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer w-full text-left disabled:opacity-60 focus:outline-none"
                >
                  {syncStatus === 'saving' ? (
                    <span className="material-symbols-outlined animate-spin text-[18px] text-on-surface-variant/70">progress_activity</span>
                  ) : showManualSavedTick ? (
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant/70">save</span>
                  )}
                  <span>
                    {syncStatus === 'saving' 
                      ? 'Saving...' 
                      : showManualSavedTick 
                        ? 'Saved!' 
                        : 'Save Draft'}
                  </span>
                </button>
              </div>
            )}
          </div>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          {user && <ProfileDropdown />}
        </div>
      </header>

      {/* ── Main Canvas ── */}
      <main className="flex-1 max-w-[720px] w-full mx-auto px-6 py-12 flex flex-col relative">
        {errors.submit && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
            <p className="text-sm text-error font-medium">{errors.submit}</p>
          </div>
        )}

        {/* Title Input Block */}
        <div className="mb-4">
          <input
            ref={titleInputRef}
            type="text"
            id="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent font-headline-lg text-4xl md:text-5xl font-bold text-on-surface placeholder:text-outline-variant/40 outline-none border-none leading-tight py-2 font-display-xl"
          />
          {slug && (
            <p className="font-code-sm text-xs text-on-surface-variant/80 mt-1 flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-[14px] text-primary">link</span>
              writen.com/blog/<span className="text-primary font-medium">{slug}</span>
            </p>
          )}
          {errors.title && <p className="text-error text-xs font-medium mt-1">{errors.title}</p>}
        </div>

        {/* ── metadata configurations list ── */}
        <div className="space-y-6 mb-8">
          {activeBlocks.map((block) => {
            let blockIcon = 'circle';
            let blockLabel = 'Block';
            let blockContent = null;

            if (block === 'category') {
              blockIcon = 'category';
              blockLabel = 'Category Picker';
              blockContent = (
                <div className="space-y-2">
                  <Select value={category} onValueChange={(v) => { setCategory(v ?? ''); if (errors.category) setErrors(prev => ({ ...prev, category: '' })); }}>
                    <SelectTrigger id="input-category" className="bg-surface-container-lowest border-outline-variant/40 font-body-md focus:border-primary focus:ring-1 focus:ring-primary h-11 rounded-lg">
                      <SelectValue placeholder="Choose a technical category for this post" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-error text-xs font-medium mt-1">{errors.category}</p>}
                </div>
              );
            } else if (block === 'coverImage') {
              blockIcon = 'image';
              blockLabel = 'Featured Cover Image (Upload or Pasted URL)';
              blockContent = (
                <DualImageUploader
                  value={coverImage}
                  onChange={(url) => { setCoverImage(url); if (errors.coverImage) setErrors(prev => ({ ...prev, coverImage: '' })); }}
                  token={accessToken}
                  label="Featured Cover Preview"
                />
              );
            } else if (block === 'excerpt') {
              blockIcon = 'description';
              blockLabel = 'Excerpt / Summary';
              blockContent = (
                <div className="space-y-2">
                  <Textarea
                    id="input-excerpt"
                    value={excerpt}
                    onChange={(e) => { setExcerpt(e.target.value); if (errors.excerpt) setErrors(prev => ({ ...prev, excerpt: '' })); }}
                    placeholder="Provide a concise summary description that will populate the post's SEO meta tags..."
                    className="bg-surface-container-lowest border-outline-variant/40 font-body-md resize-none rounded-lg focus:border-primary focus:ring-1 focus:ring-primary p-3"
                    rows={3}
                    maxLength={300}
                  />
                  <div className="flex justify-between items-center text-xs text-on-surface-variant/80 font-body-md mt-1">
                    {errors.excerpt ? (
                      <p className="text-error font-medium">{errors.excerpt}</p>
                    ) : (
                      <span className="invisible" />
                    )}
                    <span className={excerpt.length >= 285 ? 'text-error font-bold font-mono' : 'font-mono'}>{excerpt.length}/300</span>
                  </div>
                </div>
              );
            } else if (block === 'keywords') {
              blockIcon = 'tag';
              blockLabel = 'SEO Keywords';
              blockContent = (
                <div className="space-y-2">
                  <Input
                    id="input-keywords"
                    value={keywords}
                    onChange={(e) => { setKeywords(e.target.value); if (errors.keywords) setErrors(prev => ({ ...prev, keywords: '' })); }}
                    placeholder="Enter comma-separated SEO keyword tags (e.g. react, design-systems, nextjs)..."
                    className="bg-surface-container-lowest border-outline-variant/40 font-body-md h-11 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.keywords && <p className="text-error text-xs font-medium">{errors.keywords}</p>}
                  
                  {keywordChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {keywordChips.map((chip, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] rounded-full font-label-caps border border-primary/20 flex items-center gap-0.5 font-medium"
                        >
                          <span className="text-[10px] text-primary/70">#</span>
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div 
                key={block}
                id={`block-card-${block}`}
                className="relative group/block border border-outline-variant/15 hover:border-outline-variant/35 rounded-xl p-5 transition-all duration-300 bg-surface-container-lowest/40 hover:bg-surface-container-lowest shadow-sm animate-none"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/10 opacity-70 group-hover/block:opacity-100 transition-opacity">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-primary">{blockIcon}</span>
                    {blockLabel}
                  </span>
                  <button
                    onClick={() => deleteMetadataBlock(block)}
                    className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all opacity-0 group-hover/block:opacity-100 active:scale-90 cursor-pointer"
                    title={`Delete ${blockLabel}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
                {blockContent}
              </div>
            );
          })}
        </div>

        {/* ── DYNAMIC CONTENT CANVAS BLOCKS (Notion-Style reorderable canvas) ── */}
        <div id="canvas-container" className="space-y-6">
          {errors.canvas && <p className="text-error text-xs font-semibold pb-2">{errors.canvas}</p>}

          {canvasBlocks.map((block, index) => {
              let blockIcon = 'edit_note';
              let blockLabel = 'Rich Text Editor';
              let blockContent = null;

            if (block.type === 'content') {
              blockIcon = 'edit_note';
              blockLabel = `Rich Editor Block #${index + 1}`;
              blockContent = (
                <div className="min-h-[40vh]">
                  <RichEditor
                    content={block.value}
                    onChange={(val) => updateCanvasBlock(block.id, { value: val })}
                  />
                </div>
              );
            } else if (block.type === 'image_block') {
              blockIcon = 'add_photo_alternate';
              blockLabel = `Inline Image Block #${index + 1}`;
              blockContent = (
                <div className="space-y-4">
                  {errors[`block_${block.id}`] && (
                    <p className="text-error text-xs font-semibold">{errors[`block_${block.id}`]}</p>
                  )}
                  
                  {/* Reuse of reusable dual-uploader */}
                  <DualImageUploader
                    value={block.value}
                    onChange={(url) => updateCanvasBlock(block.id, { value: url })}
                    token={accessToken}
                    label={`Inline Image #${index + 1}`}
                  />
                  
                  <div className="space-y-1 pt-1">
                    <Label htmlFor={`caption-${block.id}`} className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block">Image Caption (Optional)</Label>
                    <Input
                      id={`caption-${block.id}`}
                      value={block.caption || ''}
                      onChange={(e) => updateCanvasBlock(block.id, { caption: e.target.value })}
                      placeholder="Write description caption for this image..."
                      className="bg-surface-container-lowest border-outline-variant/40 font-body-md h-10 rounded-lg focus:border-primary"
                    />
                  </div>
                </div>
              );
            } else if (block.type === 'code_block') {
              blockIcon = 'code_blocks';
              blockLabel = `Code Editor Block #${index + 1}`;
              blockContent = (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold">Language:</span>
                    <select
                      value={block.language || 'javascript'}
                      onChange={(e) => updateCanvasBlock(block.id, { language: e.target.value })}
                      className="bg-surface-container-lowest border border-outline-variant/40 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-primary font-medium"
                    >
                      {['javascript', 'typescript', 'html', 'css', 'python', 'java', 'cpp', 'rust', 'go', 'bash', 'json', 'sql'].map(lang => (
                        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  <textarea
                    value={block.value}
                    onChange={(e) => updateCanvasBlock(block.id, { value: e.target.value })}
                    placeholder="Paste or write your code snippet here..."
                    rows={8}
                    className="w-full bg-surface-container-low font-mono text-sm p-4 rounded-lg focus:outline-none border border-outline-variant/30 focus:border-primary/50 text-on-surface leading-relaxed resize-y"
                  />
                </div>
              );
            }

            return (
              <div 
                key={block.id}
                className="relative group/block border border-outline-variant/15 hover:border-outline-variant/35 rounded-xl p-5 transition-all duration-300 bg-surface-container-lowest/40 hover:bg-surface-container-lowest shadow-sm"
              >
                {/* Block Canvas Header Actions toolbar */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/10 opacity-70 group-hover/block:opacity-100 transition-opacity">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 font-semibold select-none">
                    <span className="material-symbols-outlined text-[15px] text-primary">{blockIcon}</span>
                    {blockLabel}
                  </span>
                  
                  <div className="flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveCanvasBlock(index, 'up')}
                      className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all disabled:opacity-30 cursor-pointer"
                      title="Move Block Up"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === canvasBlocks.length - 1}
                      onClick={() => moveCanvasBlock(index, 'down')}
                      className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all disabled:opacity-30 cursor-pointer"
                      title="Move Block Down"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCanvasBlock(block.id)}
                      className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all cursor-pointer"
                      title="Delete Block"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
                
                {blockContent}
              </div>
            );
          })}
        </div>

        {/* ── Block Addition Insert Bar (Clean Left Gutter Alignment) ── */}
        <div className="flex items-center gap-4 relative py-8 -ml-[44px] md:-ml-[48px] -ml-[8px] z-30">
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            title={showToolbar ? "Close options" : "Add block"}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95 shrink-0 z-10 cursor-pointer ${
              showToolbar 
                ? 'rotate-45 bg-surface-container border-outline text-on-surface' 
                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">add</span>
          </button>

          <div
            className={`flex items-center gap-2.5 transition-all duration-300 origin-left ${
              showToolbar ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
            }`}
          >
            {insertOptions.map((opt) => {
              const isMetadata = opt.category === 'metadata';
              const isAdded = isMetadata ? activeBlocks.includes(opt.type) : false;

              return (
                <div key={opt.type} className="relative group">
                  <button
                    onClick={() => {
                      if (isMetadata) {
                        handleMetadataBlockAction(opt.type);
                      } else {
                        addCanvasBlock(opt.type);
                      }
                    }}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer ${
                      isAdded 
                        ? 'border-primary/45 bg-primary/5 text-primary' 
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  </button>
                  
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all pointer-events-none z-50 animate-none">
                    <div className="bg-inverse-surface text-inverse-on-surface font-label-caps text-[10px] tracking-wider px-2.5 py-1 rounded shadow-md whitespace-nowrap uppercase">
                      {opt.label} {isAdded ? '(Added)' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {Object.keys(errors).some(k => k.startsWith('block_')) && (
          <div className="my-6 p-4 bg-error-container/20 border border-error/20 rounded-xl space-y-2">
            <p className="text-xs uppercase font-label-caps text-error tracking-wider font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Missing or Invalid Elements
            </p>
            <ul className="text-xs text-on-surface-variant space-y-1 pl-4 list-disc font-body-md">
              {Object.keys(errors).map((k) => {
                if (k.startsWith('block_')) {
                  return <li key={k} className="text-error/90 font-medium">{errors[k]}</li>;
                }
                return null;
              })}
            </ul>
          </div>
        )}

      </main>

      {/* ───🚀 FULL SCREEN DYNAMIC PREVIEW OVERLAY ─── */}
      {showPreview && createdPost && (
        <div className="fixed inset-0 z-[100] bg-surface overflow-y-auto flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-300">
          <header className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center z-10 w-full">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
              <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Story Reader Preview</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="font-label-caps text-xs text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-all cursor-pointer"
              >
                Go Back & Edit
              </button>
              <button
                onClick={() => router.push('/feed')}
                className="bg-primary text-on-primary font-label-caps text-xs px-6 py-2.5 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 shadow-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                Finish & Exit
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </header>

          <article className="max-w-[720px] w-full mx-auto px-6 py-12 flex flex-col">
            {category && (
              <div className="mb-4">
                <span className="px-3.5 py-1 bg-primary/10 text-primary text-xs font-label-caps border border-primary/20 rounded-full font-semibold">
                  {category}
                </span>
              </div>
            )}

            <h1 className="font-display-xl text-4xl md:text-5xl font-bold text-on-surface leading-tight mb-6">
              {title}
            </h1>

            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-outline-variant/15">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-label-caps text-on-surface text-sm">{user?.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-body-md text-sm font-bold text-on-surface">{user?.name || 'Anonymous Author'}</p>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-body-md mt-0.5">
                  <span>Published Today</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px]">schedule</span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {excerpt && (
              <div className="mb-8 p-5 bg-surface-container-low border-l-4 border-primary rounded-r-xl italic font-serif text-on-surface-variant text-base leading-relaxed">
                "{excerpt}"
              </div>
            )}

            {coverImage && (
              <div className="mb-10 aspect-video rounded-xl overflow-hidden border border-outline-variant/20 shadow-md">
                <img
                  src={coverImage}
                  alt="Article Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Compiled HTML preview */}
            <div 
              className="tiptap font-serif leading-relaxed text-on-surface text-lg md:text-xl space-y-6"
              dangerouslySetInnerHTML={{ __html: compileCanvasBlocks(canvasBlocks) }}
            />

            {keywordChips.length > 0 && (
              <div className="mt-12 pt-6 border-t border-outline-variant/15 flex flex-wrap gap-2">
                {keywordChips.map((chip, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-xs rounded-full font-label-caps border border-outline-variant/20 flex items-center gap-0.5 font-medium"
                  >
                    <span className="text-[10px] text-on-surface-variant/70">#</span>
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
