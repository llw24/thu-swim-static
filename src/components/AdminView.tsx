'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * 管理员后台 —— 纯静态实现：
 * 浏览器里直接调用 GitHub Contents API 读写本仓库 content/ 目录，
 * 提交后触发 Pages 自动重建。不需要任何服务器。
 *
 * 使用前提：管理员本人生成一个 GitHub Token（只需本仓库的 Contents 读写权限），
 * 粘贴一次后保存在浏览器 localStorage。
 */

const REPO = process.env.NEXT_PUBLIC_GH_REPO || 'llw24/thu-swim-static';
const API = `https://api.github.com/repos/${REPO}/contents`;
const LS_KEY = 'tssa_admin_token';

type Module = 'news' | 'sessions';
type Tab = Module | 'settings';

type FileMeta = { name: string; path: string; sha: string };
type Fields = Record<string, string>;

/** 每个模块可编辑的字段（中文标签 + 类型） */
const SCHEMA: Record<Module, {
  label: string;
  folder: string;
  filePrefix?: () => string;
  fields: { key: string; zh: string; type: 'text' | 'textarea' | 'check' | 'select'; options?: [string, string][]; hint?: string }[];
}> = {
  news: {
    label: '新闻',
    folder: 'content/news',
    filePrefix: () => new Date().toISOString().slice(0, 10) + '-',
    fields: [
      { key: 'title', zh: '标题', type: 'text' },
      { key: 'date', zh: '日期', type: 'text' },
      { key: 'summary', zh: '摘要（显示在卡片上）', type: 'text' },
      { key: 'emoji', zh: '小图标', type: 'text' },
      { key: 'pinned', zh: '置顶', type: 'check' },
      { key: 'draft', zh: '草稿（勾选 = 不公开）', type: 'check' },
    ],
  },
  sessions: {
    label: '课程',
    folder: 'content/sessions',
    fields: [
      { key: 'title', zh: '期次名称', type: 'text' },
      {
        key: 'status', zh: '状态', type: 'select',
        options: [['open', '报名中'], ['full', '名额已满'], ['closed', '已结束']],
      },
      { key: 'description', zh: '课程简介', type: 'text' },
      { key: 'schedule', zh: '上课时间', type: 'text' },
      { key: 'location', zh: '上课地点', type: 'text' },
      { key: 'price', zh: '费用', type: 'text' },
      { key: 'registerUrl', zh: '报名表单链接', type: 'text', hint: '如 https://docs.qq.com/form/page/xxx' },
      { key: 'qr', zh: '教学群二维码图片路径', type: 'text', hint: '如 /uploads/fall01.png，留空不显示' },
      { key: 'featured', zh: '上首页展示', type: 'check' },
    ],
  },
};

// ---------------------------------------------------- 站点设置（site.json）

/** content/site.json 中开放给管理员编辑的字段 */
const SITE_FIELDS: { key: string; zh: string; type: 'text' | 'textarea'; hint?: string }[] = [
  { key: 'announcement', zh: '首页公告横幅 📢', type: 'textarea', hint: '留空则首页不显示横幅' },
  { key: 'contactEmail', zh: '联系邮箱（页脚）', type: 'text' },
  { key: 'contactWechat', zh: '微信号（页脚 + 社区页）', type: 'text' },
  { key: 'wechatGroupQr', zh: '微信群二维码图片路径', type: 'text', hint: '如 /uploads/group.png；图片先上传到仓库 public/uploads/ 里' },
  { key: 'communityIntroZh', zh: '社区页介绍 · 中文', type: 'textarea' },
  { key: 'communityIntroEn', zh: '社区页介绍 · 英文', type: 'textarea' },
  { key: 'coachRequestUrl', zh: '“我要找教练”表单链接', type: 'text', hint: '留空则显示加微信引导' },
  { key: 'coachApplyUrl', zh: '教练入驻申请表单链接', type: 'text', hint: '留空则显示加微信引导' },
];

// ---------------------------------------------------------- 前置元数据解析

function parseFront(text: string): { data: Fields; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: {}, body: text };
  const data: Fields = {};
  for (const line of m[1].split('\n')) {
    const km = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (!km) continue;
    let v = km[2].trim();
    // 我们生成的内容字符串一律带 JSON 引号
    if (/^".*"$/.test(v)) {
      try { v = JSON.parse(v); } catch { v = v.slice(1, -1); }
    }
    data[km[1]] = v;
  }
  return { data, body: m[2].replace(/^\n+/, '') };
}

function serializeFront(data: Fields, schemaFields: { key: string }[], body: string): string {
  const lines = ['---'];
  for (const f of schemaFields) {
    const raw = data[f.key] ?? '';
    const isBoolField = true; // 值类型由 parse 保留的字符串决定
    void isBoolField;
    if (raw === '' || raw === 'false') continue;
    const isNumOrBool = /^(true|false|\d+(\.\d+)?)$/.test(raw);
    lines.push(`${f.key}: ${isNumOrBool ? raw : JSON.stringify(raw)}`);
  }
  lines.push('---');
  return lines.join('\n') + '\n\n' + body.replace(/^\n+/, '').replace(/\s*$/, '\n');
}

function utf8ToBase64(str: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

export default function AdminView() {
  const [token, setToken] = useState('');
  const [loginState, setLoginState] = useState<'checking' | 'ok' | 'none'>('none');
  const [user, setUser] = useState('');
  const [tab, setTab] = useState<Tab>('news');

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) || '';
    setToken(saved);
    setLoginState(saved ? 'checking' : 'none');
    if (saved) verify(saved);
  }, []);

  async function verify(tok: string) {
    try {
      const r = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' },
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      localStorage.setItem(LS_KEY, tok);
      setUser(d.login || '');
      setLoginState('ok');
      refreshAll(tok);
    } catch {
      setLoginState('none');
      alert('Token 无效或权限不足，请重新粘贴。');
    }
  }

  function logout() {
    localStorage.removeItem(LS_KEY);
    setToken('');
    setUser('');
    setLoginState('none');
  }

  // ----------------------------------------------------------- 文件列表

  const [lists, setLists] = useState<Record<Module, FileMeta[]>>({ news: [], sessions: [] });
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async (tok: string, mod: Module) => {
    const r = await fetch(`${API}/${SCHEMA[mod].folder}?ref=main`, {
      headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' },
    });
    if (!r.ok) throw new Error(`读取列表失败（HTTP ${r.status}）`);
    const arr: any[] = await r.json();
    setLists((p) => ({ ...p, [mod]: arr.filter((f) => f.name.endsWith('.md')) }));
  }, []);

  async function refreshAll(tok: string) {
    setLoading(true);
    try {
      await Promise.all([loadList(tok, 'news'), loadList(tok, 'sessions'), loadSite(tok)]);
    } catch (e: any) {
      alert(e.message || '加载失败');
    }
    setLoading(false);
  }

  // --------------------------------------------------------- 站点设置状态

  const [siteData, setSiteData] = useState<Fields>({});
  const [siteRawRef, setSiteRawRef] = useState<Record<string, any>>({});
  const [siteSha, setSiteSha] = useState('');

  async function loadSite(tok: string) {
    const r = await fetch(`${API}/content/site.json?ref=main`, {
      headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' },
    });
    if (!r.ok) throw new Error(`读取站点设置失败（HTTP ${r.status}）`);
    const d = await r.json();
    const parsed = JSON.parse(decodeURIComponent(escape(atob(d.content))));
    setSiteSha(d.sha);
    setSiteRawRef(parsed);
    setSiteData(Object.fromEntries(SITE_FIELDS.map((f) => [f.key, String(parsed[f.key] ?? '')])));
  }

  async function saveSite() {
    if (!token) return;
    setBusy(true);
    try {
      // giscus 等技术字段原样保留，只覆盖管理员的这批字段
      const merged = { ...siteRawRef };
      for (const f of SITE_FIELDS) {
        (merged as any)[f.key] = siteData[f.key] ?? '';
      }
      const text = JSON.stringify(merged, null, 2) + '\n';
      const r = await fetch(`${API}/content/site.json`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify({
          message: '后台设置：更新全站设置',
          content: utf8ToBase64(text),
          sha: siteSha,
          branch: 'main',
        }),
      });
      if (!r.ok) throw new Error(`保存失败 HTTP ${r.status}: ${JSON.stringify(await r.json()).slice(0, 200)}`);
      alert('✅ 已保存！网站将在 2~5 分钟内自动更新。');
      await loadSite(token);
    } catch (e: any) {
      alert(e.message || '保存失败');
    }
    setBusy(false);
  }

  // ------------------------------------------------------------- 编辑器

  const [editing, setEditing] = useState<null | {
    mod: Module;
    isNew: boolean;
    fileName: string;
    sha?: string;
    data: Fields;
    body: string;
  }>(null);
  const [busy, setBusy] = useState(false);

  function openNew(mod: Module) {
    const preset: Fields = {};
    for (const f of SCHEMA[mod].fields) preset[f.key] = f.type === 'select' ? f.options?.[0]?.[0] ?? '' : '';
    if (mod === 'news') { preset.date = new Date().toISOString().slice(0, 10); preset.emoji = '💧'; }
    if (mod === 'sessions') preset.featured = 'false';
    const prefix = SCHEMA[mod].filePrefix?.() ?? '';
    setEditing({ mod, isNew: true, fileName: `${prefix}新内容.md`, data: preset, body: mod === 'news' ? '在这里写正文…' : '' });
  }

  async function openFile(meta: FileMeta) {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/${meta.path}?ref=main`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      });
      if (!r.ok) throw new Error(`读取失败 HTTP ${r.status}`);
      const d = await r.json();
      const { data, body } = parseFront(decodeURIComponent(escape(atob(d.content))));
      const mod: Module = meta.path.includes('/news/') ? 'news' : 'sessions';
      setEditing({ mod, isNew: false, fileName: meta.name, sha: d.sha, data, body });
    } catch (e: any) {
      alert(e.message || '打开失败');
    }
    setBusy(false);
  }

  async function save() {
    if (!editing) return;
    const schema = SCHEMA[editing.mod];
    const titleKey = editing.data.title?.trim() || editing.data.name?.trim();
    if (!titleKey) { alert('标题不能为空'); return; }
    if (editing.isNew && !/^[\w\u4e00-\u9fa5-]+\.md$/.test(editing.fileName)) {
      alert('文件名只能包含中文、字母、数字、连字符和 .md 结尾'); return;
    }
    // 字段只保留 schema 里定义的，避免把状态写脏
    const data: Fields = {};
    for (const f of schema.fields) data[f.key] = editing.data[f.key] ?? '';
    if (!data.date && editing.mod === 'news') data.date = new Date().toISOString().slice(0, 10);
    const text = serializeFront(data, schema.fields, editing.body);

    setBusy(true);
    try {
      const body: any = {
        message: `后台编辑(${schema.label})：${titleKey}`,
        content: utf8ToBase64(text),
        branch: 'main',
      };
      if (!editing.isNew) body.sha = editing.sha;
      const r = await fetch(`${API}/${schema.folder}/${encodeURIComponent(editing.fileName)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`保存失败 HTTP ${r.status}: ${JSON.stringify(await r.json()).slice(0, 200)}`);
      alert('✅ 已保存！网站将在 2~5 分钟内自动更新。');
      setEditing(null);
      await loadList(token, editing.mod);
    } catch (e: any) {
      alert(e.message || '保存失败');
    }
    setBusy(false);
  }

  async function remove(meta: FileMeta) {
    if (!confirm(`确定删除「${meta.name}」？删除后无法恢复（可在 git 历史找回）。`)) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/${meta.path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ message: `后台删除：${meta.name}`, sha: meta.sha, branch: 'main' }),
      });
      if (!r.ok) throw new Error(`删除失败 HTTP ${r.status}`);
      alert('✅ 已删除，网站将自动更新。');
      await loadList(token, meta.path.includes('/news/') ? 'news' : 'sessions');
    } catch (e: any) {
      alert(e.message || '删除失败');
    }
    setBusy(false);
  }

  // ---------------------------------------------------------------- 视图

  const styleCard: React.CSSProperties = { padding: 28, maxWidth: 860, margin: '0 auto 20px' };

  if (loginState !== 'ok') {
    return (
      <main className="container" style={{ padding:'110px 24px 60px', maxWidth:720 }}>
        <h1 className="serif" style={{ fontSize:32, marginBottom:16 }}>🔧 管理员登录</h1>
        <div className="card" style={styleCard}>
          <p style={{ color:'#555', lineHeight:1.8, fontSize:14 }}>
            粘贴一个 GitHub Personal Access Token（需含本仓库 <b>Contents: Read and write</b> 权限）。<br />
            获取方式：GitHub 右上角头像 → <b>Settings → Developer settings → Fine-grained tokens → Generate new token</b>，
            Repository access 选 <b>Only select repositories → {REPO}</b>，Permissions 里给 <b>Contents</b> 选 <b>Read and write</b>。<br />
            Token 只保存在你自己的浏览器里，不会上传到别处。
          </p>
          <input
            className="input" type="password" placeholder="ghp_ 或 github_pat_ 开头"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <div style={{ display:'flex', gap:12, marginTop:14 }}>
            <button className="btn-primary" onClick={() => token && verify(token)}>{loginState === 'checking' ? '校验中…' : '登录'}</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <h1 className="serif" style={{ fontSize:32 }}>🔧 内容管理</h1>
        <span style={{ fontSize:13, color:'var(--muted)' }}>
          已登录 GitHub：{user} · <a href="#" onClick={(e)=>{e.preventDefault();logout();}} style={{color:'#A61E1E'}}>退出</a> ·{' '}
          <a href={`https://github.com/${REPO}/actions`} target="_blank" rel="noopener noreferrer">部署进度 ↗</a>
        </span>
      </div>

      <div style={{ display:'flex', gap:8, margin:'18px 0 22px', flexWrap:'wrap' }}>
        {(Object.keys(SCHEMA) as Module[]).map((m) => (
          <button key={m} onClick={()=>setTab(m)} className="chip" style={{
            cursor:'pointer', padding:'8px 20px', fontSize:14,
            background: tab===m?'var(--ink)':'white', color: tab===m?'white':'#333', border:'1px solid var(--line)',
          }}>{SCHEMA[m].label}</button>
        ))}
        <button onClick={()=>setTab('settings')} className="chip" style={{
          cursor:'pointer', padding:'8px 20px', fontSize:14,
          background: tab==='settings'?'var(--ink)':'white', color: tab==='settings'?'white':'#333', border:'1px solid var(--line)',
        }}>⚙️ 站点设置</button>
        {tab !== 'settings' && (
          <>
            <div style={{ flex:1 }} />
            <button className="btn-primary" onClick={()=>openNew(tab)}>＋ 新增{SCHEMA[tab as Module].label}</button>
          </>
        )}
      </div>

      {/* ------------------------------------------------ 站点设置视图 */}
      {!loading && tab === 'settings' && (
        <div className="card" style={styleCard}>
          <h2 style={{ fontSize:20, fontWeight:600, marginBottom:16 }}>⚙️ 全站设置</h2>
          <p style={{ color:'#666', fontSize:13, lineHeight:1.7, marginBottom:8 }}>
            这里的内容全站生效（首页公告、页脚联系方式、社区页介绍等）。
          </p>
          {SITE_FIELDS.map((f) => (
            <label key={f.key} className="label" style={{ display:'block', marginTop:12 }}>
              {f.zh}
              {f.hint && <span style={{ color:'var(--muted)', fontWeight:400 }}> · {f.hint}</span>}
              {f.type === 'textarea' ? (
                <textarea className="input" rows={3} value={siteData[f.key]||''} onChange={(e)=>setSiteData({...siteData, [f.key]:e.target.value})} />
              ) : (
                <input className="input" value={siteData[f.key]||''} onChange={(e)=>setSiteData({...siteData, [f.key]:e.target.value})} />
              )}
            </label>
          ))}
          <div style={{ display:'flex', gap:12, marginTop:18 }}>
            <button className="btn-primary" disabled={busy} onClick={saveSite}>{busy?'保存中…':'保存并发布'}</button>
          </div>
        </div>
      )}

      {loading && <p style={{ color:'var(--muted)' }}>加载中…</p>}

      {!loading && !editing && tab !== 'settings' && (
        <div className="card" style={{ padding:12 }}>
          {lists[tab].length === 0 && <p style={{ padding:20, color:'var(--muted)' }}>还没有{SCHEMA[tab].label}。</p>}
          {lists[tab].map((f) => (
            <div key={f.path} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:'1px solid var(--line)' }}>
              <span style={{ flex:1, fontSize:14 }}>{f.name}</span>
              <button className="chip" style={{ cursor:'pointer' }} disabled={busy} onClick={()=>openFile(f)}>编辑</button>
              <button className="chip chip-closed" style={{ cursor:'pointer' }} disabled={busy} onClick={()=>remove(f)}>删除</button>
            </div>
          ))}
        </div>
      )}

      {editing && (() => {
        const s = SCHEMA[editing.mod];
        return (
          <div className="card" style={styleCard}>
            <h2 style={{ fontSize:20, fontWeight:600, marginBottom:16 }}>
              {editing.isNew ? `新增${s.label}` : `编辑${s.label}`}
              {!editing.isNew && <span style={{ fontSize:12, color:'var(--muted)', marginLeft:8 }}>{editing.fileName}</span>}
            </h2>
            {editing.isNew && (
              <label className="label">文件名（自动生成即可）<input className="input" value={editing.fileName} onChange={(e)=>setEditing({...editing, fileName:e.target.value})} /></label>
            )}
            {s.fields.map((f) => (
              <label key={f.key} className="label" style={{ display:'block', marginTop:12 }}>
                {f.zh}
                {f.hint && <span style={{ color:'var(--muted)', fontWeight:400 }}> · {f.hint}</span>}
                {f.type === 'textarea' ? (
                  <textarea className="input" rows={3} value={editing.data[f.key]||''} onChange={(e)=>setEditing({...editing, data:{...editing.data, [f.key]:e.target.value}})} />
                ) : f.type === 'check' ? (
                  <input type="checkbox" checked={editing.data[f.key]==='true'} onChange={(e)=>setEditing({...editing, data:{...editing.data, [f.key]: e.target.checked?'true':'false'}})} style={{ display:'block', marginTop:6, width:18, height:18 }} />
                ) : f.type === 'select' ? (
                  <select className="input" value={editing.data[f.key]||''} onChange={(e)=>setEditing({...editing, data:{...editing.data, [f.key]:e.target.value}})}>
                    {f.options!.map(([v, zh]) => <option key={v} value={v}>{zh}</option>)}
                  </select>
                ) : (
                  <input className="input" value={editing.data[f.key]||''} onChange={(e)=>setEditing({...editing, data:{...editing.data, [f.key]:e.target.value}})} />
                )}
              </label>
            ))}
            <label className="label" style={{ display:'block', marginTop:12 }}>
              正文 / 详细说明（Markdown）
              <textarea className="input" rows={9} value={editing.body} onChange={(e)=>setEditing({...editing, body:e.target.value})} />
            </label>
            <div style={{ display:'flex', gap:12, marginTop:18 }}>
              <button className="btn-primary" disabled={busy} onClick={save}>{busy?'保存中…':'保存并发布'}</button>
              <button className="btn-secondary" disabled={busy} onClick={()=>setEditing(null)}>取消</button>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
