'use client';
import { useT } from '@/lib/i18n';
import { withBase } from '@/lib/content-shared';
import type { SessionItem } from '@/lib/content-shared';

/**
 * 活动页 —— 活动信息来自 content/sessions/*.md（构建时注入）。
 * 只做介绍，不做站内报名：即将开展（卡片）+ 往期活动（closed）。
 * 报名/接龙都在协会微信群内进行。
 */
export default function TrainingView({ sessions }: { sessions: SessionItem[] }) {
  const t = useT();
  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const past = sessions.filter((s) => s.status === 'closed');

  return (
    <main className="container" style={{ padding: '110px 24px 60px' }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>Activities</p>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>{t('活动', 'Events')}</h1>
      <p style={{ color: '#444', maxWidth: 720, lineHeight: 1.7, marginBottom: 12 }}>
        {t(
          '协会的活动都在这里：日常活动班、训练、校内赛事、体验活动等。活动的报名和参与方式都在协会微信群内通知。',
          'Club activities live here — regular classes, training, campus meets and taster sessions. Sign-ups and details are announced in our WeChat group.',
        )}
      </p>
      <p style={{ color: 'var(--muted)', maxWidth: 720, lineHeight: 1.7, fontSize: 13.5, marginBottom: 40 }}>
        {t(
          '想参加活动？先在「加入社群」页验证进群，群里会第一时间发通知。',
          'Want to join? Verify and join the WeChat group via "Join Us" — announcements go out there first.',
        )}
      </p>

      {upcoming.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {upcoming.map((s) => <ActivityCard key={s.slug} session={s} t={t} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: 40 }}>
          {t('近期没有活动安排，加入社群可第一时间收到通知。', 'No upcoming events announced yet — join the group to hear first.')}
        </div>
      )}

      {past.length > 0 && (
        <div style={{ marginTop: 44 }}>
          <h3 className="serif" style={{ fontSize: 20, marginBottom: 16 }}>{t('往期活动', 'Past activities')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {past.map((p) => (
              <div key={p.slug} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="chip chip-closed" style={{ alignSelf: 'flex-start' }}>{t('已结束', 'Ended')}</span>
                <div style={{ fontWeight: 500 }}>{p.title}</div>
                {(p.schedule || p.location) && (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    {[p.schedule, p.location].filter(Boolean).join(' · ')}
                  </div>
                )}
                {p.description && (
                  <div style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7 }}>{p.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

/** 即将开展的活动卡片 */
function ActivityCard({ session: s, t }: { session: SessionItem; t: (zh: string, en?: string) => string }) {
  return (
    <div className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span className="chip chip-neutral" style={{ alignSelf: 'flex-start' }}>{t('即将开展', 'Upcoming')}</span>
      <h3 className="serif" style={{ fontSize: 21, fontWeight: 500 }}>{s.title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {s.schedule && <InfoRow k={t('时间', 'When')} v={s.schedule} />}
        {s.location && <InfoRow k={t('地点', 'Where')} v={s.location} />}
        {s.price && <InfoRow k={t('费用', 'Price')} v={s.price} />}
      </div>
      {s.description && (
        <p style={{ color: '#555', lineHeight: 1.75, fontSize: 14, margin: 0 }}>{s.description}</p>
      )}
      {s.qr && (
        <div style={{ textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase(s.qr)} alt={t('活动群二维码', 'Activity WeChat QR')} style={{ width: 150, borderRadius: 10, border: '1px solid var(--line)' }} />
        </div>
      )}
      <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.7, margin: 0, marginTop: 'auto', paddingTop: 6 }}>
        {t(
          '报名/参加以协会微信群内通知为准；还没进群？到「加入社群」页验证入群。',
          'Sign-ups are announced in the WeChat group. Not in yet? Verify and join via "Join Us".',
        )}
      </p>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 14, lineHeight: 1.7 }}>
      <span style={{ color: 'var(--muted)', minWidth: 34, flexShrink: 0 }}>{k}</span>
      <span style={{ color: '#333', flex: 1 }}>{v}</span>
    </div>
  );
}
