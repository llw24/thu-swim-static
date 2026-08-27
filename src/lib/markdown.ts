import DOMPurify from 'isomorphic-dompurify';

// Very small, safe Markdown → HTML for post/comment bodies.
// Supports: headings, bold, italic, code (inline+fenced), links (auto+ [text](url)),
// unordered lists, ordered lists, blockquote, hr, line breaks. Escapes HTML.
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}

export function renderMarkdown(src: string): string {
  if (!src) return '';
  const lines = src.replace(/\r\n?/g,'\n').split('\n');
  const out: string[] = [];
  let inCode = false; let codeLang = ''; let codeBuf: string[] = [];
  let listStack: ('ul'|'ol')[] = [];
  const closeLists = (toDepth = 0) => { while (listStack.length > toDepth) out.push(`</${listStack.pop()}>`); };

  for (let raw of lines) {
    if (inCode) {
      if (/^```\s*$/.test(raw)) { out.push(`<pre><code${codeLang?` class="lang-${escapeHtml(codeLang)}"`:''}>${escapeHtml(codeBuf.join('\n'))}</code></pre>`); inCode=false; codeBuf=[]; codeLang=''; continue; }
      codeBuf.push(raw); continue;
    }
    const fence = /^```\s*(\w+)?\s*$/.exec(raw);
    if (fence) { closeLists(); inCode = true; codeLang = fence[1]||''; continue; }
    if (!raw.trim()) { closeLists(); continue; }
    // headings
    const h = /^(#{1,3})\s+(.+)$/.exec(raw);
    if (h) { closeLists(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    // hr
    if (/^---+$/.test(raw.trim())) { closeLists(); out.push('<hr/>'); continue; }
    // blockquote
    if (/^>\s?/.test(raw)) { closeLists(); out.push(`<blockquote>${inline(raw.replace(/^>\s?/,''))}</blockquote>`); continue; }
    // ol
    const ol = /^(\s*)\d+\.\s+(.+)$/.exec(raw);
    const ul = /^(\s*)[-*]\s+(.+)$/.exec(raw);
    if (ol || ul) {
      const type = ol ? 'ol' : 'ul';
      if (listStack[listStack.length-1] !== type) { closeLists(); listStack.push(type); out.push(`<${type}>`); }
      out.push(`<li>${inline((ol?ol[2]:ul![2]))}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inline(raw)}</p>`);
  }
  if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  closeLists();
  const html = out.join('\n');
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['h1','h2','h3','p','strong','em','code','pre','a','ul','ol','li','br','hr','blockquote','img'], ALLOWED_ATTR: ['href','title','target','rel','class','src','alt'] });
}

function inline(s: string): string {
  let t = escapeHtml(s);
  // code
  t = t.replace(/`([^`]+)`/g, (_,c) => `<code>${c}</code>`);
  // bold **x**
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic *x*
  t = t.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, '$1<em>$2</em>');
  // links [t](u)
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // autolink
  t = t.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (m, pre, url) => `${pre}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  return t;
}

// Extract embed info from a video URL (BiliBili, YouTube).
export function videoEmbed(url: string): { kind: 'bilibili'|'youtube'|'other'; src?: string; original: string } {
  const u = url.trim();
  if (!u) return { kind:'other', original:u };
  // BiliBili: https://www.bilibili.com/video/BVxxxx
  const bv = /bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i.exec(u);
  if (bv) return { kind:'bilibili', src:`https://player.bilibili.com/player.html?bvid=${bv[1]}&high_quality=1&autoplay=0`, original:u };
  // BiliBili b23 short — user must expand; we just link.
  // YouTube: youtu.be/ID or youtube.com/watch?v=ID
  const yt1 = /youtu\.be\/([\w-]+)/i.exec(u);
  const yt2 = /youtube\.com\/watch\?[^#]*v=([\w-]+)/i.exec(u);
  const ytId = yt1?.[1] || yt2?.[1];
  if (ytId) return { kind:'youtube', src:`https://www.youtube.com/embed/${ytId}`, original:u };
  return { kind:'other', original:u };
}
