'use client';

import React from 'react';
import { Home, Flame, Tv, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageView } from '@/types';

// Distinctive YouTube Shorts custom SVG icon
const ShortsIcon: React.FC<{ className?: string; isActive?: boolean }> = ({
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

export const BottomNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeVideo,
    setSelectedCategory,
    setSearchQuery,
    subscribedChannelIds,
  } = useApp();

  const handleNavClick = (view: PageView) => {
    setCurrentView(view);
    if (view === 'home') {
      setSelectedCategory('All');
      setSearchQuery('');
    }
  };

  const navItems = [
    {
      id: 'bottom-nav-home',
      label: 'Home',
      icon: Home,
      view: 'home' as PageView,
      isActive: currentView === 'home' && !activeVideo,
      onClick: () => handleNavClick('home'),
    },
    {
      id: 'bottom-nav-shorts',
      label: 'Shorts',
      customIcon: ShortsIcon,
      view: 'shorts' as PageView,
      isActive: currentView === 'shorts',
      onClick: () => handleNavClick('shorts'),
    },
    {
      id: 'bottom-nav-subscriptions',
      label: 'Langganan',
      icon: Tv,
      view: 'subscriptions' as PageView,
      isActive: currentView === 'subscriptions',
      badge: subscribedChannelIds.length > 0 ? subscribedChannelIds.length : null,
      onClick: () => handleNavClick('subscriptions'),
    },
    {
      id: 'bottom-nav-trending',
      label: 'Trending',
      icon: Flame,
      view: 'trending' as PageView,
      isActive: currentView === 'trending',
      onClick: () => handleNavClick('trending'),
    },
    {
      id: 'bottom-nav-settings',
      label: 'Settings',
      icon: Settings,
      view: 'settings' as PageView,
      isActive: currentView === 'settings',
      onClick: () => handleNavClick('settings'),
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-[#272727] py-1 px-2 safe-area-bottom select-none transition-colors"
    >
      <div className="flex items-center justify-around h-13 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = item.isActive;
          const Icon = item.icon;
          const CustomIcon = item.customIcon;

          return (
            <button
              key={item.id}
              id={item.id}
              onClick={item.onClick}
              className={`flex-1 flex flex-col items-center justify-center py-1 min-w-[48px] min-h-[44px] rounded-lg transition-colors touch-manipulation active:scale-95 ${
                active
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {CustomIcon ? (
                  <CustomIcon
                    className={`w-5 h-5 ${active ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}
                    isActive={active}
                  />
                ) : Icon ? (
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                ) : null}

                {item.badge && !active && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-red-600" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
