import type { Respuestas } from '@/schemas/onboarding';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

// Datos de prueba compartidos por las pruebas de la revisión y el guardado del plan.

export const RESPUESTAS: Respuestas = {
  areas: ['salud_fisica', 'social'],
  objetivos: ['mover_mas', 'tiempo_de_calidad'],
  historial: 'mantiene',
  tiempo: '20_40',
  momento: 'manana',
  obstaculo: 'olvido',
  acompanamiento: 'recordatorio_suave',
};

export function habito(cambios: Partial<HabitoPlan> = {}): HabitoPlan {
  return {
    objetivo: 'mover_mas',
    categoria: 'salud_fisica',
    nivel: 2,
    variante: 'base',
    titulo: 'Caminar 15 min',
    descripcion: null,
    duracion_min: 15,
    usa_duracion_reducida: false,
    dias_semana: [1, 2, 3, 4, 5],
    hora: '08:00',
    flexible: false,
    notificar: true,
    ...cambios,
  };
}

export const BORRADOR: BorradorPlan = {
  origen: 'ia',
  resumen: 'Empezamos ligero.',
  habitos: [
    habito(),
    habito({
      objetivo: 'tiempo_de_calidad',
      categoria: 'social',
      nivel: 1,
      titulo: '5 min con alguien',
      duracion_min: 5,
      dias_semana: [1, 3, 5],
    }),
  ],
  ajustes: {
    presupuesto_min: 40,
    estilo_notificaciones: 'recordatorio_suave',
    estrategias: ['olvido'],
    segundo_aviso: true,
  },
  alternativas: {
    mover_mas: [habito({ nivel: 1, titulo: 'Caminar 5 min', duracion_min: 5 })],
    tiempo_de_calidad: [],
  },
  ventana_flexible: { inicio: '17:00', fin: '20:00' },
};
