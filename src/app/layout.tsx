import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LangProvider } from '@/lib/i18n';
import { getSite, withBase } from '@/lib/content';

const SITE_URL =
  process.env.SITE_URL ||
  `https://llw24.github.io${process.env.NEXT_PUBLIC_BASE_PATH || '/thu-swim-static'}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: '清华大学学生游泳协会 · Tsinghua Swimming Association',
  description: '清华大学学生游泳协会官方网站 · 活动 · 加入社群 · 校园赛事',
  manifest: withBase('/manifest.webmanifest'),
  icons: { icon: withBase('/icon.svg'), apple: withBase('/icon.svg') },
  openGraph: {
    title: '清华大学学生游泳协会',
    description: '活动 · 加入社群 · 校园赛事',
    type: 'website',
    images: [withBase('/og-image.svg')],
  },
  twitter: { card: 'summary_large_image', images: [withBase('/og-image.svg')] },
};

export const viewport = {
  themeColor: '#0B1F3A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <LangProvider>
          <Navbar />
          {children}
          <Footer site={getSite()} />
        </LangProvider>
      </body>
    </html>
  );
}
