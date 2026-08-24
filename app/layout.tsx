import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { PWARegister } from '@/components/PWA/PWARegister';

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'NextTube - Modern Video Sharing & Streaming Platform',
  description: 'NextTube is a modern YouTube client with SponsorBlock, DeArrow, Picture-in-Picture, real channel profiles, and progressive web app capabilities.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NextTube',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 antialiased min-h-screen transition-colors font-sans selection:bg-red-500 selection:text-white">
        <AppProvider>
          {children}
          <PWARegister />
        </AppProvider>
      </body>
    </html>
  );
}

