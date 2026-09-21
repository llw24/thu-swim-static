import HomeView from '@/components/HomeView';
import { getSite } from '@/lib/content';

/** 首页 —— 构建时从 content/ 读设置（公告横幅） */
export default function Page() {
  return <HomeView announcement={getSite().announcement} />;
}
