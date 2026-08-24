'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { DeArrowService, extractCleanYouTubeId } from '@/lib/dearrow';
import { DeArrowBranding } from '@/types';

interface VideoLike {
  id?: string;
  youtubeId?: string;
  title: string;
  thumbnailUrl: string;
}

export function useDeArrow(video: VideoLike | null | undefined) {
  const { deArrowSettings } = useApp();

  const originalTitle = video?.title || '';
  const originalThumbnail = video?.thumbnailUrl || '';
  const rawId = video?.youtubeId || video?.id || '';
  const cleanId = extractCleanYouTubeId(rawId);

  const isDeArrowActive = Boolean(
    deArrowSettings.enabled &&
    (deArrowSettings.alternativeTitles || deArrowSettings.alternativeThumbnails) &&
    cleanId &&
    !cleanId.startsWith('v-')
  );

  // Store asynchronous branding data fetched from API
  const [asyncBranding, setAsyncBranding] = useState<DeArrowBranding | null>(() => {
    if (isDeArrowActive && cleanId) {
      return DeArrowService.getCachedBranding(cleanId);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isDeArrowActive || !cleanId) {
      return;
    }

    // Check synchronous cache first
    const cached = DeArrowService.getCachedBranding(cleanId);
    if (cached) {
      return;
    }

    let isSubscribed = true;

    DeArrowService.getBranding(cleanId)
      .then((branding) => {
        if (isSubscribed) {
          setAsyncBranding(branding);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isDeArrowActive, cleanId]);

  // Derived title and thumbnail calculation
  let displayTitle = originalTitle;
  let displayThumbnail = originalThumbnail;
  let isTitleChanged = false;
  let isThumbnailChanged = false;

  if (isDeArrowActive && cleanId) {
    const branding = DeArrowService.getCachedBranding(cleanId) || asyncBranding;
    if (branding) {
      if (deArrowSettings.alternativeTitles) {
        const bestTitle = DeArrowService.selectBestTitle(branding, originalTitle);
        if (bestTitle && bestTitle !== originalTitle) {
          displayTitle = bestTitle;
          isTitleChanged = true;
        }
      }
      if (deArrowSettings.alternativeThumbnails) {
        const bestThumbnail = DeArrowService.selectBestThumbnailUrl(cleanId, branding, originalThumbnail);
        if (bestThumbnail && bestThumbnail !== originalThumbnail) {
          displayThumbnail = bestThumbnail;
          isThumbnailChanged = true;
        }
      }
    }
  }

  return {
    title: displayTitle,
    thumbnailUrl: displayThumbnail,
    isTitleChanged,
    isThumbnailChanged,
    isDeArrowActive,
    isLoading,
    originalTitle,
    originalThumbnail,
  };
}
