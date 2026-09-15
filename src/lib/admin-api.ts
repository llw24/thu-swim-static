/**
 * 管理后台的客户端数据层。
 *
 * 登录 = 清华邮箱验证码（老站校验验证码 + admins 白名单）→ 7 天管理员凭证存本地。
 * 内容读写 = 全部代理到老站 /api/admin/content，由老站用它持有的 GitHub Token
 * 提交到内容仓库 —— GitHub 凭证不再出现在任何浏览器里。
 */
'use client';

import { JOIN_API, networkDiagnosis, type VerifyPayload } from './join-api';

const LS_KEY = 'tssa_admin_proof';

export type AdminPayload = VerifyPayload & {
  /** 老站返回里恒为 true，客户端类型不强制 */
};

export type AdminFileMeta = { name: string; path: string; sha: string };

function storedProof(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d.proof || typeof d.expiresAt !== 'number' || d.expiresAt < Date.now() + 60_000) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return d.proof;
  } catch {
    return null;
  }
}

function storeProof(proof: string, expiresAt: number) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ proof, expiresAt }));
  } catch {
    /* ignore */
  }
}

export function clearAdminProof() {
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
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
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

/** 发送管理员登录验证码（老站发码接口与管理员是同一个） */
export async function sendAdminCode(email: string): Promise<{ ok: true; devCode?: string }> {
  return (await post('/api/auth/request-code', { email })) as { ok: true; devCode?: string };
}

/** 校验验证码 → 管理员凭证（邮箱须在白名单内，否则 403） */
export async function verifyAdminCode<T extends VerifyPayload = AdminPayload>(
  email: string,
  code: string,
): Promise<T> {
  const d = (await post('/api/admin/verify', { email, code })) as unknown as T;
  storeProof(d.proof, d.expiresAt);
  return d;
}

/** 回访：用本地凭证确认身份；无效返回 null */
export async function adminGate(): Promise<AdminPayload | null> {
  const proof = storedProof();
  if (!proof) return null;
  try {
    const d = (await post('/api/admin/gate', { proof })) as AdminPayload;
    storeProof(d.proof, d.expiresAt);
    return d;
  } catch {
    return null;
  }
}

function withProof(proof: string | null, body: Record<string, unknown>) {
  if (!proof) throw new Error('管理员凭证缺失，请重新登录');
  return { proof, ...body };
}

/** 列出目录下的内容文件 */
export async function adminList(proof: string | null, dir: string): Promise<AdminFileMeta[]> {
  const d = (await post('/api/admin/content', withProof(proof, { op: 'list', dir }))) as {
    files: AdminFileMeta[];
  };
  return d.files;
}

/** 读取单个内容文件（utf8 原文 + sha） */
export async function adminFile(
  proof: string | null,
  path: string,
): Promise<{ content: string; sha: string }> {
  return (await post('/api/admin/content', withProof(proof, { op: 'file', path }))) as {
    content: string;
    sha: string;
  };
}

/** 保存（新建或更新）；提交信息自动带上操作者邮箱 */
export async function adminSave(
  proof: string | null,
  email: string,
  input: { path: string; content: string; sha?: string; message?: string },
): Promise<{ sha: string }> {
  const message = input.message || `管理后台(${email})更新 ${input.path}`;
  return (await post(
    '/api/admin/content',
    withProof(proof, { op: 'save', path: input.path, content: input.content, sha: input.sha, message }),
  )) as { sha: string };
}

/** 删除内容文件 */
export async function adminRemove(
  proof: string | null,
  email: string,
  input: { path: string; sha: string },
): Promise<void> {
  await post('/api/admin/content', withProof(proof, {
    op: 'remove',
    path: input.path,
    sha: input.sha,
    message: `管理后台(${email})删除 ${input.path}`,
  }));
}
