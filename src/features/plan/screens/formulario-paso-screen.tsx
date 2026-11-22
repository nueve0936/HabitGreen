import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
  totalPasos,
  type Borrador,
  type Paso,
  maxObjetivos,
} from '@/features/onboarding/domain/form-rules';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { useRutasPlan } from '@/features/plan/use-rutas-plan';
import { es } from '@/i18n/es';
import { navegar } from '@/lib/navegar';

// Formulario (SDD 5.1): una pregunta por pantalla. Cada paso es una entrada de la pila de
// navegación, así que «atrás» regresa al paso anterior y las respuestas siguen en el almacén. En la
// bienvenida, el paso visible se guarda para volver a él si se cierra la app. Un plan siguiente
// (Perfil → Mis planes) solo tiene 3 pasos: área, objetivos e historial.

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
  const rutas = useRutasPlan();
  const adicional = useOnboardingStore((s) => s.adicional);
  const lugares = useOnboardingStore((s) => s.lugares);
  const total = totalPasos(adicional);
  const paso = Math.min(leerPaso(useLocalSearchParams<{ paso: string }>().paso), total) as Paso;
  const borrador = useOnboardingStore((s) => s.borrador);
  const marcarRetomar = useOnboardingStore((s) => s.marcarRetomar);
  useFocusEffect(
    useCallback(() => {
      if (!rutas.enApp) marcarRetomar({ pantalla: 'formulario', paso });
    }, [marcarRetomar, paso, rutas.enApp]),
  );

  const pregunta =
    paso === 1 && adicional ? t.preguntas.areasNuevoPlan : t.preguntas[CAMPO_POR_PASO[paso]];
  const esUltimo = paso === total;

  const continuar = () => {
    navegar.push(esUltimo ? rutas.generando : rutas.paso(paso + 1));
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
          <ProgressSteps current={paso} total={total} />
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
            {paso === 2 && maxObjetivos(lugares) === 1
              ? t.preguntas.objetivos.ayudaUno
              : pregunta.ayuda}
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
