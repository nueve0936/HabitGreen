import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { guardarPlan } from '@/db/plan-repository';
import { useSession } from '@/features/auth/session-context';
import { respuestasCompletas } from '@/features/onboarding/domain/form-rules';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { PlanHabitCard } from '@/features/plan/components/plan-habit-card';
import { SecondNoticeToggle } from '@/features/plan/components/second-notice-toggle';
import {
  fechaDesdeHora,
  horaDesdeFecha,
  muestraNotaApoyo,
  muestraSegundoAviso,
  puedeBajarNivel,
  puedeQuitar,
} from '@/features/plan/domain/plan-review';
import { usePlanReviewStore } from '@/features/plan/plan-review-store';
import { es } from '@/i18n/es';
import type { HabitoPlan } from '@/schemas/plan';

// «Revisión del plan» (SDD 5.8 y 9.4). El usuario ajusta el borrador y al pulsar «Empezar» se
// guarda todo. Si sale de aquí sin confirmar, no queda nada guardado.
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

  const cambiarHora = (habito: HabitoPlan) => {
    DateTimePickerAndroid.open({
      value: fechaDesdeHora(habito.hora ?? borrador.ventana_flexible.inicio),
      mode: 'time',
      is24Hour: true,
      onValueChange: (_evento, fecha) =>
        acciones.cambiarHora(habito.objetivo, horaDesdeFecha(fecha)),
    });
  };

  const empezar = async () => {
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

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="-ml-4">
        <BackButton />
      </View>

      <View className="gap-2">
        <AppText variant="h2" className="text-center">
          {t.titulo}
        </AppText>
        <AppText tone="ink-soft" className="text-center">
          {borrador.resumen ?? t.resumenCatalogo}
        </AppText>
      </View>

      <View className="gap-4">
        {borrador.habitos.map((habito) => (
          <PlanHabitCard
            key={habito.objetivo}
            habito={habito}
            ventana={borrador.ventana_flexible}
            puedeBajar={puedeBajarNivel(borrador, habito.objetivo)}
            puedeQuitar={puedeQuitar(borrador)}
            onCambiarHora={() => cambiarHora(habito)}
            onBajarNivel={() => acciones.bajarNivel(habito.objetivo)}
            onQuitar={() => acciones.quitar(habito.objetivo)}
          />
        ))}
      </View>

      {muestraSegundoAviso(respuestas) ? (
        <SecondNoticeToggle
          value={borrador.ajustes.segundo_aviso}
          onChange={acciones.cambiarSegundoAviso}
        />
      ) : null}

      {muestraNotaApoyo(borrador) ? <Alert variant="info" message={t.apoyoProfesional} /> : null}
      {error ? <Alert variant="error" message={t.errorGuardar} /> : null}

      <Button label={t.empezar} loading={guardando} onPress={empezar} className="mt-auto" />
    </Screen>
  );
}
