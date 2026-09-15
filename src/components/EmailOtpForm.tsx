'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { sendCode, verifyCode, type VerifyPayload } from '@/lib/join-api';
import { sendAdminCode, verifyAdminCode } from '@/lib/admin-api';
import { ALLOWED_EMAIL_DOMAINS, isTsinghuaEmail } from '@/lib/content-shared';



/**
 * 清华邮箱验证组件 —— 进群（mode=join）和管理员登录（mode=admin）共用。
 *
 * join：老站校验验证码 → 返回进群二维码/报名入口。
 * admin：老站额外校验管理员白名单 → 返回 7 天管理员凭证。
 */
export default function EmailOtpForm<T extends VerifyPayload>({
  purpose,
  onVerified,
  mode = 'join',
}: {
  purpose?: string;
  onVerified: (payload: T) => void;
  mode?: 'join' | 'admin';
}) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devHint, setDevHint] = useState('');

  const domainHint = ALLOWED_EMAIL_DOMAINS.filter((d) => d !== 'mail.tsinghua.edu.cn')
    .map((d) => `@${d}`)
    .join(' / ');

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDevHint('');

    const value = email.trim().toLowerCase();
    if (!isTsinghuaEmail(value)) {
      setError(t(`请使用清华邮箱（${domainHint}）`, `Please use a Tsinghua email (${domainHint})`));
      return;
    }

    setBusy(true);
    try {
      const d = mode === 'admin' ? await sendAdminCode(value) : await sendCode(value);
      setEmail(value);
      setSent(true);
      // 只在本地未配邮件服务的开发模式出现，方便调试
      if (d.devCode) setDevHint(t(`（开发模式）验证码：${d.devCode}`, `(dev) code: ${d.devCode}`));
    } catch (e) {
      setError(friendlyError(e as Error & { status?: number }, t));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const token = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(token)) {
      setError(t('验证码是邮件里的 6 位数字', 'The code is the 6 digits in the email'));
      return;
    }
    setBusy(true);
    try {
      const payload =
        mode === 'admin'
          ? ((await verifyAdminCode<T>(email, token)))
          : ((await verifyCode<T>(email, token)));
      onVerified(payload);
    } catch (e) {
      setError(friendlyError(e as Error & { status?: number }, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <h2 className="serif" style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>
        {t('用清华邮箱验证身份', 'Verify with your Tsinghua email')}
      </h2>
      <p style={{ color: '#555', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
        {purpose ??
          t(
            '为保证群里和报名的同学都是清华在校师生，需要先用清华邮箱验证一次。验证结果 30 天内有效。',
            'To keep the group and sign-ups Tsinghua-only, verify with your Tsinghua email once — valid for 30 days.',
          )}
      </p>

      {!sent ? (
        <form onSubmit={onSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)' }}>
            {t('清华邮箱', 'Tsinghua email')}
          </label>
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder={`xxx@${ALLOWED_EMAIL_DOMAINS[0]}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
          <button className="btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
            {busy ? t('发送中…', 'Sending…') : t('发送验证码 →', 'Send code →')}
          </button>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            {t(
              `仅接受 ${domainHint} 的邮箱，其他邮箱无法收到验证码。`,
              `Only ${domainHint} addresses are accepted.`,
            )}
          </p>
        </form>
      ) : (
        <form onSubmit={onVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
            {t('验证码已发往', 'Code sent to')} <b>{email}</b>
          </div>
          <label style={{ fontSize: 13, color: 'var(--muted)' }}>
            {t('6 位验证码', '6-digit code')}
          </label>
          <input
            className="input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: '100%', letterSpacing: '0.3em', fontSize: 20 }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? t('验证中…', 'Verifying…') : t('验证', 'Verify')}
            </button>
            <button
              type="button"
              className="link-arrow"
              onClick={() => {
                setSent(false);
                setCode('');
                setError('');
                setDevHint('');
              }}
            >
              {t('换个邮箱', 'Change email')}
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            {t(
              '收不到？请看一下垃圾邮件；十分钟内有效，过期可点「换个邮箱」重新发送。',
              'Check your spam folder. The code expires in 10 minutes — resend via "Change email".',
            )}
          </p>
        </form>
      )}

      {devHint && <p style={{ marginTop: 12, fontSize: 13, color: '#1f7a4d' }}>{devHint}</p>}
      {error && (
        <p style={{ marginTop: 14, fontSize: 13.5, color: '#b91c1c', lineHeight: 1.7 }}>⚠️ {error}</p>
      )}
    </div>
  );
}

/** 把后端报错翻译成人话 */
function friendlyError(e: Error & { status?: number }, t: (zh: string, en?: string) => string): string {
  const m = e.message || '';
  if (e.status === 429 || /频繁|次数过多|rate/i.test(m)) {
    return t('操作太频繁了，请等一会儿再试。', 'Too many requests — please wait a bit.');
  }
  if (/验证码错误|验证码已过期|invalid|expired/i.test(m)) {
    return t('验证码不正确或已过期，请重新获取。', 'The code is wrong or expired — request a new one.');
  }
  if (/不是.*管理员|管理员白名单/i.test(m)) {
    return m;
  }
  if (/清华邮箱|domain|not allowed/i.test(m)) {
    return t('该邮箱不在允许范围内，请使用清华邮箱。', 'This address is not allowed — please use a Tsinghua email.');
  }
  if (/不可用|unavailable|failed to fetch/i.test(m)) {
    return t(
      '验证服务暂时不可用，请稍后再试，或直接联系理事会成员。',
      'The verification service is temporarily down — try later or ask a board member.',
    );
  }
  return m;
}
