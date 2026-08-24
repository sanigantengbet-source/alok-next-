'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Pin, ArrowUpDown, Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Comment } from '@/types';

interface CommentSectionProps {
  videoId: string;
  commentsCount: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ videoId, commentsCount }) => {
  const { comments, addComment, toggleCommentLike, user, setIsLoginModalOpen } = useApp();
  const [newCommentText, setNewCommentText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');

  const videoComments: Comment[] = comments[videoId] || [];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

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
    <section className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2b2b2b]">
      {/* Comments Header & Sort */}
      <div className="flex items-center gap-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {videoComments.length + commentsCount} Comments
        </h3>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <ArrowUpDown className="w-4 h-4" />
          <button
            id="comments-sort-toggle-btn"
            onClick={() => setSortBy(sortBy === 'top' ? 'newest' : 'top')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider text-[11px]"
          >
            Sort by: {sortBy === 'top' ? 'Top comments' : 'Newest first'}
          </button>
        </div>
      </div>

      {/* Add Comment Input Form */}
      <div className="flex items-start gap-4 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user?.avatar || '/friends/saddam.jpg'}
          alt="User Avatar"
          className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5 border border-gray-200 dark:border-[#383838]"
        />

        <form onSubmit={handleAddComment} className="flex-1">
          <textarea
            id="add-comment-textarea"
            rows={isFocused ? 3 : 1}
            value={newCommentText}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full pb-1 pt-2 bg-transparent border-b border-gray-300 dark:border-[#404040] focus:border-gray-900 dark:focus:border-white focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none transition-all"
          />

          {isFocused && (
            <div className="flex items-center justify-end gap-2.5 mt-2 animate-in fade-in duration-150">
              <button
                type="button"
                id="cancel-comment-btn"
                onClick={() => {
                  setNewCommentText('');
                  setIsFocused(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2e2e2e] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-comment-btn"
                disabled={!newCommentText.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                Comment
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {sortedComments.map((comment) => (
          <div key={comment.id} id={`comment-${comment.id}`} className="flex items-start gap-4 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 border border-gray-200 dark:border-[#383838]"
            />

            <div className="flex-1 min-w-0">
              {/* Pinned badge */}
              {comment.pinned && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  <Pin className="w-3 h-3 text-red-500 fill-red-500" />
                  <span>Pinned by creator</span>
                </div>
              )}

              {/* Author & Time */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {comment.authorName}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {comment.createdAt}
                </span>
              </div>

              {/* Comment Text */}
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 mt-1 leading-relaxed whitespace-pre-wrap">
                {comment.text}
              </p>

              {/* Like / Dislike / Reply Controls */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  id={`like-comment-${comment.id}`}
                  onClick={() => toggleCommentLike(videoId, comment.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    comment.isLiked
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{comment.likes > 0 ? comment.likes : ''}</span>
                </button>

                <button
                  id={`dislike-comment-${comment.id}`}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                <button
                  id={`reply-comment-${comment.id}`}
                  className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
