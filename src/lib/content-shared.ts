/**
 * 客户端/服务端都可安全导入的「纯数据」模块：
 * 类型定义 + 不依赖 Node API 的工具函数。
 *
 * ⚠️ 这里禁止 import 任何 Node 内置模块（fs/path 等），
 *    读文件请去 src/lib/content.ts（仅服务端可用）。
 */

/** GitHub Pages 子路径前缀（构建时由 NEXT_PUBLIC_BASE_PATH 注入） */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** 给静态资源路径加子路径前缀 */
export function withBase(p: string): string {
  if (!p || /^(https?:)?\/\//.test(p) || p.startsWith('data:')) return p;
  return BASE + p;
}

// -------------------------------------------------------- 清华邮箱域名白名单

/**
 * 允许验证/注册的邮箱域名。
 *
 * ⚠️ 这里只是前端的即时反馈（输错了马上提示），**不是安全边界**。
 *    真正的限制在老站验证服务的域名白名单里。
 */
export const ALLOWED_EMAIL_DOMAINS = [
  'mails.tsinghua.edu.cn',
  'tsinghua.edu.cn',
  'mail.tsinghua.edu.cn',
];

export function isTsinghuaEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

// ---------------------------------------------------------------- 活动

export type SessionStatus = 'upcoming' | 'closed';

export type SessionItem = {
  slug: string;
  title: string;
  status: SessionStatus;
  description: string;
  schedule: string;
  location: string;
  price: string;
  qr: string;
  /** 展示顺序（数字越小越靠前，默认 0；同状态内先按 order 再按标题） */
  order: number;
};

// ------------------------------------------------------------ 全站设置

export type GiscusConfig = {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
};

export type SiteSettings = {
  announcement: string;
  contactEmail: string;
  contactWechat: string;
  wechatGroupQr: string;
  /** 社区墙顶部的微信群二维码/进群说明 */
  communityIntroZh: string;
  communityIntroEn: string;
  giscus: GiscusConfig;
};
