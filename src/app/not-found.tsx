import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="container" style={{ padding:'140px 24px 80px', textAlign:'center' }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>🏊‍♀️</div>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 400, marginBottom: 12 }}>页面走丢了</h1>
      <p style={{ color:'#666', marginBottom: 28 }}>找不到你要的页面，或它已被移除。</p>
      <Link href="/" className="btn-primary">返回首页</Link>
    </main>
  );
}
