'use client';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import type { SiteSettings } from '@/lib/content';

/** 页脚 —— 联系方式来自 content/site.json，改设置即可更新全站 */
export default function Footer({ site }: { site: SiteSettings }) {
  const t = useT();
  return (
    <footer style={{ background:'var(--ink)', color:'white', marginTop:80 }}>
      <div className="container" style={{ padding:'56px 24px' }}>
        <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:40 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#4AA8B2,#0B1F3A)' }} />
              <div>
                <div className="serif" style={{ fontSize:18, fontWeight:500 }}>{t('清华游协', 'TSSA')}</div>
                <div style={{ fontSize:10, color:'#94a3b8', letterSpacing:'0.16em' }}>TSSA · SINCE 1984</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, letterSpacing:'0.2em', color:'#94a3b8', fontWeight:600, marginBottom:16, textTransform:'uppercase' }}>{t('导航', 'Navigate')}</div>
            <ul style={{ listStyle:'none', color:'#cbd5e1', fontSize:14, display:'flex', flexDirection:'column', gap:10 }}>
              <li><Link href="/training" style={{ color:'inherit' }}>{t('零基础班', 'Beginner Class')}</Link></li>
              <li><Link href="/community" style={{ color:'inherit' }}>{t('社区', 'Community')}</Link></li>
              <li><Link href="/coaches" style={{ color:'inherit' }}>{t('找教练', 'Coaches')}</Link></li>
              <li><Link href="/news" style={{ color:'inherit' }}>{t('动态', 'News')}</Link></li>
              <li><Link href="/about" style={{ color:'inherit' }}>{t('关于协会', 'About')}</Link></li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize:11, letterSpacing:'0.2em', color:'#94a3b8', fontWeight:600, marginBottom:16, textTransform:'uppercase' }}>{t('联系', 'Contact')}</div>
            <ul style={{ listStyle:'none', color:'#cbd5e1', fontSize:14, display:'flex', flexDirection:'column', gap:10 }}>
              <li>{site.contactEmail}</li>
              {site.contactWechat && <li>{t('微信', 'WeChat')}：{site.contactWechat}</li>}
              <li>{t('活动地点：陈明游泳馆', 'Venue: Chen Ming Natatorium')}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bot" style={{ borderTop:'1px solid rgba(255,255,255,.08)', marginTop:40, paddingTop:24, display:'flex', justifyContent:'space-between', color:'#64748b', fontSize:12, gap:12, flexWrap:'wrap' }}>
          <div>© {new Date().getFullYear()} {t('清华大学学生游泳协会', 'Tsinghua University Student Swimming Association')}</div>
          <div>Made with 💧 in Beijing · <Link href="/admin" style={{ color:'inherit' }}>管理</Link></div>
        </div>
      </div>
    </footer>
  );
}
