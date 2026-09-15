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

// ---------------------------------------------------------------- 新闻

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  emoji: string;
  pinned: boolean;
  /** 外链（公众号文章等）：有值时列表直接跳外链，而不是站内详情页 */
  url: string;
  body: string;
};

// -------------------------------------------------------- 清华邮箱域名白名单

/**
 * 允许验证/注册的邮箱域名。
 *
 * ⚠️ 这里只是前端的即时反馈（输错了马上提示），**不是安全边界**。
 *    真正的限制在服务端：supabase/schema.sql 里的
 *    hook_restrict_signup_by_email_domain() 会在建号前拒绝其他域名。
 *    改这个数组时务必同步改那个函数，否则会出现
 *    "前端说可以、发信后被 Supabase 拒绝"的割裂体验。
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

// -------------------------------------------------------------- 零基础班

export type SessionStatus = 'open' | 'full' | 'closed';

export type SessionItem = {
  slug: string;
  title: string;
  status: SessionStatus;
  description: string;
  schedule: string;
  location: string;
  price: string;
  registerUrl: string;
  qr: string;
  featured: boolean;
};

// -------------------------------------------------------------- 社区墙

export type WallCategory = 'share' | 'question' | 'buddy';

export type WallItem = {
  slug: string;
  title: string;
  url: string;
  category: WallCategory;
  date: string;
  summary: string;
  emoji: string;
};

export const WALL_CATEGORIES: Record<WallCategory, { zh: string; en: string }> = {
  share: { zh: '分享', en: 'Share' },
  question: { zh: '求助', en: 'Q&A' },
  buddy: { zh: '约游', en: 'Buddy' },
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
  /** 微信公众号（动态都发在这里，官网动态页做导流） */
  gzhName: string;
  gzhQr: string;
  giscus: GiscusConfig;
};
