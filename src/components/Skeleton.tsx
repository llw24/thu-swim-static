'use client';
import { CSSProperties } from 'react';
export function Skeleton({ h = 20, w, style }: { h?: number; w?: number|string; style?: CSSProperties }) {
  return <div style={{ height: h, width: w ?? '100%', borderRadius: 8, background: 'linear-gradient(90deg,#e9e5d7,#f4f0e5,#e9e5d7)', backgroundSize: '200% 100%', animation: 'sk 1.4s ease-in-out infinite', ...style }} />;
}
export function PageSkeleton() {
  return (
    <div className="container" style={{ padding: '110px 24px 40px', maxWidth: 900 }}>
      <Skeleton h={14} w={80} style={{ marginBottom: 12 }} />
      <Skeleton h={36} w={280} style={{ marginBottom: 24 }} />
      <div style={{ display:'grid', gap: 12 }}>
        <Skeleton h={80} />
        <Skeleton h={80} />
        <Skeleton h={80} />
      </div>
    </div>
  );
}
