'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Play,
  Clock,
  Shield,
  Zap,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CommentSection } from './CommentSection';
import { YouTubePlayer } from './YouTubePlayer';
import { Video } from '@/types';
import { useDeArrow } from '@/hooks/useDeArrow';
import { formatCompactViews, formatExactViews } from '@/lib/youtube-views';

const RelatedVideoRow: React.FC<{
  video: Video;
  onPlay: (video: Video) => void;
  onOpenChannel: (channelTitle: string, channelAvatar: string) => void;
}> = ({ video, onPlay, onOpenChannel }) => {
  const { title: displayTitle, thumbnailUrl: displayThumbnail } = useDeArrow(video);

  return (
    <div
      id={`related-video-${video.id}`}
      onClick={() => onPlay(video)}
      className="flex gap-3 group cursor-pointer p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#202020] transition-colors"
    >
      {/* Mini thumbnail */}
      <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayThumbnail || video.thumbnailUrl}
          alt={displayTitle || video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== video.thumbnailUrl && video.thumbnailUrl) {
              target.src = video.thumbnailUrl;
            } else if (video.youtubeId && !target.src.includes('hqdefault')) {
              target.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
            } else {
              target.src = `https://picsum.photos/seed/${encodeURIComponent(video.title || video.id)}/640/360`;
            }
          }}
        />
        <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-white text-[10px] font-semibold rounded-sm">
          {video.duration}
        </div>
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1 flex flex-col justify-start">
        <h4
          className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          title={displayTitle || video.title}
        >
          {displayTitle || video.title}
        </h4>
        <div
          className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-1 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer w-fit"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChannel(video.channelTitle, video.channelAvatar);
          }}
        >
          <span className="truncate hover:underline">{video.channelTitle}</span>
          {video.verified && <CheckCircle2 className="w-3 h-3 shrink-0 text-gray-500 fill-gray-400/20" />}
        </div>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          {new Intl.NumberFormat().format(video.views)} views • {video.uploadedAt}
        </span>
      </div>
    </div>
  );
};

export const WatchPage: React.FC = () => {
  const {
    activeVideo,
    videos,
    playVideoById,
    subscribedChannelIds,
    toggleSubscribe,
    likedVideoIds,
    dislikedVideoIds,
    toggleLikeVideo,
    toggleDislikeVideo,
    watchLaterIds,
    toggleWatchLater,
    setShareModalVideo,
    sponsorBlockSettings,
    openChannel,
    minimizeWatchToPopUp,
  } = useApp();

  const { title: watchVideoTitle } = useDeArrow(activeVideo);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [dynamicRelated, setDynamicRelated] = useState<Video[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [liveDetails, setLiveDetails] = useState<Partial<Video> | null>(null);

  // Swipe down gesture to pop up
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isDraggingDown, setIsDraggingDown] = useState<boolean>(false);

  // Fetch real-time live metadata (authentic exact views, likes, etc.) from YouTube
  useEffect(() => {
    if (!activeVideo) return;
    let isSubscribed = true;

    const rawYtId = activeVideo.youtubeId || (activeVideo.id.startsWith('yt-') ? activeVideo.id.replace(/^yt-/, '') : '');
    if (!rawYtId) return;

    const fetchLiveDetails = async () => {
      try {
        const res = await fetch(`/api/youtube/details?videoId=${encodeURIComponent(rawYtId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isSubscribed && data?.video) {
          setLiveDetails(data.video);
        }
      } catch (err) {
        console.warn('Failed to fetch live video details:', err);
      }
    };

    fetchLiveDetails();

    return () => {
      isSubscribed = false;
    };
  }, [activeVideo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setDragOffsetY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragOffsetY(diff);
      setIsDraggingDown(true);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 60) {
      minimizeWatchToPopUp();
    }
    setTouchStartY(null);
    setDragOffsetY(0);
    setIsDraggingDown(false);
  };

  // Compute local relevance score as instant fallback
  const localRelevantVideos = useMemo(() => {
    if (!activeVideo) return [];
    const pool = videos.filter((v) => v.id !== activeVideo.id);

    const activeKeywords = (activeVideo.title + ' ' + (activeVideo.tags || []).join(' '))
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    return pool
      .map((v) => {
        let score = 0;
        if (v.channelTitle && v.channelTitle === activeVideo.channelTitle) score += 60;
        if (v.category && activeVideo.category && v.category === activeVideo.category) score += 30;

        const targetText = (v.title + ' ' + (v.tags || []).join(' ')).toLowerCase();
        for (const kw of activeKeywords) {
          if (targetText.includes(kw)) score += 15;
        }

        return { video: v, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.video);
  }, [activeVideo, videos]);

  // Fetch real-time related recommendations from YouTube whenever active video changes
  useEffect(() => {
    if (!activeVideo) return;
    let isSubscribed = true;

    const fetchRelated = async () => {
      setIsLoadingRelated(true);
      try {
        const rawYtId = activeVideo.youtubeId || (activeVideo.id.startsWith('yt-') ? activeVideo.id.replace(/^yt-/, '') : '');
        const res = await fetch(
          `/api/youtube/related?videoId=${encodeURIComponent(rawYtId)}&title=${encodeURIComponent(
            activeVideo.title
          )}&channel=${encodeURIComponent(activeVideo.channelTitle || '')}`
        );

        if (!res.ok) return;
        const data = await res.json();

        if (isSubscribed && Array.isArray(data.results) && data.results.length > 0) {
          setDynamicRelated(data.results);
        }
      } catch (err) {
        console.warn('Failed to load related videos from API:', err);
      } finally {
        if (isSubscribed) {
          setIsLoadingRelated(false);
        }
      }
    };

    fetchRelated();

    return () => {
      isSubscribed = false;
    };
  }, [activeVideo]);

  if (!activeVideo) return null;

  const isSubscribed = subscribedChannelIds.includes(activeVideo.channelId);
  const isLiked = likedVideoIds.includes(activeVideo.id);
  const isDisliked = dislikedVideoIds.includes(activeVideo.id);
  const isSaved = watchLaterIds.includes(activeVideo.id);

  // Live metadata or fallback
  const displayViews = liveDetails?.views ?? activeVideo.views;
  const displayLikes = liveDetails?.likes ?? activeVideo.likes;
  const displaySubs = liveDetails?.subscriberCount || activeVideo.subscriberCount;
  const displayUploadedAt = liveDetails?.uploadedAt || activeVideo.uploadedAt;
  const displayDescription = liveDetails?.description || activeVideo.description;

  // Final related list: dynamic API results first, fallback to relevant local videos
  const relatedVideos = dynamicRelated.length > 0 ? dynamicRelated : localRelevantVideos;

  const formatViews = (views: number): string => {
    return formatExactViews(views);
  };

  const handlePlayRelated = (video: Video) => {
    playVideoById(video.id, video);
  };

  const handleVideoEnded = () => {
    if (isAutoplay && relatedVideos.length > 0) {
      playVideoById(relatedVideos[0].id, relatedVideos[0]);
    }
  };

  return (
    <div
      className="w-full max-w-[1920px] mx-auto p-3 sm:p-6 lg:px-8 transition-transform duration-150 ease-out"
      style={{
        transform: isDraggingDown ? `translateY(${Math.min(dragOffsetY, 120)}px)` : 'none',
        opacity: isDraggingDown ? Math.max(0.5, 1 - dragOffsetY / 300) : 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Mobile & Desktop Swipe-down minimize bar */}
      <div className="flex items-center justify-between pb-2 mb-1 text-gray-600 dark:text-gray-400 select-none">
        <button
          id="watch-minimize-to-popup-btn"
          onClick={minimizeWatchToPopUp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-800 dark:text-gray-200 text-xs font-semibold transition-all shadow-xs active:scale-95 group cursor-pointer"
          title="Minimize to floating pop-up (Swipe down)"
        >
          <ChevronDown className="w-4 h-4 text-red-500 group-hover:translate-y-0.5 transition-transform" />
          <span>Swipe down / Pop-up</span>
        </button>

        {/* Pull handle indicator on mobile */}
        <div
          onClick={minimizeWatchToPopUp}
          className="flex flex-col items-center cursor-pointer group py-1 px-4"
          title="Click or drag down to pop up"
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-red-500 transition-colors" />
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline-block">
          Swipe down to pop up
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN COLUMN: Video Player & Details */}
        <div className="flex-1 min-w-0">
          {/* Integrated SponsorBlock YouTube Player */}
          <YouTubePlayer
            video={activeVideo}
            settings={sponsorBlockSettings}
            onEnded={handleVideoEnded}
          />

          {/* Video Title */}
          <h1
            className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-4 leading-snug"
            title={watchVideoTitle || activeVideo.title}
          >
            {watchVideoTitle || activeVideo.title}
          </h1>

          {/* Channel & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-3 border-b border-gray-200 dark:border-[#272727]">
            {/* Channel Info & Subscribe Button */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-3 cursor-pointer group/chan"
                onClick={() => openChannel(activeVideo.channelTitle, activeVideo.channelAvatar)}
                title={`Go to ${activeVideo.channelTitle}'s channel`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeVideo.channelAvatar}
                  alt={activeVideo.channelTitle}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-[#383838] group-hover/chan:opacity-80 transition-opacity"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeVideo.channelTitle || 'YT')}&backgroundColor=e11d48,2563eb,d97706`;
                  }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-gray-900 dark:text-white group-hover/chan:underline">
                      {activeVideo.channelTitle}
                    </span>
                    {activeVideo.verified && (
                      <CheckCircle2 className="w-4 h-4 text-gray-500 fill-gray-400/20" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {displaySubs} subscribers
                  </span>
                </div>
              </div>

              <button
                id="watch-subscribe-btn"
                onClick={() => toggleSubscribe(activeVideo.channelId)}
                className={`ml-2 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  isSubscribed
                    ? 'bg-gray-100 dark:bg-[#272727] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333]'
                    : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Action Buttons (Like, Dislike, Share, Save) */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Like / Dislike pill */}
              <div className="flex items-center rounded-full bg-gray-100 dark:bg-[#272727] p-0.5 border border-gray-200 dark:border-[#383838]">
                <button
                  id="watch-like-btn"
                  onClick={() => toggleLikeVideo(activeVideo.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-l-full text-xs font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-[#333] ${
                    isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-blue-600 dark:fill-blue-400' : ''}`} />
                  <span>{formatCompactViews(displayLikes)}</span>
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-[#3e3e3e]" />
                <button
                  id="watch-dislike-btn"
                  onClick={() => toggleDislikeVideo(activeVideo.id)}
                  className={`px-3 py-1.5 rounded-r-full text-xs font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-[#333] ${
                    isDisliked ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-red-500' : ''}`} />
                </button>
              </div>

              {/* Share Button */}
              <button
                id="watch-share-btn"
                onClick={() => setShareModalVideo(activeVideo)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#333] border border-gray-200 dark:border-[#383838] text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              {/* Save / Watch Later */}
              <button
                id="watch-save-btn"
                onClick={() => toggleWatchLater(activeVideo.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200 dark:border-[#383838] text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200'
                    : 'bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-800 dark:text-gray-200'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Description Card */}
          <div
            id="watch-video-description-card"
            className="mt-4 p-4 rounded-2xl bg-gray-100 dark:bg-[#202020] text-xs sm:text-sm text-gray-800 dark:text-gray-200 transition-all cursor-pointer hover:bg-gray-200/70 dark:hover:bg-[#262626]"
            onClick={() => setIsDescExpanded(!isDescExpanded)}
          >
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-2">
              <span>{formatViews(displayViews)} views</span>
              <span>•</span>
              <span>{displayUploadedAt}</span>
              <span className="px-2 py-0.5 bg-gray-200 dark:bg-[#303030] rounded-md text-xs font-mono">
                #{activeVideo.category}
              </span>
            </div>

            <p className={`whitespace-pre-line leading-relaxed ${isDescExpanded ? '' : 'line-clamp-3'}`}>
              {displayDescription}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {activeVideo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>

            <button
              id="watch-toggle-desc-btn"
              className="mt-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            >
              {isDescExpanded ? (
                <>
                  Show less <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  ...more <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Comments Section Component */}
          <CommentSection videoId={activeVideo.id} commentsCount={activeVideo.commentsCount} />
        </div>

        {/* RIGHT SIDEBAR: Up Next / Related Videos */}
        <div className="w-full lg:w-96 shrink-0 space-y-3">
          {/* Autoplay header */}
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Up next</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Autoplay</span>
              <button
                id="watch-toggle-autoplay-btn"
                onClick={() => setIsAutoplay(!isAutoplay)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  isAutoplay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-[#404040]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    isAutoplay ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Related Video Cards list */}
          <div className="space-y-3">
            {isLoadingRelated && relatedVideos.length === 0 && (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                <span>Loading recommended videos...</span>
              </div>
            )}
            {relatedVideos.map((video) => (
              <RelatedVideoRow
                key={video.id}
                video={video}
                onPlay={handlePlayRelated}
                onOpenChannel={(title, avatar) => openChannel(title, avatar)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
