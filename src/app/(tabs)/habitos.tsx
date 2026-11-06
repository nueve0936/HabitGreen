import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import {
  archivarHabito,
  cambiarActivo,
  leerHabitos,
  type HabitoConHorario,
} from '@/db/habits-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { ICONO_CATEGORIA } from '@/features/habits/categoria-icono';
import { HabitCheckCard } from '@/features/habits/components/habit-check-card';
import { HabitMenu, type Ancla } from '@/features/habits/components/habit-menu';
import { useCheckIn } from '@/features/habits/use-check-in';
import { PhaseCelebration } from '@/features/rewards/components/phase-celebration';
import { es, formatear } from '@/i18n/es';
import { AREAS } from '@/schemas/onboarding';
import { colors } from '@/theme';

// Hábitos (SDD 9.4 y mockup «Hábitos #1»): una sección por categoría que tenga hábitos, con
// casilla para marcar los que tocan hoy y el menú ⋮ (editar, pausar o reanudar, eliminar). El
// botón «+» es el único CTA coral. Sin filtros por ahora (decisión del usuario).

export default function HabitosScreen() {
  const t = es.habitos;
  const areas = es.onboarding.formulario.areas;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const habitos = useLocalQuery('habitos', leerHabitos);
  const checkIn = useCheckIn(userId);
  const [menu, setMenu] = useState<{ item: HabitoConHorario; ancla: Ancla } | null>(null);
  const [eliminando, setEliminando] = useState<HabitoConHorario | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);

  const lista = habitos.data ?? [];
  const secciones = AREAS.map((area) => ({
    area,
    items: lista.filter((h) => h.categoria === area),
  })).filter((s) => s.items.length > 0);

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
          className="h-12 w-12 items-center justify-center rounded-field border-2 border-ink bg-accent active:bg-accent-oscuro"
        >
          <Plus size={26} color={colors.ink} strokeWidth={2.5} />
        </Pressable>
      </View>

      {errorGuardar ? <Alert variant="error" message={t.errorGuardar} /> : null}
      {checkIn.error ? <Alert variant="error" message={checkIn.error} /> : null}
      {checkIn.aviso ? <Alert variant="exito" message={checkIn.aviso} /> : null}

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
        secciones.map(({ area, items }) => {
          const Icono = ICONO_CATEGORIA[area];
          return (
            <View key={area} className="gap-3">
              <View className="flex-row items-center gap-2" accessibilityRole="header">
                <Icono size={24} color={colors.ink} />
                <AppText variant="h3">{areas[area]}</AppText>
              </View>
              {items.map((item) => (
                <HabitCheckCard
                  key={item.habito.id}
                  titulo={item.habito.titulo}
                  hora={item.horario?.notificar ? item.horario.hora : null}
                  duracionMin={item.habito.duracion_min}
                  hecho={item.hecho}
                  marcable={item.programadoHoy}
                  enPausa={!item.habito.activo}
                  ocupado={checkIn.ocupado === item.habito.id}
                  onAlternar={() =>
                    checkIn.alternar({ ...item.habito, categoria: item.categoria }, item.hecho)
                  }
                  onPress={() => editar(item.habito.id)}
                  onOpciones={(ancla) => setMenu({ item, ancla })}
                  menuAbierto={menu?.item.habito.id === item.habito.id}
                />
              ))}
            </View>
          );
        })
      )}

      <HabitMenu
        ancla={menu?.ancla ?? null}
        activo={menu?.item.habito.activo ?? true}
        onCerrar={() => setMenu(null)}
        onEditar={() => {
          const id = menu?.item.habito.id;
          setMenu(null);
          if (id) editar(id);
        }}
        onCambiarActivo={() => {
          const habito = menu?.item.habito;
          setMenu(null);
          if (habito) void guardar(() => cambiarActivo(habito.id, !habito.activo));
        }}
        onEliminar={() => {
          setEliminando(menu?.item ?? null);
          setMenu(null);
        }}
      />

      <ConfirmDialog
        visible={eliminando !== null}
        tipo="peligro"
        mensaje={[
          formatear(t.eliminar.pregunta, { titulo: eliminando?.habito.titulo ?? '' }),
          eliminando?.hecho ? t.eliminar.devolucion : null,
        ]
          .filter(Boolean)
          .join(' ')}
        cancelar={t.eliminar.cancelar}
        confirmar={t.eliminar.confirmar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={() => {
          const habito = eliminando?.habito;
          setEliminando(null);
          if (habito) void guardar(() => archivarHabito(userId, habito));
        }}
      />

      <PhaseCelebration celebracion={checkIn.celebracion} onCerrar={checkIn.cerrarCelebracion} />
    </Screen>
  );
}
