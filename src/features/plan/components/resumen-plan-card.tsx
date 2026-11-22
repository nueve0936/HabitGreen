import { CalendarClock, Sprout, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es, formatear } from '@/i18n/es';
import { cardShadow, colors } from '@/theme';

import type { Avance } from '../domain/detalle-plan';

// «Resumen» del detalle del plan (critique de Impeccable, decisión del usuario): en una sola
// tarjeta, cómo vas (hechos de las últimas 2 semanas con la barra de Hoy, o un mensaje de ánimo si
// es pronto) y cuándo es la próxima revisión, con una línea que explica qué pasa en ella.

export function textoRevision(dias: number): string {
  const t = es.perfil.detallePlan;
  if (dias <= 0) return t.revisionHoy;
  if (dias === 1) return t.revisionManana;
  return formatear(t.revisionEn, { n: String(dias) });
}

function Fila({ icono: Icono, children }: { icono: LucideIcon; children: ReactNode }) {
  return (
    <View className="flex-row gap-3 p-4">
      <View className="h-10 w-10 items-center justify-center rounded-chip bg-accent-claro">
        <Icono size={22} color={colors.accent} />
      </View>
      <View className="flex-1 justify-center gap-2">{children}</View>
    </View>
  );
}

export function ResumenPlanCard({ avance, dias }: { avance: Avance | null; dias: number }) {
  const t = es.perfil.detallePlan;
  const textoAvance = avance
    ? formatear(t.avance, { hechos: String(avance.hechos), total: String(avance.total) })
    : t.pronto;
  const porcentaje = avance && avance.total > 0 ? (avance.hechos / avance.total) * 100 : 0;

  return (
    <View style={cardShadow} className="overflow-hidden rounded-card bg-campo">
      <Fila icono={Sprout}>
        <AppText>{textoAvance}</AppText>
        {avance ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={textoAvance}
            accessibilityValue={{ min: 0, max: avance.total, now: avance.hechos }}
            className="h-3 w-full overflow-hidden rounded-chip bg-divisor"
          >
            <View style={{ width: `${porcentaje}%` }} className="h-full rounded-chip bg-accent" />
          </View>
        ) : null}
      </Fila>
      <View className="mx-4 h-px bg-divisor" />
      <Fila icono={CalendarClock}>
        <AppText>{textoRevision(dias)}</AppText>
        <AppText variant="small" tone="ink-soft">
          {t.revisionAyuda}
        </AppText>
      </Fila>
    </View>
  );
}
