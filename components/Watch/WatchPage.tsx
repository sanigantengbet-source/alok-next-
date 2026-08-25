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

// Helper to format subscriber count accurately
const formatSubscriberCount = (subText: string | undefined): string => {
  if (!subText) return 'Subscribers';
  const clean = subText.trim();
  if (/(?:subscribers?|pelanggan|pengikut|abonnés|suscriptores)$/i.test(clean)) {
    return clean;
  }
  return `${clean} subscribers`;
};

// Helper to auto-linkify URLs inside the video description
const renderDescriptionText = (text: string) => {
  if (!text) return 'Tidak ada deskripsi video.';

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 dark:text-blue-400 hover:underline break-all font-medium"
        >
          {part}
        </a>
      );
    }
    return part;
  });
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

  // Swipe down gesture to pop up - exclusively attached to top drag handle
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isDraggingDown, setIsDraggingDown] = useState<boolean>(false);

  const activeVideoId = activeVideo?.id;
  const activeYoutubeId = activeVideo?.youtubeId;
  const activeChannelId = activeVideo?.channelId;
  const activeChannelTitle = activeVideo?.channelTitle;
  const activeVideoTitle = activeVideo?.title;
  const activeVideoSubs = activeVideo?.subscriberCount;

  // Fetch real-time live metadata (authentic exact views, likes, subscriber count, avatar, full description) from YouTube
  useEffect(() => {
    if (!activeVideoId) return;
    let isSubscribed = true;

    const rawYtId = activeYoutubeId || (activeVideoId.startsWith('yt-') ? activeVideoId.replace(/^yt-/, '') : '');
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
  }, [activeVideoId, activeYoutubeId]);

  // If subscriber count is still default, fetch channel info to get exact live subscriber number
  useEffect(() => {
    if (!activeVideoId) return;
    const currentSubs = liveDetails?.subscriberCount || activeVideoSubs;
    if (!currentSubs || currentSubs === '100K+' || currentSubs === '500K+') {
      const rawChanId = activeChannelId || '';
      const rawChanTitle = activeChannelTitle || '';
      if (rawChanId || rawChanTitle) {
        fetch(`/api/youtube/channel?id=${encodeURIComponent(rawChanId)}&title=${encodeURIComponent(rawChanTitle)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.channel?.subscribers) {
              setLiveDetails((prev) => ({
                ...prev,
                subscriberCount: data.channel.subscribers,
                channelAvatar: data.channel.avatar || prev?.channelAvatar,
              }));
            }
          })
          .catch(() => {});
      }
    }
  }, [activeVideoId, activeChannelId, activeChannelTitle, activeVideoSubs, liveDetails?.subscriberCount]);

  const handleTopDragStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setDragOffsetY(0);
    setIsDraggingDown(false);
  };

  const handleTopDragMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 10) {
      setDragOffsetY(diff);
      setIsDraggingDown(true);
    }
  };

  const handleTopDragEnd = () => {
    // Deliberate threshold to minimize to popup
    if (dragOffsetY > 100) {
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
    if (!activeVideoId) return;
    let isSubscribed = true;

    const fetchRelated = async () => {
      setIsLoadingRelated(true);
      try {
        const rawYtId = activeYoutubeId || (activeVideoId.startsWith('yt-') ? activeVideoId.replace(/^yt-/, '') : '');
        const res = await fetch(
          `/api/youtube/related?videoId=${encodeURIComponent(rawYtId)}&title=${encodeURIComponent(
            activeVideoTitle || ''
          )}&channel=${encodeURIComponent(activeChannelTitle || '')}`
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
  }, [activeVideoId, activeYoutubeId, activeVideoTitle, activeChannelTitle]);

  if (!activeVideo) return null;

  const isSubscribed = subscribedChannelIds.includes(activeVideo.channelId);
  const isLiked = likedVideoIds.includes(activeVideo.id);
  const isDisliked = dislikedVideoIds.includes(activeVideo.id);
  const isSaved = watchLaterIds.includes(activeVideo.id);

  // Live metadata or fallback
  const displayViews = liveDetails?.views ?? activeVideo.views;
  const displayLikes = liveDetails?.likes ?? activeVideo.likes;
  const displaySubsRaw = liveDetails?.subscriberCount || activeVideo.subscriberCount;
  const displaySubs = formatSubscriberCount(displaySubsRaw);
  const displayUploadedAt = liveDetails?.uploadedAt || activeVideo.uploadedAt;
  const displayDescription = liveDetails?.description || activeVideo.description;
  const displayAvatar = liveDetails?.channelAvatar || activeVideo.channelAvatar;

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
    <div className="w-full max-w-[1920px] mx-auto p-3 sm:p-6 lg:px-8">
      {/* Top Drag Handle & Minimize Bar (touch drag is isolated here, won't trigger while scrolling content) */}
      <div
        id="watch-drag-handle-bar"
        onTouchStart={handleTopDragStart}
        onTouchMove={handleTopDragMove}
        onTouchEnd={handleTopDragEnd}
        className="flex items-center justify-between py-2 px-3 mb-2 text-gray-600 dark:text-gray-400 select-none bg-gray-100/70 dark:bg-[#1c1c1c]/80 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-[#2b2b2b] transition-all"
        style={{
          transform: isDraggingDown ? `translateY(${Math.min(dragOffsetY, 80)}px)` : 'none',
          boxShadow: isDraggingDown ? '0 10px 25px -5px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <button
          id="watch-minimize-to-popup-btn"
          onClick={minimizeWatchToPopUp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#282828] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-800 dark:text-gray-200 text-xs font-semibold transition-all shadow-xs active:scale-95 group cursor-pointer border border-gray-200 dark:border-[#3a3a3a]"
          title="Minimize to floating pop-up"
        >
          <ChevronDown className="w-4 h-4 text-red-500 group-hover:translate-y-0.5 transition-transform" />
          <span>Tutup / Pop-up</span>
        </button>

        {/* Pull handle indicator on mobile */}
        <div
          onClick={minimizeWatchToPopUp}
          className="flex flex-col items-center cursor-pointer group py-1 px-4"
          title="Tarik ke bawah atau klik untuk pop up"
        >
          <div
            className={`w-14 h-1.5 rounded-full transition-all duration-150 ${
              isDraggingDown ? 'bg-red-500 scale-x-110' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-red-500'
            }`}
          />
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            {isDraggingDown ? 'Lepas untuk pop-up' : 'Tarik ke bawah untuk pop-up'}
          </span>
        </div>

        <button
          onClick={minimizeWatchToPopUp}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hidden sm:flex items-center gap-1 cursor-pointer"
        >
          <span>Floating mode</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN COLUMN: Video Player & Details */}
        <div className="flex-1 min-w-0">
          {/* Integrated SponsorBlock YouTube Player */}
          <YouTubePlayer
            key={activeVideo.id}
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
                onClick={() => openChannel(activeVideo.channelTitle, displayAvatar)}
                title={`Go to ${activeVideo.channelTitle}'s channel`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayAvatar}
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {displaySubs}
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
            className="mt-4 p-4 rounded-2xl bg-gray-100/90 dark:bg-[#181818] border border-gray-200/70 dark:border-[#262626] text-xs sm:text-sm text-gray-800 dark:text-gray-200 transition-all shadow-xs"
          >
            {/* Header info (views, date, category) */}
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-2.5 flex-wrap">
              <span>{formatViews(displayViews)} views</span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span>{displayUploadedAt}</span>
              {activeVideo.category && (
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-[#282828] text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                  {activeVideo.category}
                </span>
              )}
            </div>

            {/* Description Body (Full expansion or 3-line clamp) */}
            <div
              className={`leading-relaxed whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300 transition-all ${
                isDescExpanded ? 'max-h-none' : 'line-clamp-3'
              }`}
            >
              {renderDescriptionText(displayDescription)}
            </div>

            {/* Tags */}
            {activeVideo.tags && activeVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-200/60 dark:border-[#262626]">
                {Array.from(new Set(activeVideo.tags)).map((tag, idx) => (
                  <span
                    key={`watch-tag-${tag}-${idx}`}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    #{tag.replace(/\s+/g, '')}
                  </span>
                ))}
              </div>
            )}

            {/* Expand / Collapse Button */}
            <div className="mt-3 flex items-center justify-between pt-1">
              <button
                id="watch-toggle-desc-btn"
                type="button"
                className="text-xs font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer py-1"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
              >
                {isDescExpanded ? (
                  <>
                    <span>Tampilkan lebih sedikit</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Tampilkan lebih banyak / Selengkapnya</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
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
            {relatedVideos.map((video, idx) => (
              <RelatedVideoRow
                key={`related-${video.id}-${idx}`}
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
