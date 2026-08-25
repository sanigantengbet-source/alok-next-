'use client';

import React, { useState, useEffect } from 'react';
import {
  Video as VideoIcon,
  Search,
  Flame,
  Tv,
  History,
  ThumbsUp,
  Clock,
  Trash2,
  FolderOpen,
  Youtube,
  Sparkles,
  Link2,
  Film,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './VideoCardSkeleton';
import { useApp } from '@/context/AppContext';
import { Video } from '@/types';
import { filterFreshVideos } from '@/lib/video-freshness';

interface VideoGridProps {
  isLoading?: boolean;
  skeletonCount?: number;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  isLoading: propLoading,
  skeletonCount = 10,
}) => {
  const {
    videos,
    searchResults,
    currentView,
    selectedCategory,
    searchQuery,
    likedVideoIds,
    watchLaterIds,
    historyVideoIds,
    subscribedChannelIds,
    clearHistory,
    user,
    setCurrentView,
    setSelectedCategory,
    setSearchQuery,
    setIsUploadModalOpen,
    isLoadingVideos,
    playDirectYouTubeVideo,
    fetchTrendingVideos,
    loadMoreVideos,
    isFetchingMore,
  } = useApp();

  const [directUrlInput, setDirectUrlInput] = useState<string>('');
  const [isDirectLoading, setIsDirectLoading] = useState<boolean>(false);

  // Show skeletons only when truly loading without existing content to prevent blinking
  const isLoading = propLoading !== undefined ? propLoading : (isLoadingVideos && videos.length === 0);

  // Filter logic
  let displayedVideos: Video[] = [...videos];
  let pageTitle = '';
  let pageIcon = null;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();

    // Combine searchResults from YouTube API with local matches, avoiding duplicates
    if (searchResults && searchResults.length > 0) {
      const ids = new Set<string>();
      const combined: Video[] = [];

      for (const v of searchResults) {
        if (!ids.has(v.id)) {
          ids.add(v.id);
          combined.push(v);
        }
      }

      for (const v of videos) {
        if (
          !ids.has(v.id) &&
          (v.title.toLowerCase().includes(q) ||
            v.channelTitle.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            v.tags.some((tag) => tag.toLowerCase().includes(q)))
        ) {
          ids.add(v.id);
          combined.push(v);
        }
      }

      displayedVideos = combined;
    } else {
      // Local filter fallback
      displayedVideos = displayedVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelTitle.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    pageTitle = `YouTube results for "${searchQuery}"`;
    pageIcon = <Youtube className="w-6 h-6 text-red-600" />;
  } else if (currentView === 'trending') {
    displayedVideos = [...displayedVideos].sort((a, b) => b.views - a.views);
    pageTitle = 'Trending';
    pageIcon = <Flame className="w-6 h-6 text-red-500" />;
  } else if (currentView === 'shorts') {
    const shortsFiltered = displayedVideos.filter(
      (v) =>
        v.tags.some((t) => t.toLowerCase().includes('short') || t.toLowerCase().includes('quick') || t.toLowerCase().includes('reel')) ||
        v.title.toLowerCase().includes('short') ||
        v.category === 'Shorts' ||
        v.duration.startsWith('0:') ||
        v.duration.startsWith('1:')
    );
    displayedVideos = shortsFiltered.length > 0 ? shortsFiltered : [...videos].slice(0, 10);
    pageTitle = 'YouTube Shorts';
    pageIcon = <Film className="w-6 h-6 text-red-600" />;
  } else if (currentView === 'subscriptions') {
    displayedVideos = displayedVideos.filter((v) =>
      subscribedChannelIds.includes(v.channelId)
    );
    pageTitle = 'Subscriptions Feed';
    pageIcon = <Tv className="w-6 h-6 text-blue-500" />;
  } else if (currentView === 'history') {
    displayedVideos = historyVideoIds
      .map((id) => videos.find((v) => v.id === id))
      .filter((v): v is Video => v !== undefined);
    pageTitle = 'Watch History';
    pageIcon = <History className="w-6 h-6 text-amber-500" />;
  } else if (currentView === 'watchLater') {
    displayedVideos = displayedVideos.filter((v) => watchLaterIds.includes(v.id));
    pageTitle = 'Watch Later';
    pageIcon = <Clock className="w-6 h-6 text-emerald-500" />;
  } else if (currentView === 'liked') {
    displayedVideos = displayedVideos.filter((v) => likedVideoIds.includes(v.id));
    pageTitle = 'Liked Videos';
    pageIcon = <ThumbsUp className="w-6 h-6 text-rose-500" />;
  } else if (currentView === 'yourVideos') {
    displayedVideos = displayedVideos.filter((v) => v.channelId === user?.id || v.channelId === 'c-user-custom');
    pageTitle = 'Your Videos & Uploads';
    pageIcon = <VideoIcon className="w-6 h-6 text-purple-500" />;
  } else {
    // Standard Home category filter
    if (selectedCategory && selectedCategory !== 'All') {
      const cleanCategory = selectedCategory.replace(/^[^\w\s]+/, '').trim().toLowerCase();
      displayedVideos = displayedVideos.filter((v) => {
        if (v.category === selectedCategory) return true;
        const lowerTitle = v.title.toLowerCase();
        const tags = v.tags ? v.tags.map((t) => t.toLowerCase()) : [];

        if (selectedCategory.includes('Rame') || selectedCategory.includes('Viral')) {
          return (
            tags.includes('viral') ||
            tags.includes('trending') ||
            tags.includes('rame') ||
            lowerTitle.includes('viral') ||
            lowerTitle.includes('rame') ||
            lowerTitle.includes('trending') ||
            v.views > 500000
          );
        }

        if (selectedCategory === 'TikTok Hits') {
          return (
            tags.includes('tiktok') ||
            tags.includes('viral') ||
            lowerTitle.includes('tiktok') ||
            lowerTitle.includes('sound')
          );
        }

        if (selectedCategory === 'Live Replay') {
          return (
            v.category === 'Live Replay' ||
            tags.includes('live') ||
            tags.includes('replay') ||
            lowerTitle.includes('live') ||
            lowerTitle.includes('stream')
          );
        }

        return (
          tags.some((t) => t.includes(cleanCategory)) ||
          lowerTitle.includes(cleanCategory) ||
          (v.category && v.category.toLowerCase().includes(cleanCategory))
        );
      });
    }

    // Strictly enforce freshness on home feed to remove 1-5 year old stale videos
    if (!searchQuery.trim()) {
      const freshOnly = filterFreshVideos(displayedVideos);
      if (freshOnly.length > 0) {
        displayedVideos = freshOnly;
      }
    }
  }

  const handleDirectPlay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrlInput.trim()) return;
    setIsDirectLoading(true);
    await playDirectYouTubeVideo(directUrlInput.trim());
    setIsDirectLoading(false);
    setDirectUrlInput('');
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-[1920px] mx-auto min-h-[calc(100vh-8rem)]">
      {/* Header for specialized views */}
      {pageTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-200 dark:border-[#272727] gap-3">
          <div className="flex items-center gap-3">
            {pageIcon}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {pageTitle}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {displayedVideos.length} {displayedVideos.length === 1 ? 'video' : 'videos'} found
              </p>
            </div>
          </div>

          {currentView === 'history' && historyVideoIds.length > 0 && (
            <button
              id="clear-watch-history-btn"
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}

          {currentView === 'yourVideos' && (
            <button
              id="your-videos-upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <VideoIcon className="w-4 h-4" />
              <span>Upload New Video</span>
            </button>
          )}
        </div>
      )}

      {/* Videos Grid or Skeleton Loading State */}
      {isLoading ? (
        <div
          id="video-grid-skeletons"
          aria-label="Loading YouTube videos..."
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8"
        >
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <VideoCardSkeleton key={`skeleton-${index}`} id={`video-skeleton-${index}`} />
          ))}
        </div>
      ) : displayedVideos.length > 0 ? (
        <div className="flex flex-col gap-8">
          <div
            id="video-grid-list"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 animate-in fade-in duration-150"
          >
            {displayedVideos.map((video, index) => (
              <VideoCard key={`grid-${video.id}-${index}`} video={video} />
            ))}
          </div>

          {/* Load More Recommendations / Infinite Scroll trigger for Home View */}
          {(currentView === 'home' || currentView === 'trending') && !searchQuery && (
            <div className="flex flex-col items-center justify-center pt-4 pb-12">
              <button
                id="load-more-recommendations-btn"
                onClick={() => loadMoreVideos()}
                disabled={isFetchingMore}
                className="flex items-center gap-2.5 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#222222] dark:hover:bg-[#2a2a2a] text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-full border border-gray-200 dark:border-[#333333] shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-60"
              >
                {isFetchingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    <span>Memuat rekomendasi baru...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Muat Lebih Banyak Rekomendasi</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 mb-4">
            <Youtube className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            {searchQuery ? `No direct match for "${searchQuery}"` : 'No videos found'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery
              ? 'You can search any keyword or paste any YouTube video link below to play it immediately.'
              : currentView === 'liked'
              ? 'Videos you like will show up here.'
              : currentView === 'watchLater'
              ? 'Videos added to your Watch Later playlist will appear here.'
              : 'There are no videos in this section yet.'}
          </p>

          {/* Direct YouTube Video Link Input */}
          <form onSubmit={handleDirectPlay} className="w-full mb-6">
            <div className="flex items-center bg-gray-100 dark:bg-[#202020] border border-gray-300 dark:border-[#383838] rounded-xl p-1.5 focus-within:border-red-500 transition-colors">
              <Link2 className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
              <input
                type="text"
                value={directUrlInput}
                onChange={(e) => setDirectUrlInput(e.target.value)}
                placeholder="Paste YouTube Link or Video ID..."
                className="w-full px-3 py-1.5 text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isDirectLoading || !directUrlInput.trim()}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                {isDirectLoading ? 'Loading...' : 'Play'}
              </button>
            </div>
          </form>

          <button
            id="empty-state-reset-btn"
            onClick={() => {
              setCurrentView('home');
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-[#282828] dark:hover:bg-[#353535] text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            Back to Home Feed
          </button>
        </div>
      )}
    </div>
  );
};
