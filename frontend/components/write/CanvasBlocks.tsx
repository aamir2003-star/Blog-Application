'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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
import { apiClient } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant text-sm">
      Loading editor…
    </div>
  ),
});

export type MetadataBlockType = 'category' | 'coverImage' | 'excerpt' | 'keywords';

export interface CanvasBlock {
  id: string;
  type: 'content' | 'image_block' | 'code_block';
  value: string;
  caption?: string;
  language?: string;
}

// ─── Dual Image Uploader Component ───
export function DualImageUploader({
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
      const res = await apiClient.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = res.data;
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setUploadError(data.message || 'Image upload failed.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.message || 'Failed to connect to backend upload portal.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`px-3 py-1.5 text-[11px] rounded-full border font-label-caps transition-all cursor-pointer bg-transparent ${
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
          className={`px-3 py-1.5 text-[11px] rounded-full border font-label-caps transition-all cursor-pointer bg-transparent ${
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

// ─── Metadata Card Component ───
interface MetadataBlockCardProps {
  block: MetadataBlockType;
  category: string;
  setCategory: (v: string) => void;
  categoriesList: string[];
  coverImage: string;
  setCoverImage: (v: string) => void;
  accessToken: string | null;
  excerpt: string;
  setExcerpt: (v: string) => void;
  keywords: string;
  setKeywords: (v: string) => void;
  keywordChips: string[];
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onDelete: () => void;
}

export function MetadataBlockCard({
  block,
  category,
  setCategory,
  categoriesList,
  coverImage,
  setCoverImage,
  accessToken,
  excerpt,
  setExcerpt,
  keywords,
  setKeywords,
  keywordChips,
  errors,
  setErrors,
  onDelete,
}: MetadataBlockCardProps) {
  let blockIcon = 'circle';
  let blockLabel = 'Block';
  let blockContent = null;

  if (block === 'category') {
    blockIcon = 'category';
    blockLabel = 'Category Picker';
    blockContent = (
      <div className="space-y-2">
        <Select value={category} onValueChange={(v) => { setCategory(v ?? ''); setErrors(prev => ({ ...prev, category: '' })); }}>
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
        onChange={(url) => { setCoverImage(url); setErrors(prev => ({ ...prev, coverImage: '' })); }}
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
          onChange={(e) => { setExcerpt(e.target.value); setErrors(prev => ({ ...prev, excerpt: '' })); }}
          placeholder="Provide a concise summary description that will populate the post's SEO meta tags..."
          className="bg-surface-container-lowest border-outline-variant/40 font-body-md resize-none rounded-lg focus:border-primary focus:ring-1 focus:ring-primary p-3"
          rows={3}
          maxLength={300}
        />
        <div className="flex justify-between items-center text-xs text-on-surface-variant/80 font-body-md mt-1 select-none">
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
          onChange={(e) => { setKeywords(e.target.value); setErrors(prev => ({ ...prev, keywords: '' })); }}
          placeholder="Enter comma-separated SEO keyword tags (e.g. react, design-systems, nextjs)..."
          className="bg-surface-container-lowest border-outline-variant/40 font-body-md h-11 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.keywords && <p className="text-error text-xs font-medium">{errors.keywords}</p>}
        
        {keywordChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 select-none">
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
      id={`block-card-${block}`}
      className="relative group/block border border-outline-variant/15 hover:border-outline-variant/35 rounded-xl p-5 transition-all duration-300 bg-surface-container-lowest/40 hover:bg-surface-container-lowest shadow-sm animate-none"
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/10 opacity-70 group-hover/block:opacity-100 transition-opacity select-none">
        <span className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 font-semibold">
          <span className="material-symbols-outlined text-[15px] text-primary">{blockIcon}</span>
          {blockLabel}
        </span>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all opacity-0 group-hover/block:opacity-100 active:scale-90 cursor-pointer bg-transparent border-none"
          title={`Delete ${blockLabel}`}
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      {blockContent}
    </div>
  );
}

// ─── Canvas Content Block Component ───
interface CanvasBlockCardProps {
  block: CanvasBlock;
  index: number;
  accessToken: string | null;
  error?: string;
  updateBlock: (updates: Partial<CanvasBlock>) => void;
}

export function CanvasBlockCard({
  block,
  index,
  accessToken,
  error,
  updateBlock,
}: CanvasBlockCardProps) {
  if (block.type === 'content') {
    return (
      <div className="min-h-[40vh]">
        <RichEditor
          content={block.value}
          onChange={(val) => updateBlock({ value: val })}
        />
      </div>
    );
  }

  if (block.type === 'image_block') {
    return (
      <div className="space-y-4">
        {error && (
          <p className="text-error text-xs font-semibold">{error}</p>
        )}
        
        <DualImageUploader
          value={block.value}
          onChange={(url) => updateBlock({ value: url })}
          token={accessToken}
          label={`Inline Image #${index + 1}`}
        />
        
        <div className="space-y-1 pt-1 select-none">
          <Label htmlFor={`caption-${block.id}`} className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold block">Image Caption (Optional)</Label>
          <Input
            id={`caption-${block.id}`}
            value={block.caption || ''}
            onChange={(e) => updateBlock({ caption: e.target.value })}
            placeholder="Write description caption for this image..."
            className="bg-surface-container-lowest border-outline-variant/40 font-body-md h-10 rounded-lg focus:border-primary"
          />
        </div>
      </div>
    );
  }

  if (block.type === 'code_block') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 select-none">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-semibold">Language:</span>
          <select
            value={block.language || 'javascript'}
            onChange={(e) => updateBlock({ language: e.target.value })}
            className="bg-surface-container-lowest border border-outline-variant/40 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-primary font-medium"
          >
            {['javascript', 'typescript', 'html', 'css', 'python', 'java', 'cpp', 'rust', 'go', 'bash', 'json', 'sql'].map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        <textarea
          value={block.value}
          onChange={(e) => updateBlock({ value: e.target.value })}
          placeholder="Paste or write your code snippet here..."
          rows={8}
          className="w-full bg-surface-container-low font-mono text-sm p-4 rounded-lg focus:outline-none border border-outline-variant/30 focus:border-primary/50 text-on-surface leading-relaxed resize-y"
        />
      </div>
    );
  }

  return null;
}
