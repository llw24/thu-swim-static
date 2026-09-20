/**
 * Issue 表单 → content/*.md 转换脚本
 *
 * 输入（环境变量）：ISSUE_BODY —— 「📝 发布内容」模板生成的 Issue 正文，
 * 格式为 "### 字段名\n\n值\n\n### 字段名\n\n值..."。
 * 输出：在 content/<模块>/ 下生成一个 markdown 文件，
 * 并把文件路径写入 GITHUB_OUTPUT 的 file_path。
 */
import fs from 'node:fs';
import path from 'node:path';

const NO_RESPONSE = /\*\*_No response_\*\*/;

/** 把 Issue 表单正文解析成 { 字段名: 值 } */
function parseForm(body) {
  const parts = String(body).split(/^###\s+/m).slice(1);
  const out = {};
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const key = part.slice(0, nl).trim();
    let val = part.slice(nl).replace(/^\s*$/, '').trim();
    if (!val || NO_RESPONSE.test(val)) val = '';
    out[key] = val;
  }
  return out;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** 文件名安全化：保留中文，去掉文件系统不允许的字符 */
function slugify(title, prefixDate) {
  const s = title
    .replace(/[/\\:*?<>|"'\n\r\t]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return prefixDate ? `${prefixDate}-${s}` : s;
}

const TYPE_DIRS = { '新闻': 'news', '活动': 'sessions', '社区墙': 'wall' };

const f = parseForm(process.env.ISSUE_BODY || '');
const type = (f['内容类型'] || '').trim();
const dir = TYPE_DIRS[type];
if (!dir) {
  console.error(`未知内容类型：「${type}」，必须是 新闻/课程/社区墙 之一`);
  process.exit(1);
}

const title = (f['标题'] || process.env.ISSUE_TITLE || '未命名').replace(/^发布[:：]\s*/, '').trim();
const date = (f['日期'] || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] || today();
const summary = f['摘要'] || '';
const emoji = f['表情符号'] || '';
const body = f['正文'] || '';
const pinned = typeof f['置顶'] === 'string' && f['置顶'].includes('[x]');
const statusMap = { '即将开展': 'upcoming', '已结束': 'closed' };
const catMap = { '分享': 'share', '求助': 'question', '约游': 'buddy' };

/** 组装 front matter */
const lines = [];
const add = (k, v) => { if (v !== '' && v != null) lines.push(`${k}: ${v}`); };

let frontBody = body;
switch (dir) {
  case 'news':
    add('title', JSON.stringify(title));
    add('date', date);
    add('summary', JSON.stringify(summary));
    add('emoji', JSON.stringify(emoji || '💧'));
    add('pinned', pinned ? 'true' : '');
    break;
  case 'sessions':
    add('title', JSON.stringify(title));
    add('status', statusMap[(f['课程状态'] || '').trim()] || 'closed');
    add('description', JSON.stringify(summary));
    add('schedule', JSON.stringify(f['上课时间'] || ''));
    add('location', JSON.stringify(f['上课地点'] || ''));
    add('price', JSON.stringify(f['费用'] || ''));
    add('featured', 'false');
    frontBody = body || '参加方式以协会微信群内通知为准。';
    break;
  case 'wall':
    add('title', JSON.stringify(title));
    add('url', f['链接地址'] || '#');
    add('category', catMap[(f['内容分类'] || '').trim()] || 'share');
    add('date', date);
    add('summary', JSON.stringify(summary));
    add('emoji', JSON.stringify(emoji || '📌'));
    frontBody = '';
    break;
}

const fm = ['---', ...lines.filter(Boolean), '---'].join('\n');
const fileName = `${slugify(type === '新闻' || type === '社区墙' ? `${date}-${title}` : title)}-${Date.now().toString(36)}.md`;
const outPath = path.join('content', dir, fileName);
fs.writeFileSync(outPath, `${fm}\n${frontBody.replace(/^\n+/, '')}\n`, 'utf-8');

// 传给后续步骤
fs.appendFileSync(process.env.GITHUB_OUTPUT ?? '/dev/null', `file_path=${outPath}\n`);
console.log(`已生成 ${outPath}`);
