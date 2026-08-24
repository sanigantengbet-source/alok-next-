export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  channelAvatar: string;
  subscriberCount: string;
  verified?: boolean;
  thumbnailUrl: string;
  views: number;
  likes: number;
  dislikes: number;
  uploadedAt: string;
  duration: string;
  category: string;
  tags: string[];
  commentsCount: number;
  isLive?: boolean;
}

export interface Comment {
  id: string;
  videoId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  likes: number;
  isLiked?: boolean;
  createdAt: string;
  pinned?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoCount: number;
  channelTitle: string;
  channelId?: string;
  updatedAt?: string;
}

export interface Channel {
  id: string;
  title: string;
  avatar: string;
  banner?: string;
  handle?: string;
  subscribers: string;
  verified: boolean;
  isSubscribed?: boolean;
  videosCount: number;
  description: string;
  joinedDate?: string;
  viewsCount?: string;
  links?: { title: string; url: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  handle: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  timeAgo: string;
  thumbnail: string;
  isRead: boolean;
  videoId: string;
}

export type PageView =
  | 'home'
  | 'shorts'
  | 'watch'
  | 'subscriptions'
  | 'library'
  | 'history'
  | 'liked'
  | 'watchLater'
  | 'yourVideos'
  | 'trending'
  | 'settings'
  | 'channel';

export type SponsorCategory =
  | 'sponsor'
  | 'intro'
  | 'outro'
  | 'selfpromo'
  | 'interaction'
  | 'music_offtopic'
  | 'preview'
  | 'filler';

export interface SponsorSegment {
  category: SponsorCategory;
  actionType: 'skip' | 'mute' | 'full' | string;
  segment: [number, number]; // [startTimeSeconds, endTimeSeconds]
  UUID: string;
  videoDuration?: number;
  votes?: number;
  locked?: number;
}

export interface SponsorBlockSettings {
  enabled: boolean;
  categories: {
    sponsor: boolean;
    intro: boolean;
    outro: boolean;
    selfpromo: boolean;
    interaction: boolean;
    music_offtopic: boolean;
    preview: boolean;
    filler: boolean;
  };
  showSkipNotice: boolean;
  autoSkip: boolean;
}

export interface DeArrowSettings {
  enabled: boolean;
  alternativeTitles: boolean;
  alternativeThumbnails: boolean;
}

export interface DeArrowTitle {
  title: string;
  original: boolean;
  votes: number;
  locked: boolean;
  UUID: string;
}

export interface DeArrowThumbnail {
  timestamp: number | null;
  original: boolean;
  votes: number;
  locked: boolean;
  UUID: string;
}

export interface DeArrowBranding {
  titles: DeArrowTitle[];
  thumbnails: DeArrowThumbnail[];
  randomTime?: number | null;
  videoDuration?: number | null;
}

