/**
 * Issue 表单 → content/sessions/*.md 转换脚本
 *
 * 输入（环境变量）：ISSUE_BODY —— 「📝 发布活动」模板生成的 Issue 正文，
 * 格式为 "### 字段名\n\n值\n\n### 字段名\n\n值..."。
 * 输出：在 content/sessions/ 下生成一个 markdown 文件，
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

/** 文件名安全化：保留中文，去掉文件系统不允许的字符 */
function slugify(title) {
  return title
    .replace(/[/\\:*?<>|"'\n\r\t]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
}

const f = parseForm(process.env.ISSUE_BODY || '');

const title = (f['活动名称'] || process.env.ISSUE_TITLE || '未命名').replace(/^发布[:：]\s*/, '').trim();
const summary = f['活动简介'] || '';
const body = f['详细说明'] || '';
const statusMap = { '即将开展': 'upcoming', '已结束': 'closed' };

/** 组装 front matter */
const lines = [];
const add = (k, v) => { if (v !== '' && v != null) lines.push(`${k}: ${v}`); };
add('title', JSON.stringify(title));
add('status', statusMap[(f['活动状态'] || '').trim()] || 'upcoming');
add('description', JSON.stringify(summary));
add('schedule', JSON.stringify(f['活动时间'] || ''));
add('location', JSON.stringify(f['活动地点'] || ''));
add('price', JSON.stringify(f['费用'] || ''));
const frontBody = body || '参加方式以协会微信群内通知为准。';

const fm = ['---', ...lines.filter(Boolean), '---'].join('\n');
const fileName = `${slugify(title)}-${Date.now().toString(36)}.md`;
const outPath = path.join('content', 'sessions', fileName);
fs.writeFileSync(outPath, `${fm}\n${frontBody.replace(/^\n+/, '')}\n`, 'utf-8');

// 传给后续步骤
fs.appendFileSync(process.env.GITHUB_OUTPUT ?? '/dev/null', `file_path=${outPath}\n`);
console.log(`已生成 ${outPath}`);
