'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import type { NewsItem, SessionItem } from '@/lib/content-shared';

/**
 * 首页 —— 视觉与原动态站一致（英雄图轮播 + 新闻轮播 + 公告横幅 + 模块卡片），
 * 数据全部来自构建时注入的 props（不再请求任何 API）。
 */
export default function HomeView({
  news,
  session,
  announcement,
}: {
  news: Pick<NewsItem, 'slug' | 'title' | 'date' | 'summary' | 'emoji'>[];
  session: SessionItem | null;
  announcement: string;
}) {
  const [idx, setIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const HERO_IMAGES = ['/hero/1.jpg', '/hero/2.jpg', '/hero/3.jpg', '/hero/4.jpg'];
  const t = useT();

  useEffect(() => {
    if (news.length < 2) return;
    const tm = setInterval(() => setIdx((i) => (i + 1) % news.length), 5000);
    return () => clearInterval(tm);
  }, [news.length]);

  useEffect(() => {
    const tm = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(tm);
  }, []);

  const trainingStatus = session ? sessionChip(session.status, t) : null;

  return (
    <main style={{ minHeight:'100vh', background:'var(--paper)', paddingTop:100 }}>
      <section className="hero-bg" style={{ position:'relative', marginTop:-100, paddingTop:130, paddingBottom:60, overflow:'hidden', marginBottom:40 }}>
        {HERO_IMAGES.map((src, i) => (
          <div key={src} aria-hidden style={{ position:'absolute', inset:0, opacity:i === heroIdx ? 1 : 0, transition:'opacity 1.2s ease-in-out' }}>
            <Image src={src} alt="" fill priority={i === 0} sizes="100vw" style={{ objectFit:'cover', objectPosition:'center' }} />
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
                '我们是经校团委批准、依托体育部及陈明游泳馆建立的正规学生社团，也是每年"马约翰杯"游泳比赛的承办单位。四十年来，协会以推广校园游泳文化、教零基础同学从怕水到自如、服务校队与代表队为宗旨。',
                'We are an officially recognized student organization approved by the Youth League Committee and hosted at Chen Ming Natatorium. As the organizer of the annual Ma Yuehan Cup swim meet, we have spent the past four decades promoting swim culture on campus, teaching beginners to swim confidently, and supporting the university teams.'
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
              <Link href="/community" className="btn-secondary hero-btn-secondary">{t('加入社区', 'Join community')}</Link>
            </div>
          </div>

          <div className="card" style={{ overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px 24px 12px', borderBottom:'1px solid var(--line)' }}>
              <span className="eyebrow">{t('最新动态', 'Latest')} · News</span>
            </div>
            <div className="news-stage" style={{ position:'relative', flex:1 }}>
              {news.map((n, i) => (
                <Link key={n.slug} href={`/news/${n.slug}`} style={{
                  position:'absolute', inset:0, opacity:i === idx ? 1 : 0,
                  transition:'opacity .5s', pointerEvents:i === idx ? 'auto' : 'none',
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
              {news.length === 0 && (
                <div style={{ padding:40, color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {t('暂无动态，敬请期待', 'No news yet — stay tuned')}
                </div>
              )}
            </div>
            {news.length > 1 && (
              <>
                <button aria-label={t('上一条', 'Previous')} className="news-nav news-nav-left" onClick={() => setIdx((i) => (i - 1 + news.length) % news.length)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button aria-label={t('下一条', 'Next')} className="news-nav news-nav-right" onClick={() => setIdx((i) => (i + 1) % news.length)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}
            <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'12px 0 20px' }}>
              {news.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width:i === idx ? 20 : 6, height:6, borderRadius:3, border:0,
                  background:i === idx ? 'var(--aqua)' : '#d5d1c4', cursor:'pointer', transition:'all .3s',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      </section>

      <div className="container">
        <h2 className="serif" style={{ fontSize:32, textAlign:'center', marginBottom:12, fontWeight:400 }}>{t('协会为你提供', 'What we offer')}</h2>
        <p style={{ textAlign:'center', color:'var(--muted)', marginBottom:48 }}>{t('教学 · 社区 · 教练资源，一个入口全部搞定', 'Lessons · Community · Coaches — all in one place')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:24, marginBottom:80 }}>
          <ModuleCard
            emoji="🏊‍♀️"
            title={t('零基础班', 'Beginner Class')}
            desc={t('每年春秋两季开班，四周八次课，专业教练小班教学。学期末承诺能独立游完 25 米。', 'Spring and fall terms · 8 sessions over 4 weeks · small-class instruction. By term end, you will swim 25m on your own.')}
            href="/training"
            cta={(session?.status === 'open' ? t('前往报名', 'Register now') : t('查看本期课程', 'View current term')) + ' →'}
            statusChip={trainingStatus}
          />
          <ModuleCard
            emoji="💬"
            title={t('游泳社区', 'Swim Community')}
            desc={t('加入协会微信群交流讨论，社区墙汇集精选求助、分享与约游内容。', 'Join our WeChat group for discussions — the community wall collects selected Q&A, sharing and meetups.')}
            href="/community"
            cta={t('进入社区', 'Enter community') + ' →'}
          />
          <ModuleCard
            emoji="👨‍🏫"
            title={t('找教练', 'Find a Coach')}
            desc={t('需要一对一指导？浏览协会认证教练资料，或提交需求由协会为你对接。', 'Need 1-on-1 coaching? Browse certified coach profiles, or submit a request and we will match you.')}
            href="/coaches"
            cta={t('浏览教练', 'Browse coaches') + ' →'}
          />
        </div>
      </div>
    </main>
  );
}

function sessionChip(status: string, t: (zh: string, en?: string) => string) {
  if (status === 'open') return { className:'chip chip-open', text:t('报名中', 'Open') };
  if (status === 'full') return { className:'chip chip-full', text:t('名额已满', 'Full') };
  return { className:'chip chip-closed', text:t('暂未开放', 'Closed') };
}

function ModuleCard({ emoji, title, desc, href, cta, statusChip }: any) {
  return (
    <div className="card" style={{ padding:32, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40 }}>{emoji}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <h3 className="serif" style={{ fontSize:22, fontWeight:500 }}>{title}</h3>
        {statusChip && <span className={statusChip.className}>{statusChip.text}</span>}
      </div>
      <p style={{ color:'#555', lineHeight:1.7, flex:1 }}>{desc}</p>
      <Link href={href} className="link-arrow">{cta}</Link>
    </div>
  );
}
