import { Redirect, router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { guardarPlan } from '@/db/plan-repository';
import { useSession } from '@/features/auth/session-context';
import { respuestasCompletas } from '@/features/onboarding/domain/form-rules';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { EditPlanHabitSheet } from '@/features/plan/components/edit-plan-habit-sheet';
import { PlanHabitCard } from '@/features/plan/components/plan-habit-card';
import { SecondNoticeToggle } from '@/features/plan/components/second-notice-toggle';
import {
  muestraNotaApoyo,
  muestraSegundoAviso,
  puedeAgregar,
  puedeQuitar,
  sugerenciasDisponibles,
} from '@/features/plan/domain/plan-review';
import { usePlanReviewStore } from '@/features/plan/plan-review-store';
import { es, formatear } from '@/i18n/es';
import type { HabitoPlan } from '@/schemas/plan';
import { colors } from '@/theme';

// «Tu plan está listo» (SDD 5.8 y 9.4, mockups de la revisión del plan). El usuario edita, quita o
// agrega hábitos (hasta 3) y al pulsar «Confirmar plan» se guarda todo. Si sale de aquí sin
// confirmar, no queda nada guardado.
// El permiso de notificaciones se pide aquí en la Entrega 5 (backlog 5.1).

export default function RevisionPlanScreen() {
  const t = es.onboarding.revision;
  const { session, chooseMode } = useSession();
  const formulario = useOnboardingStore((s) => s.borrador);
  const reiniciarFormulario = useOnboardingStore((s) => s.reiniciar);
  const borrador = usePlanReviewStore((s) => s.borrador);
  const ids = usePlanReviewStore((s) => s.ids);
  const acciones = usePlanReviewStore.getState();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const [editando, setEditando] = useState<HabitoPlan | null>(null);
  const [quitando, setQuitando] = useState<HabitoPlan | null>(null);
  const guardado = useRef(false);

  // Al confirmar, el layout raíz cambia a las pestañas y esta pantalla se desmonta: hasta
  // entonces no se borran el formulario ni el borrador, para no redirigir a mitad del cambio.
  useEffect(
    () => () => {
      if (!guardado.current) return;
      reiniciarFormulario();
      usePlanReviewStore.getState().limpiar();
    },
    [reiniciarFormulario],
  );

  const respuestas = respuestasCompletas(formulario);
  if (borrador === null || ids === null || respuestas === null) {
    return <Redirect href="/plan" />;
  }

  const confirmar = async () => {
    if (session === null) return;
    setGuardando(true);
    setError(false);
    try {
      await guardarPlan(session.user.id, borrador, respuestas, ids);
      guardado.current = true;
      // Guarda el modo y marca el onboarding como completo: el layout lleva a «Hoy».
      await chooseMode('guiado');
    } catch {
      setError(true);
      setGuardando(false);
    }
  };

  const conSugerencias = puedeAgregar(borrador) && sugerenciasDisponibles(borrador).length > 0;

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="-ml-4">
        <BackButton />
      </View>

      <View className="gap-2">
        <AppText variant="h2">{t.titulo}</AppText>
        <AppText tone="ink-soft">{t.subtitulo}</AppText>
      </View>

      <View className="gap-4">
        {borrador.habitos.map((habito) => (
          <PlanHabitCard
            key={habito.objetivo}
            habito={habito}
            ventana={borrador.ventana_flexible}
            acciones={[
              {
                label: t.editar,
                tone: 'surface-oscuro',
                accessibilityLabel: `${t.editar}: ${habito.titulo}`,
                onPress: () => setEditando(habito),
              },
              ...(puedeQuitar(borrador)
                ? [
                    {
                      label: t.quitar,
                      tone: 'peligro' as const,
                      accessibilityLabel: `${t.quitar}: ${habito.titulo}`,
                      onPress: () => setQuitando(habito),
                    },
                  ]
                : []),
            ]}
          />
        ))}
      </View>

      {conSugerencias ? (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.agregarOtro}
            onPress={() => router.push('/sugerencias')}
            className="min-h-14 flex-row items-center justify-center gap-2 rounded-card border-2 border-dashed border-bg-oscuro active:bg-bg-claro"
          >
            <Plus size={20} color={colors.ink} />
            <AppText weight="semibold">{t.agregarOtro}</AppText>
          </Pressable>
          <AppText variant="small" tone="ink-soft" className="text-center">
            {t.maximo}
          </AppText>
        </View>
      ) : null}

      {muestraSegundoAviso(respuestas) ? (
        <SecondNoticeToggle
          value={borrador.ajustes.segundo_aviso}
          onChange={acciones.cambiarSegundoAviso}
        />
      ) : null}

      {muestraNotaApoyo(borrador) ? <Alert variant="info" message={t.apoyoProfesional} /> : null}
      {error ? <Alert variant="error" message={t.errorGuardar} /> : null}

      <View className="mt-auto gap-2">
        <AppText variant="small" tone="ink-soft" className="text-center">
          {t.notaAjuste}
        </AppText>
        <Button label={t.empezar} loading={guardando} onPress={confirmar} />
      </View>

      {editando ? (
        <EditPlanHabitSheet
          habito={editando}
          horaPorDefecto={borrador.ventana_flexible.inicio}
          onCerrar={() => setEditando(null)}
          onGuardar={(cambios) => {
            acciones.editar(editando.objetivo, cambios);
            setEditando(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        visible={quitando !== null}
        tipo="peligro"
        mensaje={formatear(t.quitarConfirmar, { titulo: quitando?.titulo ?? '' })}
        cancelar={t.cancelar}
        confirmar={t.eliminar}
        onCancelar={() => setQuitando(null)}
        onConfirmar={() => {
          if (quitando) acciones.quitar(quitando.objetivo);
          setQuitando(null);
        }}
      />
    </Screen>
  );
}
