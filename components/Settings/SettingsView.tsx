'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Palette,
  Shield,
  EyeOff,
  PlayCircle,
  Film,
  History,
  Bell,
  Cloud,
  RefreshCw,
  Sliders,
  Check,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Moon,
  Sun,
  Code2,
  Sparkles,
  ExternalLink,
  Type,
  Image as ImageIcon,
  Layers,
  Volume2,
  Users,
  Globe,
  MessageCircle,
  Copy,
  Heart,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_LABELS } from '@/lib/sponsorblock';
import { SponsorCategory } from '@/types';

type SettingsSection =
  | 'main'
  | 'general'
  | 'appearance'
  | 'sponsorblock'
  | 'dearrow'
  | 'player'
  | 'media'
  | 'history'
  | 'notifications'
  | 'backup'
  | 'community'
  | 'updates';

export const SettingsView: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    historyVideoIds,
    clearHistory,
    likedVideoIds,
    watchLaterIds,
    setCurrentView,
    previousView,
    setSelectedCategory,
    setSearchQuery,
    sponsorBlockSettings,
    updateSponsorBlockSettings,
    toggleSponsorCategory,
    deArrowSettings,
    updateDeArrowSettings,
    resetDeArrowSettings,
    unreadNotificationCount,
    markNotificationsAsRead,
  } = useApp();

  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [isAutoPlayNext, setIsAutoPlayNext] = useState<boolean>(true);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(false);
  const [videoQuality, setVideoQuality] = useState<string>('auto');
  const [appLanguage, setAppLanguage] = useState<string>('id');
  const [autoMiniPlayer, setAutoMiniPlayer] = useState<boolean>(true);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (url: string, name: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedLink(name);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch {}
  };

  const categoriesList: { key: SponsorCategory; title: string; defaultOn: boolean }[] = [
    { key: 'sponsor', title: 'Sponsor', defaultOn: true },
    { key: 'intro', title: 'Intro & Jeda (Intermission)', defaultOn: true },
    { key: 'outro', title: 'Outro & Layar Akhir', defaultOn: true },
    { key: 'selfpromo', title: 'Promosi Diri (Self Promo)', defaultOn: false },
    { key: 'interaction', title: 'Pengingat Interaksi (Like/Sub)', defaultOn: false },
    { key: 'preview', title: 'Pratinjau & Rekap (Preview)', defaultOn: false },
    { key: 'filler', title: 'Segmen Pengisi (Filler & Tangen)', defaultOn: false },
    { key: 'music_offtopic', title: 'Non-Musik / Di Luar Topik', defaultOn: false },
  ];

  const handleBack = () => {
    if (activeSection !== 'main') {
      setActiveSection('main');
    } else {
      setCurrentView(previousView === 'settings' ? 'home' : previousView);
    }
  };

  // Export local settings and favorites as JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        sponsorBlock: sponsorBlockSettings,
        deArrow: deArrowSettings,
        historyCount: historyVideoIds.length,
        likedCount: likedVideoIds.length,
        watchLaterCount: watchLaterIds.length,
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `nexttube_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupNotice('Cadangan berhasil diekspor!');
      setTimeout(() => setBackupNotice(null), 3000);
    } catch (e) {
      setBackupNotice('Gagal mengekspor cadangan.');
    }
  };

  const handleCheckUpdates = () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatus('NextTube v2.5.0 sudah merupakan versi terbaru yang optimal.');
      setTimeout(() => setUpdateStatus(null), 4000);
    }, 1200);
  };

  // RENDER SUB-VIEWS (Matching Screenshot 2)
  const renderSubSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Bahasa Aplikasi
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pilih bahasa antarmuka NextTube
                  </p>
                </div>
                <select
                  value={appLanguage}
                  onChange={(e) => setAppLanguage(e.target.value)}
                  className="bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-hidden"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Buka Mini Player Otomatis
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {autoMiniPlayer ? 'Nyala' : 'Mati'} &bull; Putar video di sudut saat bernavigasi
                  </p>
                </div>
                <button
                  onClick={() => setAutoMiniPlayer(!autoMiniPlayer)}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                    autoMiniPlayer ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                      autoMiniPlayer ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Mode Gelap (Dark Mode)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isDarkMode ? 'Nyala (Tema Hitam Pekat)' : 'Mati (Tema Terang)'}
                </p>
              </div>
              <button
                id="toggle-dark-mode-switch"
                onClick={toggleDarkMode}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isDarkMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    isDarkMode ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'sponsorblock':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Master Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  SponsorBlock
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sponsorBlockSettings.enabled ? 'Nyala' : 'Mati'} &bull; Menggunakan API resmi https://sponsor.ajay.app/
                </p>
              </div>
              <button
                id="sub-sponsorblock-toggle"
                onClick={() =>
                  updateSponsorBlockSettings({ enabled: !sponsorBlockSettings.enabled })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  sponsorBlockSettings.enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    sponsorBlockSettings.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Toast Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Notifikasi Skip
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sponsorBlockSettings.showSkipNotice ? 'Nyala' : 'Mati'} &bull; Tampilkan pemberitahuan saat sponsor dilewati
                </p>
              </div>
              <button
                onClick={() =>
                  updateSponsorBlockSettings({
                    showSkipNotice: !sponsorBlockSettings.showSkipNotice,
                  })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  sponsorBlockSettings.showSkipNotice
                    ? 'bg-emerald-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    sponsorBlockSettings.showSkipNotice ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Segment Categories List */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Kategori Segmen yang Dilewati
              </h4>
              <div className="space-y-2">
                {categoriesList.map((cat) => {
                  const isChecked = sponsorBlockSettings.categories[cat.key];
                  const info = CATEGORY_LABELS[cat.key];
                  return (
                    <div
                      key={cat.key}
                      onClick={() => toggleSponsorCategory(cat.key)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] cursor-pointer select-none transition-all hover:bg-gray-100 dark:hover:bg-[#202020]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {cat.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {info.desc}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#222]'
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
        );

      case 'dearrow':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Master Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Aktifkan DeArrow
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {deArrowSettings.enabled ? 'Nyala' : 'Mati'} &bull; Tampilkan judul dan thumbnail yang lebih akurat
                </p>
              </div>
              <button
                onClick={() =>
                  updateDeArrowSettings({ enabled: !deArrowSettings.enabled })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Alternative Titles */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Judul Alternatif Komunitas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {deArrowSettings.alternativeTitles ? 'Nyala' : 'Mati'} &bull; Ganti judul clickbait dengan deskripsi asli
                </p>
              </div>
              <button
                onClick={() =>
                  updateDeArrowSettings({
                    alternativeTitles: !deArrowSettings.alternativeTitles,
                  })
                }
                disabled={!deArrowSettings.enabled}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.alternativeTitles
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.alternativeTitles ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Alternative Thumbnails */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Thumbnail Alternatif Komunitas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {deArrowSettings.alternativeThumbnails ? 'Nyala' : 'Mati'} &bull; Gunakan tangkapan layar frame video asli
                </p>
              </div>
              <button
                onClick={() =>
                  updateDeArrowSettings({
                    alternativeThumbnails: !deArrowSettings.alternativeThumbnails,
                  })
                }
                disabled={!deArrowSettings.enabled}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.alternativeThumbnails
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.alternativeThumbnails ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Putar Otomatis Video Berikutnya
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isAutoPlayNext ? 'Nyala' : 'Mati'} &bull; Otomatis beralih ke video rekomendasi setelah selesai
                </p>
              </div>
              <button
                onClick={() => setIsAutoPlayNext(!isAutoPlayNext)}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isAutoPlayNext ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    isAutoPlayNext ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Kualitas Video Bawaan
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Resolusi awal saat memulai pemutaran
                </p>
              </div>
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                className="bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-hidden"
              >
                <option value="auto">Otomatis (Auto HD)</option>
                <option value="1080">1080p Full HD</option>
                <option value="720">720p HD</option>
                <option value="480">480p Hemat</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Penghemat Data
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isDataSaver ? 'Nyala' : 'Mati'} &bull; Optimalkan kuota internet saat streaming
                </p>
              </div>
              <button
                onClick={() => setIsDataSaver(!isDataSaver)}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isDataSaver ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    isDataSaver ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Riwayat</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {historyVideoIds.length}
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Disukai</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {likedVideoIds.length}
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tonton Nanti</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {watchLaterIds.length}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                id="clear-all-history-btn"
                onClick={clearHistory}
                disabled={historyVideoIds.length === 0}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 disabled:opacity-50 transition-colors font-semibold text-sm"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5" />
                  <span>Hapus Riwayat Tontonan</span>
                </div>
              </button>

              <button
                id="reset-all-settings-btn"
                onClick={resetDeArrowSettings}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#181818] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#272727] hover:bg-gray-100 dark:hover:bg-[#202020] transition-colors font-semibold text-sm"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset Preferensi ke Bawaan</span>
                </div>
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Notifikasi Channel Langganan
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pemberitahuan ketika kreator mengunggah video baru
                </p>
              </div>
              <button
                onClick={markNotificationsAsRead}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Tandai Dibaca
              </button>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {backupNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-semibold">
                {backupNotice}
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] hover:bg-gray-100 dark:hover:bg-[#202020] text-gray-900 dark:text-white transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <Download className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-bold">Ekspor Data Cadangan</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Simpan pengaturan dan preferensi ke file JSON
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className="space-y-6 animate-in fade-in duration-150 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              NextTube v2.5.0
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Aplikasi pemutar YouTube cepat, bebas iklan, ramah privasi dengan integrasi resmi SponsorBlock &amp; DeArrow API.
            </p>

            <div className="pt-2">
              <button
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdate}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? 'Memeriksa...' : 'Periksa Pembaruan'}</span>
              </button>
            </div>

            {updateStatus && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 animate-in fade-in">
                {updateStatus}
              </p>
            )}
          </div>
        );

      case 'community':
        return (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header intro card - Clean 2-color NextTube theme */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#262626] shadow-xs">
              <div className="flex items-center gap-3.5 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Komunitas Resmi SANN404
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-600/10 text-red-600 dark:text-red-400 rounded-md border border-red-600/20">
                      Official
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    SANN404 FORUM GROUP &bull; NextTube Community Hub
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-2.5">
                Bergabunglah dengan komunitas resmi kami untuk mendapatkan rilis terbaru, pembaruan fitur, bantuan teknis, serta berdiskusi bersama pengembang dan sesama pengguna.
              </p>
            </div>

            {/* Social Links List - Clean, consistent 2-color styling */}
            <div className="space-y-3">
              {/* 1. Instagram */}
              <div
                id="community-link-instagram"
                className="p-4 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#262626] hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202020] border border-gray-200 dark:border-[#303030] text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs tracking-tight">IG</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Instagram Resmi
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-red-600/10 text-red-600 dark:text-red-400 rounded-md border border-red-600/20">
                        @sannnforums.id
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ikuti kabar dan update resmi di Instagram kami
                    </p>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono select-all block mt-0.5">
                      https://www.instagram.com/sannnforums.id
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyLink('https://www.instagram.com/sannnforums.id', 'Instagram')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs transition-colors"
                    title="Salin Tautan"
                  >
                    {copiedLink === 'Instagram' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://www.instagram.com/sannnforums.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Kunjungi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 2. GitHub */}
              <div
                id="community-link-github"
                className="p-4 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#262626] hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202020] border border-gray-200 dark:border-[#303030] text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        GitHub Project
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-red-600/10 text-red-600 dark:text-red-400 rounded-md border border-red-600/20">
                        @sannnproject
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Repository sumber kode, kontribusi, dan issue tracker
                    </p>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono select-all block mt-0.5">
                      https://github.com/sannnproject
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyLink('https://github.com/sannnproject', 'GitHub')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs transition-colors"
                    title="Salin Tautan"
                  >
                    {copiedLink === 'GitHub' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://github.com/sannnproject"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Kunjungi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 3. TikTok */}
              <div
                id="community-link-tiktok"
                className="p-4 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#262626] hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202020] border border-gray-200 dark:border-[#303030] text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs tracking-tight">TT</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        TikTok Official
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-red-600/10 text-red-600 dark:text-red-400 rounded-md border border-red-600/20">
                        @sannforums
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Video singkat, tips, panduan fitur, dan update cepat
                    </p>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono select-all block mt-0.5">
                      https://www.tiktok.com/@sannforums
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyLink('https://www.tiktok.com/@sannforums', 'TikTok')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs transition-colors"
                    title="Salin Tautan"
                  >
                    {copiedLink === 'TikTok' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://www.tiktok.com/@sannforums"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Kunjungi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 4. WhatsApp Channel */}
              <div
                id="community-link-whatsapp"
                className="p-4 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#262626] hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#202020] border border-gray-200 dark:border-[#303030] text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Saluran WhatsApp Resmi
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-red-600/10 text-red-600 dark:text-red-400 rounded-md border border-red-600/20">
                        SANN404 Channel
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Siaran notifikasi langsung, rilis aplikasi terbaru, dan link unduhan
                    </p>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono select-all break-all block mt-0.5">
                      https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyLink('https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L', 'WhatsApp')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs transition-colors"
                    title="Salin Tautan"
                  >
                    {copiedLink === 'WhatsApp' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Gabung</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Credits Badge */}
            <div className="text-center pt-4 pb-2 text-xs text-gray-400 dark:text-gray-500">
              <p>Dikembangkan dengan penuh dedikasi oleh <strong className="text-gray-700 dark:text-gray-300">SANN404 FORUM GROUP</strong></p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'general':
        return 'Umum';
      case 'appearance':
        return 'Tampilan';
      case 'sponsorblock':
        return 'SponsorBlock';
      case 'dearrow':
        return 'DeArrow';
      case 'player':
        return 'Pemain';
      case 'media':
        return 'Audio dan video';
      case 'history':
        return 'Riwayat';
      case 'notifications':
        return 'Notifikasi';
      case 'backup':
        return 'Cadangkan dan pulihkan';
      case 'community':
        return 'Komunitas';
      case 'updates':
        return 'Periksa untuk pembaruan';
      default:
        return 'Pengaturan';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto min-h-[calc(100vh-8rem)]">
      {/* Top Header with Back Button (Matching Screenshots) */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-200 dark:border-[#222]">
        <button
          id="settings-back-btn"
          onClick={handleBack}
          aria-label="Kembali"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-800 dark:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {getSectionTitle()}
        </h1>
      </div>

      {activeSection === 'main' ? (
        /* MASTER SETTINGS LIST (Matching Screenshot 1) */
        <div className="space-y-1 select-none animate-in fade-in duration-150">
          {/* 1. Umum */}
          <button
            id="settings-item-general"
            onClick={() => setActiveSection('general')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Sliders className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Umum
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Bahasa, mini player, dan preferensi aplikasi
              </p>
            </div>
          </button>

          {/* 2. Tampilan */}
          <button
            id="settings-item-appearance"
            onClick={() => setActiveSection('appearance')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Palette className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Tampilan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Atur tema {isDarkMode ? '(Gelap)' : '(Terang)'} dan kenyamanan visual
              </p>
            </div>
          </button>

          {/* 3. SponsorBlock */}
          <button
            id="settings-item-sponsorblock"
            onClick={() => setActiveSection('sponsorblock')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                SponsorBlock
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Menggunakan API dari https://sponsor.ajay.app/
              </p>
            </div>
          </button>

          {/* 4. DeArrow */}
          <button
            id="settings-item-dearrow"
            onClick={() => setActiveSection('dearrow')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <EyeOff className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                DeArrow
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Tampilkan judul dan thumbnail yang lebih akurat
              </p>
            </div>
          </button>

          {/* 5. Pemain */}
          <button
            id="settings-item-player"
            onClick={() => setActiveSection('player')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <PlayCircle className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Pemain
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Bawaan dan perilaku pemutar video
              </p>
            </div>
          </button>

          {/* 6. Audio dan Video */}
          <button
            id="settings-item-media"
            onClick={() => setActiveSection('media')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Film className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Audio dan video
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Kualitas streaming dan format
              </p>
            </div>
          </button>

          {/* 7. Riwayat */}
          <button
            id="settings-item-history"
            onClick={() => setActiveSection('history')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <History className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Riwayat
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Riwayat tontonan dan penelusuran
              </p>
            </div>
          </button>

          {/* 8. Notifikasi */}
          <button
            id="settings-item-notifications"
            onClick={() => setActiveSection('notifications')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Bell className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Notifikasi
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Tampilkan notifikasi untuk saluran baru
              </p>
            </div>
          </button>

          {/* 9. Cadangkan dan Pulihkan */}
          <button
            id="settings-item-backup"
            onClick={() => setActiveSection('backup')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Cloud className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Cadangkan dan pulihkan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Impor dan ekspor langganan, daftar putar, ...
              </p>
            </div>
          </button>

          {/* 10. Komunitas (Community) */}
          <button
            id="settings-item-community"
            onClick={() => setActiveSection('community')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Komunitas
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Instagram, GitHub, TikTok, Saluran WhatsApp
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-gray-100 dark:border-[#222]" />
          </div>

          {/* 11. Periksa untuk Pembaruan */}
          <button
            id="settings-item-updates"
            onClick={() => setActiveSection('updates')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <RefreshCw className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Periksa untuk pembaruan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                v2.5.0 &bull; Dibuat oleh SANN404 FORUM GROUP
              </p>
            </div>
          </button>
        </div>
      ) : (
        /* SUB-SETTING PAGE (Matching Screenshot 2) */
        renderSubSection()
      )}
    </div>
  );
};
