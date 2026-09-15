import NewsList from '@/components/NewsList';
import { getNews, getWall, getSite } from '@/lib/content';
import type { NewsItem } from '@/lib/content-shared';

/**
 * 动态页 —— 公众号文章（content/news/*.md）+ 社群精选（content/wall/*.md）
 * 合并成一个按时间排序的列表；有 url 的直接跳外链（微信内外都能打开）。
 */
export default function Page() {
  const news = getNews().map(({ body: _body, ...rest }) => rest);
  const wall = getWall().map(
    (w): Omit<NewsItem, 'body'> => ({
      slug: w.slug,
      title: w.title,
      date: w.date,
      summary: w.summary,
      emoji: w.emoji,
      pinned: false,
      url: w.url,
    }),
  );

  return (
    <NewsList
      items={[...news, ...wall].sort((a, b) => b.date.localeCompare(a.date))}
      site={getSite()}
    />
  );
}
