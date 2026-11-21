import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Screen } from '@/components/ui/screen';
import { FormQuestion } from '@/features/onboarding/components/form-question';
import {
  leerPaso,
  pasoCompleto,
  TOTAL_PASOS,
  type Borrador,
  type Paso,
} from '@/features/onboarding/domain/form-rules';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { es } from '@/i18n/es';

// Formulario inicial (SDD 5.1): una pregunta por pantalla. Cada paso es una entrada de la pila de
// navegación, así que «atrás» regresa al paso anterior y las respuestas siguen en el almacén. El
// paso visible se guarda para volver a él si se cierra la app.

const CAMPO_POR_PASO = {
  1: 'areas',
  2: 'objetivos',
  3: 'historial',
  4: 'tiempo',
  5: 'momento',
  6: 'obstaculo',
  7: 'acompanamiento',
} as const satisfies Record<Paso, keyof Borrador>;

export default function FormularioPasoScreen() {
  const t = es.onboarding.formulario;
  const paso = leerPaso(useLocalSearchParams<{ paso: string }>().paso);
  const borrador = useOnboardingStore((s) => s.borrador);
  const marcarRetomar = useOnboardingStore((s) => s.marcarRetomar);
  useFocusEffect(
    useCallback(() => marcarRetomar({ pantalla: 'formulario', paso }), [marcarRetomar, paso]),
  );

  const pregunta = t.preguntas[CAMPO_POR_PASO[paso]];
  const esUltimo = paso === TOTAL_PASOS;

  const continuar = () => {
    if (esUltimo) {
      router.push('/plan');
      return;
    }
    router.push({ pathname: '/formulario/[paso]', params: { paso: String(paso + 1) } });
  };

  // Arriba (flecha y avance) y abajo («Siguiente») quedan fijos; solo se desplaza la pregunta
  // (SDD 9.4, decisión del usuario).
  return (
    <Screen contentClassName="gap-4 pt-2 pb-6">
      <View className="flex-row items-center gap-4">
        <View className="-ml-4">
          <BackButton />
        </View>
        <View className="flex-1">
          <ProgressSteps current={paso} total={TOTAL_PASOS} />
        </View>
      </View>

      {/* Márgenes negativos: la sombra de las opciones no se corta en los bordes de la lista. */}
      <ScrollView
        className="-mx-8 flex-1"
        contentContainerClassName="gap-6 px-8 pb-4 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <AppText variant="h2" accessibilityRole="header" className="text-center">
            {pregunta.titulo}
          </AppText>
          <AppText variant="small" tone="ink-soft" className="text-center">
            {pregunta.ayuda}
          </AppText>
        </View>

        <FormQuestion paso={paso} />
      </ScrollView>

      <Button
        label={esUltimo ? t.crearPlan : t.continuar}
        disabled={!pasoCompleto(paso, borrador)}
        onPress={continuar}
      />
    </Screen>
  );
}
