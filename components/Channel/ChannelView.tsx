'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Bell,
  Share2,
  Search,
  Play,
  Flame,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  Radio,
  Layers,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Film,
  ListVideo,
  Eye,
  Calendar,
  Globe,
  Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Video, Channel, Playlist } from '@/types';
import { VideoCard } from '@/components/Feed/VideoCard';
import { VideoCardSkeleton } from '@/components/Feed/VideoCardSkeleton';

export const ChannelView: React.FC = () => {
  const {
    activeChannel,
    setCurrentView,
    previousView,
    subscribedChannelIds,
    toggleSubscribe,
    playVideoById,
    updateChannelInState,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'home' | 'videos' | 'shorts' | 'playlists' | 'about'>('home');
  const [videoSort, setVideoSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [channelSearch, setChannelSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Loaded channel state
  const [channelData, setChannelData] = useState<Channel | null>(null);
  const [channelVideos, setChannelVideos] = useState<Video[]>([]);
  const [channelShorts, setChannelShorts] = useState<Video[]>([]);
  const [channelPlaylists, setChannelPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Notification bell state
  const [bellState, setBellState] = useState<'all' | 'personalized' | 'none'>('all');
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);

  // Active channel reference fallback
  const baseChannel: Channel = useMemo(() => {
    if (activeChannel) return activeChannel;
    return {
      id: 'c-freecodecamp',
      title: 'freeCodeCamp.org',
      avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_lGRc-05M2OoE1ejQdxeFhyP7OkJg9h4Y-7CK_5je3QqFI=s900-c-k-c0x00ffffff-no-rj',
      banner: 'https://yt3.googleusercontent.com/_GxV-5nnBhGDO2bDgFtrpVypm6z8AC_tFg7W0zSsS9AGlw5xVg8zKLQ5tvTk6BwU1LzmWJb4YA=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj',
      handle: '@freecodecamp',
      subscribers: '9.45M',
      verified: true,
      videosCount: 1420,
      description: 'Learn to code for free with high quality tutorials on Python, JavaScript, Next.js, and web development.',
      joinedDate: 'Dec 16, 2014',
      viewsCount: '680M views',
    };
  }, [activeChannel]);

  // Current display channel merged with live data
  const currentChannel: Channel = useMemo(() => {
    return channelData || baseChannel;
  }, [channelData, baseChannel]);

  const isSubscribed = subscribedChannelIds.includes(currentChannel.id);

  // Fetch real channel details and content
  const [reloadCounter, setReloadCounter] = useState(0);
  const handleRetry = useCallback(() => {
    setReloadCounter((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const executeFetch = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const q = encodeURIComponent(baseChannel.title || '');
        const id = encodeURIComponent(baseChannel.id || '');
        const handle = encodeURIComponent(baseChannel.handle || '');
        const url = `/api/youtube/channel?q=${q}&id=${id}&handle=${handle}&channelId=${id}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Gagal mengambil data channel');
        }

        const data = await res.json();
        if (isCancelled) return;

        if (data.channel) {
          const fresh: Channel = {
            ...baseChannel,
            ...data.channel,
            id: baseChannel.id || data.channel.id,
          };
          setChannelData(fresh);
          updateChannelInState(fresh);
        }

        if (Array.isArray(data.videos)) {
          setChannelVideos(data.videos);
        } else {
          setChannelVideos([]);
        }

        if (Array.isArray(data.shorts)) {
          setChannelShorts(data.shorts);
        } else {
          setChannelShorts([]);
        }

        if (Array.isArray(data.playlists)) {
          setChannelPlaylists(data.playlists);
        } else {
          setChannelPlaylists([]);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error loading channel profile:', err);
          setErrorMessage(err.message || 'Terjadi kesalahan saat memuat channel.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isCancelled = true;
    };
  }, [baseChannel, updateChannelInState, reloadCounter]);

  // Filter and sort videos
  const sortedVideos = useMemo(() => {
    let list = [...channelVideos];

    if (channelSearch.trim()) {
      const q = channelSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
      );
    }

    if (videoSort === 'popular') {
      list.sort((a, b) => b.views - a.views);
    } else if (videoSort === 'oldest') {
      list.reverse();
    }
    return list;
  }, [channelVideos, videoSort, channelSearch]);

  const featuredVideo = sortedVideos[0] || null;

  const handleShareChannel = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://nexttube.app';
    if (navigator.share) {
      navigator
        .share({
          title: currentChannel.title,
          text: `Tonton channel ${currentChannel.title} di NextTube!`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      setIsShareModalOpen(true);
    }
  };

  return (
    <div
      id="channel-page-container"
      className="w-full min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 pb-24"
    >
      {/* Top Mobile Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#272727] md:hidden">
        <button
          onClick={() => setCurrentView(previousView === 'channel' ? 'home' : previousView)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm truncate max-w-[200px] text-gray-900 dark:text-white">
          {currentChannel.title}
        </span>
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200"
          aria-label="Info Channel"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* 1. CHANNEL HERO BANNER */}
      <div className="relative w-full h-32 sm:h-48 md:h-64 lg:h-72 bg-gradient-to-r from-gray-900 via-neutral-800 to-gray-900 overflow-hidden select-none">
        {isLoading && !currentChannel.banner ? (
          <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-[#222]" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                currentChannel.banner ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&auto=format&fit=crop&q=80'
              }
              alt={`${currentChannel.title} Banner`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=2560&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </>
        )}
      </div>

      {/* 2. CHANNEL PROFILE INFO SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-gray-200 dark:border-[#272727]">
          {/* Big Channel Avatar */}
          <div className="relative shrink-0 -mt-12 sm:-mt-16 ring-4 ring-white dark:ring-[#0f0f0f] rounded-full overflow-hidden shadow-xl bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentChannel.avatar}
              alt={currentChannel.title}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover rounded-full bg-neutral-800"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  currentChannel.title
                )}&backgroundColor=e11d48,2563eb,d97706`;
              }}
            />
          </div>

          {/* Channel Name, Handle, Sub Count & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {currentChannel.title}
              </h1>
              {currentChannel.verified && (
                <span title="Verified Creator">
                  <CheckCircle2 className="w-5 h-5 text-gray-500 fill-gray-400/20" />
                </span>
              )}
            </div>

            {/* Handle & Stats */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap font-medium">
              <span className="font-semibold text-gray-900 dark:text-gray-200">
                {currentChannel.handle || `@${currentChannel.title.replace(/\s+/g, '').toLowerCase()}`}
              </span>
              <span>&bull;</span>
              <span>{currentChannel.subscribers} subscribers</span>
              <span>&bull;</span>
              <span>
                {currentChannel.videosCount || channelVideos.length || 50} video
              </span>
            </div>

            {/* Description Snippet */}
            <div
              onClick={() => setIsAboutModalOpen(true)}
              className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-3xl cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors group flex items-baseline gap-1"
            >
              <span>
                {currentChannel.description ||
                  `Selamat datang di channel resmi ${currentChannel.title}. Tonton video, podcast, dan materi eksklusif.`}
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:underline inline-flex items-center text-xs whitespace-nowrap">
                ...selengkapnya <ChevronRight className="w-3.5 h-3.5 inline" />
              </span>
            </div>

            {/* Action Buttons: Subscribe & Share */}
            <div className="mt-4 flex items-center gap-2.5 flex-wrap">
              {isSubscribed ? (
                <div className="relative flex items-center bg-gray-100 dark:bg-[#272727] rounded-full border border-gray-300 dark:border-[#383838]">
                  <button
                    id="channel-page-subscribed-btn"
                    onClick={() => toggleSubscribe(currentChannel.id)}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-l-full transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Disubscribe</span>
                  </button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <button
                    id="channel-page-bell-btn"
                    onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                    className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-r-full transition-colors"
                    title="Preferensi Notifikasi"
                    aria-label="Preferensi Notifikasi"
                  >
                    <Bell
                      className={`w-4 h-4 ${
                        bellState === 'all' ? 'fill-current text-blue-500' : ''
                      }`}
                    />
                  </button>

                  {/* Bell Menu Dropdown */}
                  {isBellMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-[#222] rounded-xl shadow-xl border border-gray-200 dark:border-[#383838] py-1.5 z-30 animate-in fade-in">
                      <button
                        onClick={() => {
                          setBellState('all');
                          setIsBellMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#333] ${
                          bellState === 'all' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5 fill-current" />
                        <span>Semua Notifikasi</span>
                      </button>
                      <button
                        onClick={() => {
                          setBellState('personalized');
                          setIsBellMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#333] ${
                          bellState === 'personalized'
                            ? 'text-blue-500'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Dipersonalisasi</span>
                      </button>
                      <button
                        onClick={() => {
                          setBellState('none');
                          setIsBellMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#333] ${
                          bellState === 'none' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Nonaktifkan</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="channel-page-subscribe-btn"
                  onClick={() => toggleSubscribe(currentChannel.id)}
                  className="px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all shadow-xs"
                >
                  Subscribe
                </button>
              )}

              {/* Share Button */}
              <button
                id="channel-page-share-btn"
                onClick={handleShareChannel}
                className="px-4 py-2 rounded-full border border-gray-300 dark:border-[#383838] hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? 'Link Tersalin!' : 'Bagikan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="flex items-center justify-between mt-3 mb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { key: 'home', label: 'BERANDA' },
              { key: 'videos', label: 'VIDEO' },
              { key: 'shorts', label: 'SHORTS' },
              { key: 'playlists', label: 'PLAYLIST' },
              { key: 'about', label: 'TENTANG' },
            ].map((tab) => (
              <button
                key={tab.key}
                id={`channel-tab-${tab.key}`}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setChannelSearch('');
                }}
                className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search within channel button */}
          <div className="relative flex items-center pl-2">
            {isSearchOpen ? (
              <div className="flex items-center bg-gray-100 dark:bg-[#222] rounded-full px-3 py-1.5 border border-gray-300 dark:border-[#383838]">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={`Cari di ${currentChannel.title}...`}
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none w-32 sm:w-48"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setChannelSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-600 dark:text-gray-400 transition-colors"
                title={`Cari video di ${currentChannel.title}`}
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. MAIN CONTENT AREA */}
        <div className="mt-6">
          {/* LOADING STATE SKELETON */}
          {isLoading && (
            <div className="space-y-6">
              <div className="h-44 w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <VideoCardSkeleton key={`chan-skel-${i}`} id={`channel-skel-${i}`} />
                ))}
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {!isLoading && errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                Gagal Memuat Konten Channel
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* LOADED CONTENT */}
          {!isLoading && !errorMessage && (
            <>
              {/* TAB 1: BERANDA (HOME) */}
              {activeTab === 'home' && (
                <div className="space-y-8">
                  {/* Spotlight Featured Video */}
                  {featuredVideo && !channelSearch && (
                    <div
                      id="channel-featured-video"
                      onClick={() => playVideoById(featuredVideo.id, featuredVideo)}
                      className="group cursor-pointer flex flex-col md:flex-row gap-6 p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#3d3d3d] transition-all shadow-xs"
                    >
                      <div className="relative w-full md:w-80 lg:w-96 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={featuredVideo.thumbnailUrl}
                          alt={featuredVideo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all">
                          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[11px] font-semibold rounded-md">
                          {featuredVideo.duration}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
                          Video Unggulan
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {featuredVideo.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                          {featuredVideo.description ||
                            `Tonton langsung di NextTube dengan integrasi SponsorBlock & DeArrow.`}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium">
                          <span>{new Intl.NumberFormat().format(featuredVideo.views)} penayangan</span>
                          <span>&bull;</span>
                          <span>{featuredVideo.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Latest Uploads Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Film className="w-4 h-4 text-red-500" />
                        <span>Upload Terbaru</span>
                      </h2>
                    </div>

                    {sortedVideos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                        {sortedVideos.slice(0, 8).map((v) => (
                          <VideoCard key={v.id} video={v} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-[#181818] rounded-2xl border border-gray-200 dark:border-[#272727]">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tidak ada video yang ditemukan.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Popular Shorts Shelf */}
                  {channelShorts.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-[#272727]">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Flame className="w-4 h-4 text-red-500" />
                          <span>Shorts Populer</span>
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {channelShorts.slice(0, 6).map((short) => (
                          <div
                            key={short.id}
                            onClick={() => playVideoById(short.id, short)}
                            className="group cursor-pointer flex flex-col"
                          >
                            <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900 mb-2 shadow-xs group-hover:shadow-md transition-all">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={short.thumbnailUrl}
                                alt={short.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2 text-white">
                                <span className="text-[11px] font-bold block truncate">
                                  {new Intl.NumberFormat().format(short.views)} penayangan
                                </span>
                              </div>
                            </div>
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                              {short.title}
                            </h3>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VIDEO */}
              {activeTab === 'videos' && (
                <div>
                  {/* Sort Filter Chips */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'latest', label: 'Terbaru' },
                        { id: 'popular', label: 'Populer' },
                        { id: 'oldest', label: 'Terlama' },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          id={`sort-chip-${chip.id}`}
                          onClick={() => setVideoSort(chip.id as any)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            videoSort === chip.id
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                              : 'bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2c2c]'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {sortedVideos.length} video tersedia
                    </span>
                  </div>

                  {/* Videos Grid */}
                  {sortedVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                      {sortedVideos.map((v) => (
                        <VideoCard key={v.id} video={v} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 dark:bg-[#181818] rounded-3xl border border-gray-200 dark:border-[#272727] max-w-md mx-auto my-8">
                      <Film className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        Tidak Ada Video
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {channelSearch
                          ? `Tidak ditemukan video untuk kata kunci "${channelSearch}".`
                          : 'Channel ini belum memiliki video publik.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SHORTS */}
              {activeTab === 'shorts' && (
                <div>
                  {channelShorts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {channelShorts.map((short) => (
                        <div
                          key={short.id}
                          onClick={() => playVideoById(short.id, short)}
                          className="group cursor-pointer flex flex-col"
                        >
                          <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 mb-2 shadow-xs group-hover:shadow-lg transition-all">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={short.thumbnailUrl}
                              alt={short.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                              <span className="text-xs font-bold block truncate">
                                {new Intl.NumberFormat().format(short.views)} views
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                            {short.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 dark:bg-[#181818] rounded-3xl border border-gray-200 dark:border-[#272727] max-w-md mx-auto my-8">
                      <Flame className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        Tidak Ada Shorts
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Channel ini belum mengunggah YouTube Shorts.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PLAYLIST */}
              {activeTab === 'playlists' && (
                <div>
                  {channelPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {channelPlaylists.map((pl) => (
                        <div
                          key={pl.id}
                          className="group cursor-pointer bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#272727] rounded-2xl overflow-hidden hover:shadow-md transition-all"
                        >
                          <div className="relative aspect-video bg-gray-900 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={pl.thumbnailUrl}
                              alt={pl.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-y-0 right-0 w-24 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                              <ListVideo className="w-5 h-5" />
                              <span>{pl.videoCount} video</span>
                            </div>
                          </div>
                          <div className="p-3.5">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                              {pl.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {pl.updatedAt || 'Diperbarui baru-baru ini'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 dark:bg-[#181818] rounded-3xl border border-gray-200 dark:border-[#272727] max-w-md mx-auto my-8">
                      <ListVideo className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        Tidak Ada Playlist Publik
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Channel ini belum membuat playlist publik.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: TENTANG (ABOUT) */}
              {activeTab === 'about' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Description */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                        Deskripsi
                      </h2>
                      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-[#181818] p-5 rounded-2xl border border-gray-200 dark:border-[#272727]">
                        {currentChannel.description ||
                          `Selamat datang di channel resmi ${currentChannel.title}.`}
                      </div>
                    </div>

                    {/* External Links */}
                    {currentChannel.links && currentChannel.links.length > 0 && (
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                          Tautan &amp; Media Sosial
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentChannel.links.map((lnk, i) => (
                            <a
                              key={i}
                              href={lnk.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                  {lnk.title}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Statistics Box */}
                  <div className="bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl p-5 h-fit space-y-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200 dark:border-[#272727]">
                      Statistik Channel
                    </h2>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 shrink-0 text-red-500" />
                        <span>Bergabung: {currentChannel.joinedDate || 'Bergabung di YouTube'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Eye className="w-4 h-4 shrink-0 text-blue-500" />
                        <span>Total Penayangan: {currentChannel.viewsCount || 'Jutaan penayangan'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Flame className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Pelanggan: {currentChannel.subscribers} subscribers</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Film className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>Total Video: {currentChannel.videosCount || channelVideos.length || 50} video</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ABOUT MODAL (Dialog info popup) */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-[#333]">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentChannel.avatar}
                  alt={currentChannel.title}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {currentChannel.title}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentChannel.handle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Deskripsi
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {currentChannel.description || 'Tidak ada deskripsi tersedia.'}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-[#333]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Detail &amp; Statistik
                </h4>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentChannel.subscribers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Video:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentChannel.videosCount || channelVideos.length || 50}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Penayangan:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentChannel.viewsCount || 'Jutaan views'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bergabung:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentChannel.joinedDate || 'Januari 2021'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#333] flex justify-end">
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
