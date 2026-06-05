'use client';

import Link from 'next/link';

function calculateReadingTime(htmlStr: string): number {
  if (!htmlStr) return 1;
  const text = htmlStr.replace(/<\/?[^>]+(>|$)/g, '');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes || 1;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ActivePublicationsTableProps {
  posts: any[];
  loading: boolean;
  togglingId: string | null;
  transitioningDeleteIds: string[];
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDeleteRequest: (post: any) => void;
}

export default function ActivePublicationsTable({
  posts,
  loading,
  togglingId,
  transitioningDeleteIds,
  onToggleStatus,
  onDeleteRequest,
}: ActivePublicationsTableProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-10 select-none">
        <h2 className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
          Your Article Publications ({posts.length})
        </h2>
      </div>

      {/* Table wrapper */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 select-none">
            <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
            <span className="font-label-caps text-xs text-on-surface-variant font-semibold tracking-wider animate-pulse">Syncing database data...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center space-y-3 select-none">
            <span className="material-symbols-outlined text-outline-variant text-[44px]">article</span>
            <p className="font-body-md text-base font-bold text-on-surface-variant">No publications found</p>
            <p className="font-body-md text-xs text-outline leading-relaxed max-w-sm mx-auto">
              You haven't authored any publications yet. Click "Write New Story" above to draft your technical masterpiece!
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10 select-none">
                <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider">Article Title</th>
                <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[120px]">Category</th>
                <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[100px] text-center">Views</th>
                <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[140px]">Last Updated</th>
                <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[130px] text-center">Status</th>
                <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[100px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {posts.map((post) => {
                const isTransitioning = transitioningDeleteIds.includes(post._id);

                return (
                  <tr
                    key={post._id}
                    className={`hover:bg-surface-container-low/20 transition-all duration-500 origin-center ${
                      isTransitioning 
                        ? 'opacity-0 scale-95 max-h-0 py-0 border-none overflow-hidden select-none pointer-events-none bg-error-container/10' 
                        : ''
                    }`}
                  >
                    {/* Column 1: Title & Excerpt */}
                    <td className="px-6 py-4.5 min-w-[320px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-headline-lg text-base font-bold text-on-surface line-clamp-1 hover:text-primary transition-colors leading-tight">
                          {post.title}
                        </span>
                        <span className="font-body-md text-xs text-on-surface-variant line-clamp-1 leading-normal">
                          {post.excerpt || 'No summary description provided.'}
                        </span>
                        
                        {/* Premium Analytics Metadata Row */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px] text-on-surface-variant/80 font-medium select-none">
                          <span className="flex items-center gap-1" title="Total Views">
                            <span className="material-symbols-outlined text-[13px] text-primary">visibility</span>
                            <span>{(post.totalViews ?? post.views ?? 0).toLocaleString()} views</span>
                          </span>
                          <span className="text-outline-variant/40 select-none">•</span>
                          <span className="flex items-center gap-1" title="Unique Visitors">
                            <span className="material-symbols-outlined text-[13px] text-primary">groups</span>
                            <span>{(post.uniqueVisitors ?? 0).toLocaleString()} uniques</span>
                          </span>
                          <span className="text-outline-variant/40 select-none">•</span>
                          <span className="flex items-center gap-1" title="Reads (>=30s spent or >=70% scrolled)">
                            <span className="material-symbols-outlined text-[13px] text-primary">menu_book</span>
                            <span>{(post.reads ?? 0).toLocaleString()} reads</span>
                          </span>
                          <span className="text-outline-variant/40 select-none">•</span>
                          <span className="flex items-center gap-1" title="Read Rate (Reads / Uniques)">
                            <span className="material-symbols-outlined text-[13px] text-primary">analytics</span>
                            <span>{post.uniqueVisitors ? Math.round(((post.reads || 0) / post.uniqueVisitors) * 100) : 0}% read rate</span>
                          </span>
                          <span className="text-outline-variant/40 select-none">•</span>
                          <span className="flex items-center gap-1" title="Estimated Reading Time">
                            <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                            <span>{calculateReadingTime(post.htmlContent)} min read</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Category */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full font-label-caps border border-primary/10 font-bold tracking-wider select-none">
                        {post.category || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Column 3: Views stats */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <span className="font-body-md text-sm text-on-surface-variant font-medium flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-outline-variant select-none">visibility</span>
                        {(post.totalViews ?? post.views ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Column 4: Last Updated */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="font-body-md text-xs text-on-surface-variant font-medium select-none">
                        {formatRelativeTime(post.updatedAt)}
                      </span>
                    </td>

                    {/* Column 5: Status Slider Switch */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onToggleStatus(post._id, post.status)}
                          disabled={togglingId === post._id}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 select-none border-none bg-transparent ${
                            post.status === 'PUBLISHED' ? 'bg-primary' : 'bg-outline-variant/50'
                          }`}
                          title={`Switch to ${post.status === 'PUBLISHED' ? 'Draft' : 'Publish'}`}
                        >
                          <span
                            className={`pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                              post.status === 'PUBLISHED' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          >
                            {togglingId === post._id && (
                              <span className="material-symbols-outlined animate-spin text-[10px] text-primary">progress_activity</span>
                            )}
                          </span>
                        </button>
                        <span
                          className={`font-label-caps text-[10px] uppercase font-bold tracking-wider select-none w-14 text-left ${
                            post.status === 'PUBLISHED' ? 'text-primary' : 'text-on-surface-variant/80'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 select-none">
                        <Link
                          href={`/write?id=${post._id}`}
                          className="p-1.5 hover:bg-surface-container-low text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer active:scale-95"
                          title="Edit publication"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        <button
                          onClick={() => onDeleteRequest(post)}
                          className="p-1.5 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer active:scale-95 border-none bg-transparent"
                          title="Delete publication"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
