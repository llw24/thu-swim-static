import type { Metadata } from 'next';
import JoinGate from '@/components/JoinGate';
import { getSite } from '@/lib/content';

export const metadata: Metadata = {
  title: '加入社区 · 清华大学学生游泳协会',
  description: '用清华邮箱验证身份后加入协会微信群，参与约游、求助和技术交流。',
};

/** 入群验证页 —— 只有清华邮箱验证通过才看得到进群方式 */
export default function Page() {
  const site = getSite();
  return (
    <main className="container" style={{ padding: '110px 24px 60px', maxWidth: 780 }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>Community</p>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 12 }}>
        加入协会微信群
      </h1>
      <p style={{ color: '#444', lineHeight: 1.7, marginBottom: 28 }}>
        协会微信群是日常约游、技术求助和组队的主要阵地，活动报名也在这里完成。
        为保证都是清华在校师生，进群和报名前需要先用清华邮箱验证一次身份（30 天内通用）。
      </p>
      <JoinGate site={site} />
    </main>
  );
}
