'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send, Globe } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const ShareModal: React.FC = () => {
  const { shareModalVideo, setShareModalVideo } = useApp();
  const [copied, setCopied] = useState(false);

  if (!shareModalVideo) return null;

  const videoUrl = `https://www.youtube.com/watch?v=${shareModalVideo.youtubeId}`;
  const embedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${shareModalVideo.youtubeId}" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareModalVideo.title + ' ' + videoUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Send,
      color: 'bg-black dark:bg-[#333] hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareModalVideo.title)}&url=${encodeURIComponent(videoUrl)}`,
    },
    {
      name: 'Facebook',
      icon: Globe,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#212121] rounded-2xl shadow-2xl p-6 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#383838]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#383838]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold">Share</h3>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={() => setShareModalVideo(null)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#383838] transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video preview mini */}
        <div className="flex items-center gap-3 my-4 p-2.5 bg-gray-50 dark:bg-[#181818] rounded-xl border border-gray-200 dark:border-[#333]">
          <div className="w-16 h-10 rounded-lg overflow-hidden bg-black shrink-0 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shareModalVideo.thumbnailUrl}
              alt={shareModalVideo.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{shareModalVideo.title}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{shareModalVideo.channelTitle}</p>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          {socialLinks.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center p-3 rounded-xl text-white ${item.color} transition-all active:scale-95 text-xs font-medium gap-1.5 shadow-xs`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </a>
          ))}
        </div>

        {/* Copy Link Input */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Video link
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#181818] rounded-xl border border-gray-300 dark:border-[#404040]">
            <input
              id="share-video-url-input"
              type="text"
              readOnly
              value={videoUrl}
              className="w-full px-2 py-1 bg-transparent text-xs text-gray-800 dark:text-gray-200 focus:outline-none select-all"
            />
            <button
              id="share-copy-link-btn"
              onClick={handleCopyLink}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
