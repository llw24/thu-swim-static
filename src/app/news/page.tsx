import NewsList from '@/components/NewsList';
import { getNews } from '@/lib/content';

export default function Page() {
  return (
    <NewsList
      items={getNews().map(({ body: _body, ...rest }) => rest)}
    />
  );
}
