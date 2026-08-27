'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { withBase } from '@/lib/content-shared';
import type { CoachItem, SiteSettings } from '@/lib/content-shared';

/** 找教练 —— 教练卡片来自 content/coaches/*.md，表单链接来自 site.json */
export default function CoachesView({
  coaches,
  site,
}: {
  coaches: CoachItem[];
  site: SiteSettings;
}) {
  const t = useT();
  const [tab, setTab] = useState<'browse' | 'request' | 'apply'>('browse');

  return (
    <main className="container" style={{ padding:'110px 24px 60px' }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>Coaches</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:12 }}>{t('找教练', 'Find a Coach')}</h1>
      <p style={{ color:'#444', maxWidth:780, lineHeight:1.7, marginBottom:32 }}>
        {t(
          '协会认证游泳指导员及教练员介绍。学员提出训练需求（时间、地点、目标、可接受酬劳），协会帮忙联系合适的教练进行对接——学员需求信息全程仅协会可见，不会公开。',
          'Profiles of association-certified swim instructors and coaches. Students submit their needs and we match them with a coach privately — your request stays visible to the association only.'
        )}
      </p>

      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        <TabBtn active={tab==='browse'} onClick={()=>setTab('browse')}>{t('浏览教练', 'Browse coaches')}</TabBtn>
        <TabBtn active={tab==='request'} onClick={()=>setTab('request')}>{t('我要找教练', 'Request a coach')}</TabBtn>
        <TabBtn active={tab==='apply'} onClick={()=>setTab('apply')}>{t('申请入驻（教练/校队）', 'Apply as coach')}</TabBtn>
      </div>

      {tab === 'browse' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20 }}>
          {coaches.length === 0 && (
            <div className="card" style={{ padding:40, color:'var(--muted)', gridColumn:'1/-1' }}>
              {t('暂无教练资料，请稍后再来。', 'No coach profiles yet. Please check back later.')}
            </div>
          )}
          {coaches.map((c) => (
            <div key={c.slug} className="card" style={{ padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#4AA8B2,#0B1F3A)' }} />
                <div>
                  <strong>{c.name}</strong>
                  {c.specialties && <div style={{ fontSize:12, color:'var(--muted)' }}>{c.specialties}</div>}
                </div>
              </div>
              <p style={{ color:'#555', lineHeight:1.7, marginBottom:10 }}>{c.bio}</p>
              {c.availability && <div style={{ fontSize:13, color:'#333' }}>🕒 {c.availability}</div>}
              {c.contact && <div style={{ fontSize:13, color:'#333' }}>📮 {c.contact}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'request' && <FormCard
        text={t(
          '填写在线表单提交你的需求（时间 / 地点 / 目标 / 预算），管理员会挑选合适的教练与你私下联系。',
          'Fill in the online form with your needs (time / place / goals / budget). An admin will privately match you with a suitable coach.'
        )}
        url={site.coachRequestUrl}
        wechat={site.contactWechat}
        cta={t('填写找教练需求表 →', 'Open request form →')}
        t={t}
      />}

      {tab === 'apply' && <FormCard
        text={t(
          '校队队员或校外教练想入驻？提交申请表，管理员审核通过后你的资料会显示在上方列表。',
          'Team members or external coaches: submit the application form. Once approved by an admin, your profile appears in the list above.'
        )}
        url={site.coachApplyUrl}
        wechat={site.contactWechat}
        cta={t('填写教练入驻申请 →', 'Open application form →')}
        t={t}
      />}
    </main>
  );
}

function FormCard({ text, url, wechat, cta, t }: {
  text: string; url: string; wechat: string; cta: string; t: (zh: string, en?: string) => string;
}) {
  return (
    <div className="card" style={{ padding:28, maxWidth:720, display:'flex', flexDirection:'column', gap:16 }}>
      <p style={{ color:'#555', lineHeight:1.8 }}>{text}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display:'inline-block', textDecoration:'none', alignSelf:'flex-start' }}>{cta}</a>
      ) : (
        <p className="chip chip-neutral" style={{ fontSize:14 }}>
          {wechat
            ? t(`表单尚未配置：请加管理员微信 ${wechat} 办理`, `Form not set up yet — add admin WeChat ${wechat}`)
            : t('表单尚未配置：请先在 content/site.json 里填写表单链接', 'Form not configured yet — see 管理员使用手册')}
        </p>
      )}
    </div>
  );
}

function TabBtn({ active, children, onClick }: any) {
  return <button onClick={onClick} className="chip" style={{ cursor:'pointer', padding:'8px 20px', fontSize:14, background:active?'var(--ink)':'white', color:active?'white':'#333', border:'1px solid var(--line)' }}>{children}</button>;
}
