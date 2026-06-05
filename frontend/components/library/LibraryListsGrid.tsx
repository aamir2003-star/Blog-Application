'use client';

interface LibraryListsGridProps {
  activeTab: 'stories' | 'history';
  setActiveTab: (tab: 'stories' | 'history') => void;
}

export default function LibraryListsGrid({
  activeTab,
  setActiveTab,
}: LibraryListsGridProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Horizontal Navigation tabs */}
      <div className="border-b border-outline-variant/30 flex gap-6 text-sm font-medium overflow-x-auto select-none scrollbar-none">
        <button 
          onClick={() => setActiveTab('stories')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-none bg-transparent focus:outline-none ${
            activeTab === 'stories' 
              ? 'border-b-2 border-b-primary text-on-surface font-bold' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Bookmarks
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-none bg-transparent focus:outline-none ${
            activeTab === 'history' 
              ? 'border-b-2 border-b-primary text-on-surface font-bold' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Reading history
        </button>
      </div>
    </div>
  );
}
