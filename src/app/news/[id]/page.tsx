import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNews, renderBody } from '@/lib/content';

/** 新闻详情 —— 每个 content/news/*.md 在构建时生成一个静态页面 */

export function generateStaticParams() {
  return getNews().map((n) => ({ id: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = getNews().find((n) => n.slug === id);
  if (!item) return {};
  return {
    title: `${item.title} · 清华大学学生游泳协会`,
    description: item.summary,
  };
}

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getNews().find((n) => n.slug === id);
  if (!item) notFound();

  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth:780 }}>
      <Link href="/news" className="link-arrow">← 所有动态 / All news</Link>
      <div style={{ fontSize:56, marginTop:20 }}>{item.emoji}</div>
      <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>
        {item.date}{item.pinned ? ' · 置顶' : ''}
      </div>
      <h1 className="serif" style={{ fontSize:36, fontWeight:500, margin:'12px 0 20px' }}>{item.title}</h1>
      {item.summary && (
        <p style={{ color:'#333', fontSize:17, lineHeight:1.8, marginBottom:24 }}>{item.summary}</p>
      )}
      <div className="md-body" style={{ lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html: renderBody(item) }} />
    </main>
  );
}
