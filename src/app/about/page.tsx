'use client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

/** 标签 + 内容的一行说明（人群/配置/模式/报名 用） */
function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', gap: 14, fontSize: 14.5, lineHeight: 1.85 }}>
      <span style={{ color: 'var(--muted)', minWidth: 44, flexShrink: 0, fontWeight: 500 }}>{k}</span>
      <span style={{ color: '#333', flex: 1 }}>{v}</span>
    </div>
  );
}

export default function About() {
  const t = useT();
  return (
    <main className="container" style={{ padding: '110px 24px 60px', maxWidth: 860 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>About</p>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 28 }}>{t('关于协会', 'About the Association')}</h1>

      {/* ------------------------------ 我们做什么 ------------------------------ */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <h2 className="serif" style={{ fontSize: 24, marginBottom: 20 }}>{t('我们做什么', 'What we do')}</h2>

        <h3 className="serif" style={{ fontSize: 19, fontWeight: 500, margin: '4px 0 14px' }}>{t('一、日常活动', 'I. Regular activities')}</h3>

        {/* 1. 零基础班 */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
          <h4 className="serif" style={{ fontSize: 17, fontWeight: 500, marginBottom: 10 }}>
            {t('1. 零基础蛙泳、自由泳班', '1. Beginner breaststroke & freestyle class')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InfoRow k={t('人群', 'Who')} v={t(
              '还未学会游泳，但有意愿付出时间和精力去学习游泳。',
              'Students who cannot swim yet but are willing to put in the time and effort to learn.',
            )} />
            <InfoRow k={t('配置', 'Coaching')} v={t(
              '由游泳馆提供一名具有游泳教练资格证的教练来进行教学。',
              'Taught by a certified swimming coach provided by the natatorium.',
            )} />
            <InfoRow k={t('模式', 'Format')} v={t(
              '以学习蛙泳、自由泳为主。每节课所学内容不同，教练会由浅入深一步步进行教学。',
              'Focuses on breaststroke and freestyle. Each lesson covers new ground, with the coach teaching step by step from shallow to deep.',
            )} />
            <InfoRow k={t('报名', 'Sign-up')} v={t(
              '为方便教学管理，本学期实行以一个月为一期的活动形式，共 3 期。每期 8 次课，每周两次，分别为报名月份的每周四下午 3:15–4:30 和周日上午 9:30–10:45。每期只能容纳 20 名左右（根据教练情况而定），实行先到先得的原则，每期会通过群聊内小程序进行报名，若报名成功则会有负责人联系。',
              'For easier management, this term runs in monthly sessions — 3 in total. Each session has 8 lessons, twice a week: Thursdays 15:15–16:30 and Sundays 9:30–10:45 of the sign-up month. Each session holds about 20 swimmers (depending on coaching), first come first served. Sign up via the mini-program in the group chat; if you get in, an organizer will contact you.',
            )} />
          </div>
        </div>

        {/* 2. 提高区 */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '18px 20px' }}>
          <h4 className="serif" style={{ fontSize: 17, fontWeight: 500, marginBottom: 10 }}>
            {t('2. 提高区', '2. Improvement lane')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InfoRow k={t('人群', 'Who')} v={t(
              '已经学会一种泳姿的同学。',
              'Students who have already mastered one stroke.',
            )} />
            <InfoRow k={t('配置', 'Coaching')} v={t(
              '一至两名游泳馆教练员或游泳校队成员或外校拥有教练员证的同学。',
              'One or two natatorium coaches, members of the university swim team, or externally certified coaches.',
            )} />
            <InfoRow k={t('模式', 'Format')} v={t(
              '进行各种泳姿教学、答疑，每节课所学内容不同，教练会由浅入深根据学员情况进行教学。',
              'Teaching and Q&A on all strokes. Each lesson covers new ground, with coaching tailored to your level.',
            )} />
            <InfoRow k={t('报名', 'Sign-up')} v={t(
              '通过群聊内小程序报名，每周两次，分别为每周四下午 3:15–4:30 和周日上午 9:30–10:45。每期只能容纳 20 人左右，实行先到先得的原则，每次通过群聊内小程序进行报名，若报名成功则会有负责人联系。',
              'Sign up each time via the mini-program in the group chat. Lessons run twice a week — Thursdays 15:15–16:30 and Sundays 9:30–10:45 — with about 20 spots each, first come first served. If you get in, an organizer will contact you.',
            )} />
          </div>
        </div>

        <h3 className="serif" style={{ fontSize: 19, fontWeight: 500, margin: '24px 0 10px' }}>{t('二、承办赛事', 'II. Events we host')}</h3>
        <p style={{ color: '#333', lineHeight: 1.85, fontSize: 14.5 }}>
          <strong>{t('马约翰杯游泳赛', 'Ma Yuehan Cup Swim Meet')}</strong>
          {t('：每年秋季学期承办校级游泳赛事。', ': the university-level swim meet, hosted every fall term.')}
        </p>
      </div>

      {/* ------------------------------ 联系我们 ------------------------------ */}
      <div className="card" style={{ padding: 32 }}>
        <h2 className="serif" style={{ fontSize: 24, marginBottom: 12 }}>{t('联系我们', 'Contact us')}</h2>
        <p style={{ color: '#333', lineHeight: 1.85, marginBottom: 18 }}>
          {t('欢迎加入游泳协会社群', 'Come join the TSSA community')}
        </p>
        <Link href="/community" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          {t('加入社群 →', 'Join us →')}
        </Link>
      </div>
    </main>
  );
}
