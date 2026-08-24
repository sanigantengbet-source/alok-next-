'use client';

import React, { useState } from 'react';
import { X, Upload, Video as VideoIcon, Link as LinkIcon, Sparkles, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/videos';

export const UploadModal: React.FC = () => {
  const { isUploadModalOpen, setIsUploadModalOpen, addNewVideo, user } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrlOrId, setYoutubeUrlOrId] = useState('');
  const [category, setCategory] = useState('Next.js');
  const [tags, setTags] = useState('Next.js, Coding, Web Development');
  const [duration, setDuration] = useState('15:30');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isUploadModalOpen) return null;

  // Extract YouTube ID from URL or ID string
  const parseYoutubeId = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '1WmNXEVia8I';
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : trimmed.slice(0, 11);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const ytId = parseYoutubeId(youtubeUrlOrId || '1WmNXEVia8I');
    const thumb = thumbnailUrl.trim() || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;

    setTimeout(() => {
      addNewVideo({
        youtubeId: ytId,
        title: title.trim(),
        description: description.trim() || 'Uploaded by ' + (user?.name || 'Creator'),
        channelTitle: user?.name || 'My Developer Channel',
        channelId: user?.id || 'c-user-custom',
        channelAvatar: user?.avatar || '/friends/saddam.jpg',
        subscriberCount: '1.2K',
        verified: true,
        thumbnailUrl: thumb,
        duration: duration || '12:40',
        category: category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#212121] rounded-2xl shadow-2xl p-4 sm:p-6 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#383838] my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#383838]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upload video</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Share your content to the NextTube community</p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            onClick={() => setIsUploadModalOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#383838] transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Title (required)
            </label>
            <input
              id="upload-video-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a Full Stack Next.js 15 App with Tailwind CSS"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm"
            />
          </div>

          {/* YouTube Video URL or ID */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5 flex items-center justify-between">
              <span>YouTube Video URL or Embed ID</span>
              <span className="text-[11px] font-normal text-blue-500 dark:text-blue-400 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Supports any YouTube video URL
              </span>
            </label>
            <input
              id="upload-video-url-input"
              type="text"
              value={youtubeUrlOrId}
              onChange={(e) => setYoutubeUrlOrId(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=1WmNXEVia8I or 1WmNXEVia8I"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              id="upload-video-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what your video is about, timestamps, links..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm resize-none"
            />
          </div>

          {/* Category & Duration grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Category
              </label>
              <select
                id="upload-video-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Duration (MM:SS)
              </label>
              <input
                id="upload-video-duration-input"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="15:45"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              id="upload-video-tags-input"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Next.js, React, TypeScript, Tutorial"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#181818] border border-gray-300 dark:border-[#404040] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-sm"
            />
          </div>

          {/* Thumbnail preview note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-200">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>High-resolution thumbnail will be automatically fetched from YouTube or generated upon publishing.</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#383838]">
            <button
              type="button"
              id="upload-cancel-btn"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303030] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="upload-publish-btn"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>Publishing...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Publish Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
