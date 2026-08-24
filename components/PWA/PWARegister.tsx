'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PWARegister = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('NextTube PWA ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('NextTube PWA ServiceWorker registration failed:', error);
          });
      });
    }

    // 2. Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBanner) return null;

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm bg-white dark:bg-[#1f1f1f] p-3.5 rounded-2xl shadow-2xl border border-gray-200 dark:border-[#383838] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt="NextTube App Icon"
          className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">Install NextTube</h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Add to Home screen for best experience</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={() => setShowInstallBanner(false)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
