'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useT, LangToggle } from '@/lib/i18n';

/** 顶部导航 —— 静态站版本：无登录、无消息中心 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const linkClass = (p: string) => `nav-link${pathname === p ? ' active' : ''}`;
  const links: [string, { zh: string; en: string }][] = [
    ['/', { zh: '首页', en: 'Home' }],
    ['/training', { zh: '零基础班', en: 'Beginner Class' }],
    ['/community', { zh: '社区', en: 'Community' }],
    ['/coaches', { zh: '找教练', en: 'Coaches' }],
    ['/news', { zh: '动态', en: 'News' }],
    ['/about', { zh: '关于', en: 'About' }],
  ];

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none', color:'var(--ink)' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#4AA8B2,#0B1F3A)', boxShadow:'0 2px 8px rgba(11,31,58,.15)' }} />
          <div>
            <div className="serif" style={{ fontSize:18, fontWeight:500, lineHeight:1 }}>{t('清华游协', 'TSSA')}</div>
            <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.16em', marginTop:2 }}>TSSA · SINCE 1984</div>
          </div>
        </Link>

        <ul className="nav-links" style={{ listStyle:'none' }}>
          {links.map(([href, label]) => (
            <li key={href}><Link href={href} className={linkClass(href)}>{t(label.zh, label.en)}</Link></li>
          ))}
        </ul>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <LangToggle />
          <button className="nav-burger" aria-label={t('菜单', 'Menu')} onClick={()=>setMenuOpen(v=>!v)}>☰</button>
        </div>
      </div>
      {menuOpen && (
        <div className="nav-mobile">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={linkClass(href)}>{t(label.zh, label.en)}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
