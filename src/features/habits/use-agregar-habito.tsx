import { router } from 'expo-router';
import { useState } from 'react';

import { leerCupoHabitos } from '@/db/habits-repository';
import { useSession } from '@/features/auth/session-context';
import type { Area } from '@/schemas/onboarding';

import { LimiteHabitosDialog } from './components/limite-habitos-dialog';

// «+» de Hábitos y «Agregar hábito» de los detalles de una planta. Antes de abrir el asistente se
// revisa el límite de hábitos del usuario guiado (del plan y propios); si ya llegó, se explica con un diálogo.
// Si la revisión falla, se abre el asistente igual: el límite no debe bloquear por un error.

export function useAgregarHabito() {
  const { session, profile } = useSession();
  const [limite, setLimite] = useState<number | null>(null);

  const abrir = async (categoria?: Area) => {
    const userId = session?.user.id;
    if (userId) {
      const cupo = await leerCupoHabitos(userId, profile?.modo ?? null).catch(() => null);
      if (cupo?.alcanzado) {
        setLimite(cupo.limite);
        return;
      }
    }
    if (categoria) router.push({ pathname: '/habit/nuevo', params: { categoria } });
    else router.push('/habit/nuevo');
  };

  const dialogo = (
    <LimiteHabitosDialog motivo="crear" limite={limite} onCerrar={() => setLimite(null)} />
  );
  return { abrir, dialogo };
}
