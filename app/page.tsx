'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar/Navbar';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { BottomNav } from '@/components/Navbar/BottomNav';
import { CategoryBar } from '@/components/Feed/CategoryBar';
import { VideoGrid } from '@/components/Feed/VideoGrid';
import { WatchPage } from '@/components/Watch/WatchPage';
import { ShortsView } from '@/components/Shorts/ShortsView';
import { SubscriptionsView } from '@/components/Subscriptions/SubscriptionsView';
import { SettingsView } from '@/components/Settings/SettingsView';
import { ChannelView } from '@/components/Channel/ChannelView';
import { FloatingMiniPlayer } from '@/components/FloatingPlayer/FloatingMiniPlayer';
import { VoiceSearchModal } from '@/components/Navbar/VoiceSearchModal';
import { UploadModal } from '@/components/Navbar/UploadModal';
import { ShareModal } from '@/components/Navbar/ShareModal';
import { LoginModal } from '@/components/Auth/LoginModal';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const { activeVideo, currentView } = useApp();

  const isWatchMode = currentView === 'watch' && activeVideo !== null;
  const isShortsMode = currentView === 'shorts';
  const isSubscriptionsMode = currentView === 'subscriptions';
  const isSettingsMode = currentView === 'settings';
  const isChannelMode = currentView === 'channel';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 selection:bg-red-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Full / Mini on desktop, Drawer on mobile) */}
        <Sidebar />

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-16 md:pb-0">
          {isWatchMode ? (
            <WatchPage />
          ) : isShortsMode ? (
            <ShortsView />
          ) : isSubscriptionsMode ? (
            <SubscriptionsView />
          ) : isSettingsMode ? (
            <SettingsView />
          ) : isChannelMode ? (
            <ChannelView />
          ) : (
            <>
              {currentView === 'home' && <CategoryBar />}
              <VideoGrid />
            </>
          )}
        </main>
      </div>

      {/* Floating Picture-in-Picture Miniplayer (When navigating to search/browse other videos while playing) */}
      <FloatingMiniPlayer key={activeVideo?.id || 'mini'} />

      {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
      <BottomNav />

      {/* Global Interactive Modals */}
      <VoiceSearchModal />
      <UploadModal />
      <ShareModal />
      <LoginModal />
    </div>
  );
}
