import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Coins } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import { leerHoy } from '@/db/habits-repository';
import { leerAjustesLocales } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { HabitCheckCard } from '@/features/habits/components/habit-check-card';
import { useCheckIn } from '@/features/habits/use-check-in';
import { CoinBurst } from '@/features/rewards/components/coin-burst';
import { PhaseCelebration } from '@/features/rewards/components/phase-celebration';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

// Hoy (SDD 9.4 y mockup «Pantalla Dashboard»): monedas, la ilustración (provisional), la barra de
// avance de los hábitos de hoy y sus tarjetas con casilla. Todo sale de SQLite, así que funciona
// sin conexión; la sincronización sube los cambios después. Al completar: moneda animada, o el
// mensaje del tope del día, y la celebración si la planta cambió de fase (SDD 6.1).

export default function HoyScreen() {
  const t = es.hoy;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const hoy = useLocalQuery('hoy', leerHoy);
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const checkIn = useCheckIn(userId);

  const saldo = ajustes.data?.saldo ?? 0;
  const items = hoy.data?.items ?? [];
  const hechos = items.filter((i) => i.hecho).length;
  const avance = items.length === 0 ? 0 : (hechos / items.length) * 100;

  return (
    <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <AppText variant="h1">{t.titulo}</AppText>
        <View
          accessible
          accessibilityLabel={formatear(t.monedas, { n: saldo })}
          className="min-h-12 flex-row items-center gap-1"
        >
          <Coins size={22} color={colors['accent-oscuro']} />
          <AppText weight="bold" tone="texto-naranja">
            {saldo.toLocaleString('es-MX')}
          </AppText>
          {checkIn.premio ? (
            <CoinBurst key={checkIn.premio.clave} monedas={checkIn.premio.monedas} />
          ) : null}
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
          <View className="items-center gap-3">
            {/* Ilustración provisional: se reemplaza con el arte final de la app. */}
            <Image
              source={require('../../../assets/illustrations/hoy.png')}
              accessibilityLabel={t.ilustracion}
              contentFit="contain"
              style={{ width: 160, height: 160 }}
            />
            <AppText tone="ink-soft" className="text-center">
              {t.frase}
            </AppText>
          </View>

          <View className="gap-3">
            <View className="flex-row items-end justify-between">
              <AppText weight="bold">{t.pendientes}</AppText>
              {items.length > 0 ? (
                <AppText variant="small" weight="semibold" tone="texto-naranja">
                  {formatear(t.progreso, { n: hechos, total: items.length })}
                </AppText>
              ) : null}
            </View>
            {items.length > 0 ? (
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={formatear(t.progreso, { n: hechos, total: items.length })}
                accessibilityValue={{ min: 0, max: items.length, now: hechos }}
                className="h-4 w-full overflow-hidden rounded-chip bg-surface/30"
              >
                <View style={{ width: `${avance}%` }} className="h-full rounded-chip bg-surface" />
              </View>
            ) : null}

            {checkIn.error ? <Alert variant="error" message={t.errorGuardar} /> : null}
            {checkIn.topeMonedas ? (
              <Alert variant="exito" message={es.recompensas.topeMonedas} />
            ) : null}

            {items.length === 0 ? (
              <AppText tone="ink-soft">{t.vacio}</AppText>
            ) : (
              items.map((item) => (
                <HabitCheckCard
                  key={item.habito.id}
                  titulo={item.habito.titulo}
                  hora={item.horario.notificar ? item.horario.hora : null}
                  duracionMin={item.habito.duracion_min}
                  hecho={item.hecho}
                  marcable
                  ocupado={checkIn.ocupado === item.habito.id}
                  onAlternar={() =>
                    checkIn.alternar({ ...item.habito, categoria: item.categoria }, item.hecho)
                  }
                />
              ))
            )}
          </View>
        </>
      ) : null}

      <PhaseCelebration celebracion={checkIn.celebracion} onCerrar={checkIn.cerrarCelebracion} />
    </Screen>
  );
}
