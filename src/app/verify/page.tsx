import type { Metadata } from 'next';
import JoinGate from '@/components/JoinGate';
import { getSite } from '@/lib/content';

export const metadata: Metadata = {
  title: '报名验证 · 清华大学学生游泳协会',
  description: '报名前用清华邮箱验证身份。验证一次，30 天内进群和报名通用。',
};

/** 报名前的独立验证页 —— 与进群页（/join）分开，目的单一 */
export default function Page() {
  return (
    <main className="container" style={{ padding: '110px 24px 60px', maxWidth: 780 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>Sign-up</p>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>
        报名身份验证
      </h1>
      <p style={{ color: '#444', lineHeight: 1.7, marginBottom: 28 }}>
        为保证活动名额留给清华在校同学，报名前需要用清华邮箱验证一次身份。
        验证结果 30 天内有效，期间进群和报名都不用再验。
      </p>
      <JoinGate site={getSite()} variant="signup" />
    </main>
  );
}
