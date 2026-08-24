'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Tv,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Video, Channel } from '@/types';
import { VideoCard } from '@/components/Feed/VideoCard';
import { useDeArrow } from '@/hooks/useDeArrow';

export const ChannelView: React.FC = () => {
  const {
    activeChannel,
    setCurrentView,
    previousView,
    videos,
    shorts,
    subscribedChannelIds,
    toggleSubscribe,
    playVideoById,
    setShareModalVideo,
    searchYouTube,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'home' | 'videos' | 'shorts' | 'live' | 'playlists' | 'about'>('home');
  const [videoSort, setVideoSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [liveSort, setLiveSort] = useState<'latest' | 'popular' | 'longest'>('latest');
  const [liveFilterCategory, setLiveFilterCategory] = useState<'all' | 'stream' | 'podcast' | 'gaming'>('all');
  const [channelSearch, setChannelSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [channelVideos, setChannelVideos] = useState<Video[]>([]);
  const [isLoadingChannelVideos, setIsLoadingChannelVideos] = useState(false);
  const [channelLiveReplays, setChannelLiveReplays] = useState<Video[]>([]);
  const [isLoadingLiveReplays, setIsLoadingLiveReplays] = useState<boolean>(false);
  const [bellState, setBellState] = useState<'all' | 'personalized' | 'none'>('all');
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);
  const [liveMeta, setLiveMeta] = useState<{ avatar?: string; banner?: string; subscribers?: string; description?: string } | null>(null);

  // If no active channel selected, fallback gracefully
  const baseChannel: Channel = useMemo(
    () =>
      activeChannel || {
        id: 'c-default',
        title: 'Featured Channel',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
        handle: '@featured_channel',
        subscribers: '250K',
        verified: true,
        videosCount: 88,
        description: 'Welcome to our official NextTube channel. Discover tutorials, high quality podcasts, and exclusive videos.',
        joinedDate: 'Jan 2021',
        viewsCount: '15.2M views',
      },
    [activeChannel]
  );

  const channel: Channel = useMemo(
    () => ({
      ...baseChannel,
      avatar: liveMeta?.avatar || baseChannel.avatar,
      banner: liveMeta?.banner || baseChannel.banner,
      subscribers: liveMeta?.subscribers || baseChannel.subscribers,
      description: liveMeta?.description || baseChannel.description,
    }),
    [baseChannel, liveMeta]
  );

  const isSubscribed = subscribedChannelIds.includes(channel.id);

  // Fetch real YouTube channel metadata (avatar, banner, description)
  useEffect(() => {
    let isCancelled = false;

    const fetchLiveChannelInfo = async () => {
      try {
        const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(baseChannel.title)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.channel && !isCancelled) {
            setLiveMeta({
              avatar: data.channel.avatar,
              banner: data.channel.banner,
              subscribers: data.channel.subscribers,
              description: data.channel.description,
            });
          }
        }
      } catch {
        // graceful fallback
      }
    };

    fetchLiveChannelInfo();

    return () => {
      isCancelled = true;
    };
  }, [baseChannel.title]);

  // Filter local videos & fetch real YouTube videos for this specific channel
  useEffect(() => {
    let isCancelled = false;

    const loadChannelContent = async () => {
      // 1. Gather all local matching videos
      const localMatches = videos.filter(
        (v) =>
          (v.channelTitle && v.channelTitle.toLowerCase() === channel.title.toLowerCase()) ||
          (v.channelId && v.channelId === channel.id) ||
          v.title.toLowerCase().includes(channel.title.toLowerCase())
      );

      // 2. If we have fewer than 6 videos for this channel, fetch from live YouTube Search API
      if (localMatches.length < 6) {
        try {
          setIsLoadingChannelVideos(true);
          const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(channel.title)}&limit=15`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.results) && data.results.length > 0 && !isCancelled) {
              const combined = [...localMatches];
              const seen = new Set(localMatches.map((m) => m.id));
              for (const r of data.results) {
                if (!seen.has(r.id)) {
                  // Ensure channel title & avatar match this channel
                  combined.push({
                    ...r,
                    channelTitle: channel.title,
                    channelAvatar: channel.avatar || r.channelAvatar,
                  });
                  seen.add(r.id);
                }
              }
              setChannelVideos(combined);
              return;
            }
          }
        } catch (e) {
          console.warn('Channel video fetch fallback note:', e);
        } finally {
          if (!isCancelled) {
            setIsLoadingChannelVideos(false);
          }
        }
      }

      if (!isCancelled) {
        setChannelVideos(localMatches.length > 0 ? localMatches : videos.slice(0, 8));
      }
    };

    loadChannelContent();

    return () => {
      isCancelled = true;
    };
  }, [channel, videos]);

  // Dedicated Channel Shorts state and live fetch
  const [channelSpecificShorts, setChannelSpecificShorts] = useState<Video[]>([]);
  const [isLoadingShorts, setIsLoadingShorts] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const loadChannelShorts = async () => {
      // 1. Filter local existing shorts matching this channel
      const localMatchedShorts = shorts.filter(
        (s) =>
          (s.channelTitle && s.channelTitle.toLowerCase() === channel.title.toLowerCase()) ||
          (s.channelId && s.channelId === channel.id) ||
          s.title.toLowerCase().includes(channel.title.toLowerCase())
      );

      if (localMatchedShorts.length >= 4) {
        if (!isCancelled) {
          setChannelSpecificShorts(localMatchedShorts);
        }
        return;
      }

      // 2. Query live YouTube Shorts specifically for this channel handle/title
      setIsLoadingShorts(true);
      try {
        const searchQuery = `${channel.title} shorts`;
        const res = await fetch(`/api/youtube/shorts?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0 && !isCancelled) {
            const formatted = data.results.map((item: Video) => ({
              ...item,
              channelTitle: channel.title,
              channelAvatar: channel.avatar || item.channelAvatar,
            }));
            const seen = new Set(localMatchedShorts.map((s) => s.id));
            const merged = [...localMatchedShorts];
            for (const s of formatted) {
              if (!seen.has(s.id)) {
                merged.push(s);
                seen.add(s.id);
              }
            }
            setChannelSpecificShorts(merged);
            return;
          }
        }
      } catch (err) {
        console.warn('Channel shorts fetch error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingShorts(false);
        }
      }

      if (!isCancelled) {
        setChannelSpecificShorts(localMatchedShorts);
      }
    };

    loadChannelShorts();

    return () => {
      isCancelled = true;
    };
  }, [channel, shorts]);

  // Final Channel Shorts list
  const channelShorts = useMemo(() => {
    if (channelSpecificShorts.length > 0) return channelSpecificShorts;
    const matched = shorts.filter(
      (s) =>
        (s.channelTitle && s.channelTitle.toLowerCase() === channel.title.toLowerCase()) ||
        s.title.toLowerCase().includes(channel.title.toLowerCase())
    );
    return matched;
  }, [channel, shorts, channelSpecificShorts]);

  // Fetch Live Streams and Live Replays for this specific channel
  useEffect(() => {
    let isCancelled = false;

    const loadLiveReplays = async () => {
      setIsLoadingLiveReplays(true);
      try {
        const res = await fetch(`/api/youtube/live?channel=${encodeURIComponent(channel.title)}&limit=16`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0 && !isCancelled) {
            setChannelLiveReplays(data.results);
            return;
          }
        }
      } catch (err) {
        console.warn('Channel live replays fetch error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingLiveReplays(false);
        }
      }

      // Fallback: If no dedicated live endpoint results, synthesize or select suitable videos as live replays
      if (!isCancelled) {
        const fallbackReplays = channelVideos.slice(0, 6).map((v, i) => ({
          ...v,
          category: 'Live Replay',
          uploadedAt: i === 0 ? 'Disiarkan 2 hari lalu' : i === 1 ? 'Disiarkan 5 hari lalu' : 'Disiarkan 1 minggu lalu',
          tags: [...(v.tags || []), 'Replay', 'Live Stream'],
          duration: v.duration && v.duration.includes(':') && v.duration.split(':').length > 2 ? v.duration : '1:42:15',
        }));
        setChannelLiveReplays(fallbackReplays);
      }
    };

    loadLiveReplays();

    return () => {
      isCancelled = true;
    };
  }, [channel.title, channelVideos]);

  // Filter and sort Live Replays
  const sortedLiveReplays = useMemo(() => {
    let list = [...channelLiveReplays];

    if (channelSearch.trim()) {
      const q = channelSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
      );
    }

    if (liveFilterCategory === 'podcast') {
      list = list.filter((v) => v.title.toLowerCase().includes('podcast') || v.title.toLowerCase().includes('talk') || v.title.toLowerCase().includes('ngobrol'));
    } else if (liveFilterCategory === 'gaming') {
      list = list.filter((v) => v.title.toLowerCase().includes('game') || v.title.toLowerCase().includes('play') || v.title.toLowerCase().includes('mabar'));
    }

    if (liveSort === 'popular') {
      list.sort((a, b) => b.views - a.views);
    } else if (liveSort === 'longest') {
      list.sort((a, b) => b.duration.localeCompare(a.duration));
    }
    return list;
  }, [channelLiveReplays, liveSort, liveFilterCategory, channelSearch]);

  // Filter and sort videos
  const sortedVideos = useMemo(() => {
    let list = [...channelVideos];

    if (channelSearch.trim()) {
      const q = channelSearch.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q)));
    }

    if (videoSort === 'popular') {
      list.sort((a, b) => b.views - a.views);
    } else if (videoSort === 'oldest') {
      list.reverse();
    }
    return list;
  }, [channelVideos, videoSort, channelSearch]);

  const featuredVideo = sortedVideos[0] || null;

  return (
    <div id="channel-page-container" className="w-full min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 pb-20">
      {/* Top Mobile Back Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#272727] md:hidden">
        <button
          onClick={() => setCurrentView(previousView === 'channel' ? 'home' : previousView)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm truncate max-w-[200px]">{channel.title}</span>
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200"
          aria-label="Channel Info"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* 1. CHANNEL BANNER HEADER */}
      <div className="relative w-full h-32 sm:h-48 md:h-64 lg:h-72 bg-gradient-to-r from-gray-900 via-gray-800 to-black overflow-hidden select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            channel.banner ||
            `https://picsum.photos/seed/${encodeURIComponent(channel.title)}/1600/500`
          }
          alt={`${channel.title} Banner`}
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </div>

      {/* 2. CHANNEL PROFILE INFO SECTION (YouTube Format) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-gray-200 dark:border-[#272727]">
          {/* Big Channel Avatar */}
          <div className="relative shrink-0 -mt-12 sm:-mt-16 ring-4 ring-white dark:ring-[#0f0f0f] rounded-full overflow-hidden shadow-xl bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={channel.avatar}
              alt={channel.title}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-cover rounded-full bg-gray-900 shadow-md"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.channel-header-fallback')) {
                  const div = document.createElement('div');
                  div.className =
                    'channel-header-fallback w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center font-black text-4xl text-white bg-gradient-to-tr from-red-600 to-rose-700 shadow-md';
                  div.innerText = (channel.title || 'C').charAt(0).toUpperCase();
                  parent.appendChild(div);
                }
              }}
            />
          </div>

          {/* Channel Name, Handle, Sub Count & Bio */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {channel.title}
              </h1>
              {channel.verified && (
                <span title="Verified Creator">
                  <CheckCircle2 className="w-5 h-5 text-gray-500 fill-gray-400/20" />
                </span>
              )}
            </div>

            {/* Handle & Stats Line */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap font-medium">
              <span className="font-semibold text-gray-900 dark:text-gray-200">{channel.handle || `@${channel.title.replace(/\s+/g, '').toLowerCase()}`}</span>
              <span>&bull;</span>
              <span>{channel.subscribers} subscribers</span>
              <span>&bull;</span>
              <span>{channel.videosCount || channelVideos.length || 50} videos</span>
            </div>

            {/* Description Excerpt */}
            <div
              onClick={() => setIsAboutModalOpen(true)}
              className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-3xl cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors group flex items-baseline gap-1"
            >
              <span>{channel.description || 'Welcome to the official channel. Stream high quality videos, tutorials and playlists.'}</span>
              <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:underline inline-flex items-center text-xs">
                ...more <ChevronRight className="w-3.5 h-3.5 inline" />
              </span>
            </div>

            {/* Action Buttons: Subscribe, Bell, Share */}
            <div className="mt-4 flex items-center gap-2.5 flex-wrap">
              {/* Subscribe Button */}
              {isSubscribed ? (
                <div className="relative flex items-center bg-gray-100 dark:bg-[#272727] rounded-full border border-gray-300 dark:border-[#383838]">
                  <button
                    id="channel-page-subscribe-btn"
                    onClick={() => toggleSubscribe(channel.id)}
                    className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-l-full transition-colors"
                  >
                    Subscribed
                  </button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                  <button
                    id="channel-page-bell-btn"
                    onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                    className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-r-full transition-colors"
                    title="Notification preferences"
                    aria-label="Notification preferences"
                  >
                    <Bell className={`w-4 h-4 ${bellState === 'all' ? 'fill-current text-blue-500' : ''}`} />
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
                        <span>All Notifications</span>
                      </button>
                      <button
                        onClick={() => {
                          setBellState('personalized');
                          setIsBellMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#333] ${
                          bellState === 'personalized' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Personalized</span>
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
                        <span>None</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="channel-page-subscribe-btn"
                  onClick={() => toggleSubscribe(channel.id)}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-xs"
                >
                  Subscribe
                </button>
              )}

              {/* Share Channel Button */}
              <button
                id="channel-page-share-btn"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: channel.title,
                      text: `Check out ${channel.title} on NextTube!`,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert(`Copied link to ${channel.title}!`);
                  }
                }}
                className="px-4 py-2 rounded-full border border-gray-300 dark:border-[#383838] hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-800 dark:text-gray-200 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. YOUTUBE CHANNEL NAVIGATION TABS */}
        <div className="flex items-center justify-between mt-3 mb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { key: 'home', label: 'HOME' },
              { key: 'videos', label: 'VIDEOS' },
              { key: 'shorts', label: 'SHORTS' },
              { key: 'live', label: 'REPLAY LIVE', isLiveBadge: true },
              { key: 'playlists', label: 'PLAYLISTS' },
              { key: 'about', label: 'ABOUT' },
            ].map((tab) => (
              <button
                key={tab.key}
                id={`channel-tab-${tab.key}`}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setChannelSearch('');
                }}
                className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.isLiveBadge && (
                  <span className={`w-2 h-2 rounded-full ${activeTab === 'live' ? 'bg-red-500 animate-ping' : 'bg-red-600'}`} />
                )}
                <span>{tab.label}</span>
                {tab.isLiveBadge && channelLiveReplays.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'live' ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black' : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'}`}>
                    {channelLiveReplays.length}
                  </span>
                )}
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
                  placeholder={`Search ${channel.title}...`}
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
                title={`Search within ${channel.title}`}
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. TAB CONTENTS */}
        <div className="mt-6">
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Featured Video Highlight Banner */}
              {featuredVideo && !channelSearch && (
                <div
                  id="channel-featured-video"
                  onClick={() => playVideoById(featuredVideo.id, featuredVideo)}
                  className="group cursor-pointer flex flex-col md:flex-row gap-6 p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#3d3d3d] transition-all"
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
                      Featured Upload
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {featuredVideo.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {featuredVideo.description || 'Stream and learn directly on NextTube with full SponsorBlock and DeArrow support.'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium">
                      <span>{new Intl.NumberFormat().format(featuredVideo.views)} views</span>
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
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Latest Uploads</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {sortedVideos.slice(0, 8).map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>

              {/* Shorts on Home */}
              {channelShorts.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#272727]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span>{channel.title} Shorts</span>
                    </h2>
                    <button
                      onClick={() => setActiveTab('shorts')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all shorts
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {channelShorts.slice(0, 6).map((short) => (
                      <div
                        key={short.id}
                        onClick={() => playVideoById(short.id, short)}
                        className="group cursor-pointer flex flex-col"
                      >
                        <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-xs group-hover:scale-102 transition-transform">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={short.thumbnailUrl}
                            alt={short.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                            <p className="text-white text-xs font-bold line-clamp-2 leading-tight drop-shadow-sm">
                              {short.title}
                            </p>
                            <span className="text-gray-300 text-[10px] mt-1 font-medium">
                              {short.views ? new Intl.NumberFormat().format(short.views) : '120K'} views
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Streams & Replays on Home */}
              {channelLiveReplays.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#272727]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                      <span>Replay Live & Siaran Langsung</span>
                    </h2>
                    <button
                      onClick={() => setActiveTab('live')}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      <span>Lihat semua replay ({channelLiveReplays.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                    {channelLiveReplays.slice(0, 4).map((replay) => (
                      <VideoCard key={replay.id} video={replay} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIDEOS */}
          {activeTab === 'videos' && (
            <div>
              {/* Sort Filter Chips */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {[
                  { key: 'latest', label: 'Latest' },
                  { key: 'popular', label: 'Popular' },
                  { key: 'oldest', label: 'Oldest' },
                ].map((sortOption) => (
                  <button
                    key={sortOption.key}
                    id={`sort-tab-${sortOption.key}`}
                    onClick={() => setVideoSort(sortOption.key as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      videoSort === sortOption.key
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black font-semibold'
                        : 'bg-gray-100 dark:bg-[#272727] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                    }`}
                  >
                    {sortOption.label}
                  </button>
                ))}
              </div>

              {/* Videos Grid */}
              {sortedVideos.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-base font-semibold">No videos found for this search</p>
                  <p className="text-xs mt-1">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {sortedVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SHORTS */}
          {activeTab === 'shorts' && (
            <div>
              {isLoadingShorts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-200 dark:bg-[#202020] animate-pulse" />
                  ))}
                </div>
              ) : channelShorts.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#202020] flex items-center justify-center mx-auto mb-3 text-red-500">
                    <Flame className="w-6 h-6" />
                  </div>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200">Belum ada Shorts dari {channel.title}</p>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Kreator ini belum membagikan video berformat Shorts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {channelShorts.map((short) => (
                    <div
                      key={short.id}
                      onClick={() => playVideoById(short.id, short)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-xs group-hover:scale-102 transition-transform">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={short.thumbnailUrl}
                          alt={short.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                          <p className="text-white text-xs font-bold line-clamp-2 leading-tight drop-shadow-sm">
                            {short.title}
                          </p>
                          <span className="text-gray-300 text-[10px] mt-1 font-medium">
                            {short.views ? new Intl.NumberFormat().format(short.views) : '120K'} views
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPLAY LIVE (LIVE STREAMS & REPLAYS) */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              {/* Featured / Most Recent Live Replay Spotlight */}
              {sortedLiveReplays.length > 0 && !channelSearch && (
                <div
                  id="channel-featured-live-replay"
                  onClick={() => playVideoById(sortedLiveReplays[0].id, sortedLiveReplays[0])}
                  className="group cursor-pointer flex flex-col md:flex-row gap-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/20 via-gray-50 to-gray-50 dark:from-red-950/30 dark:via-[#181818] dark:to-[#181818] border border-red-200/60 dark:border-red-900/30 hover:border-red-400 dark:hover:border-red-700/60 transition-all shadow-xs"
                >
                  <div className="relative w-full md:w-80 lg:w-96 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sortedLiveReplays[0].thumbnailUrl}
                      alt={sortedLiveReplays[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-lg">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>{sortedLiveReplays[0].isLive ? 'LIVE NOW' : 'REPLAY LIVE'}</span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/85 backdrop-blur-xs text-white text-xs font-semibold rounded-md">
                      {sortedLiveReplays[0].duration || '1:34:00'}
                    </div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all">
                      <div className="w-13 h-13 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 ml-0.5 fill-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5" />
                        <span>Siaran Langsung Unggulan</span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Live Chat Replay Tersedia</span>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {sortedLiveReplays[0].title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {sortedLiveReplays[0].description || 'Tonton rekaman siaran langsung lengkap tanpa potongan iklan berlebihan, didukung SponsorBlock dan playback mulus.'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3.5 font-medium flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {new Intl.NumberFormat().format(sortedLiveReplays[0].views)} total tontonan
                      </span>
                      <span>&bull;</span>
                      <span>{sortedLiveReplays[0].uploadedAt}</span>
                      <span>&bull;</span>
                      <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Tonton Replay</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter and Sort Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                {/* Sort Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: 'latest', label: 'Siaran Terbaru' },
                    { key: 'popular', label: 'Terpopuler' },
                    { key: 'longest', label: 'Durasi Terpanjang' },
                  ].map((sortOpt) => (
                    <button
                      key={sortOpt.key}
                      id={`live-sort-${sortOpt.key}`}
                      onClick={() => setLiveSort(sortOpt.key as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        liveSort === sortOpt.key
                          ? 'bg-red-600 text-white font-semibold shadow-xs'
                          : 'bg-gray-100 dark:bg-[#272727] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                      }`}
                    >
                      {sortOpt.label}
                    </button>
                  ))}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: 'all', label: 'Semua Replay' },
                    { key: 'podcast', label: 'Podcast / Talk' },
                    { key: 'gaming', label: 'Gaming Stream' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      id={`live-cat-${cat.key}`}
                      onClick={() => setLiveFilterCategory(cat.key as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
                        liveFilterCategory === cat.key
                          ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500 font-bold'
                          : 'border-gray-200 dark:border-[#383838] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Replays Grid */}
              {isLoadingLiveReplays ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col gap-2.5 animate-pulse">
                      <div className="w-full aspect-video rounded-xl bg-gray-200 dark:bg-[#202020]" />
                      <div className="h-4 bg-gray-200 dark:bg-[#202020] rounded-md w-4/5" />
                      <div className="h-3 bg-gray-200 dark:bg-[#202020] rounded-md w-1/2" />
                    </div>
                  ))}
                </div>
              ) : sortedLiveReplays.length === 0 ? (
                <div className="text-center py-16 text-gray-500 rounded-2xl border border-dashed border-gray-200 dark:border-[#272727] p-8">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
                    <Radio className="w-7 h-7" />
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    Tidak ada Replay Live untuk &quot;{channel.title}&quot;
                  </p>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Kreator ini belum memiliki rekaman siaran live publik atau cobalah ubah filter pencarian di atas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {sortedLiveReplays.map((replay) => (
                    <VideoCard key={replay.id} video={replay} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PLAYLISTS */}
          {activeTab === 'playlists' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { title: 'Full Series & Masterclasses', count: 18, thumb: channelVideos[0]?.thumbnailUrl },
                { title: 'Podcasts & Deep Talks', count: 12, thumb: channelVideos[1]?.thumbnailUrl },
                { title: 'Quick Tips & Best Practices', count: 24, thumb: channelVideos[2]?.thumbnailUrl },
                { title: 'Popular Highlights', count: 9, thumb: channelVideos[3]?.thumbnailUrl },
              ].map((pl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (channelVideos[idx]) {
                      playVideoById(channelVideos[idx].id, channelVideos[idx]);
                    }
                  }}
                  className="group cursor-pointer flex flex-col rounded-xl overflow-hidden bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] hover:shadow-md transition-all"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pl.thumb || channel.avatar}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-y-0 right-0 w-28 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                      <Layers className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{pl.count}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-300">Videos</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{pl.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{channel.title} &bull; Playlist</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Bio & Description */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {channel.description || 'Welcome to the official NextTube channel. Discover high-definition videos, insightful tutorials, and real-time live content.'}
                  </p>
                </div>

                {channel.links && channel.links.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-[#272727]">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Links</h3>
                    <div className="space-y-2">
                      {channel.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Channel Stats & Details */}
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] space-y-4 h-fit">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  Stats
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#272727]">
                    <span className="text-gray-500">Joined</span>
                    <span className="font-medium">{channel.joinedDate || 'Jan 15, 2021'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#272727]">
                    <span className="text-gray-500">Total Views</span>
                    <span className="font-medium">{channel.viewsCount || '18.4M views'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#272727]">
                    <span className="text-gray-500">Subscribers</span>
                    <span className="font-medium">{channel.subscribers}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium">Indonesia / Global</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ABOUT MODAL (when clicking ...more) */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1f1f1f] rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-[#383838] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#2f2f2f]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">About {channel.title}</h3>
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2f2f2f] text-gray-500 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>{channel.description || 'Official NextTube Creator channel.'}</p>

              <div className="pt-4 border-t border-gray-200 dark:border-[#2f2f2f] space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Channel details</h4>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{channel.subscribers}</span> subscribers &bull;{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{channel.videosCount || 100}</span> videos &bull;{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{channel.viewsCount || '15M'}</span> views
                </p>
                <p className="text-xs text-gray-500">Joined {channel.joinedDate || 'Jan 2021'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
