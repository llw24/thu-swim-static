'use client';
import { useEffect, useState } from 'react';
import { useT, useLang } from '@/lib/i18n';
import EmailOtpForm from './EmailOtpForm';
import { clearProof, gate, type JoinPayload } from '@/lib/join-api';
import { withBase } from '@/lib/content-shared';
import type { SiteSettings } from '@/lib/content-shared';

/**
 * 验证门 —— 进群（/join、社区页）和报名（/verify）共用的验证组件，用 variant 区分：
 *
 *  group  进群场景：验证后展示企微群二维码 + 管理员微信（报名入口作次要提示）
 *  signup 报名场景：验证后自动跳转问卷星；不展示群二维码，保持目的纯粹
 *
 * 未验证时显示清华邮箱验证表单；30 天内回访凭本地凭证直接放行。
 */
export default function JoinGate({
  site,
  variant = 'group',
}: {
  site: SiteSettings;
  variant?: 'group' | 'signup';
}) {
  const t = useT();
  const { lang } = useLang();
  const isSignup = variant === 'signup';
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

  // 报名场景：验证通过后自动跳转问卷星（链接来自老站，未验证拿不到）
  useEffect(() => {
    if (!payload || !isSignup) return;
    if (payload.signupUrl) window.location.assign(payload.signupUrl);
  }, [payload, isSignup]);

  // 应急通道：验证服务挂了/还没接入时的兜底提示
  const emergency = site.contactWechat;

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
          {isSignup ? t('报名身份验证', 'Sign-up verification') : t('加入协会微信群', 'Join our WeChat group')}
        </h2>
        {payload && (
          <span className="chip chip-open" style={{ fontSize: 12 }}>
            {t('已验证', 'Verified')}
          </span>
        )}
      </div>

      {!payload ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isSignup && (
            <p style={{ color: '#555', lineHeight: 1.8, fontSize: 14.5 }}>
              {lang === 'en' ? site.communityIntroEn : site.communityIntroZh}
            </p>
          )}
          <EmailOtpForm
            purpose={
              isSignup
                ? t(
                    '为保证活动名额留给清华在校同学，报名前需要验证一次清华邮箱。验证一次，30 天内进群和报名通用。',
                    'To keep sign-ups Tsinghua-only, verify your Tsinghua email once — it also covers joining the WeChat group, valid for 30 days.',
                  )
                : undefined
            }
            onVerified={(p: JoinPayload) => setPayload(p)}
          />
        </div>
      ) : isSignup ? (
        /* —— 报名场景的验证后状态 —— */
        <div style={{ fontSize: 14.5, lineHeight: 1.9 }}>
          {payload.signupUrl ? (
            <>
              <p style={{ color: '#333' }}>
                {t('验证通过 ✅ 正在前往报名表单…', 'Verified ✅ Taking you to the sign-up form…')}
              </p>
              <div style={{ marginTop: 12 }}>
                <a href={payload.signupUrl} className="btn-primary" style={{ textDecoration: 'none' }}>
                  {t('如果没有自动跳转，点这里 →', 'Click here if not redirected →')}
                </a>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#333' }}>
                {t('验证通过 ✅ 但当前没有开放报名的活动。', 'Verified ✅ — but no sign-up is open right now.')}
              </p>
              <p style={{ color: 'var(--muted)', marginTop: 6 }}>
                {t(
                  '开放后回到「活动报名」页点击报名即可，无需再验证。也可以先加入社群等通知：',
                  'Come back to the sign-up page when it opens — no need to verify again. Or join the group to get notified:',
                )}{' '}
                <a href={withBase('/join/')} className="link-arrow">{t('加入社群 →', 'Join the group →')}</a>
              </p>
            </>
          )}
          <div style={{ marginTop: 18, fontSize: 12.5, color: 'var(--muted)' }}>
            {t('已验证', 'Verified')}：{payload.email}
            {' · '}
            {t('有效期至', 'valid until')} {new Date(payload.expiresAt).toLocaleDateString('zh-CN')}
            <button
              type="button"
              className="link-arrow"
              onClick={() => {
                clearProof();
                setPayload(null);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 10, padding: 0 }}
            >
              {t('退出验证', 'Sign out')}
            </button>
          </div>
        </div>
      ) : (
        /* —— 进群场景的验证后状态 —— */
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
