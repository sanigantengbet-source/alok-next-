'use client';

import React, { useState, useMemo } from 'react';
import {
  Tv,
  Sparkles,
  Flame,
  CheckCircle2,
  Bell,
  SlidersHorizontal,
  Compass,
  Plus,
  Check,
  Play,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ExternalLink,
  Users,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VideoCard } from '@/components/Feed/VideoCard';
import { VideoCardSkeleton } from '@/components/Feed/VideoCardSkeleton';
import { Channel, Video } from '@/types';

export const SubscriptionsView: React.FC = () => {
  const {
    channels,
    subscribedChannelIds,
    toggleSubscribe,
    videos,
    openChannel,
    isLoadingVideos,
    setCurrentView,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);
  const [showAllChannelsModal, setShowAllChannelsModal] = useState<boolean>(false);

  // Subscribed channels list
  const subscribedChannels = useMemo(() => {
    return channels.filter((c) => subscribedChannelIds.includes(c.id));
  }, [channels, subscribedChannelIds]);

  // Suggested popular channels if user wants to discover more
  const suggestedChannels = useMemo(() => {
    return channels.filter((c) => !subscribedChannelIds.includes(c.id));
  }, [channels, subscribedChannelIds]);

  // Videos from subscribed channels
  const subscriptionVideos = useMemo(() => {
    let list = videos.filter((v) => {
      if (selectedChannelFilter) {
        return (
          v.channelId === selectedChannelFilter ||
          v.channelTitle.toLowerCase() === selectedChannelFilter.toLowerCase()
        );
      }
      return subscribedChannelIds.some(
        (id) =>
          id === v.channelId ||
          channels.find((c) => c.id === id)?.title.toLowerCase() === v.channelTitle.toLowerCase()
      );
    });

    if (activeFilter === 'today') {
      list = list.slice(0, 8);
    } else if (activeFilter === 'unwatched') {
      list = list.slice(0, 12);
    }

    return list;
  }, [videos, subscribedChannelIds, channels, selectedChannelFilter, activeFilter]);

  // Recommended videos to supplement the feed (real trending/popular recommendations)
  const recommendedVideos = useMemo(() => {
    const subVideoIds = new Set(subscriptionVideos.map((v) => v.id));
    return videos.filter((v) => !subVideoIds.has(v.id)).slice(0, 10);
  }, [videos, subscriptionVideos]);

  return (
    <div className="p-4 sm:p-6 w-full max-w-[1920px] mx-auto min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-gray-200 dark:border-[#272727] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Langganan (Subscriptions)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subscribedChannels.length} channel diikuti &bull; Update video langsung dari kreator
            </p>
          </div>
        </div>

        {/* Quick manage button */}
        {subscribedChannels.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllChannelsModal(true)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202020] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2c2c2c] transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-red-600" />
              <span>Kelola {subscribedChannels.length} Saluran</span>
            </button>
          </div>
        )}
      </div>

      {/* TOP SUBSCRIBED CHANNELS BAR (Horizontal Scrollable Avatar Carousel) */}
      {subscribedChannels.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none select-none">
            {/* All channels pill */}
            <button
              id="sub-filter-all-btn"
              onClick={() => setSelectedChannelFilter(null)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all shrink-0 ${
                selectedChannelFilter === null
                  ? 'bg-gray-200 dark:bg-[#2c2c2c] text-gray-900 dark:text-white font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                Semua
              </div>
              <span className="text-[11px] font-medium truncate max-w-[70px]">Semua VT</span>
            </button>

            {subscribedChannels.map((c) => {
              const isSelected = selectedChannelFilter === c.id || selectedChannelFilter === c.title;
              return (
                <div
                  key={c.id}
                  id={`sub-channel-avatar-${c.id}`}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                  onClick={() => {
                    if (isSelected) {
                      openChannel(c);
                    } else {
                      setSelectedChannelFilter(c.id);
                    }
                  }}
                  title={`Klik untuk filter, klik dua kali untuk buka profile ${c.title}`}
                >
                  <div
                    className={`relative w-12 h-12 rounded-full p-0.5 transition-all ${
                      isSelected
                        ? 'ring-2 ring-red-600 dark:ring-red-500 scale-105'
                        : 'group-hover:ring-2 group-hover:ring-gray-300 dark:group-hover:ring-gray-600'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatar}
                      alt={c.title}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          c.title
                        )}&backgroundColor=e11d48,2563eb`;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-[#0f0f0f]" />
                  </div>
                  <span
                    className={`text-[11px] truncate max-w-[76px] text-center ${
                      isSelected
                        ? 'font-bold text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}
                  >
                    {c.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER CHIPS (Semua, Terbaru, Belum Ditonton) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[
          { id: 'all', label: 'Semua Video' },
          { id: 'today', label: 'Terbaru' },
          { id: 'unwatched', label: 'Belum Ditonton' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`sub-tab-${tab.id}`}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeFilter === tab.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                : 'bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2c2c]'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {selectedChannelFilter && (
          <button
            onClick={() => {
              const matched = channels.find((c) => c.id === selectedChannelFilter);
              if (matched) openChannel(matched);
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors shrink-0 flex items-center gap-1"
          >
            <span>Buka Halaman Channel</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* PRIMARY SECTION: Videos from Subscriptions */}
      {isLoadingVideos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 mb-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={`sub-skel-${i}`} id={`sub-skeleton-${i}`} />
          ))}
        </div>
      ) : subscriptionVideos.length > 0 ? (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Video dari Channel Langganan</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                ({subscriptionVideos.length} VT)
              </span>
            </h2>
          </div>

          <div
            id="subscription-video-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 animate-in fade-in duration-200"
          >
            {subscriptionVideos.map((video) => (
              <VideoCard key={`sub-vid-${video.id}`} video={video} />
            ))}
          </div>
        </div>
      ) : (
        /* Empty Subscriptions or No Videos Found */
        <div className="bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-3xl p-8 text-center max-w-xl mx-auto my-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center mb-4">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {subscribedChannels.length === 0
              ? 'Belum ada Channel yang Di-Subscribe'
              : 'Tidak ada video dari filter ini'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Subscribe ke channel favorit Anda di bawah ini untuk mendapatkan rekomendasi video dan update konten terbaru secara otomatis.
          </p>
        </div>
      )}

      {/* SUGGESTED POPULAR CHANNELS TO SUBSCRIBE */}
      {suggestedChannels.length > 0 && (
        <div className="mb-12 pt-6 border-t border-gray-200 dark:border-[#272727]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Saluran Populer yang Disarankan</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Temukan dan ikuti kreator terbaik YouTube
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestedChannels.slice(0, 4).map((c) => (
              <div
                key={c.id}
                id={`suggested-chan-${c.id}`}
                className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2b2b2b] rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all group"
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-gray-200 dark:border-[#333] cursor-pointer group-hover:scale-105 transition-transform"
                  onClick={() => openChannel(c)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.avatar}
                    alt={c.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        c.title
                      )}&backgroundColor=e11d48,2563eb`;
                    }}
                  />
                </div>

                <div
                  className="cursor-pointer mb-1 flex items-center gap-1 justify-center"
                  onClick={() => openChannel(c)}
                >
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  {c.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  )}
                </div>

                <span className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">
                  {c.subscribers} subscribers
                </span>

                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => openChannel(c)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border border-gray-300 dark:border-[#383838] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    Profil
                  </button>
                  <button
                    id={`suggested-sub-btn-${c.id}`}
                    onClick={() => toggleSubscribe(c.id)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ikuti</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECONDARY SECTION: Rekomendasi Video VT untuk Anda */}
      {recommendedVideos.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-[#272727]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Rekomendasi Video untuk Anda</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                VT viral &amp; trending yang mungkin Anda sukai
              </p>
            </div>
          </div>

          <div
            id="recommended-video-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8"
          >
            {recommendedVideos.map((video) => (
              <VideoCard key={`rec-vid-${video.id}`} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ALL SUBSCRIBED CHANNELS */}
      {showAllChannelsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-[#333]">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Semua Saluran yang Diikuti ({subscribedChannels.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAllChannelsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-semibold"
              >
                Tutup
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {subscribedChannels.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#2b2b2b] hover:border-gray-300 dark:hover:border-[#3d3d3d] transition-all"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => {
                      setShowAllChannelsModal(false);
                      openChannel(c);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatar}
                      alt={c.title}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-200 dark:border-[#383838]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {c.title}
                        </h4>
                        {c.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {c.handle} &bull; {c.subscribers} subscribers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => {
                        setShowAllChannelsModal(false);
                        openChannel(c);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-[#2c2c2c] hover:bg-gray-300 dark:hover:bg-[#383838] text-gray-900 dark:text-white transition-colors"
                    >
                      Buka
                    </button>
                    <button
                      onClick={() => toggleSubscribe(c.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
