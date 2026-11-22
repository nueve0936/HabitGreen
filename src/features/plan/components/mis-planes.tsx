import { ChevronRight, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { cupoPlanes } from '@/db/limits-repository';
import { leerGlobalesFormulario, leerMisPlanes } from '@/db/plan-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { ICONO_CATEGORIA } from '@/features/habits/categoria-icono';
import {
  type AvisoLimite,
  LimiteHabitosDialog,
} from '@/features/habits/components/limite-habitos-dialog';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { es, formatear } from '@/i18n/es';
import { useAccionUnica } from '@/lib/use-accion-unica';
import { AREAS } from '@/schemas/onboarding';
import { cardShadow, colors, tintes } from '@/theme';
import { navegar } from '@/lib/navegar';

import { usePlanReviewStore } from '../plan-review-store';

// «Mis planes» en Perfil (varios planes por usuario, decisión del usuario): un plan por área, con
// sus hábitos. Tocar un plan abre su detalle (donde también se termina). «Crear plan» abre el
// formulario (los 7 pasos si nunca lo hizo; si no, 3). No hay modo fijo: cualquiera
// puede tener planes y hábitos propios.

export type MisPlanesProps = {
  userId: string;
};

export function MisPlanes({ userId }: MisPlanesProps) {
  const t = es.perfil.planes;
  const areas = es.onboarding.formulario.areas;
  const planes = useLocalQuery(`mis-planes-${userId}`, () => leerMisPlanes(userId));
  const [abriendo, setAbriendo] = useState(false);
  const [avisoLimite, setAvisoLimite] = useState<AvisoLimite | null>(null);

  const lista = planes.data ?? [];
  // Un toque doble rápido no abre el detalle dos veces.
  const abrirPlan = useAccionUnica((id: string) =>
    navegar.push({ pathname: '/detalle-plan/[id]', params: { id } }),
  );
  const todasOcupadas = lista.length >= AREAS.length;

  // Los planes se ganan (fase 5): 1 más 1 por subida. Sin un plan disponible se explica cómo ganar
  // otro y no se abre el formulario. Si la revisión falla, se abre igual.
  const crear = async () => {
    setAbriendo(true);
    try {
      const cupo = await cupoPlanes(userId).catch(() => null);
      if (cupo?.alcanzado && cupo.limite !== null) {
        setAvisoLimite({ motivo: 'plan', limite: cupo.limite });
        return;
      }
      const globales = await leerGlobalesFormulario(userId);
      useOnboardingStore.getState().prepararNuevoPlan(
        userId,
        globales,
        lista.map((p) => p.area),
      );
      usePlanReviewStore.getState().limpiar();
      navegar.push({ pathname: '/plan-nuevo/[paso]', params: { paso: '1' } });
    } finally {
      setAbriendo(false);
    }
  };

  if (planes.cargando && !planes.data) {
    return <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />;
  }

  return (
    <View className="gap-3">
      {lista.length === 0 ? <AppText tone="ink-soft">{t.vacio}</AppText> : null}

      {lista.map((plan) => {
        const Icono = ICONO_CATEGORIA[plan.area];
        const habitos = plan.habitos.map((h) =>
          h.activo ? h.titulo : formatear(t.enPausa, { titulo: h.titulo }),
        );
        return (
          <Pressable
            key={plan.id}
            accessibilityRole="button"
            accessibilityLabel={[
              formatear(t.verPlan, { area: areas[plan.area] }),
              habitos.length > 0 ? habitos.join(', ') : t.sinHabitos,
            ].join('. ')}
            onPress={() => abrirPlan(plan.id)}
            style={cardShadow}
            className="gap-3 rounded-card bg-campo p-4 active:bg-accent-claro"
          >
            <View className="flex-row items-center gap-3">
              <View
                style={{ backgroundColor: tintes[plan.area] }}
                className="h-10 w-10 items-center justify-center rounded-field"
              >
                <Icono size={22} color={colors.ink} />
              </View>
              {/* Solo el área: la pantalla ya se llama «Mis planes» (critique de Impeccable). */}
              <AppText weight="bold" className="flex-1">
                {areas[plan.area]}
              </AppText>
              <ChevronRight size={22} color={colors.ink} />
            </View>
            <AppText variant="small" tone="ink-soft">
              {habitos.length > 0 ? habitos.join(' · ') : t.sinHabitos}
            </AppText>
          </Pressable>
        );
      })}

      <Button
        variant="secondary"
        label={t.crear}
        icon={<Plus size={20} color={todasOcupadas ? colors['ink-soft'] : colors.ink} />}
        disabled={todasOcupadas}
        loading={abriendo}
        onPress={() => void crear()}
      />
      {todasOcupadas ? (
        <AppText variant="small" tone="ink-soft" className="text-center">
          {t.todasOcupadas}
        </AppText>
      ) : (
        <AppText variant="small" tone="ink-soft" className="text-center">
          {t.necesitaConexion}
        </AppText>
      )}
      <LimiteHabitosDialog aviso={avisoLimite} onCerrar={() => setAvisoLimite(null)} />
    </View>
  );
}
