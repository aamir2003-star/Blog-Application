'use client';

import React, { useState } from 'react';

interface PDFDownloadButtonProps {
  post: any;
}

export default function PDFDownloadButton({ post }: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      // Lazy load large PDF compilation packages only when requested by the user
      const { pdf } = await import('@react-pdf/renderer');
      const { ArticlePDFDocument } = await import('./ArticlePDFDocument');
      
      const doc = <ArticlePDFDocument post={post} />;
      const blob = await pdf(doc).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Convert title into a file-friendly slug name
      const filename = post.title
        ? post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : 'article';
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to generate PDF document:', error);
      alert(`Failed to generate PDF copy: ${error?.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer focus:outline-none disabled:opacity-50 select-none border-none bg-transparent ${
        isGenerating ? 'text-primary bg-primary/5 animate-pulse' : 'text-on-surface-variant hover:text-on-surface'
      }`}
      title="Download PDF Copy"
    >
      <span className="material-symbols-outlined text-[18px]">
        {isGenerating ? 'hourglass_empty' : 'download'}
      </span>
      <span className="text-xs font-semibold font-label-caps uppercase tracking-wider">
        {isGenerating ? 'Generating...' : 'PDF'}
      </span>
    </button>
  );
}
