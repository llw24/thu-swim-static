import type { Metadata } from 'next';
import AdminView from '@/components/AdminView';

export const metadata: Metadata = {
  title: '管理员后台 · 清华大学学生游泳协会',
  robots: { index: false },
};

/** 管理员后台入口 —— 不出现在导航里，地址仅管理员知晓 */
export default function Page() {
  return <AdminView />;
}
