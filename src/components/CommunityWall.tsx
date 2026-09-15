'use client';
import { useState } from 'react';
import { useT, useLang } from '@/lib/i18n';
import GiscusComments from './GiscusComments';
import JoinGate from './JoinGate';
import { WALL_CATEGORIES } from '@/lib/content-shared';
import type {
  WallItem,
  WallCategory,
  SiteSettings,
} from '@/lib/content-shared';

/**
 * 加入社群页 —— 三块结构：
 *  ① 验证入群（JoinGate：先验证清华邮箱，验证后才看得到进群方式与报名入口）
 *  ② 社群精选（content/wall/*.md 的公众号文章/视频外链）
 *  ③ Giscus 留言板（GitHub Discussions，配置后自动启用）
 */
export default function CommunityWall({ wall, site }: { wall: WallItem[]; site: SiteSettings }) {
  const t = useT();
  const { lang } = useLang();
  const [cat, setCat] = useState<WallCategory | 'all'>('all');
  const shown = cat === 'all' ? wall : wall.filter((w) => w.category === cat);

  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth:900 }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>Join Us</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:28 }}>
        {t('加入社群', 'Join Our Community')}
      </h1>

      {/* ① 验证入群 —— 验证清华邮箱后才会显示进群方式与报名入口 */}
      <JoinGate site={site} />

      {/* ② 社群精选 */}
      <h2 className="serif" style={{ fontSize:26, fontWeight:400, marginBottom:16 }}>{t('社群精选', 'Highlights')}</h2>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <Chip active={cat==='all'} onClick={()=>setCat('all')}>{t('全部', 'All')}</Chip>
        {(Object.keys(WALL_CATEGORIES) as WallCategory[]).map((k) => (
          <Chip key={k} active={cat===k} onClick={()=>setCat(k)}>
            {lang === 'en' ? WALL_CATEGORIES[k].en : WALL_CATEGORIES[k].zh}
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="card" style={{ padding:40, color:'var(--muted)', marginBottom:32 }}>
          {t('这里还没有内容。管理员发现好文章/视频后会贴到这里。', 'Nothing here yet — admins will post selected articles and videos.')}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:32 }}>
          {shown.map((w) => (
            <a key={w.slug} href={w.url} target="_blank" rel="noopener noreferrer" className="card" style={{ padding:20, textDecoration:'none', color:'inherit' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:26 }}>{w.emoji}</span>
                <span className="chip chip-neutral">{lang === 'en' ? WALL_CATEGORIES[w.category].en : WALL_CATEGORIES[w.category].zh}</span>
              </div>
              <h3 className="serif" style={{ fontSize:17, fontWeight:500, marginBottom:6 }}>{w.title} ↗</h3>
              {w.summary && <p style={{ color:'#555', lineHeight:1.6, fontSize:14 }}>{w.summary}</p>}
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:10 }}>{w.date}</div>
            </a>
          ))}
        </div>
      )}

      {/* ③ 留言板 */}
      <GiscusComments giscus={site.giscus} />
    </main>
  );
}

function Chip({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} className={`chip ${active ? 'chip-open' : 'chip-neutral'}`} style={{ cursor:'pointer', padding:'6px 16px', fontSize:14, background:active?'var(--ink)':'white', color:active?'white':'#333', border:'1px solid var(--line)' }}>
      {children}
    </button>
  );
}
