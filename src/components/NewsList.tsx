'use client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { withBase } from '@/lib/content-shared';
import type { NewsItem, SiteSettings } from '@/lib/content-shared';

/**
 * 动态页 —— 日常动态都在微信公众号发布，这里做导流：
 * 顶部公众号卡片（二维码/名称）+ 文章链接列表（content/news/*.md 里放 mp.weixin.qq.com 链接）。
 */
export default function NewsList({ items, site }: { items: Omit<NewsItem, 'body'>[]; site: SiteSettings }) {
  const t = useT();

  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth:900 }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>News</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:20 }}>{t('协会动态', 'Association News')}</h1>

      {/* 公众号导流卡 */}
      <div className="card" style={{ padding:24, marginBottom:32, display:'flex', gap:22, alignItems:'center', flexWrap:'wrap' }}>
        {site.gzhQr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(site.gzhQr)}
            alt={t('公众号二维码', 'WeChat account QR')}
            style={{ width:120, height:120, objectFit:'contain', borderRadius:10, border:'1px solid var(--line)' }}
          />
        )}
        <div style={{ flex:1, minWidth:260 }}>
          <h2 className="serif" style={{ fontSize:20, fontWeight:500, marginBottom:8 }}>
            {t('最新动态都在微信公众号', 'All our updates live on WeChat')}
          </h2>
          <p style={{ color:'#555', lineHeight:1.8, fontSize:14 }}>
            {site.gzhName
              ? t(
                  `日常通知、活动回顾和招新信息都在公众号「${site.gzhName}」发布，微信搜索或扫码关注即可看到最新内容。`,
                  `Announcements and event recaps are posted on our official account "${site.gzhName}" — search it on WeChat or scan the QR code.`,
                )
              : t('日常通知、活动回顾和招新信息都在微信公众号发布。', 'Announcements are posted on our official WeChat account.')}
          </p>
        </div>
      </div>

      {items.length === 0 && (
        <div className="card" style={{ padding:40, color:'var(--muted)' }}>{t('暂无动态，敬请期待', 'No news yet — stay tuned')}</div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {items.map((n) =>
          // 有 url 的直接跳公众号文章，没有的走站内详情页
          n.url ? (
            <a key={n.slug} href={n.url} target="_blank" rel="noopener noreferrer" className="card" style={{ padding:20, textDecoration:'none', color:'inherit' }}>
              <ItemBody n={n} t={t} external />
            </a>
          ) : (
            <Link key={n.slug} href={`/news/${n.slug}`} className="card" style={{ padding:20, textDecoration:'none', color:'inherit' }}>
              <ItemBody n={n} t={t} />
            </Link>
          ),
        )}
      </div>
    </main>
  );
}

function ItemBody({
  n,
  t,
  external,
}: {
  n: Omit<NewsItem, 'body'>;
  t: (zh: string, en?: string) => string;
  external?: boolean;
}) {
  return (
    <>
      <div style={{ fontSize:36, marginBottom:12 }}>{n.emoji}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>
        {n.date}
        {n.pinned ? ` · ${t('置顶', 'Pinned')}` : ''}
        {external ? ` · ${t('公众号文章', 'WeChat article')}` : ''}
      </div>
      <h3 className="serif" style={{ fontSize:18, fontWeight:500, marginBottom:8 }}>
        {n.title}{external ? ' ↗' : ''}
      </h3>
      <p style={{ color:'#555', lineHeight:1.6, fontSize:14 }}>{n.summary}</p>
    </>
  );
}
