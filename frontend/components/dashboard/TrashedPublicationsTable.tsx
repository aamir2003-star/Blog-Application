'use client';

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

interface TrashedPublicationsTableProps {
  trashPosts: any[];
  loading: boolean;
  restoringId: string | null;
  onRestore: (id: string) => void;
  onPermanentDeleteRequest: (post: any) => void;
}

export default function TrashedPublicationsTable({
  trashPosts,
  loading,
  restoringId,
  onRestore,
  onPermanentDeleteRequest,
}: TrashedPublicationsTableProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-10 select-none">
        <h2 className="font-label-caps text-[11px] uppercase tracking-wider text-error font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Trash Bin ({trashPosts.length})
        </h2>
      </div>

      {/* Table wrapper */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 select-none">
            <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
            <span className="font-label-caps text-xs text-on-surface-variant font-semibold tracking-wider animate-pulse">Syncing database data...</span>
          </div>
        ) : trashPosts.length === 0 ? (
          <div className="p-16 text-center space-y-3 select-none">
            <span className="material-symbols-outlined text-outline-variant text-[44px]">delete</span>
            <p className="font-body-md text-base font-bold text-on-surface-variant">Trash bin is empty</p>
            <p className="font-body-md text-xs text-outline leading-relaxed max-w-sm mx-auto">
              Soft-deleted articles will appear here. You can recover them anytime or purge them forever.
            </p>
          </div>
        ) : (
          <>
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-outline-variant/10 select-none">
                  <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider">Article Title</th>
                  <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[120px]">Category</th>
                  <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[140px]">Deleted Date</th>
                  <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[120px] text-center">Orig. Status</th>
                  <th className="font-label-caps text-[10px] font-bold text-on-surface-variant/80 uppercase px-6 py-3.5 tracking-wider w-[100px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {trashPosts.map((post) => {
                  // Calculate dynamic countdown if TTL is enabled
                  let ttlDescription = "";
                  if (post.autoDeleteAt) {
                    const diff = new Date(post.autoDeleteAt).getTime() - Date.now();
                    const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
                    ttlDescription = daysLeft > 0 ? `Auto-deletes in ${daysLeft} day${daysLeft > 1 ? 's' : ''}` : "Expiring soon";
                  } else {
                    ttlDescription = "Indefinite storage";
                  }

                  return (
                    <tr
                      key={post._id}
                      className="hover:bg-surface-container-low/20 transition-all duration-300"
                    >
                      {/* Column 1: Title & Excerpt */}
                      <td className="px-6 py-4.5 min-w-[320px]">
                        <div className="flex flex-col gap-1">
                          <span className="font-headline-lg text-base font-bold text-on-surface line-clamp-1 leading-tight">
                            {post.title}
                          </span>
                          <span className="font-body-md text-xs text-on-surface-variant line-clamp-1 leading-normal">
                            {post.excerpt || 'No summary description provided.'}
                          </span>
                          
                          {/* TTL Info Indicator */}
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-on-surface-variant/80 font-medium select-none">
                            <span className="material-symbols-outlined text-[13px] text-primary">hourglass_empty</span>
                            <span>{ttlDescription}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Category */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full font-label-caps border border-primary/10 font-bold tracking-wider select-none">
                          {post.category || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Column 3: Deleted Date */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="font-body-md text-xs text-on-surface-variant font-medium select-none">
                          {formatRelativeTime(post.deletedAt || post.updatedAt)}
                        </span>
                      </td>

                      {/* Column 4: Pre-deletion status */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold font-label-caps uppercase tracking-wider ${
                            post.status === 'PUBLISHED' 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'bg-outline-variant/30 text-on-surface-variant border border-outline-variant/50'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5 select-none">
                          <button
                            onClick={() => onRestore(post._id)}
                            disabled={restoringId === post._id}
                            className="p-1.5 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer active:scale-95 disabled:opacity-50 border-none bg-transparent"
                            title="Restore article to active dashboard"
                          >
                            {restoringId === post._id ? (
                              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
                            )}
                          </button>
                          <button
                            onClick={() => onPermanentDeleteRequest(post)}
                            className="p-1.5 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer active:scale-95 border-none bg-transparent"
                            title="Permanently purge article"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card Layout */}
            <div className="block md:hidden divide-y divide-outline-variant/10">
              {trashPosts.map((post) => {
                let ttlDescription = "";
                if (post.autoDeleteAt) {
                  const diff = new Date(post.autoDeleteAt).getTime() - Date.now();
                  const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
                  ttlDescription = daysLeft > 0 ? `Auto-deletes in ${daysLeft}d` : "Expiring soon";
                } else {
                  ttlDescription = "Indefinite storage";
                }

                return (
                  <div key={post._id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <h3 className="font-headline-lg text-sm font-bold text-on-surface leading-tight line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="inline-block text-[10px] text-on-surface-variant font-medium select-none bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/10">
                            {post.category || 'Uncategorized'}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold font-label-caps uppercase tracking-wider ${
                            post.status === 'PUBLISHED' 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'bg-outline-variant/30 text-on-surface-variant border border-outline-variant/50'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 select-none">
                        <button
                          onClick={() => onRestore(post._id)}
                          disabled={restoringId === post._id}
                          className="p-1.5 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer active:scale-95 disabled:opacity-50 border-none bg-transparent"
                          title="Restore article to active dashboard"
                        >
                          {restoringId === post._id ? (
                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
                          )}
                        </button>
                        <button
                          onClick={() => onPermanentDeleteRequest(post)}
                          className="p-1.5 hover:bg-error-container/20 text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer active:scale-95 border-none bg-transparent"
                          title="Permanently purge article"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                        </button>
                      </div>
                    </div>

                    <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {post.excerpt || 'No summary description provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/5 text-[10px] text-on-surface-variant/80 font-medium select-none">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-primary">hourglass_empty</span>
                        <span>{ttlDescription}</span>
                      </span>
                      <span>
                        Deleted {formatRelativeTime(post.deletedAt || post.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
