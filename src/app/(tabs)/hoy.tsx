import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Coins } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, useWindowDimensions, View } from 'react-native';

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
// avance de los hábitos de hoy y sus tarjetas con casilla. De la barra hacia arriba queda fijo y
// solo se desplazan los hábitos. Todo sale de SQLite, así que funciona sin conexión; la
// sincronización sube los cambios después. Al completar: moneda animada, o el aviso de por qué no
// dio monedas, y la celebración si la planta cambió de fase (SDD 6.1).

// Con letra muy grande o una pantalla baja, la parte fija dejaría sin espacio a la lista: entonces
// se desplaza toda la pantalla (guía de UX/UI, sección 6).
const ESCALA_MAXIMA_FIJA = 1.5;
const ALTO_MINIMO_FIJO = 640;

export default function HoyScreen() {
  const t = es.hoy;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const hoy = useLocalQuery('hoy', leerHoy);
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const checkIn = useCheckIn(userId);
  const { height, fontScale } = useWindowDimensions();
  const todoDesplazable = fontScale >= ESCALA_MAXIMA_FIJA || height < ALTO_MINIMO_FIJO;

  const saldo = ajustes.data?.saldo ?? 0;
  const items = hoy.data?.items ?? [];
  const hechos = items.filter((i) => i.hecho).length;
  const avance = items.length === 0 ? 0 : (hechos / items.length) * 100;

  const encabezado = (
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
  );

  const parteFija = (
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
      </View>
    </>
  );

  const lista = (
    <>
      {checkIn.error ? <Alert variant="error" message={checkIn.error} /> : null}
      {checkIn.aviso ? <Alert variant="exito" message={checkIn.aviso} /> : null}
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
    </>
  );

  const celebracion = (
    <PhaseCelebration celebracion={checkIn.celebracion} onCerrar={checkIn.cerrarCelebracion} />
  );

  if (hoy.cargando && !hoy.data) {
    return (
      <Screen edges={['top']} contentClassName="gap-6 pt-6">
        {encabezado}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        </View>
      </Screen>
    );
  }

  if (hoy.error && !hoy.data) {
    return (
      <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
        {encabezado}
        <View className="gap-4">
          <Alert variant="error" message={t.error} />
          <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
        </View>
      </Screen>
    );
  }

  if (hoy.data && !hoy.data.tieneHabitos) {
    return (
      <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
        {encabezado}
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
      </Screen>
    );
  }

  if (todoDesplazable) {
    return (
      <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
        {encabezado}
        {parteFija}
        <View className="gap-3">{lista}</View>
        {celebracion}
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} contentClassName="gap-4 pt-6">
      {encabezado}
      {parteFija}
      {/* Márgenes negativos: la sombra de las tarjetas no se corta en los bordes de la lista. */}
      <ScrollView
        className="-mx-8 flex-1"
        contentContainerClassName="gap-3 px-8 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
      >
        {lista}
      </ScrollView>
      {celebracion}
    </Screen>
  );
}
