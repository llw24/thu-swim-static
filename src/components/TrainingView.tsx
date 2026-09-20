'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import type { SessionItem } from '@/lib/content-shared';

/**
 * 活动预告页 —— 活动信息来自 content/sessions/*.md（构建时注入）。
 * 只做介绍，不做站内报名：即将开展（upcoming，点开看详情）+ 往期活动（closed）。
 * 报名/接龙都在协会微信群内进行。
 */
export default function TrainingView({ sessions }: { sessions: SessionItem[] }) {
  const t = useT();
  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const past = sessions.filter((s) => s.status === 'closed');

  return (
    <main className="container" style={{ padding:'110px 24px 60px' }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>Activities</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:12 }}>{t('活动预告', 'Events')}</h1>
      <p style={{ color:'#444', maxWidth:720, lineHeight:1.7, marginBottom:12 }}>
        {t(
          '协会活动的预告与回顾：教学班、训练、校内赛事、体验活动等。活动的报名和参与方式都在协会微信群内通知。',
          'Previews and recaps of club events — beginner classes, training, campus meets and taster sessions. Sign-ups and details are announced in our WeChat group.',
        )}
      </p>
      <p style={{ color:'var(--muted)', maxWidth:720, lineHeight:1.7, fontSize:13.5, marginBottom:40 }}>
        {t(
          '想参加活动？先在「加入社群」页验证进群，群里会第一时间发通知。',
          'Want to join? Verify and join the WeChat group via "Join Us" — announcements go out there first.',
        )}
      </p>

      {upcoming.length > 0 ? (
        <UpcomingStrip items={upcoming} t={t} />
      ) : (
        <div className="card" style={{ padding:40, marginBottom:40 }}>
          {t('近期没有新的活动预告，加入社群可第一时间收到通知。', 'No upcoming events announced yet — join the group to hear first.')}
        </div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop:40 }}>
          <h3 className="serif" style={{ fontSize:20, marginBottom:16 }}>{t('往期活动', 'Past activities')}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>
            {past.map((p) => (
              <div key={p.slug} className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:8 }}>
                <span className="chip chip-closed" style={{ alignSelf:'flex-start' }}>{t('已结束', 'Ended')}</span>
                <div style={{ fontWeight:500 }}>{p.title}</div>
                {(p.schedule || p.location) && (
                  <div style={{ fontSize:12.5, color:'var(--muted)' }}>
                    {[p.schedule, p.location].filter(Boolean).join(' · ')}
                  </div>
                )}
                {p.description && (
                  <div style={{ fontSize:13.5, color:'#555', lineHeight:1.7 }}>{p.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

/** 即将开展的活动 —— 横向一栏，点击展开详情 */
function UpcomingStrip({ items, t }: { items: SessionItem[]; t: (zh: string, en?: string) => string }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const sel = items.find((s) => s.slug === openSlug) ?? null;

  return (
    <div>
      <h3 className="serif" style={{ fontSize:20, fontWeight:500, marginBottom:4 }}>{t('即将开展', 'Coming up')}</h3>
      <p style={{ color:'var(--muted)', fontSize:13, marginBottom:14 }}>
        {t('点击活动名查看详情。', 'Tap an activity for details.')}
      </p>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {items.map((s) => (
          <button
            key={s.slug}
            onClick={() => setOpenSlug(openSlug === s.slug ? null : s.slug)}
            className="chip"
            style={{
              cursor:'pointer', padding:'10px 18px', fontSize:14, borderRadius:20,
              background: openSlug === s.slug ? 'var(--ink)' : 'white',
              color: openSlug === s.slug ? 'white' : '#333',
              border:'1px solid var(--line)',
            }}
          >
            {openSlug === s.slug ? '▾ ' : '▸ '}{s.title}
          </button>
        ))}
      </div>
      {sel && (
        <div className="card" style={{ marginTop:14, padding:24 }}>
          <span className="chip chip-neutral" style={{ display:'inline-block', marginBottom:10 }}>{t('即将开展', 'Upcoming')}</span>
          <h4 className="serif" style={{ fontSize:18, fontWeight:500, marginBottom:10 }}>{sel.title}</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12, fontSize:14 }}>
            {sel.schedule && <InfoRow k={t('时间', 'When')} v={sel.schedule} />}
            {sel.location && <InfoRow k={t('地点', 'Where')} v={sel.location} />}
            {sel.price && <InfoRow k={t('费用', 'Price')} v={sel.price} />}
          </div>
          {sel.description && <p style={{ color:'#555', lineHeight:1.7, fontSize:14, marginBottom:12 }}>{sel.description}</p>}
          <p style={{ color:'var(--muted)', fontSize:12.5 }}>
            {t(
              '参加方式以协会微信群内通知为准；还没进群？到「加入社群」页验证入群。',
              'How to take part is announced in the WeChat group. Not in yet? Verify and join via "Join Us".',
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display:'flex', gap:12, fontSize:14 }}>
      <span style={{ color:'var(--muted)', minWidth:64 }}>{k}</span>
      <span style={{ color:'#333' }}>{v}</span>
    </div>
  );
}
