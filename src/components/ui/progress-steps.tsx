import { View } from 'react-native';

import { AppText } from './app-text';

// Barra de progreso del formulario con el estilo del mockup («1/7» dentro de la barra).
// Para lectores de pantalla se anuncia «Paso 1 de 7».

export type ProgressStepsProps = {
  current: number;
  total: number;
};

export function ProgressSteps({ current, total }: ProgressStepsProps) {
  const safeCurrent = Math.min(Math.max(current, 1), total);
  const percent = (safeCurrent / total) * 100;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${safeCurrent} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: safeCurrent }}
      className="h-5 w-full overflow-hidden rounded-chip bg-alerta-info"
    >
      <View
        style={{ width: `${percent}%` }}
        className="h-full min-w-12 items-center justify-center rounded-chip bg-surface"
      >
        <AppText variant="small" weight="semibold" className="text-[12px] leading-4">
          {`${safeCurrent}/${total}`}
        </AppText>
      </View>
    </View>
  );
}
