'use client';
import { useEffect, useRef } from 'react';
import type { SiteSettings } from '@/lib/content-shared';

/**
 * Giscus 评论区 —— 基于 GitHub Discussions，免费、无需服务器。
 * 配置来自 content/site.json 的 giscus 字段；
 * 四个值都填好后评论区自动启用（配置方法见《管理员使用手册》）。
 */
export default function GiscusComments({ giscus }: { giscus: SiteSettings['giscus'] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const ready = !!(giscus.repo && giscus.repoId && giscus.category && giscus.categoryId);

  useEffect(() => {
    if (!ready || !boxRef.current || boxRef.current.dataset.loaded === '1') return;
    boxRef.current.dataset.loaded = '1';
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    Object.entries({
      'data-repo': giscus.repo,
      'data-repo-id': giscus.repoId,
      'data-category': giscus.category,
      'data-category-id': giscus.categoryId,
      'data-mapping': 'pathname',
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': 'light',
      'data-lang': 'zh-CN',
    }).forEach(([k, v]) => script.setAttribute(k, v));
    boxRef.current.appendChild(script);
  }, [ready, giscus]);

  return (
    <div className="card" style={{ padding:28, marginTop:40 }}>
      <h2 style={{ fontSize:20, fontWeight:600, marginBottom:16 }}>💬 留言板</h2>
      {ready ? (
        <div ref={boxRef} />
      ) : (
        <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.8 }}>
          评论区尚未启用：管理员在 GitHub 上登录一次并完成 giscus 配置后，这里就会变成留言墙。
          （配置步骤见仓库里的《管理员使用手册》）
        </p>
      )}
    </div>
  );
}
