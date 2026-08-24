'use client';

import React, { useState } from 'react';
import { X, LogIn, User, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, setUser, signInDemoUser } = useApp();
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/friends/saddam.jpg');

  if (!isLoginModalOpen) return null;

  const avatars = [
    '/friends/saddam.jpg',
    '/friends/Sundar_pichai.png.webp',
    '/friends/elon-musk.jpg',
    '/friends/emma-watson.jpg',
    '/friends/mark.jpg',
    '/friends/susan-2.jpg',
  ];

  const handleCustomSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setUser({
      id: `user-${Date.now()}`,
      name: customName.trim(),
      email: customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      avatar: selectedAvatar,
      handle: `@${customName.toLowerCase().replace(/\s+/g, '_')}`,
    });
    setIsLoginModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#212121] rounded-2xl shadow-2xl p-6 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#383838]">
        {/* Close Button */}
        <button
          id="close-login-modal-btn"
          onClick={() => setIsLoginModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#383838] transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md mb-3">
            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[12px] border-l-white ml-1" />
          </div>
          <h2 className="text-xl font-bold">Sign in to NextTube</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            to like videos, comment, subscribe, and upload content
          </p>
        </div>

        {/* 1-Click Quick Google Demo Sign-In */}
        <button
          id="google-signin-btn"
          onClick={signInDemoUser}
          className="w-full py-2.5 px-4 bg-white dark:bg-[#181818] hover:bg-gray-50 dark:hover:bg-[#282828] border border-gray-300 dark:border-[#404040] rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-xs"
        >
          {/* Google 4-color G logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#333]" />
          <span className="px-3 text-xs uppercase font-medium text-gray-400">or custom profile</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-[#333]" />
        </div>

        {/* Custom Profile Form */}
        <form onSubmit={handleCustomSignIn} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
              Choose Avatar
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {avatars.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setSelectedAvatar(img)}
                  className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 transition-all ${
                    selectedAvatar === img
                      ? 'border-red-600 ring-2 ring-red-500/30 scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <input
              id="custom-signin-name-input"
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Saddam Arbaa"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-red-600 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
              Email (optional)
            </label>
            <input
              id="custom-signin-email-input"
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="saddam@example.com"
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-red-600 text-xs"
            />
          </div>

          <button
            type="submit"
            id="custom-signin-submit-btn"
            disabled={!customName.trim()}
            className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-colors mt-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#333] flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure sandbox session with local persistence</span>
        </div>
      </div>
    </div>
  );
};
