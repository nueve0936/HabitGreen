import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Snackbar } from '@/components/ui/snackbar';
import {
  archivarHabito,
  cambiarActivo,
  leerCupoHabitos,
  type HabitoConHorario,
} from '@/db/habits-repository';
import { useSession } from '@/features/auth/session-context';
import { es, formatear } from '@/i18n/es';
import { useFechaHoy } from '@/lib/fecha-hoy';
import { navegar } from '@/lib/navegar';

import { PhaseCelebration } from '../rewards/components/phase-celebration';
import type { HabitCheckCardProps } from './components/habit-check-card';
import { HabitMenu, type Ancla, type HabitMenuProps } from './components/habit-menu';
import { LimiteHabitosDialog } from './components/limite-habitos-dialog';
import { useCheckIn } from './use-check-in';

// Lo que se puede hacer con un hábito de una lista: marcarlo y abrir su menú ⋮ (editar, pausar o
// reanudar, eliminar). Lo comparten Hábitos y Detalles de la planta. `capas` va dentro de `Screen` y
// `aviso`, como hermano de `Screen`, para que flote sin desplazarse con la lista. El detalle del
// plan agrega opciones al menú (`extras`) y lo abre desde sus propias filas (`abrirMenu`).

export type OpcionesAcciones = {
  /** Opciones extra del menú ⋮ para un hábito, después de Editar. */
  extras?: (item: HabitoConHorario) => NonNullable<HabitMenuProps['extras']>;
};

export function useHabitActions(
  userId: string,
  margenAviso?: number,
  opciones: OpcionesAcciones = {},
) {
  const t = es.habitos;
  const checkIn = useCheckIn(userId);
  const [menu, setMenu] = useState<{ item: HabitoConHorario; ancla: Ancla } | null>(null);
  const [eliminando, setEliminando] = useState<HabitoConHorario | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);
  // Límite alcanzado al intentar reanudar un hábito en pausa (usuario guiado).
  const [limite, setLimite] = useState<number | null>(null);
  const modo = useSession().profile?.modo ?? null;
  // Al cambiar el día, el menú y la confirmación de eliminar muestran datos de ayer: se cierran.
  const fecha = useFechaHoy((s) => s.fecha);
  const [fechaVista, setFechaVista] = useState(fecha);
  if (fechaVista !== fecha) {
    setFechaVista(fecha);
    setMenu(null);
    setEliminando(null);
  }

  const guardar = async (accion: () => Promise<void>) => {
    setErrorGuardar(false);
    try {
      await accion();
    } catch {
      setErrorGuardar(true);
    }
  };

  // Pausar libera un lugar y no se revisa. Reanudar respeta el límite de hábitos activos (el mismo
  // de «+»): si ya se llegó, se explica y el hábito sigue en pausa. Si la revisión falla, se reanuda.
  const cambiarActivoConLimite = async (habito: { id: string; activo: boolean }) => {
    if (!habito.activo) {
      const cupo = await leerCupoHabitos(userId, modo).catch(() => null);
      if (cupo?.alcanzado) {
        setLimite(cupo.limite);
        return;
      }
    }
    await guardar(() => cambiarActivo(habito.id, !habito.activo));
  };

  const editar = (id: string) => navegar.push({ pathname: '/habit/[id]', params: { id } });

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
          if (habito) void cambiarActivoConLimite(habito);
        }}
        onEliminar={() => {
          setEliminando(menu?.item ?? null);
          setMenu(null);
        }}
        extras={(menu && opciones.extras ? opciones.extras(menu.item) : []).map((extra) => ({
          ...extra,
          onPress: () => {
            setMenu(null);
            extra.onPress();
          },
        }))}
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

      <LimiteHabitosDialog motivo="reanudar" limite={limite} onCerrar={() => setLimite(null)} />

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

  return {
    propsTarjeta,
    capas,
    aviso,
    /** Abre el menú ⋮ de un hábito desde una fila propia (detalle del plan). */
    abrirMenu: (item: HabitoConHorario, ancla: Ancla) => setMenu({ item, ancla }),
    /** Id del hábito con el menú abierto, o null. */
    menuAbiertoDe: menu?.item.habito.id ?? null,
  };
}
