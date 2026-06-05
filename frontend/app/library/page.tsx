'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import TopNavBar from '@/components/layout/TopNavBar';
import SideNavBar from '@/components/layout/SideNavBar';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryListsGrid from '@/components/library/LibraryListsGrid';
import ReadingListFeed from '@/components/library/ReadingListFeed';
import ReadingHistoryFeed from '@/components/library/ReadingHistoryFeed';
import {
  useBookmarksQuery,
  useToggleBookmarkMutation,
  useUpdateBookmarkNoteMutation,
  useReadingHistoryQuery,
} from '@/hooks/useBookmarks';

export default function LibraryPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── States ──
  const [activeSubMode, setActiveSubMode] = useState<'list' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'stories' | 'history'>('stories');
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  // ── Strict Authentication check ──
  useEffect(() => {
    if (authLoading) return;
    if (user === null) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── React Query Queries & Mutations ──
  const { data: bookmarks = [], isLoading: bookmarksLoading, error: bookmarksError } = useBookmarksQuery(accessToken);
  const { data: historyList = [], isLoading: historyLoading, error: historyError } = useReadingHistoryQuery(accessToken);
  const toggleBookmarkMutation = useToggleBookmarkMutation(accessToken);
  const updateBookmarkNoteMutation = useUpdateBookmarkNoteMutation(accessToken);

  // Initialize note values when bookmarks load
  useEffect(() => {
    if (bookmarks) {
      const initialNotes: Record<string, string> = {};
      bookmarks.forEach((b: any) => {
        if (b.postId) {
          initialNotes[b.postId._id] = b.note || '';
        }
      });
      setNoteValues(initialNotes);
    }
  }, [bookmarks]);

  const handleToggleBookmark = (postId: string) => {
    toggleBookmarkMutation.mutate(postId);
  };

  const handleSaveNote = (postId: string) => {
    const noteText = noteValues[postId] || '';
    updateBookmarkNoteMutation.mutate(
      { postId, note: noteText },
      {
        onSuccess: () => alert('Note saved successfully.'),
        onError: (err: any) => alert(err.message || 'Failed to save note.'),
      }
    );
  };

  const handleNoteChange = (postId: string, val: string) => {
    setNoteValues(prev => ({
      ...prev,
      [postId]: val,
    }));
  };

  // Get cover images for collage (limit to 3)
  const collageCovers = bookmarks
    .map((b: any) => b.postId?.coverImage)
    .filter(Boolean)
    .slice(0, 3);

  const error = bookmarksError?.message || historyError?.message || null;
  const loading = bookmarksLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center select-none">
        <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      <TopNavBar />

      <div className="flex-1 flex w-full">
        <SideNavBar />

        <div className="flex-1 flex justify-center pl-16 pr-6 py-10 md:pl-16 md:pr-8 transition-all duration-[450ms] ease-in-out">
          <main className="flex-1 max-w-[800px] w-full flex flex-col min-h-[calc(100vh-57px)]">
            {error && (
              <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3 select-none">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            {activeSubMode === 'list' ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <LibraryHeader />
                <LibraryListsGrid
                  user={user}
                  bookmarksCount={bookmarks.length}
                  collageCovers={collageCovers}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onSelectReadingList={() => setActiveSubMode('detail')}
                />
                
                {activeTab === 'history' && (
                  <ReadingHistoryFeed
                    user={user}
                    historyList={historyList}
                    loading={historyLoading}
                    inline={true}
                  />
                )}
              </div>
            ) : (
              <ReadingListFeed
                user={user}
                bookmarks={bookmarks}
                onBack={() => setActiveSubMode('list')}
                onRemoveBookmark={handleToggleBookmark}
                noteValues={noteValues}
                onNoteChange={handleNoteChange}
                onSaveNote={handleSaveNote}
                savingNoteId={updateBookmarkNoteMutation.isPending ? updateBookmarkNoteMutation.variables?.postId || null : null}
                togglingId={toggleBookmarkMutation.isPending ? toggleBookmarkMutation.variables || null : null}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
