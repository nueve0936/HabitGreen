import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { generarBorrador } from '@/db/plan-repository';
import { respuestasCompletas } from '@/features/onboarding/domain/form-rules';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { GrowingPlant } from '@/features/plan/components/growing-plant';
import { PreparingSteps } from '@/features/plan/components/preparing-steps';
import { usePlanReviewStore } from '@/features/plan/plan-review-store';
import { es } from '@/i18n/es';

// «Generando plan» (SDD 5.8 y 9.4): pide el borrador a generate-plan y pasa a la revisión.
// Sin conexión muestra el mensaje y «Reintentar»; si la IA falla, el servidor ya responde con el
// plan de catálogo, así que aquí solo llegan errores de red o del servidor.

const SEGUNDOS_LENTO = 10;
// Cada paso de la lista se marca cada 1.2 s; el último espera la respuesta del servidor.
const MS_POR_PASO = 1200;
// Pausa breve con todos los pasos marcados antes de pasar a la revisión.
const MS_FINAL = 500;

type Estado = 'cargando' | 'sin_conexion' | 'error';

export default function GenerandoPlanScreen() {
  const t = es.onboarding.generando;
  const borrador = useOnboardingStore((s) => s.borrador);
  const cargarRevision = usePlanReviewStore((s) => s.cargar);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [lento, setLento] = useState(false);
  const [intento, setIntento] = useState(0);
  const [pasosListos, setPasosListos] = useState(0);
  const totalPasos = t.pasos.length;

  const completas = respuestasCompletas(borrador) !== null;

  useEffect(() => {
    const respuestas = respuestasCompletas(borrador);
    if (respuestas === null) return;
    let activo = true;
    const avisoLento = setTimeout(() => {
      if (activo) setLento(true);
    }, SEGUNDOS_LENTO * 1000);
    const avance = setInterval(() => {
      if (activo) setPasosListos((n) => Math.min(n + 1, totalPasos - 1));
    }, MS_POR_PASO);
    let salida: ReturnType<typeof setTimeout> | undefined;

    generarBorrador(respuestas)
      .then((resultado) => {
        if (!activo) return;
        if (resultado.ok) {
          setPasosListos(totalPasos);
          salida = setTimeout(() => {
            cargarRevision(resultado.borrador);
            router.replace('/revision');
          }, MS_FINAL);
        } else {
          setEstado(resultado.motivo);
        }
      })
      .catch(() => {
        if (activo) setEstado('error');
      })
      .finally(() => {
        clearTimeout(avisoLento);
        clearInterval(avance);
      });

    return () => {
      activo = false;
      clearTimeout(avisoLento);
      clearInterval(avance);
      clearTimeout(salida);
    };
  }, [borrador, intento, cargarRevision, totalPasos]);

  if (!completas) {
    return <Redirect href={{ pathname: '/formulario/[paso]', params: { paso: '1' } }} />;
  }

  const reintentar = () => {
    setEstado('cargando');
    setLento(false);
    setPasosListos(0);
    setIntento((n) => n + 1);
  };

  if (estado !== 'cargando') {
    return (
      <Screen scroll contentClassName="gap-6 pt-2">
        <View className="-ml-4">
          <BackButton />
        </View>
        <Alert variant="error" message={estado === 'sin_conexion' ? t.sinConexion : t.error} />
        <Button label={t.reintentar} onPress={reintentar} className="mt-auto" />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="gap-6 pt-2">
      <View className="-ml-4">
        <BackButton />
      </View>
      <View className="flex-1 items-center justify-center gap-6">
        <GrowingPlant label={t.ilustracion} />
        <View accessibilityLiveRegion="polite" className="items-center gap-2">
          <AppText variant="h2" tone="texto-naranja" className="text-center">
            {t.preparando}
          </AppText>
          <AppText className="text-center">{t.descripcion}</AppText>
          {lento ? (
            <AppText tone="ink-soft" className="text-center">
              {t.lento}
            </AppText>
          ) : null}
        </View>
        <PreparingSteps listos={pasosListos} />
      </View>
    </Screen>
  );
}
