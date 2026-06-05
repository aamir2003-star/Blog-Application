'use client';

interface AnalyticsSummaryProps {
  loading: boolean;
  analytics: {
    totalViews: number;
    publishedCount: number;
    draftsCount: number;
  };
}

export default function AnalyticsSummary({
  loading,
  analytics,
}: AnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 select-none">
      {/* Metric 1: Views */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 blur-xl group-hover:scale-110 transition-transform select-none pointer-events-none" />
        <div className="space-y-1">
          <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant font-semibold uppercase">Total Story Views</span>
          <p className="text-3xl font-bold text-on-surface font-sans leading-none tracking-tight">
            {loading ? '—' : analytics.totalViews.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">visibility</span>
        </div>
      </div>

      {/* Metric 2: Published */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 blur-xl group-hover:scale-110 transition-transform select-none pointer-events-none" />
        <div className="space-y-1">
          <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant font-semibold uppercase">Published Articles</span>
          <p className="text-3xl font-bold text-on-surface font-sans leading-none tracking-tight">
            {loading ? '—' : analytics.publishedCount.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">public</span>
        </div>
      </div>

      {/* Metric 3: Drafts */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:border-outline-variant/30 transition-all duration-300 relative group overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-tertiary/5 rounded-full translate-x-8 -translate-y-8 blur-xl group-hover:scale-110 transition-transform select-none pointer-events-none" />
        <div className="space-y-1">
          <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant font-semibold uppercase">Unpublished Drafts</span>
          <p className="text-3xl font-bold text-on-surface font-sans leading-none tracking-tight">
            {loading ? '—' : analytics.draftsCount.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">description</span>
        </div>
      </div>
    </div>
  );
}
