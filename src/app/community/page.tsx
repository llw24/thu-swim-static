import CommunityWall from '@/components/CommunityWall';
import { getSite } from '@/lib/content';

export default function Page() {
  return <CommunityWall site={getSite()} />;
}
