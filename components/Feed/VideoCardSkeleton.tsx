'use client';

import React from 'react';

interface VideoCardSkeletonProps {
  id?: string;
}

export const VideoCardSkeleton: React.FC<VideoCardSkeletonProps> = ({ id }) => {
  return (
    <div
      id={id || 'video-card-skeleton'}
      aria-hidden="true"
      className="flex flex-col select-none animate-pulse"
    >
      {/* Thumbnail Skeleton Box */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-[#272727] mb-3">
        {/* Shimmer gradient overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
        
        {/* Duration badge placeholder */}
        <div className="absolute bottom-2 right-2 w-10 h-4 bg-gray-300 dark:bg-[#383838] rounded-md" />
      </div>

      {/* Video Details Skeleton */}
      <div className="flex gap-3 items-start px-0.5">
        {/* Channel Avatar Skeleton */}
        <div className="shrink-0 pt-0.5">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#272727]" />
        </div>

        {/* Title & Metadata Skeletons */}
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          {/* Title line 1 */}
          <div className="h-3.5 bg-gray-200 dark:bg-[#272727] rounded-md w-[92%]" />
          {/* Title line 2 */}
          <div className="h-3.5 bg-gray-200 dark:bg-[#272727] rounded-md w-[65%]" />

          {/* Channel Name */}
          <div className="h-3 bg-gray-200 dark:bg-[#272727] rounded-md w-[48%] mt-2" />

          {/* Views & Timestamp */}
          <div className="h-3 bg-gray-200 dark:bg-[#272727] rounded-md w-[36%] mt-1" />
        </div>
      </div>
    </div>
  );
};
