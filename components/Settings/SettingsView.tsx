'use client';

import React from 'react';
import {
  Settings,
  Moon,
  Sun,
  Trash2,
  Code2,
  ShieldCheck,
  Globe,
  Sparkles,
  Zap,
  Info,
  ExternalLink,
  Flame,
  CheckCircle2,
  RefreshCw,
  Shield,
  Sliders,
  Bell,
  Check,
  EyeOff,
  Type,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_LABELS } from '@/lib/sponsorblock';
import { SponsorCategory } from '@/types';

export const SettingsView: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    historyVideoIds,
    clearHistory,
    likedVideoIds,
    watchLaterIds,
    setCurrentView,
    setSelectedCategory,
    setSearchQuery,
    sponsorBlockSettings,
    updateSponsorBlockSettings,
    toggleSponsorCategory,
    deArrowSettings,
    updateDeArrowSettings,
    resetDeArrowSettings,
  } = useApp();

  const handleRefreshTrending = async () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setCurrentView('home');
    window.location.reload();
  };

  const categoriesList: { key: SponsorCategory; title: string; defaultOn: boolean }[] = [
    { key: 'sponsor', title: 'Skip Sponsors', defaultOn: true },
    { key: 'intro', title: 'Skip Intro & Intermission', defaultOn: true },
    { key: 'outro', title: 'Skip Outro & End Cards', defaultOn: true },
    { key: 'selfpromo', title: 'Skip Self Promotion', defaultOn: false },
    { key: 'interaction', title: 'Skip Interaction (Like / Subscribe)', defaultOn: false },
    { key: 'preview', title: 'Skip Preview & Recap', defaultOn: false },
    { key: 'filler', title: 'Skip Filler & Tangents', defaultOn: false },
    { key: 'music_offtopic', title: 'Skip Non-Music / Offtopic', defaultOn: false },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-200 dark:border-[#272727]">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shadow-xs">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your NextTube experience, SponsorBlock auto-skip, and developer settings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* DEVELOPER CREDIT - CLEAN & SIMPLE */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200/90 dark:border-[#272727] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#252525] flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Developer
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  SANN404 FORUM GROUP
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#222222] font-mono text-[11px]">
                Build v2.5.0
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#222222] text-[11px]">
                SponsorBlock
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#222222] text-[11px]">
                YouTube Sync
              </span>
            </div>
          </div>
        </div>

        {/* SPONSORBLOCK INTEGRATION SETTINGS */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2b2b2b] rounded-2xl p-5 shadow-xs">
          <div className="flex items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#272727]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    SponsorBlock
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    Official API
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Automatically skip sponsors, intros, outros, and promotional segments
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">
                {sponsorBlockSettings.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                id="settings-sponsorblock-master-toggle"
                onClick={() =>
                  updateSponsorBlockSettings({ enabled: !sponsorBlockSettings.enabled })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  sponsorBlockSettings.enabled
                    ? 'bg-emerald-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
                aria-label="Toggle SponsorBlock Master Switch"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    sponsorBlockSettings.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sub-Options */}
          <div
            className={`mt-4 space-y-3 transition-opacity ${
              sponsorBlockSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            {/* Show Skip Notice Pill */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#202020] rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    Show Skip Notice Toast
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Displays a gentle notification with an &quot;Undo&quot; button when a segment is skipped
                  </p>
                </div>
              </div>

              <button
                id="settings-sponsorblock-toast-toggle"
                onClick={() =>
                  updateSponsorBlockSettings({
                    showSkipNotice: !sponsorBlockSettings.showSkipNotice,
                  })
                }
                className={`w-10 h-5.5 rounded-full transition-colors relative ${
                  sponsorBlockSettings.showSkipNotice
                    ? 'bg-emerald-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    sponsorBlockSettings.showSkipNotice ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>

            {/* Category Checkboxes List */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 px-1">
                Skip Categories
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoriesList.map((cat) => {
                  const isChecked = sponsorBlockSettings.categories[cat.key];
                  const info = CATEGORY_LABELS[cat.key];

                  return (
                    <div
                      key={cat.key}
                      id={`settings-cat-row-${cat.key}`}
                      onClick={() => toggleSponsorCategory(cat.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60 text-gray-900 dark:text-white'
                          : 'bg-gray-50/60 dark:bg-[#202020] border-gray-200 dark:border-[#2f2f2f] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: info.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {cat.title}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {info.desc}
                          </p>
                        </div>
                      </div>

                      {/* Custom Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1a1a]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DEARROW ANTI-CLICKBAIT SETTINGS */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2b2b2b] rounded-2xl p-5 shadow-xs">
          <div className="flex items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#272727]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    DeArrow
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    Official API
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Use community-provided titles and thumbnails to reduce clickbait.
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">
                {deArrowSettings.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                id="settings-dearrow-master-toggle"
                onClick={() =>
                  updateDeArrowSettings({ enabled: !deArrowSettings.enabled })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.enabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
                aria-label="Toggle DeArrow Master Switch"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sub-Options: Only active when Enable DeArrow is ON */}
          <div
            className={`mt-4 space-y-3 transition-opacity ${
              deArrowSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            {/* Sub-Option 1: Use Alternative Titles */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl border border-transparent dark:border-[#282828]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100/60 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    Use Alternative Titles
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Replaces sensationalist titles with community-submitted descriptive titles
                  </p>
                </div>
              </div>

              <button
                id="settings-dearrow-titles-toggle"
                onClick={() =>
                  updateDeArrowSettings({
                    alternativeTitles: !deArrowSettings.alternativeTitles,
                  })
                }
                disabled={!deArrowSettings.enabled}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  deArrowSettings.alternativeTitles
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
                aria-label="Toggle Alternative Titles"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    deArrowSettings.alternativeTitles ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>

            {/* Sub-Option 2: Use Alternative Thumbnails */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl border border-transparent dark:border-[#282828]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100/60 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    Use Alternative Thumbnails
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Replaces clickbait thumbnails with representative video frame captures
                  </p>
                </div>
              </div>

              <button
                id="settings-dearrow-thumbnails-toggle"
                onClick={() =>
                  updateDeArrowSettings({
                    alternativeThumbnails: !deArrowSettings.alternativeThumbnails,
                  })
                }
                disabled={!deArrowSettings.enabled}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  deArrowSettings.alternativeThumbnails
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
                aria-label="Toggle Alternative Thumbnails"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    deArrowSettings.alternativeThumbnails ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* APPEARANCE / THEME */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2b2b2b] rounded-2xl p-5 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Appearance
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Customize the look and feel of the app
          </p>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Theme Mode
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isDarkMode ? 'Currently using Dark Theme' : 'Currently using Light Theme'}
                </p>
              </div>
            </div>

            <button
              id="settings-theme-toggle-btn"
              onClick={toggleDarkMode}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-200 dark:bg-[#303030] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] text-gray-800 dark:text-gray-100 transition-colors"
            >
              Switch to {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {/* FEED & STREAMING PREFERENCES */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2b2b2b] rounded-2xl p-5 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Feed &amp; Content Sync
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Manage your live YouTube feeds and trending topics
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Auto-Refresh Live Trending Feed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Always displays the freshest viral trending videos on Home
                  </p>
                </div>
              </div>

              <button
                id="settings-refresh-trending-btn"
                onClick={handleRefreshTrending}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Trending</span>
              </button>
            </div>
          </div>
        </div>

        {/* DATA & HISTORY MANAGEMENT */}
        <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2b2b2b] rounded-2xl p-5 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            History &amp; Saved Data
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Manage your watch history and local favorites
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl">
              <span className="text-xs text-gray-500 dark:text-gray-400">Watched Videos</span>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {historyVideoIds.length}
              </p>
            </div>
            <div className="p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl">
              <span className="text-xs text-gray-500 dark:text-gray-400">Liked Videos</span>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {likedVideoIds.length}
              </p>
            </div>
            <div className="p-3.5 bg-gray-50 dark:bg-[#202020] rounded-xl">
              <span className="text-xs text-gray-500 dark:text-gray-400">Watch Later</span>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {watchLaterIds.length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-[#272727]">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Clear your watch history or restore default settings
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="settings-reset-all-btn"
                onClick={() => {
                  resetDeArrowSettings();
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#282828] rounded-xl transition-colors"
                title="Reset DeArrow & Extension Preferences to Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Settings</span>
              </button>

              <button
                id="settings-clear-history-btn"
                onClick={clearHistory}
                disabled={historyVideoIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Watch History</span>
              </button>
            </div>
          </div>
        </div>

        {/* ABOUT & DEVELOPER FOOTER */}
        <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            NextTube &bull; Created &amp; Maintained by <span className="text-red-600 dark:text-red-400 font-bold">SANN404 FORUM GROUP</span>
          </p>
          <p className="text-[11px] text-gray-400">
            &copy; 2026 NextTube. Integrated with SponsorBlock API for ad-free experience.
          </p>
        </div>
      </div>
    </div>
  );
};
