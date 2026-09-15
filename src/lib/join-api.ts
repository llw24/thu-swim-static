/**
 * 老站验证服务的浏览器端客户端。
 *
 * 老站（thu-swim.netlify.app）瘦身后只干一件事：验证清华邮箱，
 * 通过后返回"验证后可见内容"（企微群二维码 / 问卷星报名链接 / 微信号）。
 *
 * 凭证（proof）存 localStorage，30 天内回访免重复验证；
 * 过期或无效时接口返回 401，上层会退回验证表单。
 *
 * 接口地址是公开信息（不是密钥），安全性由老站侧的
 * 邮箱域名白名单 + 频控 + 二维码不进公开仓库来保证。
 */
'use client';

const RAW = process.env.NEXT_PUBLIC_JOIN_API || 'https://thu-swim.netlify.app';

export const JOIN_API = RAW.replace(/\/+$/, '');

export type JoinPayload = {
  ok: true;
  email: string;
  proof: string;
  expiresAt: number;
  /** 企微群二维码 dataURL；留空表示尚未接入 */
  groupQr: string;
  /** 问卷星报名链接；留空表示报名暂未开放 */
  signupUrl: string;
  /** 管理员微信号（备用入口） */
  wechatId: string;
  /** 验证通过后显示的说明 */
  note: string;
};

const LS_KEY = 'tssa_join_proof';

function storedProof(): { proof: string; expiresAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    // 提前 1 分钟视为过期，避免边界状态
    if (!d.proof || typeof d.expiresAt !== 'number' || d.expiresAt < Date.now() + 60_000) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return { proof: d.proof, expiresAt: d.expiresAt };
  } catch {
    return null;
  }
}

function storeProof(proof: string, expiresAt: number) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ proof, expiresAt }));
  } catch {
    /* 隐私模式下存不了就算了，只是要重新验证 */
  }
}

/** 退出验证：清掉本地凭证 */
export function clearProof() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

async function post(path: string, body: unknown, attempt = 0): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${JOIN_API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // 15 秒超时：不让用户对着转圈的页面干等
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // 网络层失败（连不上/被拦截/超时）：自动重试一次，仍失败给出可自查的提示
    if (attempt === 0) {
      await new Promise((r) => setTimeout(r, 800));
      return post(path, body, 1);
    }
    throw new Error(
      '无法连接验证服务（网络原因或被浏览器插件拦截）。' +
        '可以：① 换个网络再试（比如手机流量）；② 关闭广告拦截类插件；' +
        '③ 在浏览器直接打开 thu-swim.netlify.app/api/health 自测服务是否可达——' +
        '能打开说明服务正常，是你当前网络到它的链路问题；打不开就是当前网络屏蔽了该域名。',
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `请求失败（${res.status}）`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

/** 发送验证码到清华邮箱 */
export async function sendCode(email: string): Promise<{ ok: true; devCode?: string }> {
  return (await post('/api/auth/request-code', { email })) as { ok: true; devCode?: string };
}

/** 校验验证码，返回验证后可见内容 */
export async function verifyCode(email: string, code: string): Promise<JoinPayload> {
  const d = (await post('/api/join/verify', { email, code })) as JoinPayload;
  storeProof(d.proof, d.expiresAt);
  return d;
}

/** 用本地存储的凭证换取内容；无效返回 null（上层退回验证表单） */
export async function gate(): Promise<JoinPayload | null> {
  const s = storedProof();
  if (!s) return null;
  try {
    const d = (await post('/api/join/gate', { proof: s.proof })) as JoinPayload;
    storeProof(d.proof, d.expiresAt);
    return d;
  } catch {
    return null;
  }
}
