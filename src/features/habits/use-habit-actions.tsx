import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Snackbar } from '@/components/ui/snackbar';
import { archivarHabito, cambiarActivo, type HabitoConHorario } from '@/db/habits-repository';
import { es, formatear } from '@/i18n/es';

import { PhaseCelebration } from '../rewards/components/phase-celebration';
import type { HabitCheckCardProps } from './components/habit-check-card';
import { HabitMenu, type Ancla } from './components/habit-menu';
import { useCheckIn } from './use-check-in';

// Lo que se puede hacer con un hábito de una lista: marcarlo y abrir su menú ⋮ (editar, pausar o
// reanudar, eliminar). Lo comparten Hábitos y Detalles de la planta. `capas` va dentro de `Screen` y
// `aviso`, como hermano de `Screen`, para que flote sin desplazarse con la lista.

export function useHabitActions(userId: string, margenAviso?: number) {
  const t = es.habitos;
  const checkIn = useCheckIn(userId);
  const [menu, setMenu] = useState<{ item: HabitoConHorario; ancla: Ancla } | null>(null);
  const [eliminando, setEliminando] = useState<HabitoConHorario | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);

  const guardar = async (accion: () => Promise<void>) => {
    setErrorGuardar(false);
    try {
      await accion();
    } catch {
      setErrorGuardar(true);
    }
  };

  const editar = (id: string) => router.push({ pathname: '/habit/[id]', params: { id } });

  const propsTarjeta = (item: HabitoConHorario): HabitCheckCardProps => ({
    titulo: item.habito.titulo,
    hora: item.horario?.notificar ? item.horario.hora : null,
    duracionMin: item.habito.duracion_min,
    hecho: item.hecho,
    marcable: item.programadoHoy,
    enPausa: !item.habito.activo,
    ocupado: checkIn.ocupado === item.habito.id,
    onAlternar: () => checkIn.alternar({ ...item.habito, categoria: item.categoria }, item.hecho),
    onPress: () => editar(item.habito.id),
    onOpciones: (ancla) => setMenu({ item, ancla }),
    menuAbierto: menu?.item.habito.id === item.habito.id,
  });

  const errorActual = checkIn.error ?? (errorGuardar ? t.errorGuardar : null);

  const capas = (
    <>
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
    </>
  );

  const aviso = (
    <Snackbar
      mensaje={errorActual ?? checkIn.aviso}
      variant={errorActual ? 'error' : 'exito'}
      margenInferior={margenAviso}
      onCerrar={() => {
        setErrorGuardar(false);
        checkIn.cerrarAvisos();
      }}
    />
  );

  return { propsTarjeta, capas, aviso };
}
