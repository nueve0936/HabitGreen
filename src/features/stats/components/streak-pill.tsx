import { Flame } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { lineaDeRacha, pildoraDeRacha, type Racha } from '@/features/stats/domain/rachas';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

// Racha de un hábito (maqueta «Piezas», opción C con el verde rocío de A): un cuadro de 36 dp con
// el número y una llama. Si la racha se rompió, «Mejor: 3» en un tono más suave, nunca «perdiste».
// Con `desanimo`, solo la mejor. TalkBack lee la frase completa («Racha actual: 5»).

export function textoRacha(racha: Racha, desanimo: boolean): string {
  const t = es.estadisticas;
  return lineaDeRacha(racha, desanimo)
    .map(({ texto, n }) => formatear(t[texto], { n }))
    .join('. ');
}

export function StreakPill({ racha, desanimo }: { racha: Racha; desanimo: boolean }) {
  const pildora = pildoraDeRacha(racha, desanimo);
  if (!pildora) return null;
  const actual = pildora.tipo === 'actual';
  return (
    <View
      accessible
      accessibilityLabel={textoRacha(racha, desanimo)}
      style={{ minHeight: 36 }}
      className="flex-row items-center gap-1 self-start rounded-field bg-accent-claro px-2.5"
    >
      <AppText
        variant="small"
        weight={actual ? 'bold' : 'medium'}
        tone={actual ? 'ink' : 'ink-soft'}
        maxFontSizeMultiplier={1.5}
      >
        {actual ? String(pildora.n) : formatear(es.estadisticas.mejorCorta, { n: pildora.n })}
      </AppText>
      <Flame size={18} strokeWidth={2} color={actual ? colors.accent : colors['ink-soft']} />
    </View>
  );
}
