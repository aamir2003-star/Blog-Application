'use client';

import { useState } from 'react';
import { CanvasBlock, MetadataBlockType, CanvasBlockCard } from './CanvasBlocks';

interface EditorCanvasProps {
  canvasBlocks: CanvasBlock[];
  activeBlocks: MetadataBlockType[];
  accessToken: string | null;
  errors: Record<string, string>;
  updateCanvasBlock: (id: string, updates: Partial<CanvasBlock>) => void;
  moveCanvasBlock: (index: number, direction: 'up' | 'down') => void;
  deleteCanvasBlock: (id: string) => void;
  onAddCanvasBlock: (type: 'content' | 'image_block' | 'code_block') => void;
  onAddMetadataBlock: (type: MetadataBlockType) => void;
}

export default function EditorCanvas({
  canvasBlocks,
  activeBlocks,
  accessToken,
  errors,
  updateCanvasBlock,
  moveCanvasBlock,
  deleteCanvasBlock,
  onAddCanvasBlock,
  onAddMetadataBlock,
}: EditorCanvasProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const insertOptions = [
    { type: 'category' as const, icon: 'category', label: 'Category Picker', category: 'metadata' },
    { type: 'coverImage' as const, icon: 'image', label: 'Featured Cover', category: 'metadata' },
    { type: 'excerpt' as const, icon: 'description', label: 'Short Excerpt', category: 'metadata' },
    { type: 'keywords' as const, icon: 'tag', label: 'SEO Keywords', category: 'metadata' },
    { type: 'content' as const, icon: 'edit_note', label: 'Rich Editor', category: 'canvas' },
    { type: 'image_block' as const, icon: 'add_photo_alternate', label: 'Inline Image', category: 'canvas' },
    { type: 'code_block' as const, icon: 'code_blocks', label: 'Code Snippet', category: 'canvas' },
  ];

  return (
    <div id="canvas-container" className="space-y-6">
      {errors.canvas && (
        <p className="text-error text-xs font-semibold pb-2 select-none">
          {errors.canvas}
        </p>
      )}

      {canvasBlocks.map((block, index) => {
        let blockIcon = 'edit_note';
        let blockLabel = 'Rich Text Editor';

        if (block.type === 'content') {
          blockIcon = 'edit_note';
          blockLabel = `Rich Editor Block #${index + 1}`;
        } else if (block.type === 'image_block') {
          blockIcon = 'add_photo_alternate';
          blockLabel = `Inline Image Block #${index + 1}`;
        } else if (block.type === 'code_block') {
          blockIcon = 'code_blocks';
          blockLabel = `Code Editor Block #${index + 1}`;
        }

        return (
          <div
            key={block.id}
            className="relative group/block border border-outline-variant/15 hover:border-outline-variant/35 rounded-xl p-5 transition-all duration-300 bg-surface-container-lowest/40 hover:bg-surface-container-lowest shadow-sm"
          >
            {/* Block Canvas Header Actions toolbar */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/10 opacity-70 group-hover/block:opacity-100 transition-opacity select-none">
              <span className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-[15px] text-primary">{blockIcon}</span>
                {blockLabel}
              </span>

              <div className="flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveCanvasBlock(index, 'up')}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all disabled:opacity-30 cursor-pointer bg-transparent border-none"
                  title="Move Block Up"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  disabled={index === canvasBlocks.length - 1}
                  onClick={() => moveCanvasBlock(index, 'down')}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all disabled:opacity-30 cursor-pointer bg-transparent border-none"
                  title="Move Block Down"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteCanvasBlock(block.id)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-error transition-all cursor-pointer bg-transparent border-none"
                  title="Delete Block"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            <CanvasBlockCard
              block={block}
              index={index}
              accessToken={accessToken}
              error={errors[`block_${block.id}`]}
              updateBlock={(updates) => updateCanvasBlock(block.id, updates)}
            />
          </div>
        );
      })}

      {/* ── Block Addition Insert Bar (Clean Left Gutter Alignment) ── */}
      <div className="flex items-center gap-4 relative py-8 -ml-[44px] md:-ml-[48px] -ml-[8px] z-30 select-none">
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          title={showToolbar ? 'Close options' : 'Add block'}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95 shrink-0 z-10 cursor-pointer bg-transparent ${
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
            const isAdded = isMetadata ? activeBlocks.includes(opt.type as MetadataBlockType) : false;

            return (
              <div key={opt.type} className="relative group">
                <button
                  onClick={() => {
                    if (isMetadata) {
                      onAddMetadataBlock(opt.type as MetadataBlockType);
                    } else {
                      onAddCanvasBlock(opt.type as 'content' | 'image_block' | 'code_block');
                    }
                    setShowToolbar(false);
                  }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer bg-transparent ${
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
    </div>
  );
}
