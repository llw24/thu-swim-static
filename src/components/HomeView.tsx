'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/lib/i18n';
import { withBase } from '@/lib/content-shared';
import type { NewsItem } from '@/lib/content-shared';

/**
 * 首页 —— 视觉与原动态站一致（英雄图轮播 + 新闻轮播 + 公告横幅 + 模块卡片），
 * 数据全部来自构建时注入的 props（不再请求任何 API）。
 */
export default function HomeView({
  news,
  announcement,
}: {
  news: Pick<NewsItem, 'slug' | 'title' | 'date' | 'summary' | 'emoji' | 'url' | 'pinned'>[];
  announcement: string;
}) {
  const [idx, setIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const HERO_IMAGES = ['/hero/1.webp', '/hero/2.webp', '/hero/3.webp', '/hero/4.webp'];
  const t = useT();

  // 右侧卡片同步置顶动态：只显示置顶的；没有置顶时显示最新一条
  const heroNews = useMemo(() => {
    const pinned = news.filter((n) => n.pinned);
    return pinned.length > 0 ? pinned : news.slice(0, 1);
  }, [news]);
  // 轮播索引对卡片列表取模，避免列表变化后 idx 越界导致卡片空白
  const safeIdx = heroNews.length ? idx % heroNews.length : 0;

  useEffect(() => {
    if (heroNews.length < 2) return;
    const tm = setInterval(() => setIdx((i) => (i + 1) % heroNews.length), 5000);
    return () => clearInterval(tm);
  }, [heroNews.length]);

  useEffect(() => {
    const tm = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(tm);
  }, []);

  return (
    <main style={{ minHeight:'100vh', background:'var(--paper)', paddingTop:100 }}>
      <section className="hero-bg" style={{ position:'relative', marginTop:-100, paddingTop:130, paddingBottom:60, overflow:'hidden', marginBottom:40 }}>
        {HERO_IMAGES.map((src, i) => (
          <div key={src} aria-hidden style={{ position:'absolute', inset:0, opacity:i === heroIdx ? 1 : 0, transition:'opacity 1.2s ease-in-out' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase(src)}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
            />
          </div>
        ))}
        <div aria-hidden className="hero-overlay" style={{ position:'absolute', inset:0, background:'linear-gradient(rgba(15,32,52,0.55), rgba(15,32,52,0.35))' }} />
        <button aria-label="Previous image" onClick={() => setHeroIdx((i) => (i - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)} className="hero-arrow hero-arrow-left">‹</button>
        <button aria-label="Next image" onClick={() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length)} className="hero-arrow hero-arrow-right">›</button>
        <div className="hero-dots" aria-hidden>
          {HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Image ${i+1}`} className={`hero-dot${i === heroIdx ? ' active' : ''}`} />
          ))}
        </div>
      <div className="container" style={{ position:'relative', zIndex:1 }}>
        {announcement && (
          <div style={{ background:'#FFF6E0', border:'1px solid #EBD8A6', padding:'12px 18px', borderRadius:10, marginBottom:24, fontSize:14, color:'#7A5B0E' }}>📢 {announcement}</div>
        )}
        <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1.15fr 1fr', gap:48, alignItems:'stretch', marginBottom:0 }}>
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <p className="eyebrow hero-eyebrow" style={{ marginBottom:20 }}>Tsinghua Swimming Association</p>
            <h1 className="serif hero-title" style={{ fontSize:52, lineHeight:1.1, fontWeight:300, marginBottom:24 }}>
              {t('欢迎来到', 'Welcome to')}<br/>{t('清华大学学生游泳协会', 'Tsinghua Student Swimming Association')}
            </h1>
            <p className="hero-lead" style={{ fontSize:17, lineHeight:1.75, marginBottom:20, maxWidth:560 }}>
              {t(
                '我们是经校团委批准、依托体育部及陈明游泳馆建立的学生社团，也是每年"马约翰杯"游泳比赛的承办单位。主要社团活动为开展群众游泳活动以及推广校园游泳文化。',
                'We are a student organization approved by the Youth League Committee, established under the Sports Department and based at Chen Ming Natatorium, and we organize the annual Ma Yuehan Cup swim meet. Day to day, we run swim sessions for everyone on campus and work to grow swimming culture at Tsinghua.'
              )}
            </p>
            <p className="hero-lead" style={{ lineHeight:1.75, marginBottom:28, maxWidth:560 }}>
              {t(
                '无论你是想学会游泳的初学者、寻找伙伴与教练的进阶者，还是希望在校园找到一片属于游泳的社区——这里都为你敞开。',
                'Whether you are a beginner learning to swim, an intermediate swimmer looking for a partner or coach, or simply looking for a swim community on campus — you are welcome here.'
              )}
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <Link href="/about" className="btn-primary">{t('了解更多', 'Learn more')} →</Link>
              <Link href="/community" className="btn-secondary hero-btn-secondary">{t('加入社群', 'Join our community')}</Link>
            </div>
          </div>

          <div className="card" style={{ overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px 24px 12px', borderBottom:'1px solid var(--line)' }}>
              <span className="eyebrow">{t('置顶动态', 'Pinned')} · News</span>
            </div>
            <div className="news-stage" style={{ position:'relative', flex:1 }}>
              {heroNews.map((n, i) => (
                <Link key={n.slug} href={n.url || `/news/${n.slug}`}
                  target={n.url ? '_blank' : undefined}
                  rel={n.url ? 'noopener noreferrer' : undefined}
                  style={{
                  position:'absolute', inset:0, opacity:i === safeIdx ? 1 : 0,
                  transition:'opacity .5s', pointerEvents:i === safeIdx ? 'auto' : 'none',
                  display:'flex', flexDirection:'column', textDecoration:'none', color:'inherit',
                }}>
                  <div className="news-cover">{n.emoji}</div>
                  <div style={{ padding:24, flex:1 }}>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8, textAlign:'center' }}>{n.date}</div>
                    <h3 className="serif" style={{ fontSize:22, marginBottom:12, fontWeight:500 }}>{n.title}</h3>
                    <p style={{ color:'#444', lineHeight:1.7 }}>{n.summary}</p>
                  </div>
                </Link>
              ))}
              {heroNews.length === 0 && (
                <div style={{ padding:40, color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {t('暂无动态，敬请期待', 'No news yet — stay tuned')}
                </div>
              )}
            </div>
            {heroNews.length > 1 && (
              <>
                <button aria-label={t('上一条', 'Previous')} className="news-nav news-nav-left" onClick={() => setIdx((i) => (i - 1 + heroNews.length) % heroNews.length)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button aria-label={t('下一条', 'Next')} className="news-nav news-nav-right" onClick={() => setIdx((i) => (i + 1) % heroNews.length)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}
            <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'12px 0 20px' }}>
              {heroNews.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width:i === safeIdx ? 20 : 6, height:6, borderRadius:3, border:0,
                  background:i === safeIdx ? 'var(--aqua)' : '#d5d1c4', cursor:'pointer', transition:'all .3s',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      </section>

      <div className="container">
        <h2 className="serif" style={{ fontSize:32, textAlign:'center', marginBottom:12, fontWeight:400 }}>{t('协会为你提供', 'What we offer')}</h2>
        <p style={{ textAlign:'center', color:'var(--muted)', marginBottom:48 }}>{t('活动报名 · 加入社群 · 校园赛事，一个入口全部搞定', 'Sign-ups · Community · Campus meets — all in one place')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:24, marginBottom:80 }}>
          <ModuleCard
            emoji="🏊‍♀️"
            title={t('活动报名', 'Sign-up')}
            desc={t('零基础教学班、进阶训练、校园赛事等活动的报名入口都在这里，验证清华邮箱后即可报名。', 'Beginner classes, training, campus meets — all sign-ups live here, unlocked with a quick Tsinghua email verification.')}
            href="/training"
            cta={t('前往报名', 'Register now') + ' →'}
          />
          <ModuleCard
            emoji="💬"
            title={t('泳协社群', 'Our Community')}
            desc={t('加入协会微信群：日常通知、约游组队、技术交流都在社群里进行。', 'Join our WeChat group — notices, meetups and technique chat all happen in the community.')}
            href="/community"
            cta={t('加入社群', 'Join Us') + ' →'}
          />
        </div>
      </div>
    </main>
  );
}

function ModuleCard({ emoji, title, desc, href, cta }: { emoji: string; title: string; desc: string; href: string; cta: string }) {
  return (
    <div className="card" style={{ padding:32, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40 }}>{emoji}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <h3 className="serif" style={{ fontSize:22, fontWeight:500 }}>{title}</h3>
      </div>
      <p style={{ color:'#555', lineHeight:1.7, flex:1 }}>{desc}</p>
      <Link href={href} className="link-arrow">{cta}</Link>
    </div>
  );
}
