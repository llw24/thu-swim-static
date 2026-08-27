import CoachesView from '@/components/CoachesView';
import { getCoaches, getSite } from '@/lib/content';

export default function Page() {
  return <CoachesView coaches={getCoaches()} site={getSite()} />;
}
