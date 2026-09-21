'use client';
import { useT } from '@/lib/i18n';
import GiscusComments from './GiscusComments';
import JoinGate from './JoinGate';
import type { SiteSettings } from '@/lib/content-shared';

/**
 * 加入社群页 —— 结构：
 *  ① 验证入群（JoinGate：先验证清华邮箱，验证后才看得到进群方式）
 *  ② Giscus 留言板（GitHub Discussions，配置后自动启用）
 */
export default function CommunityWall({ site }: { site: SiteSettings }) {
  const t = useT();

  return (
    <main className="container" style={{ padding:'110px 24px 60px', maxWidth:900 }}>
      <p className="eyebrow" style={{ marginBottom:10 }}>Join Us</p>
      <h1 className="serif" style={{ fontSize:36, fontWeight:400, marginBottom:28 }}>
        {t('加入社群', 'Join Our Community')}
      </h1>

      {/* ① 验证入群 —— 验证清华邮箱后才会显示进群方式 */}
      <JoinGate site={site} />

      {/* ② 留言板 */}
      <GiscusComments giscus={site.giscus} />
    </main>
  );
}
