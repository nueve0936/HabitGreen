import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import {
  archivarHabito,
  cambiarActivo,
  leerHabitos,
  type HabitoConHorario,
} from '@/db/habits-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { ICONO_CATEGORIA } from '@/features/habits/categoria-icono';
import { HabitListCard } from '@/features/habits/components/habit-list-card';
import { HabitMenu } from '@/features/habits/components/habit-menu';
import { confirmarArchivar } from '@/features/habits/confirmar-archivar';
import { es } from '@/i18n/es';
import { AREAS, type Area } from '@/schemas/onboarding';
import { colors } from '@/theme';

// Hábitos (SDD 9.4): lista agrupada por categoría con chips de filtro y el botón «+» como único
// CTA coral. El check-in vive solo en Hoy; aquí se crean, editan, pausan y eliminan.

export default function HabitosScreen() {
  const t = es.habitos;
  const areas = es.onboarding.formulario.areas;
  const habitos = useLocalQuery('habitos', leerHabitos);
  const [filtro, setFiltro] = useState<Area | null>(null);
  const [menu, setMenu] = useState<HabitoConHorario | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);

  const lista = habitos.data ?? [];
  const conHabitos = AREAS.filter((a) => lista.some((h) => h.categoria === a));
  // Si se filtró una categoría que se quedó sin hábitos, se vuelve a «Todas».
  const filtroActivo = filtro !== null && conHabitos.includes(filtro) ? filtro : null;
  const secciones = (filtroActivo ? [filtroActivo] : conHabitos).map((area) => ({
    area,
    items: lista.filter((h) => h.categoria === area),
  }));

  const guardar = async (accion: () => Promise<void>) => {
    setErrorGuardar(false);
    try {
      await accion();
    } catch {
      setErrorGuardar(true);
    }
  };

  const editar = (id: string) => router.push({ pathname: '/habit/[id]', params: { id } });

  return (
    <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <AppText variant="h1">{es.tabs.habitos}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.agregar}
          onPress={() => router.push('/habit/nuevo')}
          className="h-12 w-12 items-center justify-center rounded-chip border-2 border-ink bg-accent active:bg-accent-oscuro"
        >
          <Plus size={26} color={colors.ink} strokeWidth={2.5} />
        </Pressable>
      </View>

      {errorGuardar ? <Alert variant="error" message={t.errorGuardar} /> : null}

      {habitos.cargando && !habitos.data ? (
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      ) : habitos.error && !habitos.data ? (
        <View className="gap-4">
          <Alert variant="error" message={t.error} />
          <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
        </View>
      ) : lista.length === 0 ? (
        <AppText tone="ink-soft" className="text-center">
          {t.vacio}
        </AppText>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-8"
            contentContainerClassName="gap-2 px-8"
          >
            <FilterChip
              label={t.todas}
              selected={filtroActivo === null}
              onPress={() => setFiltro(null)}
            />
            {conHabitos.map((area) => (
              <FilterChip
                key={area}
                label={areas[area]}
                selected={filtroActivo === area}
                onPress={() => setFiltro(area)}
              />
            ))}
          </ScrollView>

          {secciones.map(({ area, items }) => {
            const Icono = ICONO_CATEGORIA[area];
            return (
              <View key={area} className="gap-3">
                <View className="flex-row items-center gap-2" accessibilityRole="header">
                  <Icono size={22} color={colors.ink} />
                  <AppText variant="h3">{areas[area]}</AppText>
                </View>
                {items.map((item) => (
                  <HabitListCard
                    key={item.habito.id}
                    item={item}
                    onPress={() => editar(item.habito.id)}
                    onOpciones={() => setMenu(item)}
                  />
                ))}
              </View>
            );
          })}
        </>
      )}

      <HabitMenu
        titulo={menu?.habito.titulo ?? null}
        activo={menu?.habito.activo ?? true}
        onCerrar={() => setMenu(null)}
        onEditar={() => {
          const id = menu?.habito.id;
          setMenu(null);
          if (id) editar(id);
        }}
        onCambiarActivo={() => {
          const habito = menu?.habito;
          setMenu(null);
          if (habito) void guardar(() => cambiarActivo(habito.id, !habito.activo));
        }}
        onEliminar={() => {
          const id = menu?.habito.id;
          setMenu(null);
          if (id) confirmarArchivar(() => void guardar(() => archivarHabito(id)));
        }}
      />
    </Screen>
  );
}
