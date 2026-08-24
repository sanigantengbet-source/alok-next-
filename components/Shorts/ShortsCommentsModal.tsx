'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Video, Comment } from '@/types';
import { X, Send, ThumbsUp, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ShortsCommentsModalProps {
  short: Video;
  isOpen: boolean;
  onClose: () => void;
}

export const ShortsCommentsModal: React.FC<ShortsCommentsModalProps> = ({
  short,
  isOpen,
  onClose,
}) => {
  const { comments, addComment, toggleCommentLike, user } = useApp();
  const [commentText, setCommentText] = useState('');

  if (!isOpen) return null;

  const shortComments: Comment[] = comments[short.id] || [
    {
      id: `c-init-1-${short.id}`,
      videoId: short.id,
      authorName: 'Rian Pratama',
      authorAvatar: 'https://picsum.photos/seed/rian/80/80',
      text: 'Pemikiran yang luar biasa mendalam! Sangat relevan dengan kondisi sekarang 🔥',
      likes: 142,
      isLiked: false,
      createdAt: '2 hours ago',
    },
    {
      id: `c-init-2-${short.id}`,
      videoId: short.id,
      authorName: 'Dev Learner',
      authorAvatar: 'https://picsum.photos/seed/devlearner/80/80',
      text: 'Singkat, padat, dan sangat berbobot videonya. Lanjut part 2 dong min!',
      likes: 89,
      isLiked: false,
      createdAt: '5 hours ago',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(short.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#181818] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] flex flex-col max-h-[75vh] sm:max-h-[600px] overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Comments
            </h3>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#262626] px-2 py-0.5 rounded-full">
              {shortComments.length}
            </span>
          </div>

          <button
            id="shorts-comments-close-btn"
            onClick={onClose}
            aria-label="Close comments"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-gray-100 dark:divide-[#222222]">
          {shortComments.map((comment) => (
            <div key={comment.id} className="pt-3 first:pt-0 flex gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-[#333]">
                <Image
                  src={comment.authorAvatar}
                  alt={comment.authorName}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                    {comment.authorName}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {comment.createdAt}
                  </span>
                </div>

                <p className="text-xs text-gray-800 dark:text-gray-300 mt-1 leading-relaxed">
                  {comment.text}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => toggleCommentLike(short.id, comment.id)}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                      comment.isLiked
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-gray-50 dark:bg-[#121212] border-t border-gray-100 dark:border-[#262626] flex items-center gap-2"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-300 dark:border-[#444]">
            <Image
              src={user?.avatar || 'https://picsum.photos/seed/user/80/80'}
              alt={user?.name || 'User'}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <input
            type="text"
            id="shorts-comment-input"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white dark:bg-[#202020] border border-gray-200 dark:border-[#333] rounded-full px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-red-500"
          />

          <button
            type="submit"
            id="shorts-comment-submit-btn"
            disabled={!commentText.trim()}
            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
