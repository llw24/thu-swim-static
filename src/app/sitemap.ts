import type { MetadataRoute } from 'next';
import { getNews, BASE } from '@/lib/content';

/** 静态 sitemap —— 部署地址可用 SITE_URL 覆盖 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.SITE_URL || `https://llw24.github.io${BASE || '/thu-swim-static'}`
  ).replace(/\/$/, '');

  const now = new Date();
  const items: MetadataRoute.Sitemap = ['', 'training', 'community', 'news', 'about'].map(
    (p) => ({
      url: `${base}/${p}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.6,
    }),
  );
  for (const n of getNews()) {
    items.push({ url: `${base}/news/${n.slug}`, lastModified: n.date ? new Date(n.date) : now, priority: 0.5 });
  }
  return items;
}
