'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Play, Pause, X, Maximize2, Shield, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useDeArrow } from '@/hooks/useDeArrow';

export const FloatingMiniPlayer: React.FC = () => {
  const {
    activeVideo,
    currentView,
    isMiniPlayerDismissed,
    dismissMiniPlayer,
    restoreWatchPage,
    isPlayerPlaying,
    togglePlayerPlay,
    playerCurrentTime,
    setPlayerCurrentTime,
    playerDuration,
  } = useApp();

  const { title: displayTitle, thumbnailUrl: displayThumbnail } = useDeArrow(activeVideo);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(35);

  // Store the initial seek timestamp once on mount so the iframe src never reloads every second
  const [initialStartSec] = useState<number>(() => Math.max(0, Math.floor(playerCurrentTime || 0)));

  // Keep playerCurrentTime advancing while miniplayer is actively playing
  useEffect(() => {
    if (!activeVideo || currentView === 'watch' || isMiniPlayerDismissed || !isPlayerPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setPlayerCurrentTime((prev) => {
        if (playerDuration > 0 && prev >= playerDuration) {
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeVideo, currentView, isMiniPlayerDismissed, isPlayerPlaying, playerDuration, setPlayerCurrentTime]);

  // If on watch page or no active video or dismissed, don't show floating player
  if (!activeVideo || currentView === 'watch' || isMiniPlayerDismissed) {
    return null;
  }

  const staticEmbedSrc = `https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&start=${initialStartSec}&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`;

  const calculatedProgress =
    playerDuration > 0
      ? (playerCurrentTime / playerDuration) * 100
      : progress;

  return (
    <div
      id="floating-miniplayer-container"
      className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 w-52 sm:w-72 md:w-80 aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/20 dark:border-[#333333] transition-all duration-200 group select-none hover:shadow-red-500/10 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Floating video player"
    >
      {/* Video Content / Embedded or Preview */}
      <div
        className="w-full h-full relative cursor-pointer"
        onClick={restoreWatchPage}
        title="Tap to expand video"
      >
        {isPlayerPlaying ? (
          <iframe
            src={staticEmbedSrc}
            title={displayTitle || activeVideo.title}
            className="w-full h-full pointer-events-none object-cover border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayThumbnail || activeVideo.thumbnailUrl}
              alt={displayTitle || activeVideo.title}
              className="w-full h-full object-cover brightness-75"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== activeVideo.thumbnailUrl && activeVideo.thumbnailUrl) {
                  target.src = activeVideo.thumbnailUrl;
                } else if (activeVideo.youtubeId && !target.src.includes('hqdefault')) {
                  target.src = `https://i.ytimg.com/vi/${activeVideo.youtubeId}/hqdefault.jpg`;
                } else {
                  target.src = `https://picsum.photos/seed/${encodeURIComponent(activeVideo.title || activeVideo.id)}/640/360`;
                }
              }}
            />
          </div>
        )}

        {/* Top Floating Action Controls (Matching user screenshot) */}
        <div
          className={`absolute top-2 left-2 right-2 flex items-center justify-between z-10 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-85 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play / Pause Toggle Button */}
          <button
            id="floating-player-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayerPlay();
            }}
            aria-label={isPlayerPlaying ? 'Pause video' : 'Play video'}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 border border-white/20 shadow-md"
          >
            {isPlayerPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Expand / Maximize button */}
            <button
              id="floating-player-maximize-btn"
              onClick={(e) => {
                e.stopPropagation();
                restoreWatchPage();
              }}
              aria-label="Maximize player"
              className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 border border-white/20 shadow-md"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close / Dismiss Button */}
            <button
              id="floating-player-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                dismissMiniPlayer();
              }}
              aria-label="Close floating player"
              className="w-8 h-8 rounded-full bg-black/70 hover:bg-red-600/90 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 border border-white/20 shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Title & Channel Banner */}
        <div className="absolute inset-x-0 bottom-0 pt-6 pb-2 px-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
          <p
            className="text-white text-xs font-semibold line-clamp-1 drop-shadow-sm"
            title={displayTitle || activeVideo.title}
          >
            {displayTitle || activeVideo.title}
          </p>
          <p className="text-gray-300 text-[10px] truncate drop-shadow-sm mt-0.5">
            {activeVideo.channelTitle}
          </p>
        </div>

        {/* Red Progress Bar at the very bottom */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, calculatedProgress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
