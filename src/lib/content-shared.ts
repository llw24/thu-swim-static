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
  body: string;
};

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

// ---------------------------------------------------------------- 教练

export type CoachItem = {
  slug: string;
  name: string;
  specialties: string;
  bio: string;
  availability: string;
  contact: string;
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
  /** 找教练表单链接（学员需求 / 教练入驻），留空则显示微信引导 */
  coachRequestUrl: string;
  coachApplyUrl: string;
  giscus: GiscusConfig;
};
