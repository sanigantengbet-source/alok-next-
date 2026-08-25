'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/videos';

export const CategoryBar: React.FC = () => {
  const { selectedCategory, setSelectedCategory, setSearchQuery, setActiveVideo, fetchTrendingVideos } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setActiveVideo(null);
    if (category !== selectedCategory) {
      fetchTrendingVideos(true, category);
    }
  };

  return (
    <div className="relative flex items-center bg-white/95 dark:bg-[#0f0f0f]/95 py-2 px-3 sm:px-4 sticky top-0 z-20 border-b border-gray-100 dark:border-[#222222]">
      {/* Scroll Left Button */}
      <button
        id="category-scroll-left-btn"
        onClick={() => handleScroll('left')}
        aria-label="Scroll categories left"
        className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/90 dark:bg-[#202020]/90 shadow-md hover:bg-gray-100 dark:hover:bg-[#2e2e2e] text-gray-700 dark:text-gray-200 shrink-0 mr-2 border border-gray-200 dark:border-[#333]"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Categories Scroll Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((category, idx) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={`cat-${category}-${idx}`}
              id={`category-chip-${category.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => handleSelectCategory(category)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none ${
                isSelected
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-[#272727] dark:hover:bg-[#383838] dark:text-gray-200'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        id="category-scroll-right-btn"
        onClick={() => handleScroll('right')}
        aria-label="Scroll categories right"
        className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/90 dark:bg-[#202020]/90 shadow-md hover:bg-gray-100 dark:hover:bg-[#2e2e2e] text-gray-700 dark:text-gray-200 shrink-0 ml-2 border border-gray-200 dark:border-[#333]"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
