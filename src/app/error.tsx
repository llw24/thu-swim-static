'use client';
import { useEffect } from 'react';
import Link from 'next/link';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="container" style={{ padding:'140px 24px 80px', textAlign:'center' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>💧</div>
      <h1 className="serif" style={{ fontSize: 32, marginBottom: 10 }}>出了点问题</h1>
      <p style={{ color:'#666', marginBottom: 20 }}>刷新一下或者返回首页试试。</p>
      <div style={{ display:'flex', gap: 12, justifyContent:'center' }}>
        <button className="btn-primary" onClick={reset}>重试</button>
        <Link href="/" className="btn-secondary">回首页</Link>
      </div>
    </main>
  );
}
