'use client';

export default function PostCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-outline-variant/30"></div>
        <div className="w-24 h-4 bg-outline-variant/30 rounded"></div>
        <div className="w-2 h-4 bg-outline-variant/30 rounded"></div>
        <div className="w-12 h-4 bg-outline-variant/30 rounded"></div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-outline-variant/30 rounded w-5/6"></div>
          <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
          <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
          <div className="h-4 bg-outline-variant/30 rounded w-2/3"></div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <div className="w-20 h-6 bg-outline-variant/30 rounded-full"></div>
              <div className="w-16 h-4 bg-outline-variant/30 rounded"></div>
            </div>
          </div>
        </div>
        <div className="w-[80px] h-[80px] xs:w-[120px] xs:h-[90px] sm:w-[160px] sm:h-[107px] bg-outline-variant/30 rounded-lg shrink-0"></div>
      </div>
      <div className="w-full h-px bg-outline-variant/10 pt-4"></div>
    </div>
  );
}
