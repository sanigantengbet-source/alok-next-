'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Video } from '@/types';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Music2,
  Sparkles,
  CheckCircle2,
  Flame,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { ShortsCommentsModal } from './ShortsCommentsModal';

const TRENDING_QUERIES = [
  '#shorts viral trending',
  '#shorts fyp viral 2026',
  '#shorts trending indonesia',
  '#shorts tiktok viral trending',
  '#shorts popular trending',
];

export const ShortsView: React.FC = () => {
  const {
    shorts,
    fetchShorts,
    likedVideoIds,
    toggleLikeVideo,
    dislikedVideoIds,
    toggleDislikeVideo,
    subscribedChannelIds,
    toggleSubscribe,
    setShareModalVideo,
    openChannel,
  } = useApp();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeCommentsShort, setActiveCommentsShort] = useState<Video | null>(null);
  const isAutoFetchingRef = useRef<boolean>(false);
  const queryRotationIndexRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keep itemRefs in sync with shorts length
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, shorts.length);
  }, [shorts.length]);

  // Handle intersection observer to accurately detect which short is in focus
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
              setIsPlaying(true);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [shorts]);

  // Real-time automatic recommendation: fetch next trending batch when approaching end of feed
  useEffect(() => {
    if (activeIndex >= shorts.length - 3 && shorts.length > 0 && !isAutoFetchingRef.current) {
      isAutoFetchingRef.current = true;
      const nextQuery = TRENDING_QUERIES[queryRotationIndexRef.current % TRENDING_QUERIES.length];
      queryRotationIndexRef.current += 1;

      fetchShorts(nextQuery).finally(() => {
        setTimeout(() => {
          isAutoFetchingRef.current = false;
        }, 800);
      });
    }
  }, [activeIndex, shorts.length, fetchShorts]);

  // Scroll to index helper
  const scrollToIndex = useCallback(
    (index: number) => {
      const target = itemRefs.current[index];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    []
  );

  const handleNext = useCallback(() => {
    if (activeIndex < shorts.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  }, [activeIndex, shorts.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  }, [activeIndex, scrollToIndex]);

  // Keyboard navigation support (Arrow Up / Down / Mute / Play)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem-3.5rem)] md:h-[calc(100vh-3.5rem)] bg-neutral-950 flex items-center justify-center overflow-hidden">
      {/* Realtime Trending Badge */}
      <div className="absolute top-3 left-4 z-30 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold select-none shadow-lg">
        <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
        <span>Trending Shorts Real-Time</span>
      </div>

      {/* Scrollable vertical snap container */}
      <div
        ref={containerRef}
        id="shorts-vertical-feed"
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none flex flex-col items-center"
      >
        {shorts.map((short, index) => {
          const isActive = index === activeIndex;
          const isLiked = likedVideoIds.includes(short.id);
          const isDisliked = dislikedVideoIds.includes(short.id);
          const isSubscribed = subscribedChannelIds.includes(short.channelId);

          return (
            <div
              key={`${short.id}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              data-index={index}
              className="w-full h-full shrink-0 snap-start snap-always flex items-center justify-center p-1 sm:p-3 relative"
            >
              {/* Short Container Box (9:16 Aspect ratio) */}
              <div className="relative w-full max-w-[380px] sm:max-w-[400px] h-full max-h-[85vh] sm:rounded-3xl overflow-hidden shadow-2xl bg-black border border-neutral-800 flex items-center justify-center group select-none">
                {/* Video Playback / Embed */}
                {isActive ? (
                  <div
                    className="relative w-full h-full cursor-pointer"
                    onClick={() => setIsPlaying((prev) => !prev)}
                  >
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=1&mute=${
                          isMuted ? 1 : 0
                        }&loop=1&playlist=${short.youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                        title={short.title}
                        className="w-full h-full object-cover pointer-events-none scale-105"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <Image
                          src={short.thumbnailUrl}
                          alt={short.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 400px"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                            <Play className="w-8 h-8 fill-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={short.thumbnailUrl}
                      alt={short.title}
                      className="w-full h-full object-cover brightness-75"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (short.youtubeId && !target.src.includes('hqdefault')) {
                          target.src = `https://i.ytimg.com/vi/${short.youtubeId}/hqdefault.jpg`;
                        } else {
                          target.src = `https://picsum.photos/seed/${encodeURIComponent(short.title || short.id)}/480/854`;
                        }
                      }}
                    />
                  </div>
                )}

                {/* Top Overlay: Sound Mute/Unmute & Indicator */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <button
                    id={`short-mute-btn-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted((prev) => !prev);
                    }}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 border border-white/20 shadow-md"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Right Action Column (Likes, Dislikes, Comments, Share, Disc) */}
                <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4 text-white">
                  {/* Like Button */}
                  <div className="flex flex-col items-center">
                    <button
                      id={`short-like-btn-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeVideo(short.id);
                      }}
                      aria-label="Like short"
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/10 ${
                        isLiked
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                          : 'bg-black/50 hover:bg-black/70 text-white'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
                      />
                    </button>
                    <span className="text-[11px] font-bold mt-1 text-white drop-shadow-md">
                      {formatCount(short.likes + (isLiked ? 1 : 0))}
                    </span>
                  </div>

                  {/* Dislike Button */}
                  <div className="flex flex-col items-center">
                    <button
                      id={`short-dislike-btn-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDislikeVideo(short.id);
                      }}
                      aria-label="Dislike short"
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 border border-white/10 ${
                        isDisliked
                          ? 'bg-gray-800 text-red-400'
                          : 'bg-black/50 hover:bg-black/70 text-white'
                      }`}
                    >
                      <ThumbsDown
                        className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`}
                      />
                    </button>
                    <span className="text-[11px] font-medium mt-1 text-white/80 drop-shadow-md">
                      Dislike
                    </span>
                  </div>

                  {/* Comments Button */}
                  <div className="flex flex-col items-center">
                    <button
                      id={`short-comments-btn-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommentsShort(short);
                      }}
                      aria-label="Open comments"
                      className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 border border-white/10 text-white"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <span className="text-[11px] font-bold mt-1 text-white drop-shadow-md">
                      {formatCount(short.commentsCount)}
                    </span>
                  </div>

                  {/* Share Button */}
                  <div className="flex flex-col items-center">
                    <button
                      id={`short-share-btn-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModalVideo(short);
                      }}
                      aria-label="Share short"
                      className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 border border-white/10 text-white"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <span className="text-[11px] font-medium mt-1 text-white/80 drop-shadow-md">
                      Share
                    </span>
                  </div>

                  {/* Spinning Audio Track Disc */}
                  <div className="mt-1 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr from-gray-900 via-neutral-800 to-gray-700 p-0.5 border border-white/30 shadow-lg ${
                        isPlaying && isActive ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                    >
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        <Music2 className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Video Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-4 pt-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white pointer-events-none">
                  {/* Channel & Subscribe */}
                  <div className="flex items-center gap-2.5 mb-2 pointer-events-auto">
                    <div
                      className="relative w-8 h-8 rounded-full overflow-hidden border border-white/40 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChannel(short.channelTitle, short.channelAvatar);
                      }}
                      title={`View ${short.channelTitle}'s channel`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={short.channelAvatar}
                        alt={short.channelTitle}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(short.channelTitle || 'creator')}/100/100`;
                        }}
                      />
                    </div>

                    <div
                      className="flex items-center gap-1.5 min-w-0 cursor-pointer group/chan"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChannel(short.channelTitle, short.channelAvatar);
                      }}
                    >
                      <span className="font-bold text-xs sm:text-sm text-white truncate drop-shadow-sm group-hover/chan:underline">
                        {short.channelTitle}
                      </span>
                      {short.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white/80 shrink-0" />
                      )}
                    </div>

                    <button
                      id={`short-subscribe-btn-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSubscribe(short.channelId);
                      }}
                      className={`ml-1 text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${
                        isSubscribed
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-white hover:bg-gray-100 text-black'
                      }`}
                    >
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  </div>

                  {/* Title & Hashtags */}
                  <p className="text-xs sm:text-sm text-white/95 font-medium line-clamp-2 drop-shadow-sm mb-2 pointer-events-auto leading-snug">
                    {short.title}
                  </p>

                  {/* Audio Ticker */}
                  <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium pointer-events-auto">
                    <Music2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">
                      Original sound - {short.channelTitle}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Desktop / Tablet Up & Down Navigation Chevrons */}
      <div className="hidden sm:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-30">
        <button
          id="shorts-nav-prev-btn"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous short"
          className="w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-neutral-800 disabled:opacity-30 backdrop-blur-md text-white flex items-center justify-center border border-neutral-700 shadow-xl transition-transform active:scale-95 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <button
          id="shorts-nav-next-btn"
          onClick={handleNext}
          disabled={activeIndex === shorts.length - 1}
          aria-label="Next short"
          className="w-10 h-10 rounded-full bg-neutral-900/80 hover:bg-neutral-800 disabled:opacity-30 backdrop-blur-md text-white flex items-center justify-center border border-neutral-700 shadow-xl transition-transform active:scale-95 cursor-pointer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Sliding Comments Modal for Shorts */}
      {activeCommentsShort && (
        <ShortsCommentsModal
          short={activeCommentsShort}
          isOpen={Boolean(activeCommentsShort)}
          onClose={() => setActiveCommentsShort(null)}
        />
      )}
    </div>
  );
};
