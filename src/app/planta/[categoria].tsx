import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Snackbar } from '@/components/ui/snackbar';
import { StableBoldText } from '@/components/ui/stable-bold-text';
import { leerHabitos } from '@/db/habits-repository';
import { equiparAccesorio, leerJardin, type Accesorio } from '@/db/rewards-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { HabitCheckCard } from '@/features/habits/components/habit-check-card';
import { useAgregarHabito } from '@/features/habits/use-agregar-habito';
import { useHabitActions } from '@/features/habits/use-habit-actions';
import { ObjectGrid, TIPOS_OBJETO } from '@/features/rewards/components/object-grid';
import { PhaseCarousel } from '@/features/rewards/components/phase-carousel';
import type { TipoAccesorio } from '@/features/rewards/domain/equipar';
import { es, formatear } from '@/i18n/es';
import { AREAS, type Area } from '@/schemas/onboarding';
import { colors } from '@/theme';

// Detalles de la planta (SDD 9.4, mockups «Detalles #1», «#2» y «#2.1»): la planta en sus 3 fases y un
// panel con Hábitos y Objetos, que cambia tocando o deslizando. Equipar es instantáneo y funciona sin
// conexión: se guarda en el teléfono y se sube al sincronizar.

// Con letra muy grande o una pantalla baja, la parte fija dejaría sin espacio al panel: entonces se
// desplaza toda la pantalla (guía de UX/UI, sección 6).
const ESCALA_MAXIMA_FIJA = 1.5;
const ALTO_MINIMO_FIJO = 640;
const PROPORCION_PLANTA = 0.27;
const PROPORCION_ANCHO = 0.6;
const PROPORCION_PANEL = 0.8;

const PAGINA_OBJETOS = 1;
// Los avisos flotan sobre las pestañas de tipo de Objetos y la barra del sistema.
const MARGEN_AVISO = 72;

type Aviso = { tipo: 'exito' | 'error'; texto: string };

export default function PlantaScreen() {
  const t = es.planta;
  const params = useLocalSearchParams<{
    categoria: string;
    pestana?: string;
    tipo?: string;
    llegada?: string;
    puesto?: string;
    quitado?: string;
  }>();
  const area = (AREAS as readonly string[]).includes(params.categoria)
    ? (params.categoria as Area)
    : null;
  const paginaPedida = params.pestana === 'objetos' ? PAGINA_OBJETOS : 0;
  const tipoPedido = TIPOS_OBJETO.find((opcion) => opcion === params.tipo);

  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const jardin = useLocalQuery(`jardin-${userId}`, () => leerJardin(userId));
  const habitos = useLocalQuery('habitos', leerHabitos);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const margenAviso = insets.bottom + MARGEN_AVISO;
  const acciones = useHabitActions(userId, margenAviso);
  const agregar = useAgregarHabito();
  const reducirMovimiento = useReducedMotion();

  const panel = useRef<PagerView>(null);
  const [pagina, setPagina] = useState(paginaPedida);
  const [tipo, setTipo] = useState<TipoAccesorio>(tipoPedido ?? 'sombrero');
  // «Equipar ahora» reemplazó a otro objeto de la planta: se avisa al llegar, sin pedir confirmación.
  const avisoReemplazo = (): Aviso | null =>
    params.quitado && params.puesto
      ? {
          tipo: 'exito',
          texto: formatear(t.reemplazado, { nuevo: params.puesto, anterior: params.quitado }),
        }
      : null;
  const [aviso, setAviso] = useState<Aviso | null>(avisoReemplazo);

  // Al regresar desde la Tienda con «Equipar ahora», la pantalla ya abierta recibe parámetros nuevos.
  const llegada = `${params.pestana}|${params.tipo}|${params.llegada}`;
  const [llegadaVista, setLlegadaVista] = useState(llegada);
  if (llegada !== llegadaVista) {
    setLlegadaVista(llegada);
    if (params.pestana === 'objetos') setPagina(PAGINA_OBJETOS);
    if (tipoPedido) setTipo(tipoPedido);
    const reemplazo = avisoReemplazo();
    if (reemplazo) setAviso(reemplazo);
  }

  useEffect(() => {
    if (reducirMovimiento) panel.current?.setPageWithoutAnimation(pagina);
    else panel.current?.setPage(pagina);
  }, [pagina, reducirMovimiento]);

  const planta = jardin.data?.plantas.find((p) => p.area === area);
  const lista = (habitos.data ?? []).filter((h) => h.categoria === area);
  const todoDesplazable = fontScale >= ESCALA_MAXIMA_FIJA || height < ALTO_MINIMO_FIJO;
  const tamanoPlanta = Math.min(height * PROPORCION_PLANTA, width * PROPORCION_ANCHO);

  const equipar = async (accesorio: Accesorio) => {
    if (!planta || !area) return;
    // Tocar el que lleva esta planta se lo quita; cualquier otro se lo pone, aunque otra planta
    // también lo lleve.
    const puesto = accesorio.categoriasEquipadas.includes(planta.categoryId);
    setAviso(null);
    try {
      await equiparAccesorio(userId, accesorio, planta.categoryId, !puesto);
    } catch {
      setAviso({ tipo: 'error', texto: t.error });
    }
  };

  if (!area || !planta) {
    return (
      <View className="flex-1 bg-bg">
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View className="flex-1 gap-6 px-8 pt-2">
            <View className="-ml-4">
              <BackButton />
            </View>
            {jardin.cargando && !jardin.data ? (
              <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
            ) : (
              <Alert variant="error" message={es.jardin.error} />
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const nombreArea = es.onboarding.formulario.areas[area];

  const parteSuperior = (
    <View>
      <View className="z-10 px-4">
        <BackButton />
      </View>
      <PhaseCarousel planta={planta} tamano={tamanoPlanta}>
        <View className="items-center px-8 pt-2">
          <AppText variant="h2" className="text-center">
            {nombreArea}
          </AppText>
        </View>
      </PhaseCarousel>
    </View>
  );

  const pestanas = [t.pestanaHabitos, t.pestanaObjetos];

  const panelInferior = (
    <View
      style={todoDesplazable ? { height: height * PROPORCION_PANEL } : undefined}
      className={`rounded-t-card bg-campo pt-2 ${todoDesplazable ? '' : 'flex-1'}`}
    >
      <View accessibilityRole="tablist" className="flex-row px-5">
        {pestanas.map((etiqueta, i) => {
          const activa = pagina === i;
          return (
            <Pressable
              key={etiqueta}
              accessibilityRole="tab"
              accessibilityLabel={etiqueta}
              accessibilityState={{ selected: activa }}
              onPress={() => setPagina(i)}
              className="min-h-12 flex-1 items-center justify-center"
            >
              <View className="items-center gap-1">
                <StableBoldText bold={activa}>{etiqueta}</StableBoldText>
                {/* La `key` la vuelve a montar: en Android, cambiar solo el fondo no siempre se pinta. */}
                <View
                  key={activa ? 'activa' : 'inactiva'}
                  className={`h-1 self-stretch rounded-chip ${activa ? 'bg-accent' : ''}`}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      <PagerView
        ref={panel}
        initialPage={paginaPedida}
        onPageSelected={(e) => setPagina(e.nativeEvent.position)}
        style={{ flex: 1 }}
      >
        <View key="habitos" className="flex-1">
          <ScrollView
            nestedScrollEnabled
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            contentContainerClassName="grow gap-3 px-5 pt-2"
          >
            {habitos.cargando && !habitos.data ? (
              <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
            ) : lista.length === 0 ? (
              <View className="flex-1 items-center justify-center gap-4 py-6">
                <AppText tone="ink-soft" className="text-center">
                  {es.jardin.sinHabitos}
                </AppText>
                <Button
                  label={es.habitos.agregar}
                  onPress={() => void agregar.abrir(area ?? undefined)}
                />
              </View>
            ) : (
              lista.map((item) => (
                <HabitCheckCard key={item.habito.id} {...acciones.propsTarjeta(item)} />
              ))
            )}
          </ScrollView>
        </View>

        <View key="objetos" className="flex-1">
          <ObjectGrid
            planta={planta}
            plantas={jardin.data?.plantas ?? []}
            accesorios={jardin.data?.accesorios ?? []}
            tipo={tipo}
            onCambiarTipo={setTipo}
            onTocar={(a) => void equipar(a)}
            onIrATienda={() => router.push({ pathname: '/tienda', params: { desde: area } })}
            margenInferior={insets.bottom}
          />
        </View>
      </PagerView>
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {todoDesplazable ? (
          <ScrollView nestedScrollEnabled>
            {parteSuperior}
            {panelInferior}
          </ScrollView>
        ) : (
          <>
            {parteSuperior}
            {panelInferior}
          </>
        )}
      </SafeAreaView>
      {acciones.capas}
      {acciones.aviso}
      {agregar.dialogo}
      <Snackbar
        mensaje={aviso?.texto ?? null}
        variant={aviso?.tipo}
        margenInferior={margenAviso}
        onCerrar={() => setAviso(null)}
      />
    </View>
  );
}
