'use client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function About() {
  const t = useT();
  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth: 820 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>About</p>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 24 }}>{t('关于协会', 'About the Association')}</h1>

      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <h2 className="serif" style={{ fontSize: 22, marginBottom: 12 }}>{t('我们是谁', 'Who we are')}</h2>
        <p style={{ color:'#333', lineHeight: 1.85, marginBottom: 14 }}>
          {t(
            '清华大学学生游泳协会是经校团委批准、依托体育部及陈明游泳馆建立的正规学生社团，也是每年"马约翰杯"游泳比赛的承办单位。四十年来，协会以推广校园游泳文化、教零基础同学从怕水到自如、服务校队与代表队为宗旨。',
            'The Tsinghua Student Swimming Association is an officially recognized student club approved by the Youth League Committee, hosted at Chen Ming Natatorium. As the organizer of the annual Ma Yuehan Cup, we have spent four decades promoting swim culture on campus, teaching beginners, and supporting the university teams.'
          )}
        </p>
        <p style={{ color:'#333', lineHeight: 1.85 }}>
          {t(
            '我们相信游泳是一项能陪伴终身的运动，也是清华同学在紧张学习之余最好的放松方式之一。在这里，你可以找到教零基础的耐心教练、可以求教技术难题、可以约到一同下水的伙伴。',
            'We believe swimming is a lifelong sport and one of the best ways for Tsinghua students to unwind. Here you will find patient coaches for beginners, expert help on technique, and companions for your next swim.'
          )}
        </p>
      </div>

      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <h2 className="serif" style={{ fontSize: 22, marginBottom: 12 }}>{t('我们做什么', 'What we do')}</h2>
        <ul style={{ color:'#333', lineHeight: 1.9, paddingLeft: 22 }}>
          <li><strong>{t('零基础班', 'Beginner Class')}</strong>：{t('每学期开设蛙泳、自由泳等多个班次，八次课带你从怕水到独立游 25 米。', 'Breaststroke and freestyle sections each term. Eight sessions take you from fearing the water to swimming 25m on your own.')}</li>
          <li><strong>{t('校内游泳社区', 'Campus Swim Community')}</strong>：{t('技术求助、分享、约游三大版块，认证队员和教练为你解答。', 'Three boards — technique Q&A, sharing, meetups — with answers from certified members and coaches.')}</li>
          <li><strong>{t('马约翰杯游泳赛', 'Ma Yuehan Cup')}</strong>：{t('每年秋季学期承办校级游泳赛事。', 'We host the university swim meet every fall term.')}</li>
          <li><strong>{t('校队与代表队服务', 'Support for university teams')}</strong>：{t('为清华游泳队与游泳代表队提供后勤与训练支持。', 'Logistics and training support for the Tsinghua swim team and varsity squad.')}</li>
        </ul>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <h2 className="serif" style={{ fontSize: 22, marginBottom: 12 }}>{t('联系我们', 'Contact us')}</h2>
        <p style={{ color:'#555', lineHeight: 1.8 }}>
          {t('有加入协会、合作或其他咨询，欢迎通过', 'To join the association, propose a collaboration, or ask anything else, please post in the ')}
          <Link href="/community" className="link-arrow">{t('社区', 'community')}</Link>
          {t('发帖联系，或联系协会理事会成员。', ' or reach out to a board member.')}
        </p>
      </div>
    </main>
  );
}
