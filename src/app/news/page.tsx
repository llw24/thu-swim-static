import NewsList from '@/components/NewsList';
import { getNews, getSite } from '@/lib/content';

export default function Page() {
  return (
    <NewsList
      items={getNews().map(({ body: _body, ...rest }) => rest)}
      site={getSite()}
    />
  );
}
