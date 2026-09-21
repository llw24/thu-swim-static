import type { MetadataRoute } from 'next';
import { BASE } from '@/lib/content';

/** 静态 sitemap —— 部署地址可用 SITE_URL 覆盖 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.SITE_URL || `https://llw24.github.io${BASE || '/thu-swim-static'}`
  ).replace(/\/$/, '');

  const now = new Date();
  return ['', 'training', 'community', 'about'].map((p) => ({
    url: `${base}/${p}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.6,
  }));
}
