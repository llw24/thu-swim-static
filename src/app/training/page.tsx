import TrainingView from '@/components/TrainingView';
import { getSessions } from '@/lib/content';

export default function Page() {
  return <TrainingView sessions={getSessions()} />;
}
