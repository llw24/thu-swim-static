'use client';
import { useState } from 'react';

export function RoleBadge({ role }: { role: string }) {
  const [show, setShow] = useState(false);
  if (role === 'team_school') {
    return <BadgeWrap show={show} setShow={setShow} className="badge-check badge-gold" label="校队成员认证（黄金）" desc="✓ 清华游泳队" title="✓" />;
  }
  if (role === 'team_represent') {
    return <BadgeWrap show={show} setShow={setShow} className="badge-check badge-platinum" label="代表队成员认证（铂金）" desc="✓ 游泳代表队" title="✓" />;
  }
  if (role === 'coach') {
    return <BadgeWrap show={show} setShow={setShow} className="badge-check badge-coach" label="校外认证教练" desc="协会认证的校外教练" title="✓" />;
  }
  return null;
}

function BadgeWrap({ show, setShow, className, label, desc, title }: any) {
  return (
    <span style={{ position:'relative', display:'inline-block' }}>
      <span className={className} onClick={() => setShow(!show)} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>{title}</span>
      {show && (
        <span style={{ position:'absolute', top:'110%', left:0, background:'white', border:'1px solid var(--line)', padding:'8px 12px', borderRadius:8, fontSize:12, whiteSpace:'nowrap', zIndex:20, boxShadow:'0 4px 16px rgba(0,0,0,.08)', color:'#111' }}>
          <div style={{ fontWeight:600 }}>{label}</div>
          <div style={{ color:'#666' }}>{desc}</div>
        </span>
      )}
    </span>
  );
}
