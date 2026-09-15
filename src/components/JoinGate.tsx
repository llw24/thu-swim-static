'use client';
import { useEffect, useState } from 'react';
import { useT, useLang } from '@/lib/i18n';
import EmailOtpForm from './EmailOtpForm';
import { clearProof, gate, type JoinPayload } from '@/lib/join-api';
import { withBase } from '@/lib/content-shared';
import type { SiteSettings } from '@/lib/content-shared';

/**
 * 验证门 —— 社区页和 /join 页共用。
 *
 * 未验证：显示清华邮箱验证表单。
 * 已验证（含 30 天内回访）：显示企微群二维码 + 报名入口 + 管理员微信。
 * 带 ?next=signup 进来时，验证通过后自动跳转问卷星。
 */
export default function JoinGate({ site }: { site: SiteSettings }) {
  const t = useT();
  const { lang } = useLang();
  const [payload, setPayload] = useState<JoinPayload | null>(null);
  const [probing, setProbing] = useState(true);

  // 回访：先用本地凭证换内容，换不到再走验证表单
  useEffect(() => {
    let alive = true;
    gate()
      .then((p) => alive && setPayload(p))
      .catch(() => {})
      .finally(() => alive && setProbing(false));
    return () => {
      alive = false;
    };
  }, []);

  // 验证通过后按来源自动转跳：?next=signup → 问卷星报名表
  useEffect(() => {
    if (!payload) return;
    const next = new URLSearchParams(window.location.search).get('next');
    if (next === 'signup' && payload.signupUrl) {
      window.location.assign(payload.signupUrl);
    }
  }, [payload]);

  const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
  const autoJumping = !!payload && next === 'signup' && !!payload.signupUrl;

  // 应急通道：验证服务挂了/还没接入时的兜底提示
  const emergency =
    site.contactWechat ||
    (site.wechatGroupQr ? t('社区页二维码（应急）', 'emergency QR below') : '');

  if (probing) {
    return (
      <div className="card" style={{ padding: 28, marginBottom: 32 }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('正在检查验证状态…', 'Checking verification…')}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <h2 className="serif" style={{ fontSize: 22, fontWeight: 500 }}>
          {t('加入协会微信群', 'Join our WeChat group')}
        </h2>
        {payload && (
          <span className="chip chip-open" style={{ fontSize: 12 }}>
            {t('已验证', 'Verified')}
          </span>
        )}
      </div>

      {!payload ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ color: '#555', lineHeight: 1.8, fontSize: 14.5 }}>
            {lang === 'en' ? site.communityIntroEn : site.communityIntroZh}
          </p>
          <EmailOtpForm
            purpose={t(
              '协会微信群只对清华在校师生开放。先用清华邮箱验证一下身份，验证后这里会显示进群方式；报名时也不用再验证。',
              'The group is open to Tsinghua students and staff only. Verify with your Tsinghua email to see how to join — no need to verify again when signing up.',
            )}
            onVerified={setPayload}
          />
        </div>
      ) : autoJumping ? (
        <div style={{ color: '#555', fontSize: 14.5, lineHeight: 1.9 }}>
          {t('验证通过 ✅ 正在前往报名表单…', 'Verified ✅ Taking you to the sign-up form…')}
          <div style={{ marginTop: 12 }}>
            <a href={payload.signupUrl} className="btn-primary" style={{ textDecoration: 'none' }}>
              {t('如果没有自动跳转，点这里 →', 'Click here if not redirected →')}
            </a>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {payload.groupQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payload.groupQr}
              alt={t('协会微信群二维码', 'WeChat group QR')}
              style={{
                width: 190,
                height: 190,
                objectFit: 'contain',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'white',
              }}
            />
          ) : (
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: 10,
                border: '2px dashed var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                fontSize: 13,
                textAlign: 'center',
                padding: 12,
              }}
            >
              {t('入群二维码即将开放\n敬请期待', 'Group QR coming soon')}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 14.5, color: '#333', lineHeight: 1.8, marginBottom: 12 }}>
              {t(
                '验证通过 ✅ 用微信扫左侧二维码进群，进群后记得看群公告。',
                'Verified ✅ Scan the QR code to join. Check the group announcement after joining.',
              )}
              {payload.note && (
                <span style={{ display: 'block', color: '#555', marginTop: 6 }}>{payload.note}</span>
              )}
            </p>

            {/* 报名入口（同一份验证凭证通用） */}
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 14 }}>{t('近期活动报名', 'Current sign-up')}</span>
              {payload.signupUrl ? (
                <a
                  href={payload.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  {t('前往报名表单 →', 'Open sign-up form →')}
                </a>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {t('暂未开放，敬请关注公告', 'Not open yet — watch for announcements')}
                </span>
              )}
            </div>

            {payload.wechatId && (
              <p style={{ fontSize: 14, marginBottom: 10 }}>
                <span style={{ color: 'var(--muted)', fontSize: 13, marginRight: 8 }}>
                  {t('扫码遇到问题？加管理员微信', 'Or add the admin on WeChat')}
                </span>
                <b>{payload.wechatId}</b>
                <span style={{ color: 'var(--muted)', fontSize: 12.5, marginLeft: 6 }}>
                  （{t('备注「姓名+院系」', 'mention name & department')}）
                </span>
              </p>
            )}

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {t('已验证', 'Verified')}：{payload.email}
                {' · '}
                {t('有效期至', 'valid until')} {new Date(payload.expiresAt).toLocaleDateString('zh-CN')}
              </span>
              <button
                type="button"
                className="link-arrow"
                onClick={() => {
                  clearProof();
                  setPayload(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t('退出验证', 'Sign out')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 验证不可用时的应急通道 */}
      {!payload && emergency && (
        <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
          {t(
            '验证遇到问题？直接联系理事会成员拉你进群：',
            'Having trouble? Ask a board member to add you directly:',
          )}{' '}
          {site.contactWechat}
          {site.wechatGroupQr && (
            <>
              {' · '}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBase(site.wechatGroupQr)}
                alt={t('应急二维码', 'Emergency QR')}
                style={{ width: 90, verticalAlign: 'middle', borderRadius: 6, border: '1px solid var(--line)' }}
              />
            </>
          )}
        </p>
      )}
    </div>
  );
}
