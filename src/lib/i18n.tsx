'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type Lang = 'zh' | 'en';
type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LangCtx = createContext<Ctx>({ lang: 'zh', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lang') as Lang | null;
      if (stored === 'en' || stored === 'zh') setLangState(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try { document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; } catch {}
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
  }, []);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() { return useContext(LangCtx); }

/**
 * useT() -> t(zh, en?) helper.
 * Usage: const t = useT(); t('中文', 'English')
 * If en is omitted, returns zh in either mode.
 */
export function useT() {
  const { lang } = useContext(LangCtx);
  return useCallback(function t(zh: string, en?: string) {
    if (lang === 'en' && typeof en === 'string') return en;
    return zh;
  }, [lang]);
}

export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  const other: Lang = lang === 'zh' ? 'en' : 'zh';
  return (
    <button
      onClick={() => setLang(other)}
      aria-label="切换语言 · Toggle language"
      title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
      style={{
        border: '1px solid var(--line)',
        background: 'transparent',
        color: 'var(--ink)',
        borderRadius: 9999,
        padding: compact ? '4px 10px' : '6px 12px',
        fontSize: 12,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ opacity: lang === 'zh' ? 1 : 0.4 }}>中</span>
      <span style={{ opacity: 0.3 }}>/</span>
      <span style={{ opacity: lang === 'en' ? 1 : 0.4 }}>EN</span>
    </button>
  );
}
