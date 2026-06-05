'use client';

interface LibraryListsGridProps {
  user: {
    name: string;
  };
  bookmarksCount: number;
  collageCovers: string[];
  activeTab: 'stories' | 'history';
  setActiveTab: (tab: 'stories' | 'history') => void;
  onSelectReadingList: () => void;
}

export default function LibraryListsGrid({
  user,
  bookmarksCount,
  collageCovers,
  activeTab,
  setActiveTab,
  onSelectReadingList,
}: LibraryListsGridProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Horizontal Navigation tabs */}
      <div className="border-b border-outline-variant/30 flex gap-6 text-sm font-medium overflow-x-auto select-none scrollbar-none">
        <button 
          onClick={() => setActiveTab('stories')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-none bg-transparent focus:outline-none ${
            activeTab === 'stories' 
              ? 'border-b-2 border-b-primary text-on-surface' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Stories
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-none bg-transparent focus:outline-none ${
            activeTab === 'history' 
              ? 'border-b-2 border-b-primary text-on-surface' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Reading history
        </button>
      </div>

      {activeTab === 'stories' && (
        <div className="space-y-4">
          {/* The Reading list card trigger */}
          <div 
            onClick={onSelectReadingList}
            className="bg-surface-container-lowest hover:bg-surface-container-low/30 border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm transition-all duration-300 cursor-pointer overflow-hidden group"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-on-surface-variant">{user.name}</span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-on-surface leading-tight tracking-tight group-hover:text-primary transition-colors">
                  Reading list
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium select-none">
                  <span>{bookmarksCount} stories</span>
                </div>
              </div>
            </div>

            {/* Right Cover Collage split container */}
            <div className="w-[180px] h-[100px] rounded-xl overflow-hidden border border-outline-variant/20 flex shrink-0 ml-4 bg-gradient-to-tr from-primary/10 to-tertiary/10 relative select-none">
              {collageCovers.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-outline-variant/60">
                  <span className="material-symbols-outlined text-4xl select-none">bookmark</span>
                </div>
              ) : (
                collageCovers.map((cover, idx) => {
                  let widthStyle = {};
                  if (collageCovers.length === 3) {
                    if (idx === 0) widthStyle = { width: '50%', flexGrow: 0, flexShrink: 0 };
                    else if (idx === 1) widthStyle = { width: '30%', flexGrow: 0, flexShrink: 0 };
                    else if (idx === 2) widthStyle = { width: '20%', flexGrow: 0, flexShrink: 0 };
                  } else if (collageCovers.length === 2) {
                    if (idx === 0) widthStyle = { width: '60%', flexGrow: 0, flexShrink: 0 };
                    else if (idx === 1) widthStyle = { width: '40%', flexGrow: 0, flexShrink: 0 };
                  } else {
                    widthStyle = { width: '100%', flexGrow: 0, flexShrink: 0 };
                  }

                  return (
                    <div 
                      key={idx} 
                      className="h-full border-r border-outline-variant/10 last:border-0 overflow-hidden"
                      style={widthStyle}
                    >
                      <img 
                        src={cover} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt="cover collage" 
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
