'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Video, Channel, Comment, User, NotificationItem, PageView, SponsorBlockSettings, SponsorCategory, DeArrowSettings } from '@/types';
import { INITIAL_VIDEOS, INITIAL_COMMENTS } from '@/data/videos';
import { INITIAL_CHANNELS } from '@/data/channels';
import { INITIAL_SHORTS } from '@/data/shorts';
import { DEFAULT_SPONSORBLOCK_SETTINGS } from '@/lib/sponsorblock';
import { DEFAULT_DEARROW_SETTINGS } from '@/lib/dearrow';
import { getStoredItem, setStoredItem } from '@/lib/indexedDB';
import { filterFreshVideos, isFreshAndHotVideo } from '@/lib/video-freshness';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  signInDemoUser: () => void;
  signOut: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  videos: Video[];
  shorts: Video[];
  fetchShorts: (query?: string) => Promise<void>;
  searchResults: Video[];
  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  playVideoById: (id: string, fallbackVideo?: Video) => void;
  playDirectYouTubeVideo: (youtubeIdOrUrl: string) => Promise<void>;
  addNewVideo: (video: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadedAt' | 'commentsCount'>) => void;
  searchYouTube: (query: string) => Promise<Video[]>;

  // Mini Floating PiP Player
  isMiniPlayerDismissed: boolean;
  dismissMiniPlayer: () => void;
  restoreWatchPage: () => void;
  isPlayerPlaying: boolean;
  setIsPlayerPlaying: (playing: boolean) => void;
  togglePlayerPlay: () => void;
  playerCurrentTime: number;
  setPlayerCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  playerDuration: number;
  setPlayerDuration: React.Dispatch<React.SetStateAction<number>>;

  sponsorBlockSettings: SponsorBlockSettings;
  setSponsorBlockSettings: React.Dispatch<React.SetStateAction<SponsorBlockSettings>>;
  updateSponsorBlockSettings: (partial: Partial<SponsorBlockSettings>) => void;
  toggleSponsorCategory: (category: SponsorCategory) => void;

  deArrowSettings: DeArrowSettings;
  setDeArrowSettings: React.Dispatch<React.SetStateAction<DeArrowSettings>>;
  updateDeArrowSettings: (partial: Partial<DeArrowSettings>) => void;
  resetDeArrowSettings: () => void;

  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  previousView: PageView;
  setPreviousView: (view: PageView) => void;

  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel | null) => void;
  openChannel: (channelOrTitle: Channel | string, fallbackAvatar?: string, channelId?: string, handle?: string) => void;
  updateChannelInState: (updated: Channel) => void;
  minimizeWatchToPopUp: () => void;

  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  removeSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  channels: Channel[];
  subscribedChannelIds: string[];
  toggleSubscribe: (channelId: string) => void;

  likedVideoIds: string[];
  dislikedVideoIds: string[];
  toggleLikeVideo: (videoId: string) => void;
  toggleDislikeVideo: (videoId: string) => void;

  watchLaterIds: string[];
  toggleWatchLater: (videoId: string) => void;

  historyVideoIds: string[];
  clearHistory: () => void;

  comments: Record<string, Comment[]>;
  addComment: (videoId: string, text: string) => void;
  toggleCommentLike: (videoId: string, commentId: string) => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;

  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: (open: boolean) => void;

  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;

  isLoadingVideos: boolean;
  setIsLoadingVideos: (loading: boolean) => void;
  fetchTrendingVideos: (forceRefresh?: boolean, category?: string) => Promise<void>;
  loadMoreVideos: () => Promise<void>;
  isFetchingMore: boolean;

  shareModalVideo: Video | null;
  setShareModalVideo: (video: Video | null) => void;

  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationsAsRead: () => void;
}

const DEFAULT_USER: User = {
  id: 'user-default',
  name: 'Developer Account',
  email: 'developer@nexttube.app',
  avatar: '/friends/saddam.jpg',
  handle: '@nexttube_creator',
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'freeCodeCamp.org uploaded: Next.js 15 Full Tutorial & App Router',
    channelName: 'freeCodeCamp.org',
    channelAvatar: '/images/freecodecomp.png',
    timeAgo: '2 hours ago',
    thumbnail: 'https://i.ytimg.com/vi/1WmNXEVia8I/hqdefault.jpg',
    isRead: false,
    videoId: 'v-1',
  },
  {
    id: 'n-2',
    title: 'Programming with Mosh is live: Master Modern TypeScript & React',
    channelName: 'Programming with Mosh',
    channelAvatar: '/images/mos.jpg',
    timeAgo: '5 hours ago',
    thumbnail: 'https://i.ytimg.com/vi/Ke90Tje7VS0/hqdefault.jpg',
    isRead: false,
    videoId: 'v-4',
  },
  {
    id: 'n-3',
    title: 'Harvard CS50 posted new lecture materials: CS50 AI Algorithms',
    channelName: 'Harvard CS50',
    channelAvatar: '/images/cs.png',
    timeAgo: '1 day ago',
    thumbnail: 'https://i.ytimg.com/vi/jS4aFq5-91M/hqdefault.jpg',
    isRead: true,
    videoId: 'v-6',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>(INITIAL_SHORTS);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [previousView, setPreviousView] = useState<PageView>('home');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState<string[]>([]);
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [dislikedVideoIds, setDislikedVideoIds] = useState<string[]>([]);
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>([]);
  const [historyVideoIds, setHistoryVideoIds] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [recommendationPage, setRecommendationPage] = useState<number>(1);
  const [shareModalVideo, setShareModalVideo] = useState<Video | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Initialize and load persistent user data from IndexedDB
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const hydrateFromIndexedDB = async () => {
      try {
        const todayKey = new Date().toDateString();
        const [
          savedSubs,
          savedCustomChannels,
          savedLikes,
          savedDislikes,
          savedWatchLater,
          savedHistory,
          savedDark,
          savedSearchHist,
          savedDailyVideos,
          savedDailyDate,
        ] = await Promise.all([
          getStoredItem<string[]>('subscribedChannelIds', []),
          getStoredItem<Channel[]>('channels', INITIAL_CHANNELS),
          getStoredItem<string[]>('likedVideoIds', ['v-1', 'v-2']),
          getStoredItem<string[]>('dislikedVideoIds', []),
          getStoredItem<string[]>('watchLaterIds', ['v-3', 'v-6']),
          getStoredItem<string[]>('historyVideoIds', ['v-1', 'v-2', 'v-4']),
          getStoredItem<boolean | null>('isDarkMode', null),
          getStoredItem<string[]>('searchHistory', []),
          getStoredItem<Video[]>('dailyHomeVideos', []),
          getStoredItem<string>('dailyHomeDate', ''),
        ]);

        if (!isCancelled) {
          const subs = Array.isArray(savedSubs) ? savedSubs : [];
          setSubscribedChannelIds(subs);

          // Merge default channels with saved channels from IndexedDB
          const channelMap = new Map<string, Channel>();
          INITIAL_CHANNELS.forEach((c) => channelMap.set(c.id, { ...c, isSubscribed: subs.includes(c.id) }));
          if (Array.isArray(savedCustomChannels)) {
            savedCustomChannels.forEach((c) => {
              if (c && c.id) {
                channelMap.set(c.id, {
                  ...c,
                  isSubscribed: subs.includes(c.id),
                });
              }
            });
          }
          setChannels(Array.from(channelMap.values()));

          if (Array.isArray(savedLikes)) setLikedVideoIds(savedLikes);
          if (Array.isArray(savedDislikes)) setDislikedVideoIds(savedDislikes);
          if (Array.isArray(savedWatchLater)) setWatchLaterIds(savedWatchLater);
          if (Array.isArray(savedHistory)) setHistoryVideoIds(savedHistory);
          if (typeof savedDark === 'boolean') setIsDarkMode(savedDark);
          if (Array.isArray(savedSearchHist)) {
            // Filter out any leftover initial mock search items
            const cleanedHistory = savedSearchHist.filter(
              (item) =>
                item &&
                typeof item === 'string' &&
                item !== 'Next.js 15 Full Course' &&
                item !== 'React Hooks' &&
                item !== 'CS50 AI' &&
                item !== 'TypeScript Crash Course'
            );
            setSearchHistory(cleanedHistory);
          }

          if (typeof window !== 'undefined') {
            setIsSidebarOpen(window.innerWidth >= 1024);
          }

          setIsHydrated(true);
        }
      } catch (e) {
        console.warn('IndexedDB initial load note:', e);
        if (!isCancelled) setIsHydrated(true);
      }
    };

    hydrateFromIndexedDB();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Save changes to IndexedDB when user updates state
  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('subscribedChannelIds', subscribedChannelIds);
  }, [subscribedChannelIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('channels', channels);
  }, [channels, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('likedVideoIds', likedVideoIds);
  }, [likedVideoIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('dislikedVideoIds', dislikedVideoIds);
  }, [dislikedVideoIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('watchLaterIds', watchLaterIds);
  }, [watchLaterIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('historyVideoIds', historyVideoIds);
  }, [historyVideoIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('isDarkMode', isDarkMode);
  }, [isDarkMode, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredItem('searchHistory', searchHistory);
  }, [searchHistory, isHydrated]);

  const addSearchHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 20);
    });
  }, []);

  const removeSearchHistory = useCallback((query: string) => {
    setSearchHistory((prev) => prev.filter((item) => item.toLowerCase() !== query.toLowerCase()));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Floating PiP Miniplayer states
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState<boolean>(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState<boolean>(true);
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(0);
  const [playerDuration, setPlayerDuration] = useState<number>(0);

  const dismissMiniPlayer = useCallback(() => {
    setIsMiniPlayerDismissed(true);
  }, []);

  const restoreWatchPage = useCallback(() => {
    setIsMiniPlayerDismissed(false);
    setCurrentView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const togglePlayerPlay = useCallback(() => {
    setIsPlayerPlaying((prev) => !prev);
  }, []);

  // Fetch real trending YouTube shorts
  const fetchShorts = useCallback(async (query: string = '#shorts viral trending') => {
    try {
      const res = await fetch(`/api/youtube/shorts?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        setShorts((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newItems = data.results.filter((r: Video) => !existingIds.has(r.id));
          return [...prev, ...newItems];
        });
      }
    } catch (e) {
      console.log('Shorts fetch notice:', e);
    }
  }, []);

  // Load initial live shorts on mount
  useEffect(() => {
    let isCancelled = false;

    const loadLiveShorts = async () => {
      try {
        const res = await fetch(`/api/youtube/shorts?q=${encodeURIComponent('#shorts viral trending')}`);
        if (!res.ok || isCancelled) return;
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0 && !isCancelled) {
          setShorts((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newItems = data.results.filter((r: Video) => !existingIds.has(r.id));
            return [...prev, ...newItems];
          });
        }
      } catch (e) {
        console.log('Shorts initial fetch notice:', e);
      }
    };

    loadLiveShorts();

    return () => {
      isCancelled = true;
    };
  }, []);

  // SponsorBlock user preferences
  const [sponsorBlockSettings, setSponsorBlockSettings] = useState<SponsorBlockSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexttube_sponsorblock_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_SPONSORBLOCK_SETTINGS,
            ...parsed,
            categories: {
              ...DEFAULT_SPONSORBLOCK_SETTINGS.categories,
              ...(parsed.categories || {}),
            },
          };
        }
      } catch {}
    }
    return DEFAULT_SPONSORBLOCK_SETTINGS;
  });

  // Save SponsorBlock settings on update
  const updateSponsorBlockSettings = useCallback((partial: Partial<SponsorBlockSettings>) => {
    setSponsorBlockSettings((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexttube_sponsorblock_settings', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const toggleSponsorCategory = useCallback((category: SponsorCategory) => {
    setSponsorBlockSettings((prev) => {
      const next = {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: !prev.categories[category],
        },
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexttube_sponsorblock_settings', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  // DeArrow user preferences
  const [deArrowSettings, setDeArrowSettings] = useState<DeArrowSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexttube_dearrow_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_DEARROW_SETTINGS,
            ...parsed,
          };
        }
      } catch {}
    }
    return DEFAULT_DEARROW_SETTINGS;
  });

  // Save DeArrow settings on update
  const updateDeArrowSettings = useCallback((partial: Partial<DeArrowSettings>) => {
    setDeArrowSettings((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexttube_dearrow_settings', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const resetDeArrowSettings = useCallback(() => {
    setDeArrowSettings(DEFAULT_DEARROW_SETTINGS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexttube_dearrow_settings', JSON.stringify(DEFAULT_DEARROW_SETTINGS));
      } catch {}
    }
  }, []);

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load and auto-update live YouTube recommendations for Home feed
  const fetchTrendingVideos = useCallback(async (isSilent = false, category?: string, forceRefresh = false) => {
    try {
      if (!isSilent) setIsLoadingVideos(true);
      const catParam = category && category !== 'All' ? `&category=${encodeURIComponent(category)}` : '';
      const refreshParam = forceRefresh ? '&refresh=true' : '';
      const res = await fetch(`/api/youtube/trending?_t=${Date.now()}${catParam}${refreshParam}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const freshTrending: Video[] = data.results as Video[];
        setVideos((prev) => {
          // Keep user custom uploads
          const userUploads = prev.filter((v) => v.id.startsWith('v-') || v.id.startsWith('custom-'));
          return [...userUploads, ...freshTrending];
        });
      }
    } catch (e) {
      console.log('Daily trending sync notice:', e);
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  // Load more recommendations for infinite scroll
  const loadMoreVideos = useCallback(async () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = recommendationPage + 1;
      const catParam = selectedCategory && selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      const res = await fetch(`/api/youtube/trending?page=${nextPage}${catParam}&_t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newUnique = (data.results as Video[]).filter((v) => !existingIds.has(v.id));
          return [...prev, ...newUnique];
        });
        setRecommendationPage(nextPage);
      }
    } catch (err) {
      console.warn('Error loading more recommendations:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, recommendationPage, selectedCategory]);

  // Fetch fresh recommendations on mount and sync periodically (every 5 minutes)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        fetchTrendingVideos(true, undefined, true);
      }
    }, 0);

    const interval = setInterval(() => {
      if (isMounted) {
        fetchTrendingVideos(true);
      }
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchTrendingVideos]);

  // Live YouTube search function
  const searchYouTube = useCallback(async (query: string): Promise<Video[]> => {
    if (!query.trim()) return [];
    setIsLoadingVideos(true);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const results: Video[] = Array.isArray(data.results) ? data.results : [];

      setSearchResults(results);

      // Merge into master video list so all actions (Watch, Like, History) seamlessly work
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const newItems = results.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });

      return results;
    } catch (err) {
      console.error('Failed to perform YouTube search:', err);
      return [];
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  // Effect to automatically search YouTube whenever searchQuery changes
  const lastSearchedRef = useRef<string>('');
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      const resetTimer = setTimeout(() => setSearchResults([]), 0);
      lastSearchedRef.current = '';
      return () => clearTimeout(resetTimer);
    }

    if (trimmed === lastSearchedRef.current) return;
    lastSearchedRef.current = trimmed;

    const timer = setTimeout(() => {
      searchYouTube(trimmed);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, searchYouTube]);

  // Effect to fetch real YouTube videos when a specific category is clicked if list is sparse
  const lastCategoryRef = useRef<string>('All');
  useEffect(() => {
    if (selectedCategory === 'All' || searchQuery.trim()) return;
    if (selectedCategory === lastCategoryRef.current) return;
    lastCategoryRef.current = selectedCategory;

    let targetQuery = `${selectedCategory} video terbaru`;
    if (selectedCategory === '🔥 Rame & Viral' || selectedCategory.includes('Rame')) {
      targetQuery = 'video viral yang lagi rame hari ini';
    } else if (selectedCategory === 'TikTok Hits') {
      targetQuery = 'viral tiktok hits terbaru indonesia';
    } else if (selectedCategory === 'Trending') {
      targetQuery = 'trending youtube indonesia hari ini';
    } else if (selectedCategory === 'Live Replay') {
      targetQuery = 'live stream replay viral';
    }

    fetch(`/api/youtube/search?q=${encodeURIComponent(targetQuery)}&limit=16`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.results) && data.results.length > 0) {
          setVideos((prev) => {
            const existingIds = new Set(prev.map((v) => v.id));
            const newItems = data.results.filter((r: Video) => !existingIds.has(r.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch((e) => console.log('Category auto-fill note:', e));
  }, [selectedCategory, searchQuery]);

  const signInDemoUser = () => {
    setUser(DEFAULT_USER);
    setIsLoginModalOpen(false);
  };

  const signOut = () => {
    setUser(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const playVideoById = (id: string, fallbackVideo?: Video) => {
    // Search in videos, shorts, searchResults, or use provided fallback
    let found = videos.find((v) => v.id === id);
    if (!found) {
      found = shorts.find((s) => s.id === id);
    }
    if (!found) {
      found = searchResults.find((v) => v.id === id);
    }
    if (!found && fallbackVideo && fallbackVideo.id === id) {
      found = fallbackVideo;
      setVideos((prev) => [fallbackVideo, ...prev]);
    }

    if (!found && id.startsWith('yt-')) {
      const ytId = id.replace(/^yt-/, '');
      found = {
        id,
        youtubeId: ytId,
        title: 'YouTube Video',
        description: 'Watch video seamlessly on NextTube.',
        channelTitle: 'YouTube Creator',
        channelId: `c-${ytId}`,
        channelAvatar: `https://picsum.photos/seed/${ytId}/100/100`,
        subscriberCount: '100K',
        verified: true,
        thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        views: 25000,
        likes: 1200,
        dislikes: 10,
        uploadedAt: 'Recently',
        duration: '10:00',
        category: 'YouTube',
        tags: ['YouTube', 'Video'],
        commentsCount: 24,
      };
      setVideos((prev) => [found!, ...prev]);
    }

    if (found) {
      if (activeVideo?.id !== id) {
        setPlayerCurrentTime(0);
      }
      setActiveVideo(found);
      setIsMiniPlayerDismissed(false);
      setIsPlayerPlaying(true);
      setCurrentView('watch');
      // Add to history
      setHistoryVideoIds((prev) => {
        const filtered = prev.filter((item) => item !== id);
        return [id, ...filtered];
      });
      // Increment view count
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, views: v.views + 1 } : v))
      );
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const playDirectYouTubeVideo = async (input: string) => {
    if (!input.trim()) return;
    setIsLoadingVideos(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const targetVideo = data.results[0];
        setVideos((prev) => {
          const exists = prev.some((v) => v.id === targetVideo.id);
          return exists ? prev : [targetVideo, ...prev];
        });
        if (activeVideo?.id !== targetVideo.id) {
          setPlayerCurrentTime(0);
        }
        setActiveVideo(targetVideo);
        setIsMiniPlayerDismissed(false);
        setIsPlayerPlaying(true);
        setCurrentView('watch');
        setHistoryVideoIds((prev) => [targetVideo.id, ...prev.filter((id) => id !== targetVideo.id)]);
      }
    } catch (e) {
      console.error('Failed to play direct YouTube link:', e);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const addNewVideo = (
    newVid: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'uploadedAt' | 'commentsCount'>
  ) => {
    const newVideoItem: Video = {
      ...newVid,
      id: `v-${Date.now()}`,
      views: 1,
      likes: 1,
      dislikes: 0,
      uploadedAt: 'Just now',
      commentsCount: 0,
    };
    setVideos((prev) => [newVideoItem, ...prev]);
    setIsUploadModalOpen(false);
  };

  const toggleSubscribe = (channelId: string) => {
    if (!channelId) return;

    let willBeSubscribed = false;

    setSubscribedChannelIds((prev) => {
      const exists = prev.includes(channelId);
      willBeSubscribed = !exists;
      const next = exists ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexttube_subscribedChannelIds', JSON.stringify(next));
          localStorage.setItem('nexttube_subscriptions', JSON.stringify(next));
        } catch {}
      }
      setStoredItem('subscribedChannelIds', next);
      return next;
    });

    setChannels((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.id === channelId || c.title.toLowerCase() === channelId.toLowerCase()
      );

      let nextChannels: Channel[];
      if (existingIndex >= 0) {
        nextChannels = prev.map((c, i) =>
          i === existingIndex ? { ...c, isSubscribed: !c.isSubscribed } : c
        );
      } else {
        // Find matching video or active context to synthesize channel
        const matchingVideo =
          videos.find((v) => v.channelId === channelId || v.channelTitle.toLowerCase() === channelId.toLowerCase()) ||
          (activeVideo && (activeVideo.channelId === channelId || activeVideo.channelTitle.toLowerCase() === channelId.toLowerCase()) ? activeVideo : null);

        const cleanTitle = matchingVideo?.channelTitle || channelId.replace(/^c-/, '');
        const newChannel: Channel = {
          id: channelId,
          title: cleanTitle,
          avatar:
            matchingVideo?.channelAvatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanTitle)}&backgroundColor=e11d48,2563eb,d97706`,
          banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&auto=format&fit=crop&q=80',
          handle: `@${cleanTitle.replace(/\s+/g, '').toLowerCase()}`,
          subscribers: matchingVideo?.subscriberCount || '120K+',
          verified: matchingVideo?.verified ?? true,
          isSubscribed: true,
          videosCount: 24,
          description: `Official NextTube channel for ${cleanTitle}.`,
          joinedDate: 'Joined recently',
          viewsCount: '1.5M views',
        };
        nextChannels = [newChannel, ...prev];
      }

      setStoredItem('channels', nextChannels);
      return nextChannels;
    });

    setActiveChannel((prev) => {
      if (prev && (prev.id === channelId || prev.title.toLowerCase() === channelId.toLowerCase())) {
        return { ...prev, isSubscribed: !prev.isSubscribed };
      }
      return prev;
    });
  };

  const toggleLikeVideo = (videoId: string) => {
    const isLiked = likedVideoIds.includes(videoId);
    if (isLiked) {
      setLikedVideoIds((prev) => prev.filter((id) => id !== videoId));
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, likes: Math.max(0, v.likes - 1) } : v))
      );
    } else {
      setLikedVideoIds((prev) => [...prev, videoId]);
      setDislikedVideoIds((prev) => prev.filter((id) => id !== videoId));
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, likes: v.likes + 1 } : v))
      );
    }
  };

  const toggleDislikeVideo = (videoId: string) => {
    const isDisliked = dislikedVideoIds.includes(videoId);
    if (isDisliked) {
      setDislikedVideoIds((prev) => prev.filter((id) => id !== videoId));
    } else {
      setDislikedVideoIds((prev) => [...prev, videoId]);
      setLikedVideoIds((prev) => prev.filter((id) => id !== videoId));
    }
  };

  const toggleWatchLater = (videoId: string) => {
    setWatchLaterIds((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((id) => id !== videoId);
      }
      return [...prev, videoId];
    });
  };

  const clearHistory = () => {
    setHistoryVideoIds([]);
  };

  const addComment = (videoId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      videoId,
      authorName: user?.name || 'Guest User',
      authorAvatar: user?.avatar || '/friends/saddam.jpg',
      text: text.trim(),
      likes: 0,
      createdAt: 'Just now',
    };

    setComments((prev) => ({
      ...prev,
      [videoId]: [newComment, ...(prev[videoId] || [])],
    }));

    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, commentsCount: v.commentsCount + 1 } : v))
    );
  };

  const toggleCommentLike = (videoId: string, commentId: string) => {
    setComments((prev) => {
      const vidComments = prev[videoId] || [];
      const updated = vidComments.map((c) => {
        if (c.id === commentId) {
          const isLiked = c.isLiked;
          return {
            ...c,
            isLiked: !isLiked,
            likes: isLiked ? c.likes - 1 : c.likes + 1,
          };
        }
        return c;
      });
      return { ...prev, [videoId]: updated };
    });
  };

  const updateChannelInState = useCallback((updated: Channel) => {
    if (!updated || !updated.id) return;
    setChannels((prev) => {
      const index = prev.findIndex((c) => c.id === updated.id || c.title.toLowerCase() === updated.title.toLowerCase());
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...updated };
        return next;
      }
      return [updated, ...prev];
    });

    setActiveChannel((prev) => {
      if (prev && (prev.id === updated.id || prev.title.toLowerCase() === updated.title.toLowerCase())) {
        return { ...prev, ...updated };
      }
      return prev;
    });
  }, []);

  const openChannel = useCallback(
    (
      channelOrTitle: Channel | string,
      fallbackAvatar?: string,
      channelId?: string,
      handle?: string
    ) => {
      let matchedChannel: Channel | null = null;
      if (typeof channelOrTitle === 'object' && channelOrTitle !== null) {
        matchedChannel = channelOrTitle;
      } else {
        const titleOrId = String(channelOrTitle).trim();
        const candidateId = channelId || (titleOrId.startsWith('c-') || titleOrId.startsWith('UC') ? titleOrId : '');
        
        matchedChannel =
          channels.find(
            (c) =>
              (candidateId && c.id === candidateId) ||
              c.id === titleOrId ||
              c.title.toLowerCase() === titleOrId.toLowerCase() ||
              (c.handle && c.handle.toLowerCase() === titleOrId.toLowerCase()) ||
              (handle && c.handle && c.handle.toLowerCase() === handle.toLowerCase())
          ) || null;

        if (!matchedChannel) {
          const cleanTitle = titleOrId.replace(/^c-/, '');
          const finalHandle = handle || `@${cleanTitle.replace(/\s+/g, '').toLowerCase()}`;
          const finalId = channelId || `c-${cleanTitle.replace(/\s+/g, '-').toLowerCase()}`;
          
          matchedChannel = {
            id: finalId,
            title: cleanTitle,
            avatar:
              fallbackAvatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanTitle)}&backgroundColor=e11d48,2563eb,d97706`,
            banner: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&auto=format&fit=crop&q=80`,
            handle: finalHandle,
            subscribers: '120K+',
            verified: true,
            isSubscribed: subscribedChannelIds.includes(finalId),
            videosCount: 45,
            description: `Official NextTube channel for ${cleanTitle}. Explore exclusive videos, tutorials, and content.`,
            joinedDate: 'Joined recently',
            viewsCount: '2.4M views',
          };
          setChannels((prev) => [matchedChannel!, ...prev]);
        }
      }

      // Sync subscribed state with subscribedChannelIds
      if (matchedChannel) {
        matchedChannel = {
          ...matchedChannel,
          isSubscribed: subscribedChannelIds.includes(matchedChannel.id),
        };
      }

      setActiveChannel(matchedChannel);
      setPreviousView(currentView);
      setCurrentView('channel');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [channels, currentView, subscribedChannelIds]
  );

  const minimizeWatchToPopUp = useCallback(() => {
    if (currentView === 'watch') {
      setIsMiniPlayerDismissed(false);
      setCurrentView(previousView === 'watch' ? 'home' : previousView);
    }
  }, [currentView, previousView]);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        signInDemoUser,
        signOut,
        isLoginModalOpen,
        setIsLoginModalOpen,
        videos,
        shorts,
        fetchShorts,
        searchResults,
        activeVideo,
        setActiveVideo,
        playVideoById,
        playDirectYouTubeVideo,
        addNewVideo,
        searchYouTube,
        isMiniPlayerDismissed,
        dismissMiniPlayer,
        restoreWatchPage,
        isPlayerPlaying,
        setIsPlayerPlaying,
        togglePlayerPlay,
        playerCurrentTime,
        setPlayerCurrentTime,
        playerDuration,
        setPlayerDuration,
        currentView,
        setCurrentView,
        previousView,
        setPreviousView,
        activeChannel,
        setActiveChannel,
        openChannel,
        updateChannelInState,
        minimizeWatchToPopUp,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        searchHistory,
        addSearchHistory,
        removeSearchHistory,
        clearSearchHistory,
        channels,
        subscribedChannelIds,
        toggleSubscribe,
        likedVideoIds,
        dislikedVideoIds,
        toggleLikeVideo,
        toggleDislikeVideo,
        watchLaterIds,
        toggleWatchLater,
        historyVideoIds,
        clearHistory,
        comments,
        addComment,
        toggleCommentLike,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        isMobileSearchOpen,
        setIsMobileSearchOpen,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isLoadingVideos,
        setIsLoadingVideos,
        fetchTrendingVideos,
        loadMoreVideos,
        isFetchingMore,
        shareModalVideo,
        setShareModalVideo,
        notifications,
        unreadNotificationCount,
        markNotificationsAsRead,
        sponsorBlockSettings,
        setSponsorBlockSettings,
        updateSponsorBlockSettings,
        toggleSponsorCategory,
        deArrowSettings,
        setDeArrowSettings,
        updateDeArrowSettings,
        resetDeArrowSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
