import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { fichaDia } from '@/features/stats/domain/texto-periodo';
import { cardShadow } from '@/theme';

// Fichas de la semana en Diario: los 7 días de lunes a domingo, fijos. La semana se cambia con las
// flechas de arriba (decisión del usuario: deslizar chocaba con el cambio de pantalla y rebotaba).
// La elegida lleva borde verde, fondo verde rocío y negritas; hoy dice «Hoy».
//
// La fila ocupa todo el ancho de la pantalla (márgenes de 12 dp) para que cada ficha, con su zona
// táctil ampliada, llegue a 48 dp.

const ALTO = 64;
const SEPARACION = 4;

export type DayStripProps = {
  semana: readonly string[];
  hoy: string;
  elegido: string;
  onElegir: (fecha: string) => void;
};

export function DayStrip({ semana, hoy, elegido, onElegir }: DayStripProps) {
  return (
    <View style={{ gap: SEPARACION }} className="-mx-8 flex-row px-3 py-2">
      {semana.map((fecha) => {
        const ficha = fichaDia(fecha, hoy);
        const activa = fecha === elegido;
        return (
          <Pressable
            key={fecha}
            accessibilityRole="button"
            accessibilityLabel={ficha.nombre}
            accessibilityState={{ selected: activa }}
            onPress={() => onElegir(fecha)}
            hitSlop={{ left: SEPARACION / 2, right: SEPARACION / 2 }}
            style={[{ height: ALTO }, activa ? undefined : cardShadow]}
            className={`flex-1 items-center justify-center gap-0.5 rounded-field border-2 ${
              activa
                ? 'border-accent bg-accent-claro'
                : 'border-transparent bg-campo active:bg-accent-claro'
            }`}
          >
            <AppText
              variant="small"
              weight={activa || ficha.esHoy ? 'bold' : 'regular'}
              tone={activa || ficha.esHoy ? 'ink' : 'ink-soft'}
              maxFontSizeMultiplier={1.2}
            >
              {ficha.corta}
            </AppText>
            <AppText variant="h3" weight={activa ? 'bold' : 'semibold'} maxFontSizeMultiplier={1.2}>
              {String(ficha.numero)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
