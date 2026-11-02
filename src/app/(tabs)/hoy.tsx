import { TabPlaceholder } from '@/components/tab-placeholder';
import { es } from '@/i18n/es';

export default function HoyScreen() {
  return <TabPlaceholder title={es.tabs.hoy} emptyMessage={es.hoy.vacio} />;
}
