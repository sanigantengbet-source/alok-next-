'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, SponsorSegment, SponsorBlockSettings } from '@/types';
import { SponsorBlockService, CATEGORY_LABELS } from '@/lib/sponsorblock';
import { useApp } from '@/context/AppContext';
import { Shield, ShieldAlert, ShieldCheck, Undo2, X, Zap, Play } from 'lucide-react';

interface YouTubePlayerProps {
  video: Video;
  settings: SponsorBlockSettings;
  onEnded?: () => void;
}

interface SkipNotice {
  id: string;
  category: string;
  categoryLabel: string;
  fromTime: number;
  toTime: number;
  segmentUUID: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ video, settings, onEnded }) => {
  const {
    playerCurrentTime: globalCurrentTime,
    setPlayerCurrentTime: setGlobalCurrentTime,
    setPlayerDuration: setGlobalDuration,
    setIsPlayerPlaying: setGlobalIsPlaying,
  } = useApp();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const pollerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const lastSkippedUUIDRef = useRef<string | null>(null);

  // Capture the initial seek time once on component mount to keep iframe.src completely static
  const [initialStartSeconds] = useState<number>(() => Math.max(0, Math.floor(globalCurrentTime || 0)));
  const globalCurrentTimeRef = useRef<number>(globalCurrentTime);

  useEffect(() => {
    globalCurrentTimeRef.current = globalCurrentTime;
  }, [globalCurrentTime]);

  const [segments, setSegments] = useState<SponsorSegment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);
  const [activeNotice, setActiveNotice] = useState<SkipNotice | null>(null);
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(globalCurrentTime || 0);
  const [playerDuration, setPlayerDuration] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState<boolean>(false);
  const [showSegmentsPopover, setShowSegmentsPopover] = useState<boolean>(false);

  // Static embed source that NEVER changes on tick updates, preventing iframe reload loops
  const embedSrc = React.useMemo(() => {
    const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&start=${initialStartSeconds}${originParam}`;
  }, [video.youtubeId, initialStartSeconds]);

  // Keep references updated for the stable poller loop
  const segmentsRef = useRef<SponsorSegment[]>([]);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  const settingsRef = useRef<SponsorBlockSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const onEndedRef = useRef<(() => void) | undefined>(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Trigger non-intrusive visual skip feedback
  const triggerSkipNotice = useCallback((segment: SponsorSegment) => {
    if (!settingsRef.current.showSkipNotice) return;

    const catLabel = SponsorBlockService.getCategoryLabel(segment.category);
    const notice: SkipNotice = {
      id: `skip-${Date.now()}`,
      category: segment.category,
      categoryLabel: catLabel,
      fromTime: segment.segment[0],
      toTime: segment.segment[1],
      segmentUUID: segment.UUID,
    };

    setActiveNotice(notice);

    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setActiveNotice(null);
    }, 4500);
  }, []);

  const triggerSkipNoticeRef = useRef(triggerSkipNotice);
  useEffect(() => {
    triggerSkipNoticeRef.current = triggerSkipNotice;
  }, [triggerSkipNotice]);

  // Undo skipped segment
  const handleUndoSkip = () => {
    if (!activeNotice || !playerRef.current) return;
    try {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(activeNotice.fromTime, true);
        lastSkippedUUIDRef.current = activeNotice.segmentUUID;
      }
    } catch {}
    setActiveNotice(null);
  };

  // Manual trigger play if browser blocked autoplay
  const handleManualPlay = () => {
    setShowPlayOverlay(false);
    setIsVideoPlaying(true);
    setGlobalIsPlaying(true);

    if (playerRef.current) {
      try {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch {}
    } else if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      } catch {}
    }
  };

  // 1. Fetch SponsorBlock Segments when video changes
  useEffect(() => {
    let isSubscribed = true;
    lastSkippedUUIDRef.current = null;

    const fetchSegments = async () => {
      setIsLoadingSegments(true);
      setActiveNotice(null);
      try {
        const fetchedSegments = await SponsorBlockService.getSegments(video.youtubeId);
        if (isSubscribed) {
          setSegments(fetchedSegments);
          setIsLoadingSegments(false);
        }
      } catch {
        if (isSubscribed) {
          setSegments([]);
          setIsLoadingSegments(false);
        }
      }
    };

    fetchSegments();

    return () => {
      isSubscribed = false;
    };
  }, [video.youtubeId]);

  // 2. Playback Polling Handler (Operates locally without causing global context re-render loops)
  const startPlaybackPolling = useCallback(() => {
    if (pollerRef.current) clearInterval(pollerRef.current);

    pollerRef.current = setInterval(() => {
      if (!playerRef.current) return;

      try {
        if (typeof playerRef.current.getCurrentTime !== 'function') return;

        const currentTime = playerRef.current.getCurrentTime();
        if (typeof currentTime !== 'number' || isNaN(currentTime)) return;

        // Local state update for smooth player overlay UI
        setPlayerCurrentTime(currentTime);

        if (typeof playerRef.current.getDuration === 'function') {
          const dur = playerRef.current.getDuration();
          if (typeof dur === 'number' && dur > 0) {
            setPlayerDuration(dur);
          }
        }

        const currentSegments = segmentsRef.current;
        const currentSettings = settingsRef.current;

        // Check if user sought backwards before the last skipped segment
        if (lastSkippedUUIDRef.current && currentSegments.length > 0) {
          const lastSeg = currentSegments.find((s) => s.UUID === lastSkippedUUIDRef.current);
          if (lastSeg && (currentTime < lastSeg.segment[0] - 2 || currentTime > lastSeg.segment[1] + 2)) {
            lastSkippedUUIDRef.current = null;
          }
        }

        // SponsorBlock skip evaluation
        const targetSeg = SponsorBlockService.shouldSkip(
          currentTime,
          currentSegments,
          currentSettings,
          lastSkippedUUIDRef.current
        );

        if (targetSeg) {
          const targetEnd = targetSeg.segment[1];
          playerRef.current.seekTo(targetEnd, true);
          lastSkippedUUIDRef.current = targetSeg.UUID;
          triggerSkipNoticeRef.current(targetSeg);
        }
      } catch {
        // Suppress polling error
      }
    }, 250);
  }, []);

  const stopPlaybackPolling = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }, []);

  // 3. Attach YouTube IFrame API to the existing DOM iframe
  useEffect(() => {
    const targetVideoId = video.youtubeId;
    const resumeTime = Math.max(0, Math.floor(initialStartSeconds || 0));

    const bindYTPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      const iframeElem = document.getElementById('nexttube-yt-iframe-player');
      if (!iframeElem) return;

      // If already bound to this video
      if (playerRef.current && loadedVideoIdRef.current === targetVideoId) {
        return;
      }

      try {
        loadedVideoIdRef.current = targetVideoId;
        playerRef.current = new window.YT.Player('nexttube-yt-iframe-player', {
          events: {
            onReady: (event: any) => {
              setIsIframeLoaded(true);
              try {
                if (resumeTime > 0) {
                  event.target.seekTo(resumeTime, true);
                }
                event.target.playVideo();
                if (typeof event.target.getDuration === 'function') {
                  const dur = event.target.getDuration();
                  if (dur > 0) {
                    setPlayerDuration(dur);
                    setGlobalDuration(dur);
                  }
                }
              } catch {}
              startPlaybackPolling();
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING, -1 = UNSTARTED, 5 = CUED
              if (event.data === 1) {
                setIsVideoPlaying(true);
                setShowPlayOverlay(false);
                setGlobalIsPlaying(true);
                startPlaybackPolling();
              } else if (event.data === 2) {
                setIsVideoPlaying(false);
                setGlobalIsPlaying(false);
                stopPlaybackPolling();
                try {
                  const cur = event.target.getCurrentTime?.();
                  if (typeof cur === 'number' && cur > 0) {
                    setGlobalCurrentTime(cur);
                  }
                } catch {}
              } else if (event.data === 0) {
                setIsVideoPlaying(false);
                setGlobalIsPlaying(false);
                stopPlaybackPolling();
                if (onEndedRef.current) onEndedRef.current();
              } else if (event.data === -1 || event.data === 5) {
                try {
                  event.target.playVideo();
                } catch {}
              }
            },
            onError: () => {
              setIsIframeLoaded(true);
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player binding notice:', err);
      }
    };

    // If script not loaded yet, inject it
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        bindYTPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      bindYTPlayer();
    }
  }, [video.youtubeId, initialStartSeconds, startPlaybackPolling, stopPlaybackPolling, setGlobalIsPlaying, setGlobalDuration, setGlobalCurrentTime]);

  // Clean up timer, poller, and preserve playback position to global context on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const finalTime = playerRef.current.getCurrentTime();
          if (typeof finalTime === 'number' && !isNaN(finalTime) && finalTime > 0) {
            setGlobalCurrentTime(finalTime);
          }
        } catch {}
      }
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [setGlobalCurrentTime]);

  const activeCategoriesCount = segments.filter(
    (s) => settings.categories[s.category] ?? false
  ).length;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-200 dark:border-[#222] select-none group">
      {/* Fast Direct Native IFrame - Instant Load without black screen */}
      <iframe
        ref={iframeRef}
        id="nexttube-yt-iframe-player"
        src={embedSrc}
        title={video.title}
        className="w-full h-full border-0 absolute inset-0 z-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsIframeLoaded(true)}
      />

      {/* Poster Placeholder (shown briefly before first frame renders to eliminate pure black screen) */}
      {!isIframeLoaded && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center pointer-events-none transition-opacity duration-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover blur-xs opacity-60 scale-105"
          />
          <div className="absolute flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
            <span className="text-xs text-white/90 font-medium drop-shadow-md">Memuat video...</span>
          </div>
        </div>
      )}

      {/* Play Overlay if autoplay was prevented by browser */}
      {showPlayOverlay && (
        <div
          onClick={handleManualPlay}
          className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer group/play"
        >
          <div className="w-16 h-16 rounded-full bg-red-600 group-hover/play:scale-110 group-hover/play:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform">
            <Play className="w-7 h-7 fill-white translate-x-0.5" />
          </div>
          <span className="text-white text-xs font-semibold mt-3 bg-black/70 px-3 py-1 rounded-full">
            Ketuk untuk melanjutkan video
          </span>
        </div>
      )}

      {/* SPONSORBLOCK VISUAL SEGMENT INDICATOR BAR */}
      {playerDuration > 0 && segments.length > 0 && (
        <div
          id="sponsorblock-timeline-markers"
          className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 pointer-events-none z-10 overflow-hidden flex"
        >
          {segments.map((seg, idx) => {
            const startPct = Math.min(100, Math.max(0, (seg.segment[0] / playerDuration) * 100));
            const endPct = Math.min(100, Math.max(0, (seg.segment[1] / playerDuration) * 100));
            const widthPct = Math.max(0.5, endPct - startPct);
            const color = CATEGORY_LABELS[seg.category]?.color || '#00d482';
            const isCategoryActive = settings.categories[seg.category];

            return (
              <div
                key={`${seg.UUID}-${idx}`}
                title={`SponsorBlock: ${SponsorBlockService.getCategoryLabel(seg.category)} (${formatTime(seg.segment[0])} - ${formatTime(seg.segment[1])})`}
                className="absolute top-0 bottom-0 transition-opacity"
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: color,
                  opacity: isCategoryActive && settings.enabled ? 0.9 : 0.35,
                }}
              />
            );
          })}
        </div>
      )}

      {/* FLOATING SPONSORBLOCK STATUS BADGE (Top Right of Player) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          id="sponsorblock-status-pill"
          onClick={() => setShowSegmentsPopover(!showSegmentsPopover)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md transition-all shadow-md ${
            !settings.enabled
              ? 'bg-black/60 text-gray-400 border border-white/10 hover:bg-black/80'
              : segments.length > 0
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/90'
              : 'bg-black/60 text-gray-300 border border-white/15 hover:bg-black/80'
          }`}
          title="SponsorBlock Info"
        >
          {settings.enabled ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span>
            {isLoadingSegments
              ? 'Checking...'
              : !settings.enabled
              ? 'SB Disabled'
              : segments.length > 0
              ? `SB: ${activeCategoriesCount}/${segments.length} segments`
              : 'SB: Clean'}
          </span>
        </button>
      </div>

      {/* POPUP: DETAILED SPONSORBLOCK SEGMENTS LIST FOR THIS VIDEO */}
      {showSegmentsPopover && (
        <div
          id="sponsorblock-segments-modal"
          className="absolute top-12 right-3 z-30 w-72 max-w-[90vw] p-3.5 bg-gray-950/95 backdrop-blur-xl border border-gray-800 text-white rounded-2xl shadow-2xl text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <div className="flex items-center gap-1.5 font-bold text-gray-200">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>SponsorBlock Segments</span>
            </div>
            <button
              onClick={() => setShowSegmentsPopover(false)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {segments.length === 0 ? (
              <p className="text-gray-400 text-center py-3 text-[11px]">
                No sponsor segments reported for this video yet.
              </p>
            ) : (
              segments.map((seg, i) => {
                const info = CATEGORY_LABELS[seg.category] || {
                  label: seg.category,
                  idLabel: seg.category,
                  color: '#00d482',
                };
                const isEnabled = settings.categories[seg.category] && settings.enabled;

                return (
                  <div
                    key={seg.UUID || i}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-900/80 border border-gray-800/80"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: info.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-[11px] truncate">{info.idLabel}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {formatTime(seg.segment[0])} - {formatTime(seg.segment[1])}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isEnabled ? 'Will Skip' : 'Ignored'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
            <span>Powered by Ajay&apos;s SponsorBlock</span>
            <span className="font-mono">v2.5.0</span>
          </div>
        </div>
      )}

      {/* NON-INTRUSIVE SPONSORBLOCK SKIP NOTICE (TOAST / BANNER) */}
      {activeNotice && settings.showSkipNotice && (
        <div
          id="sponsorblock-skip-toast"
          className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-4 z-30 max-w-sm flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gray-950/90 dark:bg-black/90 backdrop-blur-md text-white border border-emerald-500/50 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-100 truncate">
                SponsorBlock &bull; {activeNotice.categoryLabel} dilewati
              </p>
              <p className="text-[10px] text-emerald-400/90 font-mono">
                {formatTime(activeNotice.fromTime)} &rarr; {formatTime(activeNotice.toTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="sponsorblock-undo-skip-btn"
              onClick={handleUndoSkip}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-colors shadow-xs"
              title="Undo Skip and go back"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>

            <button
              onClick={() => setActiveNotice(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

