import { TabPlaceholder } from '@/components/tab-placeholder';
import { es } from '@/i18n/es';

export default function JardinScreen() {
  return <TabPlaceholder title={es.tabs.jardin} emptyMessage={es.jardin.vacio} />;
}
