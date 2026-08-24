'use client';

import React from 'react';
import {
  Home,
  Flame,
  Settings,
  History,
  Clock,
  ThumbsUp,
  Compass,
  Radio,
  Lightbulb,
  Video,
  ChevronRight,
  Code2,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageView } from '@/types';

// Distinctive YouTube Shorts custom SVG icon
const ShortsNavIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
  className = 'w-5 h-5',
  isActive = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.77 4.96c-1.39-1.39-3.65-1.39-5.04 0L6.46 11.23c-1.74 1.74-1.74 4.56 0 6.31 1.74 1.74 4.56 1.74 6.31 0l6.27-6.27c1.74-1.74 1.74-4.57 0-6.31zm-1.06 1.06c1.16 1.16 1.16 3.03 0 4.19l-6.27 6.27c-1.16 1.16-3.03 1.16-4.19 0-1.16-1.16-1.16-3.03 0-4.19l6.27-6.27c1.16-1.16 3.03-1.16 4.19 0z"
    />
    <polygon points="10,8.5 16,12 10,15.5" fill={isActive ? '#dc2626' : 'currentColor'} />
  </svg>
);

export const Sidebar: React.FC = () => {
  const {
    isSidebarOpen,
    toggleSidebar,
    currentView,
    setCurrentView,
    activeVideo,
    setActiveVideo,
    likedVideoIds,
    watchLaterIds,
    historyVideoIds,
    setSelectedCategory,
    setSearchQuery,
    channels,
    subscribedChannelIds,
    openChannel,
  } = useApp();

  const handleNavClick = (view: PageView, category?: string) => {
    setCurrentView(view);
    if (category) {
      setSelectedCategory(category);
    } else if (view === 'home') {
      setSelectedCategory('All');
      setSearchQuery('');
    }
  };

  const sidebarContent = (
    <>
      {/* SECTION 1: MAIN NAVIGATION */}
      <div className="space-y-1 pb-3 border-b border-gray-200 dark:border-[#272727]">
        <button
          id="sidebar-nav-home"
          onClick={() => handleNavClick('home')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'home' && !activeVideo
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="truncate">Home</span>
        </button>

        <button
          id="sidebar-nav-shorts"
          onClick={() => handleNavClick('shorts')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'shorts'
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <ShortsNavIcon
            className={`w-5 h-5 shrink-0 ${currentView === 'shorts' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
            isActive={currentView === 'shorts'}
          />
          <span className="truncate">Shorts</span>
        </button>

        <button
          id="sidebar-nav-trending"
          onClick={() => handleNavClick('trending')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'trending'
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <Flame className="w-5 h-5 text-red-500 shrink-0" />
          <span className="truncate">Trending</span>
        </button>

        <button
          id="sidebar-nav-settings"
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'settings'
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="truncate">Settings</span>
        </button>
      </div>

      {/* SECTION 2: SAVED & PLAYLISTS */}
      <div className="pt-3 pb-3 border-b border-gray-200 dark:border-[#272727] space-y-1">
        <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Saved &amp; History
        </div>

        <button
          id="sidebar-nav-history"
          onClick={() => handleNavClick('history')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'history'
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <History className="w-5 h-5 shrink-0" />
            <span className="truncate">History</span>
          </div>
          <span className="text-xs text-gray-400 font-mono shrink-0">{historyVideoIds.length}</span>
        </button>

        <button
          id="sidebar-nav-watch-later"
          onClick={() => handleNavClick('watchLater')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'watchLater'
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="truncate">Watch Later</span>
          </div>
          <span className="text-xs text-gray-400 font-mono shrink-0">{watchLaterIds.length}</span>
        </button>

        <button
          id="sidebar-nav-liked"
          onClick={() => handleNavClick('liked')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            currentView === 'liked'
              ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
          }`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <ThumbsUp className="w-5 h-5 shrink-0" />
            <span className="truncate">Liked Videos</span>
          </div>
          <span className="text-xs text-gray-400 font-mono shrink-0">{likedVideoIds.length}</span>
        </button>
      </div>

      {/* SECTION 3: EXPLORE CATEGORIES */}
      <div className="pt-3 pb-3 border-b border-gray-200 dark:border-[#272727]">
        <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Explore Topics
        </h4>
        <div className="space-y-0.5">
          {[
            { label: 'Trending Viral', icon: Flame, category: 'Trending' },
            { label: 'Coding & Tech', icon: Lightbulb, category: 'Coding' },
            { label: 'Next.js & React', icon: Video, category: 'Next.js' },
            { label: 'AI & Machine Learning', icon: Radio, category: 'Artificial Intelligence' },
            { label: 'Web Development', icon: Compass, category: 'Web Development' },
          ].map((cat) => (
            <button
              key={cat.label}
              id={`explore-cat-${cat.category.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => {
                setSelectedCategory(cat.category);
                setCurrentView('home');
                setActiveVideo(null);
              }}
              className="w-full flex items-center gap-4 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors"
            >
              <cat.icon className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: SUBSCRIPTIONS & CHANNELS */}
      <div className="pt-3 pb-3 border-b border-gray-200 dark:border-[#272727]">
        <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Subscriptions
        </h4>
        <div className="space-y-1">
          {channels.slice(0, 6).map((c) => (
            <button
              key={c.id}
              id={`sidebar-channel-${c.id}`}
              onClick={() => openChannel(c)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.avatar}
                alt={c.title}
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 dark:border-[#383838]"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.title)}&backgroundColor=e11d48,2563eb`;
                }}
              />
              <span className="truncate flex-1">{c.title}</span>
              {subscribedChannelIds.includes(c.id) && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DEVELOPER CREDIT IN SIDEBAR */}
      <div className="pt-3 px-1">
        <div className="p-2.5 bg-gray-50 dark:bg-[#181818] border border-gray-200/80 dark:border-[#282828] rounded-xl">
          <div className="flex items-center gap-1.5 mb-0.5 text-gray-500 dark:text-gray-400 font-medium text-[11px]">
            <Code2 className="w-3.5 h-3.5 text-red-500" />
            <span>Developer</span>
          </div>
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
            SANN404 FORUM GROUP
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-4 px-3 text-[11px] text-gray-400 dark:text-gray-500 space-y-2 pb-16 md:pb-6">
        <p className="leading-relaxed">
          Terms &bull; Privacy &bull; Safety &bull; NextTube
        </p>
        <p className="pt-1 text-gray-500 dark:text-gray-600 font-mono text-[10px]">
          &copy; 2026 SANN404 FORUM GROUP
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* MOBILE DRAWER (when isSidebarOpen is toggled on mobile) */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            id="mobile-sidebar-backdrop"
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-in Drawer Container */}
          <aside className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-[#272727] py-3 px-3 overflow-y-auto select-none z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-250">
            {/* Header with Close and Logo */}
            <div className="flex items-center justify-between pb-3 mb-2 px-1 border-b border-gray-200 dark:border-[#272727]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-5.5 bg-red-600 rounded-lg flex items-center justify-center shadow-xs">
                  <div className="w-0 h-0 border-y-[3.5px] border-y-transparent border-l-[7px] border-l-white ml-0.5" />
                </div>
                <span className="font-bold text-base tracking-tighter text-gray-900 dark:text-white">
                  NextTube
                </span>
              </div>

              <button
                id="close-mobile-sidebar-btn"
                onClick={toggleSidebar}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto" onClick={() => toggleSidebar()}>
              {sidebarContent}
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      {!isSidebarOpen ? (
        /* MINI SIDEBAR (desktop collapsed) */
        <aside className="hidden md:flex flex-col items-center w-18 shrink-0 py-3 bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-[#272727] select-none z-30 transition-all">
          {[
            { icon: Home, label: 'Home', view: 'home' as PageView },
            { customIcon: ShortsNavIcon, label: 'Shorts', view: 'shorts' as PageView },
            { icon: Flame, label: 'Trending', view: 'trending' as PageView },
            { icon: Settings, label: 'Settings', view: 'settings' as PageView },
          ].map((item) => {
            const isActive = currentView === item.view && !activeVideo;
            const Icon = item.icon;
            const CustomIcon = item.customIcon;
            return (
              <button
                key={item.label}
                id={`mini-nav-${item.view}`}
                onClick={() => handleNavClick(item.view)}
                className={`w-16 py-3 flex flex-col items-center justify-center rounded-xl transition-colors my-0.5 ${
                  isActive
                    ? 'bg-gray-100 dark:bg-[#272727] text-gray-900 dark:text-white font-medium'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222222]'
                }`}
              >
                {CustomIcon ? (
                  <CustomIcon
                    className={`w-5 h-5 mb-1 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-400'}`}
                    isActive={isActive}
                  />
                ) : Icon ? (
                  <Icon className="w-5 h-5 mb-1" />
                ) : null}
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </aside>
      ) : (
        /* FULL DESKTOP SIDEBAR */
        <aside className="hidden md:block w-60 shrink-0 h-[calc(100vh-3.5rem)] overflow-y-auto bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-[#272727] py-3 px-2 select-none z-30 custom-scrollbar">
          {sidebarContent}
        </aside>
      )}
    </>
  );
};
