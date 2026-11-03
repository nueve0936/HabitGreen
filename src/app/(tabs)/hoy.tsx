import { router } from 'expo-router';
import { Coins } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import { leerHoy, type HoyLocal } from '@/db/habits-repository';
import { completarHabito, deshacerHabito } from '@/db/logs-repository';
import { leerAjustesLocales } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { TodayHabitCard } from '@/features/habits/components/today-habit-card';
import { CoinBurst, DURACION_COIN_BURST } from '@/features/rewards/components/coin-burst';
import {
  PhaseCelebration,
  type Celebracion,
} from '@/features/rewards/components/phase-celebration';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

// Hoy (SDD 9.4 y mockup «Inicio»): saludo, monedas y los hábitos de hoy con su check. Todo sale
// de SQLite, así que funciona sin conexión; la sincronización sube los cambios después.
// Al completar: moneda animada, o el mensaje del tope del día, y la celebración si la planta
// cambió de fase (SDD 6.1).

export default function HoyScreen() {
  const t = es.hoy;
  const { session, profile } = useSession();
  const userId = session?.user.id ?? '';
  const hoy = useLocalQuery('hoy', leerHoy);
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);
  const [topeMonedas, setTopeMonedas] = useState(false);
  const [premio, setPremio] = useState<{ clave: number; monedas: number } | null>(null);
  const [celebracion, setCelebracion] = useState<Celebracion | null>(null);

  const cambiar = async (habitId: string, accion: () => Promise<unknown>) => {
    setOcupado(habitId);
    setErrorGuardar(false);
    try {
      await accion();
    } catch {
      setErrorGuardar(true);
    } finally {
      setOcupado(null);
    }
  };

  const saldo = ajustes.data?.saldo ?? 0;
  const fecha = hoy.data?.fecha ?? '';

  // La moneda animada se quita sola al terminar.
  useEffect(() => {
    if (premio === null) return;
    const temporizador = setTimeout(() => setPremio(null), DURACION_COIN_BURST);
    return () => clearTimeout(temporizador);
  }, [premio]);

  const completar = (item: HoyLocal['items'][number]) =>
    cambiar(item.habito.id, async () => {
      const r = await completarHabito(userId, item.habito, fecha);
      if (r === null) return;
      const textos = es.recompensas;
      setTopeMonedas(r.monedas === 0);
      if (r.monedas > 0) {
        setPremio({ clave: Date.now(), monedas: r.monedas });
        AccessibilityInfo.announceForAccessibility(
          formatear(textos.hechoMonedas, { n: r.monedas }),
        );
      } else {
        AccessibilityInfo.announceForAccessibility(`${textos.hecho} ${textos.topeMonedas}`);
      }
      if (r.cambioFase !== null && r.cambioFase > 1) {
        setCelebracion({ area: item.categoria, fase: r.cambioFase });
      }
    });

  return (
    <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <AppText variant="h3" className="flex-1">
          {profile?.nombre ? formatear(t.saludo, { nombre: profile.nombre }) : t.saludoSinNombre}
        </AppText>
        <View
          accessible
          accessibilityLabel={formatear(t.monedas, { n: saldo })}
          className="min-h-11 flex-row items-center gap-1"
        >
          <Coins size={22} color={colors['accent-oscuro']} />
          <AppText weight="bold">{saldo}</AppText>
          {premio ? <CoinBurst key={premio.clave} monedas={premio.monedas} /> : null}
        </View>
      </View>

      {hoy.cargando && !hoy.data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        </View>
      ) : hoy.error && !hoy.data ? (
        <View className="gap-4">
          <Alert variant="error" message={t.error} />
          <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
        </View>
      ) : hoy.data && !hoy.data.tieneHabitos ? (
        <View className="flex-1 justify-center gap-4 py-8">
          <AppText variant="h2" className="text-center">
            {t.sinHabitos.titulo}
          </AppText>
          <AppText tone="ink-soft" className="text-center">
            {t.sinHabitos.descripcion}
          </AppText>
          <Button
            label={t.sinHabitos.crear}
            onPress={() => router.push('/habit/nuevo')}
            className="mt-2"
          />
        </View>
      ) : hoy.data ? (
        <>
          <AppText tone="ink-soft" className="text-center">
            {t.frase}
          </AppText>
          <View className="gap-4">
            <AppText variant="h3">{t.pendientes}</AppText>
            {errorGuardar ? <Alert variant="error" message={t.errorGuardar} /> : null}
            {topeMonedas ? <Alert variant="exito" message={es.recompensas.topeMonedas} /> : null}
            {hoy.data.items.length === 0 ? (
              <AppText tone="ink-soft">{t.vacio}</AppText>
            ) : (
              hoy.data.items.map((item) => (
                <TodayHabitCard
                  key={item.habito.id}
                  item={item}
                  ocupado={ocupado === item.habito.id}
                  onCompletar={() => completar(item)}
                  onDeshacer={() =>
                    cambiar(item.habito.id, async () => {
                      setTopeMonedas(false);
                      await deshacerHabito(userId, item.habito, fecha);
                      AccessibilityInfo.announceForAccessibility(es.recompensas.deshecho);
                    })
                  }
                />
              ))
            )}
          </View>
        </>
      ) : null}

      <PhaseCelebration celebracion={celebracion} onCerrar={() => setCelebracion(null)} />
    </Screen>
  );
}
