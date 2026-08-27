'use client';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';

const SDK_URL = 'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.6/libs/cn/index.js';

declare global {
  interface Window {
    CozeWebSDK?: any;
  }
}

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.CozeWebSDK) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { sdkPromise = null; reject(new Error('failed to load Coze SDK')); };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export default function CozeChat() {
  const clientRef = useRef<any>(null);
  const { lang } = useLang();
  const [hintVisible, setHintVisible] = useState(false);

  const botId = process.env.NEXT_PUBLIC_COZE_BOT_ID;

  useEffect(() => {
    if (!botId) return;
    let cancelled = false;
    let started = false;

    const start = async () => {
      if (started || cancelled) return;
      started = true;
      try {
        await loadSdk();
        if (cancelled) return;

        // If a client already exists (from a previous render), tear it down.
        try { clientRef.current?.destroy?.(); } catch {}

        const client = new window.CozeWebSDK!.WebChatClient({
          config: {
            bot_id: botId,
          },
          auth: {
            type: 'token',
            token: async () => {
              const r = await fetch('/api/coze/token', { cache: 'no-store' });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error || 'token error');
              return d.access_token as string;
            },
            onRefreshToken: async () => {
              const r = await fetch('/api/coze/token', { cache: 'no-store' });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error || 'token error');
              return d.access_token as string;
            },
          },
          ui: {
            base: {
              layout: 'pc',
              lang: lang === 'en' ? 'en' : 'zh-CN',
              zIndex: 1000,
            },
            asstBtn: { isNeed: true },
            header: {
              isShow: true,
              isNeedClose: true,
            },
            chatBot: {
              title: lang === 'en' ? 'Swim Assistant' : '游协小助手',
              uploadable: false,
              width: 380,
              el: undefined,
            },
            footer: {
              isShow: false,
            },
          },
        });

        clientRef.current = client;
      } catch (err) {
        console.error('[CozeChat] init failed', err);
      }
    };

    // Kick off after first user interaction OR a short idle delay, whichever comes first.
    const events: (keyof WindowEventMap)[] = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    const trigger = () => { cleanup(); start(); };
    const cleanup = () => { events.forEach(ev => window.removeEventListener(ev, trigger)); };
    events.forEach(ev => window.addEventListener(ev, trigger, { once: true, passive: true }));
    const idleTimer = window.setTimeout(trigger, 3500);

    return () => {
      cancelled = true;
      cleanup();
      window.clearTimeout(idleTimer);
      try { clientRef.current?.destroy?.(); } catch {}
      clientRef.current = null;
    };
  }, [botId, lang]);

  useEffect(() => {
    // Only prompt once per browser session, once user scrolls past first viewport.
    let shown = false;
    try { shown = sessionStorage.getItem('ai-hint-shown') === '1'; } catch {}
    if (shown) return;
    const onScroll = () => {
      if (window.scrollY < window.innerHeight * 0.4) return;
      window.removeEventListener('scroll', onScroll);
      setHintVisible(true);
      try { sessionStorage.setItem('ai-hint-shown', '1'); } catch {}
      setTimeout(() => setHintVisible(false), 6000);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!hintVisible) return null;
  return (
    <div className="ai-assistant-hint" aria-hidden>
      <span>✨</span>
      <span>{lang === 'en' ? 'AI Assistant' : 'AI 小助手'}</span>
    </div>
  );
}
