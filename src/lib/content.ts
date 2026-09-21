import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * 统一内容读取器 —— 仅在服务端（构建时）使用，⚠️ 不可被客户端组件 import
 * （内部用了 node:fs）。
 *
 * 类型定义和 withBase 等工具都在 ./content-shared，客户端组件请从那里导入。
 *
 * 每个功能模块对应 content/ 下一个文件夹：
 *   content/sessions/*.md  活动（预告与回顾）
 *   content/site.json      全站设置
 *
 * 要新增一个模块：content/ 下新建文件夹 + 在这里加一个 getXxx() 即可。
 */

export * from './content-shared';
import type { SessionItem, SessionStatus, SiteSettings } from './content-shared';

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

// ---------------------------------------------------------------- 活动

const STATUS_ORDER: Record<SessionStatus, number> = { upcoming: 0, closed: 1 };

export function getSessions(): SessionItem[] {
  return readDir('sessions')
    .map((d) => ({
      slug: d.slug,
      title: String(d.front.title ?? d.slug),
      status: ((['upcoming', 'closed'].includes(d.front.status))
        ? d.front.status
        : 'closed') as SessionStatus,
      description: String(d.front.description ?? ''),
      schedule: String(d.front.schedule ?? ''),
      location: String(d.front.location ?? ''),
      price: String(d.front.price ?? ''),
      qr: String(d.front.qr ?? ''),
      order: Number(d.front.order ?? 0) || 0,
    }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.order - b.order ||
        a.title.localeCompare(b.title, 'zh-Hans-CN'),
    );
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
    giscus: { repo: '', repoId: '', category: '', categoryId: '' },
  };
  try {
    return { ...empty, ...JSON.parse(fs.readFileSync(file, 'utf-8')) };
  } catch {
    return empty;
  }
}
