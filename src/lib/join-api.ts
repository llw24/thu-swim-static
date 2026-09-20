/**
 * 老站验证服务的浏览器端客户端。
 *
 * 老站（thu-swim.netlify.app）瘦身后只干一件事：验证清华邮箱，
 * 通过后返回"验证后可见内容"（企微群二维码 / 微信号）。
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

/** 验证凭证的最小形状（进群/管理员通用） */
export type VerifyPayload = { email: string; proof: string; expiresAt: number };

export type JoinPayload = VerifyPayload & {
  ok: true;
  /** 企微群二维码 dataURL；留空表示尚未接入 */
  groupQr: string;
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

/** 网络层失败时的自动诊断：服务到底能不能被当前网络访问到 */
export async function probeService(): Promise<'reachable' | 'blocked'> {
  try {
    // no-cors 模式：只要网络层能连通就算可达（不读内容，因此不需要 CORS）
    await fetch(`${JOIN_API}/api/health`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    return 'reachable';
  } catch {
    return 'blocked';
  }
}

/** 把网络层失败翻译成带诊断结论的报错 */
export async function networkDiagnosis(e: unknown): Promise<string> {
  const name = (e as { name?: string })?.name || '';
  const timedOut = name === 'TimeoutError' || name === 'AbortError';
  const reach = await probeService();
  if (reach === 'reachable') {
    return (
      `浏览器发起了请求但未完成（${timedOut ? '超时' : '被拦截'}），而验证服务本身可达 —— ` +
      '多半是广告拦截类插件或本地缓存在作怪：请关闭广告拦截插件、强制刷新（Ctrl+Shift+R）后重试。'
    );
  }
  return (
    `当前网络无法访问验证服务（${JOIN_API}）。请更换网络（如手机流量）后重试；` +
    '若换网络后仍失败，请联系技术负责人（可能需要给验证服务绑定独立域名）。'
  );
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
  } catch (e) {
    // 网络层失败（连不上/被拦截/超时）：自动重试一次，仍失败给出诊断结论
    if (attempt === 0) {
      await new Promise((r) => setTimeout(r, 800));
      return post(path, body, 1);
    }
    throw new Error(await networkDiagnosis(e));
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
export async function verifyCode<T extends VerifyPayload = JoinPayload>(email: string, code: string): Promise<T> {
  const d = (await post('/api/join/verify', { email, code })) as unknown as T;
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
