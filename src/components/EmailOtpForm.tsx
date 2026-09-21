'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { sendCode, verifyCode, type VerifyPayload } from '@/lib/join-api';
import { sendAdminCode, verifyAdminCode } from '@/lib/admin-api';
import { isTsinghuaEmail } from '@/lib/content-shared';

type PayloadShape = { email: string; proof: string; expiresAt: number };

/** 下拉里可选的清华邮箱后缀（严格两种；服务端白名单里的旧域名仅作兼容保留） */
const SUFFIXES = ['@mails.tsinghua.edu.cn', '@tsinghua.edu.cn'];

/**
 * 清华邮箱验证组件 —— 进群（mode=join）和管理员登录（mode=admin）共用。
 *
 * join：老站校验验证码 → 返回进群二维码/报名入口。
 * admin：老站额外校验管理员白名单 → 返回 7 天管理员凭证。
 */
export default function EmailOtpForm<T extends PayloadShape>({
  purpose,
  onVerified,
  mode = 'join',
}: {
  purpose?: string;
  onVerified: (payload: T) => void;
  mode?: 'join' | 'admin';
}) {
  const t = useT();
  const [emailUser, setEmailUser] = useState('');
  const [suffix, setSuffix] = useState(SUFFIXES[0]);
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [devHint, setDevHint] = useState('');

  const composedEmail = `${emailUser.trim().toLowerCase()}${suffix}`;

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDevHint('');

    const user = emailUser.trim().toLowerCase();
    if (!/^[A-Za-z0-9._-]{1,32}$/.test(user)) {
      setError(
        t(
          '邮箱用户名格式不对：只允许字母、数字、点（.）、下划线和连字符',
          'Invalid username: letters, digits, dots, underscores and hyphens only',
        ),
      );
      return;
    }
    if (!isTsinghuaEmail(composedEmail)) {
      setError(t('请选择清华邮箱后缀', 'Please pick a Tsinghua email suffix'));
      return;
    }

    setBusy(true);
    try {
      const d = mode === 'admin' ? await sendAdminCode(composedEmail) : await sendCode(composedEmail);
      setSentEmail(composedEmail);
      setSent(true);
      // 只在本地未配邮件服务的开发模式出现，方便调试
      if (d.devCode) setDevHint(t(`（开发模式）验证码：${d.devCode}`, `(dev) code: ${d.devCode}`));
    } catch (e) {
      const err = e as Error & { status?: number };
      // 频控 429：验证码往往其实已经发出（老站是先写库再发信）。
      // 直接进入输入验证码界面，避免"收到了码却被拦在第一屏"。
      if (err.status === 429 || /频繁|次数过多|rate/i.test(err.message || '')) {
        setSentEmail(composedEmail);
        setSent(true);
        setError(
          t(
            '发送太频繁：如果刚才收到过验证码，直接在下方输入即可（10 分钟内有效）；没收到请稍等一两分钟再点发送。',
            'Too many attempts: if you just received a code, enter it below (valid for 10 minutes); otherwise wait a minute and send again.',
          ),
        );
      } else {
        setError(friendlyError(err, t));
      }
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
          ? ((await verifyAdminCode<T>(sentEmail, token)) as T)
          : ((await verifyCode<T>(sentEmail, token)) as T);
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
            '为保证群里和活动的同学都是清华在校师生，需要先用清华邮箱验证一次。验证结果 30 天内有效。',
            'To keep the group and events Tsinghua-only, verify with your Tsinghua email once — valid for 30 days.',
          )}
      </p>

      {!sent ? (
        <form onSubmit={onSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)' }}>
            {t('清华邮箱', 'Tsinghua email')}
          </label>
          <div className="otp-row">
            <input
              className="input"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              aria-label={t('清华邮箱用户名', 'Tsinghua email username')}
              value={emailUser}
              onChange={(e) => setEmailUser(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <select
              className="input"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              style={{ width: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
              aria-label={t('邮箱后缀', 'Email domain')}
            >
              {SUFFIXES.map((sfx) => (
                <option key={sfx} value={sfx}>
                  {sfx}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
            {busy ? t('发送中…', 'Sending…') : t('发送验证码 →', 'Send code →')}
          </button>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            {t(
              '只支持清华邮箱：输入用户名，后缀从右侧选择；验证码发到对应邮箱。',
              'Tsinghua addresses only — enter your username and pick the suffix on the right.',
            )}
          </p>
        </form>
      ) : (
        <form onSubmit={onVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8 }}>
            {t('验证码已发往', 'Code sent to')} <b>{sentEmail}</b>
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
  if (/无法访问验证服务|被拦截|插件/i.test(m)) {
    return m;
  }
  if (/不可用|unavailable|failed to fetch/i.test(m)) {
    return t(
      '验证服务暂时不可用，请稍后再试，或直接联系理事会成员。',
      'The verification service is temporarily down — try later or ask a board member.',
    );
  }
  return m;
}
