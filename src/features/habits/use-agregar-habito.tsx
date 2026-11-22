import { useState } from 'react';

import { cupoHabitos } from '@/db/limits-repository';
import { useSession } from '@/features/auth/session-context';
import type { Area } from '@/schemas/onboarding';
import { navegar } from '@/lib/navegar';

import { type AvisoLimite, LimiteHabitosDialog } from './components/limite-habitos-dialog';

// «+» de Hábitos y «Agregar hábito» de los detalles de una planta. Antes de abrir el asistente se
// revisa el cupo total de hábitos (plan y propios juntos; sin planes no hay límite); si ya llegó, se
// explica con un diálogo. Si la revisión falla, se abre el asistente igual: el límite no
// debe bloquear por un error.

export function useAgregarHabito() {
  const { session } = useSession();
  const [aviso, setAviso] = useState<AvisoLimite | null>(null);

  const abrir = async (categoria?: Area) => {
    const userId = session?.user.id;
    if (userId) {
      const cupo = await cupoHabitos(userId).catch(() => null);
      if (cupo?.alcanzado && cupo.limite !== null) {
        setAviso({ motivo: 'crear', limite: cupo.limite });
        return;
      }
    }
    if (categoria) navegar.push({ pathname: '/habit/nuevo', params: { categoria } });
    else navegar.push('/habit/nuevo');
  };

  const dialogo = <LimiteHabitosDialog aviso={aviso} onCerrar={() => setAviso(null)} />;
  return { abrir, dialogo };
}
