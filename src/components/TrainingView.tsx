'use client';
import { useT } from '@/lib/i18n';
import { withBase } from '@/lib/content-shared';
import type { SessionItem, SessionStatus } from '@/lib/content-shared';

/** 零基础班 —— 数据来自 content/sessions/*.md */
export default function TrainingView({ sessions }: { sessions: SessionItem[] }) {
  const t = useT();
  const active = sessions.filter((s) => s.status !== 'closed');
  const past = sessions.filter((s) => s.status === 'closed');

  return (
    <main className="container" style={{ padding:'110px 24px 60px' }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>Beginner Class</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:12 }}>{t('零基础班', 'Beginner Class')}</h1>
      <p style={{ color:'#444', maxWidth:720, lineHeight:1.7, marginBottom:40 }}>
        {t(
          '面向从未接触过游泳、或希望进阶的清华同学。协会每学期开设多个班次（如蛙泳班、自由泳班），由校队队员与专业教练小班执教，学期末进行独立游泳测试。',
          'For Tsinghua students who have never swum before, or want to improve. Each term we run several sections (breaststroke, freestyle, etc.) taught in small classes by team members and coaches, with a final swim test at term end.'
        )}
      </p>

      {active.length > 0 ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:20, marginBottom:40 }}>
          {active.map((s) => <SessionCard key={s.slug} session={s} t={t} />)}
        </div>
      ) : (
        <div className="card" style={{ padding:40, marginBottom:40 }}>{t('本期暂无课程，请留意后续公告。', 'No classes this term — watch for future announcements.')}</div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop:20 }}>
          <h3 className="serif" style={{ fontSize:20, marginBottom:16 }}>{t('往期回顾', 'Past terms')}</h3>
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
      ? t('名额已满 · 可联系候补', 'Full — waitlist via contact')
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
        {s.registerUrl && s.status !== 'closed' ? (
          <a href={s.registerUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display:'inline-block', textDecoration:'none' }}>
            {s.status === 'open' ? t('立即报名 →', 'Register now →') : t('查看详情与候补 →', 'Details & waitlist →')}
          </a>
        ) : (
          <span style={{ fontSize:14, color:'var(--muted)' }}>{t('报名尚未开始，敬请关注首页公告。', 'Registration not open yet — check the homepage announcement.')}</span>
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
