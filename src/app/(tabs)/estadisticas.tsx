import { TabPlaceholder } from '@/components/tab-placeholder';
import { es } from '@/i18n/es';

export default function EstadisticasScreen() {
  return <TabPlaceholder title={es.tabs.estadisticas} emptyMessage={es.estadisticas.vacio} />;
}
