'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Tv,
  CheckCircle2,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { VideoCard } from '@/components/Feed/VideoCard';
import { VideoCardSkeleton } from '@/components/Feed/VideoCardSkeleton';
import { Video } from '@/types';

// Helper for clean channel avatar fallback
const getChannelInitialFallback = (title: string) => {
  const initial = (title || 'C').charAt(0).toUpperCase();
  const colors = [
    'from-red-600 to-rose-700',
    'from-blue-600 to-indigo-700',
    'from-emerald-600 to-teal-700',
    'from-purple-600 to-violet-700',
    'from-amber-600 to-orange-700',
    'from-pink-600 to-rose-700',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  return { initial, gradientClass: colors[colorIndex] };
};

export const SubscriptionsView: React.FC = () => {
  const {
    channels,
    subscribedChannelIds,
    videos,
    openChannel,
    isLoadingVideos,
    setCurrentView,
    setSelectedCategory,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);
  const [dynamicChannelVideos, setDynamicChannelVideos] = useState<Video[]>([]);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState<boolean>(false);

  // Subscribed channels list with robust fallback resolution
  const subscribedChannels = useMemo(() => {
    return subscribedChannelIds.map((id) => {
      const found = channels.find((c) => c.id === id || c.title.toLowerCase() === id.toLowerCase());
      if (found) return found;

      const matchVid = videos.find(
        (v) => v.channelId === id || v.channelTitle.toLowerCase() === id.toLowerCase()
      );
      const cleanTitle = matchVid?.channelTitle || id.replace(/^c-/, '');

      return {
        id,
        title: cleanTitle,
        avatar:
          matchVid?.channelAvatar ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanTitle)}&backgroundColor=e11d48,2563eb,d97706`,
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&auto=format&fit=crop&q=80',
        handle: `@${cleanTitle.replace(/\s+/g, '').toLowerCase()}`,
        subscribers: matchVid?.subscriberCount || '100K+',
        verified: matchVid?.verified ?? true,
        isSubscribed: true,
        videosCount: 20,
        description: `Official NextTube channel for ${cleanTitle}.`,
        joinedDate: 'Joined recently',
        viewsCount: '1.2M views',
      };
    });
  }, [channels, subscribedChannelIds, videos]);

  const selectedChannelObj = useMemo(() => {
    if (!selectedChannelFilter) return null;
    return (
      channels.find(
        (c) =>
          c.id === selectedChannelFilter ||
          c.title.toLowerCase() === selectedChannelFilter.toLowerCase()
      ) || null
    );
  }, [channels, selectedChannelFilter]);

  // Automatically fetch real YouTube videos when a specific channel is selected
  useEffect(() => {
    let isCancelled = false;

    if (!selectedChannelObj) return;

    const fetchVideosForChannel = async () => {
      try {
        setIsLoadingDynamic(true);
        const res = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(selectedChannelObj.title)}&limit=16`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0 && !isCancelled) {
            const enriched = data.results.map((v: Video) => ({
              ...v,
              channelTitle: selectedChannelObj.title,
              channelAvatar: selectedChannelObj.avatar || v.channelAvatar,
              channelId: selectedChannelObj.id,
            }));
            setDynamicChannelVideos(enriched);
            return;
          }
        }
      } catch (err) {
        console.warn('Channel dynamic video fetch note:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingDynamic(false);
        }
      }
    };

    fetchVideosForChannel();

    return () => {
      isCancelled = true;
    };
  }, [selectedChannelObj]);

  // Videos from subscribed channels
  const subscriptionVideos = useMemo(() => {
    if (selectedChannelObj && dynamicChannelVideos.length > 0) {
      return dynamicChannelVideos;
    }

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
  }, [
    videos,
    subscribedChannelIds,
    channels,
    selectedChannelFilter,
    selectedChannelObj,
    dynamicChannelVideos,
    activeFilter,
  ]);

  // Recommended videos to supplement the feed
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
              {subscribedChannels.length} channel diikuti &bull; Video terbaru dan rekomendasi terbaik
            </p>
          </div>
        </div>

        {/* Quick count pill */}
        {subscribedChannels.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202020] text-gray-700 dark:text-gray-300">
              {subscribedChannels.length} Saluran Diikuti
            </span>
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
              const isSelected =
                selectedChannelFilter === c.id ||
                selectedChannelFilter === c.title ||
                selectedChannelObj?.id === c.id;

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
                  title={`Klik untuk filter, klik lagi untuk buka profil ${c.title}`}
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
                      className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-[#222]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const fallbackInfo = getChannelInitialFallback(c.title);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.fallback-initial')) {
                          const div = document.createElement('div');
                          div.className = `fallback-initial w-full h-full rounded-full flex items-center justify-center font-bold text-sm text-white bg-gradient-to-tr ${fallbackInfo.gradientClass}`;
                          div.innerText = fallbackInfo.initial;
                          parent.appendChild(div);
                        }
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white dark:border-[#0f0f0f]" />
                  </div>
                  <span
                    className={`text-[11px] truncate max-w-[80px] text-center ${
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

      {/* SELECTED CHANNEL HEADER BANNER (If filtered by specific channel) */}
      {selectedChannelObj && (
        <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#282828] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedChannelObj.avatar}
              alt={selectedChannelObj.title}
              className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-[#333] shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedChannelObj.title}
                </h3>
                {selectedChannelObj.verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedChannelObj.handle} &bull; {selectedChannelObj.subscribers} subscribers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => openChannel(selectedChannelObj)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Profil Channel</span>
            </button>
            <button
              onClick={() => setSelectedChannelFilter(null)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#222] text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Reset Filter
            </button>
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
      </div>

      {/* PRIMARY SECTION: Videos from Subscriptions */}
      {subscribedChannels.length === 0 ? (
        /* Empty State when no channels subscribed */
        <div className="bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Belum Ada Channel yang Di-Subscribe
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Daftar langganan Anda masih kosong. Silakan jelajahi beranda atau tonton video untuk subscribe channel kreator favorit Anda!
          </p>
          <button
            id="empty-sub-explore-home-btn"
            onClick={() => {
              setCurrentView('home');
              setSelectedCategory('All');
            }}
            className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-red-600/20 inline-flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Jelajahi Beranda Sekarang</span>
          </button>
        </div>
      ) : isLoadingVideos || isLoadingDynamic ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 mb-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={`sub-skel-${i}`} id={`sub-skeleton-${i}`} />
          ))}
        </div>
      ) : subscriptionVideos.length > 0 ? (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>
                {selectedChannelObj
                  ? `Video dari ${selectedChannelObj.title}`
                  : 'Video dari Channel Langganan'}
              </span>
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
        /* Empty Video filter state */
        <div className="bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-3xl p-8 text-center max-w-md mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#252525] text-gray-600 dark:text-gray-300 mx-auto flex items-center justify-center mb-3">
            <Tv className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Tidak ada video pada filter ini
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            Coba ubah filter atau pilih channel lain dari baris di atas.
          </p>
          <button
            onClick={() => {
              setActiveFilter('all');
              setSelectedChannelFilter(null);
            }}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-[#282828] text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#333] transition-colors"
          >
            Tampilkan Semua Video
          </button>
        </div>
      )}
    </div>
  );
};
