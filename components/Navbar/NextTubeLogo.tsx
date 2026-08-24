'use client';

import React from 'react';

interface NextTubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const NextTubeLogo: React.FC<NextTubeLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7 rounded-xl',
    md: 'w-8 h-8 sm:w-9 sm:h-9 rounded-2xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const textSizeClasses = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-lg sm:text-xl font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Exact Red Tube Icon with Folded Play Symbol (from file_00000000a06081fab5f42a77276e6aa6.png) */}
      <div
        className={`relative ${iconSizeClasses[size]} bg-gradient-to-b from-[#FF1A24] via-[#E50914] to-[#C8040F] flex items-center justify-center shadow-md shadow-red-600/25 overflow-hidden shrink-0 border border-red-500/20`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[68%] h-[68%] filter drop-shadow-xs"
        >
          {/* Base Folded White Play / N Silhouette */}
          <path
            d="M32 25C32 20.5817 35.5817 17 40 17C43.2044 17 46.0465 18.887 47.3323 21.614L74.8 62.5C76.8 65.5 74.5 70 70.8 70H40C35.5817 70 32 66.4183 32 62V25Z"
            fill="white"
          />
          {/* Vertical Left Stem */}
          <rect
            x="32"
            y="20"
            width="17"
            height="50"
            rx="8.5"
            fill="white"
          />
          {/* Diagonal Play Triangle Fold */}
          <path
            d="M40.5 35L73.5 59.5C76.2 61.5 75.8 65.5 72.5 66.5C71.5 66.8 70 67 68.5 66.5L40.5 48.5V35Z"
            fill="#E2E8F0"
          />
          {/* Fold Highlight & Shading */}
          <path
            d="M40.5 21L73.8 58.2C75.8 60.5 74.2 64 71.2 64L40.5 38.5V21Z"
            fill="url(#fold-grad)"
          />
          {/* Fold crease shadow */}
          <path
            d="M40.5 38.5L71.2 64H50L40.5 48.5V38.5Z"
            fill="#CBD5E1"
            fillOpacity="0.8"
          />
          <defs>
            <linearGradient id="fold-grad" x1="40" y1="21" x2="73" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.65" stopColor="#F1F5F9" />
              <stop offset="1" stopColor="#D8DEE9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span className={`${textSizeClasses[size]} text-gray-900 dark:text-white flex items-center leading-none font-bold`}>
          Next<span className="text-[#FF1E27]">Tube</span>
        </span>
      )}
    </div>
  );
};
