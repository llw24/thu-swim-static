'use client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import type { NewsItem } from '@/lib/content-shared';

/** 新闻列表 */
export default function NewsList({ items }: { items: Omit<NewsItem, 'body'>[] }) {
  const t = useT();
  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth:900 }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>News</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:28 }}>{t('协会动态', 'Association News')}</h1>
      {items.length === 0 && (
        <div className="card" style={{ padding:40, color:'var(--muted)' }}>{t('暂无动态，敬请期待', 'No news yet — stay tuned')}</div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {items.map((n) => (
          <Link key={n.slug} href={`/news/${n.slug}`} className="card" style={{ padding:20, textDecoration:'none', color:'inherit' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>{n.emoji}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>
              {n.date}{n.pinned ? ` · ${t('置顶', 'Pinned')}` : ''}
            </div>
            <h3 className="serif" style={{ fontSize:18, fontWeight:500, marginBottom:8 }}>{n.title}</h3>
            <p style={{ color:'#555', lineHeight:1.6, fontSize:14 }}>{n.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
