import HomeView from '@/components/HomeView';
import { getNews, getFeaturedSession, getSite } from '@/lib/content';

/** 首页 —— 构建时从 content/ 读数据 */
export default function Page() {
  return (
    <HomeView
      news={getNews().slice(0, 8)}
      session={getFeaturedSession()}
      announcement={getSite().announcement}
    />
  );
}
