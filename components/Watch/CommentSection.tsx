'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Pin, ArrowUpDown, Send, Smile } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Comment } from '@/types';

interface CommentSectionProps {
  videoId: string;
  commentsCount: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ videoId, commentsCount }) => {
  const { comments, addComment, toggleCommentLike } = useApp();
  const [newCommentText, setNewCommentText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');

  const videoComments: Comment[] = comments[videoId] || [];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    addComment(videoId, newCommentText.trim());
    setNewCommentText('');
    setIsFocused(false);
  };

  const sortedComments = [...videoComments].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === 'top') return b.likes - a.likes;
    return b.id.localeCompare(a.id);
  });

  return (
    <section id="video-comments-section" className="mt-6 pt-6 border-t border-gray-200 dark:border-[#272727]">
      {/* Comments Header & Sort */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {videoComments.length + commentsCount} Komentar
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <button
            id="comments-sort-toggle-btn"
            onClick={() => setSortBy(sortBy === 'top' ? 'newest' : 'top')}
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors uppercase tracking-wider text-[11px]"
          >
            {sortBy === 'top' ? 'Terpopuler' : 'Terbaru'}
          </button>
        </div>
      </div>

      {/* Add Comment Input Form - Avatar removed as requested */}
      <div className="mb-7 p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#282828] focus-within:border-red-500/50 transition-all shadow-xs">
        <form onSubmit={handleAddComment} className="w-full">
          <textarea
            id="add-comment-textarea"
            rows={isFocused ? 3 : 2}
            value={newCommentText}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Tulis komentar Anda di sini..."
            className="w-full bg-transparent border-0 focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
          />

          <div className="flex items-center justify-between pt-2 border-t border-gray-200/80 dark:border-[#2b2b2b] mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="text-[11px]">Komentar publik</span>
            </div>

            <div className="flex items-center gap-2">
              {isFocused && (
                <button
                  type="button"
                  id="cancel-comment-btn"
                  onClick={() => {
                    setNewCommentText('');
                    setIsFocused(false);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-[#282828] rounded-full transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                id="submit-comment-btn"
                disabled={!newCommentText.trim()}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4 sm:space-y-5">
        {sortedComments.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            Belum ada komentar. Jadilah yang pertama berkomentar!
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div
              key={comment.id}
              id={`comment-${comment.id}`}
              className="p-3 sm:p-3.5 rounded-xl bg-transparent hover:bg-gray-50 dark:hover:bg-[#161616] border border-transparent hover:border-gray-200/60 dark:hover:border-[#252525] transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Author Avatar or Initial Badge */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-[#2a2a2a] shrink-0 border border-gray-200 dark:border-[#353535]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comment.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.authorName || 'User')}&backgroundColor=dc2626`}
                    alt={comment.authorName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.authorName || 'User')}&backgroundColor=dc2626`;
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Pinned badge */}
                  {comment.pinned && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">
                      <Pin className="w-3 h-3 fill-red-600" />
                      <span>Disematkan oleh kreator</span>
                    </div>
                  )}

                  {/* Author & Time */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {comment.authorName}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      &bull; {comment.createdAt}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.text}
                  </p>

                  {/* Like / Dislike / Reply Controls */}
                  <div className="flex items-center gap-4 mt-2.5">
                    <button
                      id={`like-comment-${comment.id}`}
                      onClick={() => toggleCommentLike(videoId, comment.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                        comment.isLiked
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-600 dark:fill-red-400' : ''}`} />
                      <span>{comment.likes > 0 ? comment.likes : ''}</span>
                    </button>

                    <button
                      id={`dislike-comment-${comment.id}`}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`reply-comment-${comment.id}`}
                      onClick={() => {
                        setNewCommentText(`@${comment.authorName} `);
                        setIsFocused(true);
                        document.getElementById('add-comment-textarea')?.focus();
                      }}
                      className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Balas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
