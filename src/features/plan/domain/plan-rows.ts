import {
  VERSION_FORMULARIO,
  type Area,
  type Objetivo,
  type Respuestas,
} from '@/schemas/onboarding';
import type { BorradorPlan } from '@/schemas/plan';

// Convierte el borrador confirmado en las filas que se guardan al pulsar «Empezar» (SDD 5.8).
// Los UUID vienen de fuera (los genera el cliente, SDD 3.4): si el guardado falla a medias y se
// reintenta, se usan los mismos y no se duplican filas.
// Varios planes por usuario: se guarda un plan por cada área de los hábitos del borrador, con sus
// respuestas de área (objetivos e historial).

export type IdsPlan = {
  /** Plan del área del primer hábito. */
  planId: string;
  /** Planes de las demás áreas del borrador (mientras el formulario permita dos áreas). */
  planesExtra?: Partial<Record<Area, string>>;
  habitos: Partial<Record<Objetivo, { habitId: string; scheduleId: string }>>;
};

export type FilaPlan = {
  id: string;
  user_id: string;
  origen: BorradorPlan['origen'];
  json_plan: BorradorPlan;
  area: Area;
  respuestas: { areas: Area[]; objetivos: Objetivo[]; historial: Respuestas['historial'] };
};

/** Áreas del borrador, en el orden de sus hábitos. */
export function areasDelBorrador(borrador: Pick<BorradorPlan, 'habitos'>): Area[] {
  return [...new Set(borrador.habitos.map((h) => h.categoria))];
}

/** id del plan de cada área: el primero usa `planId`; los demás, `planesExtra`. */
function idDelPlan(ids: IdsPlan, area: Area, primera: Area | undefined): string {
  const id = area === primera ? ids.planId : ids.planesExtra?.[area];
  if (id === undefined) throw new Error(`Falta el id del plan de ${area}`);
  return id;
}

export type FilasPlan = {
  plans: FilaPlan[];
  habits: {
    id: string;
    user_id: string;
    category_id: string;
    plan_id: string;
    objetivo: Objetivo;
    nivel: number;
    usa_duracion_reducida: boolean;
    titulo: string;
    descripcion: string | null;
    duracion_min: number;
  }[];
  schedules: {
    id: string;
    habit_id: string;
    user_id: string;
    dias_semana: number[];
    hora: string | null;
    flexible: boolean;
    notificar: boolean;
    vigente_desde: string;
  }[];
  settings: {
    user_id: string;
    presupuesto_min: number;
    estilo_notificaciones: BorradorPlan['ajustes']['estilo_notificaciones'];
    estrategias: string[];
    segundo_aviso: boolean;
  };
  answers: { user_id: string; respuestas: Respuestas; version_formulario: number };
};

export function filasDelPlan(input: {
  userId: string;
  borrador: BorradorPlan;
  respuestas: Respuestas;
  ids: IdsPlan;
  /** id de cada categoría del sistema, por clave. */
  categorias: Record<Area, string>;
  /** Fecha local de hoy, "YYYY-MM-DD": desde cuándo vale el horario. */
  hoy: string;
  /** Sin permiso de avisos, los hábitos se guardan sin recordatorio (SDD 7.1). */
  conRecordatorios?: boolean;
}): FilasPlan {
  const { userId, borrador, ids } = input;
  const conRecordatorios = input.conRecordatorios ?? true;

  const conIds = borrador.habitos.map((h) => {
    const habitIds = ids.habitos[h.objetivo];
    if (habitIds === undefined) throw new Error(`Faltan los ids del hábito ${h.objetivo}`);
    return { habito: h, ...habitIds };
  });

  const areas = areasDelBorrador(borrador);
  const primera = areas[0];

  return {
    plans: areas.map((area) => ({
      id: idDelPlan(ids, area, primera),
      user_id: userId,
      origen: borrador.origen,
      json_plan: borrador,
      area,
      respuestas: {
        areas: [area],
        objetivos: borrador.habitos.filter((h) => h.categoria === area).map((h) => h.objetivo),
        historial: input.respuestas.historial,
      },
    })),
    habits: conIds.map(({ habito: h, habitId }) => ({
      id: habitId,
      user_id: userId,
      category_id: input.categorias[h.categoria],
      plan_id: idDelPlan(ids, h.categoria, primera),
      objetivo: h.objetivo,
      nivel: h.nivel,
      usa_duracion_reducida: h.usa_duracion_reducida,
      titulo: h.titulo,
      descripcion: h.descripcion,
      duracion_min: h.duracion_min,
    })),
    schedules: conIds.map(({ habito: h, habitId, scheduleId }) => ({
      id: scheduleId,
      habit_id: habitId,
      user_id: userId,
      dias_semana: h.dias_semana,
      hora: conRecordatorios && !h.flexible ? h.hora : null,
      flexible: conRecordatorios && h.flexible,
      notificar: conRecordatorios && h.notificar,
      vigente_desde: input.hoy,
    })),
    settings: {
      user_id: userId,
      presupuesto_min: borrador.ajustes.presupuesto_min,
      estilo_notificaciones: borrador.ajustes.estilo_notificaciones,
      estrategias: borrador.ajustes.estrategias,
      segundo_aviso: borrador.ajustes.segundo_aviso,
    },
    answers: {
      user_id: userId,
      respuestas: input.respuestas,
      version_formulario: VERSION_FORMULARIO,
    },
  };
}

export { fechaLocal } from '@/lib/dates';

/** Ajustes por defecto del modo tradicional (SDD 6.5). */
export function ajustesTradicionales(userId: string, presupuestoPorDefecto: number) {
  return {
    user_id: userId,
    presupuesto_min: presupuestoPorDefecto,
    estilo_notificaciones: 'recordatorio_suave' as const,
    estrategias: [] as string[],
    segundo_aviso: false,
  };
}
