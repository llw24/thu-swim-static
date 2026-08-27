import CommunityWall from '@/components/CommunityWall';
import { getWall, getSite } from '@/lib/content';

export default function Page() {
  return <CommunityWall wall={getWall()} site={getSite()} />;
}
