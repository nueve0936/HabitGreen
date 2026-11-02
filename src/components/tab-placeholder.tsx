import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

// Contenido provisional de las pestañas mientras llegan sus entregas: título y estado vacío.

export type TabPlaceholderProps = {
  title: string;
  emptyMessage: string;
};

export function TabPlaceholder({ title, emptyMessage }: TabPlaceholderProps) {
  return (
    <Screen edges={['top']} contentClassName="gap-6 pt-6">
      <AppText variant="h1">{title}</AppText>
      <View className="flex-1 items-center justify-center">
        <AppText variant="body" tone="ink-soft" className="text-center">
          {emptyMessage}
        </AppText>
      </View>
    </Screen>
  );
}
