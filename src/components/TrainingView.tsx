'use client';
import { useT } from '@/lib/i18n';
import { withBase } from '@/lib/content-shared';
import type { SessionItem, SessionStatus } from '@/lib/content-shared';

/**
 * 活动报名页 —— 活动信息来自 content/sessions/*.md（构建时注入）。
 * 报名走问卷星：链接不公开在页面上，点「立即报名」先做清华邮箱验证，
 * 验证后由老站接口发放报名入口（见 /join）。
 */
export default function TrainingView({ sessions }: { sessions: SessionItem[] }) {
  const t = useT();
  const active = sessions.filter((s) => s.status !== 'closed');
  const past = sessions.filter((s) => s.status === 'closed');

  return (
    <main className="container" style={{ padding:'110px 24px 60px' }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>Sign-up</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:12 }}>{t('活动报名', 'Activity Sign-up')}</h1>
      <p style={{ color:'#444', maxWidth:720, lineHeight:1.7, marginBottom:12 }}>
        {t(
          '协会的各类活动都在这里开放报名：零基础教学班、进阶训练、校内赛事、体验活动等。报名需先用清华邮箱验证身份（一次验证，进群和报名通用）。',
          'All club activities open for sign-up here: beginner classes, advanced training, campus meets and taster sessions. A quick Tsinghua email verification is required first (it also covers joining the WeChat group).',
        )}
      </p>
      <p style={{ color:'var(--muted)', maxWidth:720, lineHeight:1.7, fontSize:13.5, marginBottom:40 }}>
        {t(
          '名额有限，先到先得；每期名额与截止时间以活动卡片为准，满员后请联系理事会登记候补。',
          'Seats are limited and first come, first served. Check each card for capacity and deadlines; contact a board member for the waitlist once full.',
        )}
      </p>

      {active.length > 0 ? (
        <div style={{ marginBottom:40 }}>
          <h3 className="serif" style={{ fontSize:22, fontWeight:500, marginBottom:16 }}>{t('正在报名', 'Open now')}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:20 }}>
            {active.map((s) => <SessionCard key={s.slug} session={s} t={t} />)}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding:40, marginBottom:40 }}>{t('近期没有开放报名的活动，请留意首页公告，或先加入社群等通知。', 'Nothing open for sign-up right now — watch the homepage or join the group to get notified.')}</div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop:20 }}>
          <h3 className="serif" style={{ fontSize:20, marginBottom:16 }}>{t('往期活动', 'Past activities')}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
            {past.map((p) => (
              <div key={p.slug} className="card" style={{ padding:20 }}>
                <span className="chip chip-closed" style={{ marginBottom:10, display:'inline-block' }}>{t('已结束', 'Ended')}</span>
                <div style={{ fontWeight:500 }}>{p.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

const CHIP: Record<SessionStatus, string> = { open:'chip chip-open', full:'chip chip-full', closed:'chip chip-closed' };

function SessionCard({ session: s, t }: { session: SessionItem; t: (zh: string, en?: string) => string }) {
  const chipText = s.status === 'open'
    ? t('报名中 · 点击下方按钮报名', 'Open — register below')
    : s.status === 'full'
      ? t('名额已满 · 可登记候补', 'Full — join the waitlist')
      : t('暂未开放报名', 'Not open yet');

  return (
    <div className="card" style={{ padding:28, display:'flex', flexDirection:'column' }}>
      <span className={CHIP[s.status]} style={{ alignSelf:'flex-start' }}>{chipText}</span>
      <h2 className="serif" style={{ fontSize:22, fontWeight:500, margin:'12px 0 8px' }}>{s.title}</h2>
      <p style={{ color:'#555', lineHeight:1.7, fontSize:14, marginBottom:16 }}>{s.description}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
        {s.schedule && <InfoRow k={t('上课时间', 'Schedule')} v={s.schedule} />}
        {s.location && <InfoRow k={t('上课地点', 'Location')} v={s.location} />}
        {s.price && <InfoRow k={t('费用', 'Price')} v={s.price} />}
      </div>
      {s.qr && (
        <div style={{ textAlign:'center', marginBottom:16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase(s.qr)} alt={t('教学群二维码', 'Class WeChat QR')} style={{ width:160, borderRadius:10, border:'1px solid var(--line)' }} />
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>{t('教学微信群二维码', 'Class group QR code')}</div>
        </div>
      )}
      <div style={{ marginTop:'auto' }}>
        {s.status === 'closed' ? (
          <span style={{ fontSize:14, color:'var(--muted)' }}>{t('报名尚未开始，敬请关注首页公告。', 'Registration not open yet — check the homepage announcement.')}</span>
        ) : s.registerUrl ? (
          <a href={s.registerUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display:'inline-block', textDecoration:'none' }}>
            {t('立即报名 →', 'Register now →')}
          </a>
        ) : (
          <a href={`/verify/?next=signup`} className="btn-primary" style={{ display:'inline-block', textDecoration:'none' }}>
            {s.status === 'full' ? t('登记候补 →', 'Join waitlist →') : t('立即报名 →', 'Register now →')}
          </a>
        )}
      </div>
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
