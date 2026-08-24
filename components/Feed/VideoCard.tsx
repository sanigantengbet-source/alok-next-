'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Share2, MoreVertical, Play, ListPlus } from 'lucide-react';
import { Video } from '@/types';
import { useApp } from '@/context/AppContext';
import { useDeArrow } from '@/hooks/useDeArrow';
import { formatCompactViews } from '@/lib/youtube-views';

interface VideoCardProps {
  video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const {
    playVideoById,
    watchLaterIds,
    toggleWatchLater,
    setShareModalVideo,
    openChannel,
  } = useApp();

  const { title: displayTitle, thumbnailUrl: displayThumbnail, isTitleChanged, isThumbnailChanged } = useDeArrow(video);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isWatchLater = watchLaterIds.includes(video.id);

  const formatViews = (views: number): string => {
    return formatCompactViews(views);
  };

  return (
    <div
      id={`video-card-${video.id}`}
      className="flex flex-col group cursor-pointer transition-transform duration-200"
    >
      {/* Thumbnail Box */}
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3 shadow-xs group-hover:rounded-none group-hover:shadow-md transition-all"
        onClick={() => playVideoById(video.id)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayThumbnail || video.thumbnailUrl}
          alt={displayTitle || video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
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

        {/* Play Overlay icon on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 ml-0.5 fill-white" />
          </div>
        </div>

        {/* Live / Replay Badge */}
        {video.isLive ? (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider flex items-center gap-1 shadow-md animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>
        ) : video.category === 'Live Replay' || video.tags?.includes('Replay') ? (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-700/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-md tracking-wide shadow-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
            <span>REPLAY LIVE</span>
          </div>
        ) : null}

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md tracking-tight">
          {video.isLive ? 'LIVE' : video.duration}
        </div>

        {/* Quick action buttons on top right of thumbnail */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            id={`card-watch-later-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchLater(video.id);
            }}
            title={isWatchLater ? 'Remove from Watch Later' : 'Watch Later'}
            className={`p-1.5 rounded-md backdrop-blur-md transition-colors ${
              isWatchLater
                ? 'bg-blue-600 text-white'
                : 'bg-black/70 hover:bg-black text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          <button
            id={`card-share-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setShareModalVideo(video);
            }}
            title="Share"
            className="p-1.5 rounded-md bg-black/70 hover:bg-black text-white backdrop-blur-md transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Details */}
      <div className="flex gap-3 items-start px-0.5">
        {/* Channel Avatar */}
        <div
          className="shrink-0 pt-0.5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            openChannel(video.channelTitle, video.channelAvatar);
          }}
          title={`Go to ${video.channelTitle}'s channel`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.channelAvatar}
            alt={video.channelTitle}
            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-[#333] hover:opacity-80 transition-opacity"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.channelTitle || 'YT')}&backgroundColor=e11d48,2563eb,d97706`;
            }}
          />
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
            title={displayTitle || video.title}
            onClick={() => playVideoById(video.id)}
          >
            {displayTitle || video.title}
          </h3>

          <div
            className="mt-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 cursor-pointer group/chan w-fit"
            onClick={(e) => {
              e.stopPropagation();
              openChannel(video.channelTitle, video.channelAvatar);
            }}
          >
            <span className="hover:text-gray-900 dark:hover:text-white group-hover/chan:underline transition-colors font-medium">
              {video.channelTitle}
            </span>
            {video.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-500 fill-gray-400/20 shrink-0" />
            )}
          </div>

          <div
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 cursor-pointer"
            onClick={() => playVideoById(video.id)}
          >
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{video.uploadedAt}</span>
          </div>
        </div>

        {/* Action Menu button */}
        <div className="relative shrink-0">
          <button
            id={`card-menu-btn-${video.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-[#252525] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-6 w-44 bg-white dark:bg-[#212121] rounded-xl shadow-xl border border-gray-200 dark:border-[#383838] py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button
                id={`menu-watch-later-${video.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchLater(video.id);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#303030] flex items-center gap-2.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isWatchLater ? 'Remove Watch Later' : 'Save to Watch Later'}</span>
              </button>

              <button
                id={`menu-share-${video.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShareModalVideo(video);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#303030] flex items-center gap-2.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Video</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
