import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { renderMarkdown } from './markdown';

/**
 * 统一内容读取器 —— 仅在服务端（构建时）使用，⚠️ 不可被客户端组件 import
 * （内部用了 node:fs）。
 *
 * 类型定义和 withBase 等工具都在 ./content-shared，客户端组件请从那里导入。
 *
 * 每个功能模块对应 content/ 下一个文件夹：
 *   content/news/*.md      新闻
 *   content/sessions/*.md  零基础班期次
 *   content/wall/*.md      社区墙精选外链
 *   content/site.json      全站设置
 *
 * 要新增一个模块：content/ 下新建文件夹 + 在这里加一个 getXxx() 即可。
 */

export * from './content-shared';
import { BASE } from './content-shared';
import type {
  NewsItem,
  SessionItem,
  SessionStatus,
  WallItem,
  WallCategory,
  SiteSettings,
} from './content-shared';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function readDir(folder: string) {
  const dir = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug: f.replace(/\.md$/, ''),
        front: data as Record<string, any>,
        body: content.trim(),
      };
    });
}

// ---------------------------------------------------------------- 新闻

export function getNews(): NewsItem[] {
  return readDir('news')
    .filter((d) => d.front.draft !== true)
    .map((d) => ({
      slug: d.slug,
      title: String(d.front.title ?? '未命名'),
      date: String(d.front.date ?? ''),
      summary: String(d.front.summary ?? ''),
      emoji: String(d.front.emoji ?? '💧'),
      pinned: d.front.pinned === true,
      url: String(d.front.url ?? ''),
      body: d.body,
    }))
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.date.localeCompare(a.date),
    );
}

/** Markdown 正文渲染为 HTML（图片路径自动加 GitHub Pages 子路径前缀） */
export function renderBody(item: { body: string }): string {
  return renderMarkdown(item.body).replace(/src="\//g, `src="${BASE}/`);
}

// -------------------------------------------------------------- 零基础班

const STATUS_ORDER: Record<SessionStatus, number> = { open: 0, full: 1, closed: 2 };

export function getSessions(): SessionItem[] {
  return readDir('sessions')
    .map((d) => ({
      slug: d.slug,
      title: String(d.front.title ?? d.slug),
      status: (['open', 'full', 'closed'].includes(d.front.status)
        ? d.front.status
        : 'closed') as SessionStatus,
      description: String(d.front.description ?? ''),
      schedule: String(d.front.schedule ?? ''),
      location: String(d.front.location ?? ''),
      price: String(d.front.price ?? ''),
      registerUrl: String(d.front.registerUrl ?? ''),
      qr: String(d.front.qr ?? ''),
      featured: d.front.featured === true,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

/** 上首页展示的那一期（featured 优先，否则取第一个非 closed 的） */
export function getFeaturedSession(): SessionItem | null {
  const all = getSessions();
  return all.find((s) => s.featured && s.status !== 'closed')
    ?? all.find((s) => s.status !== 'closed')
    ?? all[0]
    ?? null;
}

// -------------------------------------------------------------- 社区墙

export function getWall(): WallItem[] {
  return readDir('wall')
    .map((d) => ({
      slug: d.slug,
      title: String(d.front.title ?? d.slug),
      url: String(d.front.url ?? '#'),
      category: (['share', 'question', 'buddy'].includes(d.front.category)
        ? d.front.category
        : 'share') as WallCategory,
      date: String(d.front.date ?? ''),
      summary: String(d.front.summary ?? ''),
      emoji: String(d.front.emoji ?? '📌'),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ------------------------------------------------------------ 全站设置

export function getSite(): SiteSettings {
  const file = path.join(CONTENT_DIR, 'site.json');
  const empty: SiteSettings = {
    announcement: '',
    contactEmail: '',
    contactWechat: '',
    wechatGroupQr: '',
    communityIntroZh: '',
    communityIntroEn: '',
    gzhName: '',
    gzhQr: '',
    giscus: { repo: '', repoId: '', category: '', categoryId: '' },
  };
  try {
    return { ...empty, ...JSON.parse(fs.readFileSync(file, 'utf-8')) };
  } catch {
    return empty;
  }
}
