import { Video, Comment } from '@/types';

export const INITIAL_VIDEOS: Video[] = [];

export const CATEGORIES = [
  'All',
  '🔥 Rame & Viral',
  'Trending',
  'TikTok Hits',
  'Music',
  'Gaming',
  'Entertainment',
  'Tech',
  'Podcasts',
  'Live Replay',
  'News',
  'Comedy',
];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  'yt-87krDLLWRys': [
    {
      id: 'comm-1',
      videoId: 'yt-87krDLLWRys',
      authorName: 'Rian Pratama',
      authorAvatar: 'https://picsum.photos/seed/rian/100/100',
      text: 'Suaranya merdu banget, artikulasinya jelas dan penjiwaannya luar biasa! Auto lolos ini!',
      createdAt: '1 week ago',
      likes: 432,
      isLiked: false,
    },
    {
      id: 'comm-2',
      videoId: 'yt-87krDLLWRys',
      authorName: 'Siti Nurhaliza Fan',
      authorAvatar: 'https://picsum.photos/seed/siti/100/100',
      text: 'Calon juara Indonesian Idol berikutnya nih, merinding pas nada tingginya 🔥',
      createdAt: '1 week ago',
      likes: 198,
      isLiked: false,
    },
  ],
  'yt-L_LUpnjgPso': [
    {
      id: 'comm-3',
      videoId: 'yt-L_LUpnjgPso',
      authorName: 'GlobalMusicVibes',
      authorAvatar: 'https://picsum.photos/seed/musicvibes/100/100',
      text: 'Bruno Mars and Lady Gaga together is pure magic. Song of the decade! ❤️',
      createdAt: '2 weeks ago',
      likes: 15400,
      isLiked: true,
    },
  ],
};

