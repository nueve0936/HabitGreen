import { TabPlaceholder } from '@/components/tab-placeholder';
import { es } from '@/i18n/es';

export default function HabitosScreen() {
  return <TabPlaceholder title={es.tabs.habitos} emptyMessage={es.habitos.vacio} />;
}
