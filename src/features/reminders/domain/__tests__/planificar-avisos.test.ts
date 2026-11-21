import type { Habito, Horario } from '@/features/habits/domain/habitos-del-dia';
import { es } from '@/i18n/es';

import {
  AVISOS_POR_DEFECTO,
  fechaHora,
  HORAS_POR_DEFECTO,
  planificarAvisos,
  type DatosAvisos,
} from '../planificar-avisos';

// Lunes 16 de noviembre de 2026, 07:00 (hora local del teléfono).
const AHORA = new Date(2026, 10, 16, 7, 0);
const TODOS = [1, 2, 3, 4, 5, 6, 7];

function habito(id: string, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    category_id: 'cat',
    plan_id: null,
    titulo: `Hábito ${id}`,
    descripcion: null,
    duracion_min: 10,
    activo: true,
    archivado_en: null,
    ...cambios,
  };
}

function horario(habitId: string, cambios: Partial<Horario> = {}): Horario {
  return {
    id: `h-${habitId}`,
    habit_id: habitId,
    dias_semana: TODOS,
    hora: '08:00',
    flexible: false,
    notificar: true,
    vigente_desde: '2026-11-01',
    vigente_hasta: null,
    ...cambios,
  };
}

function datos(cambios: Partial<DatosAvisos> = {}): DatosAvisos {
  return {
    estilo: 'recordatorio_suave',
    estrategias: [],
    segundoAviso: false,
    horas: HORAS_POR_DEFECTO,
    config: AVISOS_POR_DEFECTO,
    momento: null,
    planes: [],
    habitos: [habito('a')],
    horarios: [horario('a')],
    ocurrencias: [],
    registros: [],
    ...cambios,
  };
}

const sinFin = (avisos: ReturnType<typeof planificarAvisos>) =>
  avisos.filter((a) => a.id !== 'fin-ventana');

describe('planificarAvisos', () => {
  it('recordatorio suave: un aviso por día a la hora del hábito, más la invitación final', () => {
    const avisos = planificarAvisos(datos(), AHORA);
    const delHabito = sinFin(avisos);
    expect(delHabito).toHaveLength(7);
    expect(delHabito[0]?.fecha).toEqual(fechaHora('2026-11-16', '08:00'));
    expect(delHabito[0]?.titulo).toBe('Hábito a');
    expect(delHabito[0]?.cuerpo).toBe('Es un buen momento para tus 10 min.');
    const fin = avisos.at(-1);
    expect(fin?.id).toBe('fin-ventana');
    expect(fin?.titulo).toBe(es.avisos.finTitulo);
    expect(fin?.fecha).toEqual(fechaHora('2026-11-22', '08:01'));
  });

  it('no programa avisos que ya pasaron', () => {
    const avisos = sinFin(planificarAvisos(datos(), new Date(2026, 10, 16, 9, 0)));
    expect(avisos).toHaveLength(6);
    expect(avisos[0]?.fecha).toEqual(fechaHora('2026-11-17', '08:00'));
  });

  it('no avisa un hábito ya hecho hoy', () => {
    const avisos = sinFin(
      planificarAvisos(
        datos({ registros: [{ habit_id: 'a', fecha: '2026-11-16', eliminado_en: null }] }),
        AHORA,
      ),
    );
    expect(avisos[0]?.fecha).toEqual(fechaHora('2026-11-17', '08:00'));
  });

  it('sin recordatorio («Ninguno») no hay avisos ni invitación', () => {
    expect(
      planificarAvisos(
        datos({ horarios: [horario('a', { hora: null, notificar: false })] }),
        AHORA,
      ),
    ).toEqual([]);
  });

  it('estilo mínimo: solo avisan los hábitos con recordatorio', () => {
    const avisos = sinFin(
      planificarAvisos(
        datos({
          estilo: 'minimo',
          habitos: [habito('a'), habito('b')],
          horarios: [horario('a'), horario('b', { hora: null, notificar: false })],
        }),
        AHORA,
      ),
    );
    expect(avisos.every((a) => a.habitId === 'a')).toBe(true);
  });

  it('no avisa hábitos pausados ni archivados', () => {
    expect(
      planificarAvisos(
        datos({
          habitos: [habito('a', { activo: false }), habito('b', { archivado_en: '2026-11-10' })],
          horarios: [horario('a'), horario('b')],
        }),
        AHORA,
      ),
    ).toEqual([]);
  });

  it('segundo aviso: 2 h después, solo hoy y mañana', () => {
    const segundos = planificarAvisos(datos({ segundoAviso: true }), AHORA).filter((a) =>
      a.id.startsWith('segundo'),
    );
    expect(segundos.map((a) => a.fecha)).toEqual([
      fechaHora('2026-11-16', '10:00'),
      fechaHora('2026-11-17', '10:00'),
    ]);
    expect(segundos[0]?.titulo).toBe('¿Un momento para Hábito a?');
  });

  it('el segundo aviso no pasa a la madrugada siguiente', () => {
    const avisos = planificarAvisos(
      datos({ segundoAviso: true, horarios: [horario('a', { hora: '23:00' })] }),
      AHORA,
    );
    expect(avisos.some((a) => a.id.startsWith('segundo'))).toBe(false);
  });

  it('distracción: nunca más de un aviso por hábito al día', () => {
    const avisos = planificarAvisos(
      datos({ segundoAviso: true, estrategias: ['distraccion'] }),
      AHORA,
    );
    expect(avisos.some((a) => a.id.startsWith('segundo'))).toBe(false);
  });

  it('ánimo rotativo: el mensaje de un hábito cambia de un día al siguiente', () => {
    const cuerpos = sinFin(planificarAvisos(datos({ estilo: 'recordatorio_y_animo' }), AHORA)).map(
      (a) => a.cuerpo,
    );
    cuerpos.forEach((cuerpo) => expect(es.avisos.animo).toContain(cuerpo));
    cuerpos.slice(1).forEach((cuerpo, i) => expect(cuerpo).not.toBe(cuerpos[i]));
  });

  it('distracción con ánimo: una sola línea corta', () => {
    const [primero] = planificarAvisos(
      datos({ estilo: 'recordatorio_y_animo', estrategias: ['distraccion'] }),
      AHORA,
    );
    expect(primero?.cuerpo).toMatch(/^10 min y listo\. /);
    expect(es.avisos.animoCorto.some((c) => primero?.cuerpo.endsWith(c))).toBe(true);
  });

  it('momento flexible: a la hora de «Tarde» y 3 h después, el segundo solo hoy y mañana', () => {
    const avisos = sinFin(
      planificarAvisos(datos({ horarios: [horario('a', { hora: null, flexible: true })] }), AHORA),
    );
    expect(avisos.filter((a) => a.id.startsWith('flexible-'))).toHaveLength(7);
    expect(avisos.filter((a) => a.id.startsWith('flexible2-')).map((a) => a.fecha)).toEqual([
      fechaHora('2026-11-16', '20:00'),
      fechaHora('2026-11-17', '20:00'),
    ]);
  });

  it('momento flexible sigue la hora de «Tarde» de Perfil', () => {
    const [primero] = planificarAvisos(
      datos({
        horas: { ...HORAS_POR_DEFECTO, tarde: '16:00' },
        horarios: [horario('a', { hora: null, flexible: true })],
      }),
      AHORA,
    );
    expect(primero?.fecha).toEqual(fechaHora('2026-11-16', '16:00'));
  });

  it('momento flexible con distracción: solo el primer aviso', () => {
    const avisos = planificarAvisos(
      datos({
        estrategias: ['distraccion'],
        horarios: [horario('a', { hora: null, flexible: true })],
      }),
      AHORA,
    );
    expect(avisos.some((a) => a.id.startsWith('flexible2'))).toBe(false);
  });

  it('resumen nocturno: a las 21:00 con los hábitos de mañana', () => {
    const avisos = sinFin(
      planificarAvisos(
        datos({
          estilo: 'resumen_nocturno',
          habitos: [habito('a'), habito('b'), habito('c')],
          horarios: [horario('a'), horario('b'), horario('c', { dias_semana: [3] })],
        }),
        AHORA,
      ),
    );
    expect(avisos.every((a) => a.id.startsWith('resumen'))).toBe(true);
    // El lunes avisa del martes: dos hábitos.
    expect(avisos[0]?.fecha).toEqual(fechaHora('2026-11-16', '21:00'));
    expect(avisos[0]?.titulo).toBe('Mañana te esperan 2 hábitos');
    expect(avisos[0]?.cuerpo).toBe('Hábito a y Hábito b. Descansa bien.');
    // El martes avisa del miércoles: tres.
    expect(avisos[1]?.cuerpo).toBe('Hábito a, Hábito b y Hábito c. Descansa bien.');
  });

  it('resumen nocturno con un solo hábito', () => {
    const [primero] = planificarAvisos(datos({ estilo: 'resumen_nocturno' }), AHORA);
    expect(primero?.titulo).toBe('Mañana te espera un hábito');
  });

  it('olvido con resumen: un aviso al día a la hora del momento', () => {
    const olvidos = planificarAvisos(
      datos({ estilo: 'resumen_nocturno', estrategias: ['olvido'], momento: 'mediodia' }),
      AHORA,
    ).filter((a) => a.id.startsWith('olvido'));
    expect(olvidos).toHaveLength(7);
    expect(olvidos[0]?.fecha).toEqual(fechaHora('2026-11-16', '13:00'));
  });

  it('olvido con resumen y horario variable: a la hora de «Tarde»', () => {
    const [olvido] = planificarAvisos(
      datos({ estilo: 'resumen_nocturno', estrategias: ['olvido'], momento: 'varia' }),
      AHORA,
    ).filter((a) => a.id.startsWith('olvido'));
    expect(olvido?.fecha).toEqual(fechaHora('2026-11-16', '17:00'));
  });

  it('una ocurrencia movida avisa en su nueva fecha y no en la original', () => {
    const avisos = sinFin(
      planificarAvisos(
        datos({
          horarios: [horario('a', { dias_semana: [2] })],
          ocurrencias: [
            {
              habit_id: 'a',
              fecha_original: '2026-11-17',
              fecha_nueva: '2026-11-19',
              estado: 'movida',
            },
          ],
        }),
        AHORA,
      ),
    );
    expect(avisos.map((a) => a.fecha)).toEqual([fechaHora('2026-11-19', '08:00')]);
  });

  it('tope de 60: se recortan los días más lejanos y la invitación cuenta', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `h${i}`);
    const avisos = planificarAvisos(
      datos({ habitos: ids.map((id) => habito(id)), horarios: ids.map((id) => horario(id)) }),
      AHORA,
    );
    expect(avisos).toHaveLength(60);
    const ultimoHabito = sinFin(avisos).at(-1);
    expect(ultimoHabito?.fecha).toEqual(fechaHora('2026-11-21', '08:00'));
  });

  it('apoyo de la semana 3: el lunes, a la hora del momento', () => {
    const apoyo = planificarAvisos(
      datos({
        planes: [{ historial: 'semanas_y_suelta', inicioPlan: '2026-11-02' }],
        momento: 'manana',
      }),
      AHORA,
    ).filter((a) => a.id.startsWith('apoyo'));
    expect(apoyo).toHaveLength(1);
    expect(apoyo[0]?.titulo).toBe(es.avisos.apoyo[3].titulo);
    expect(apoyo[0]?.fecha).toEqual(fechaHora('2026-11-16', '08:00'));
  });

  it('sin apoyo con el estilo mínimo', () => {
    const avisos = planificarAvisos(
      datos({
        estilo: 'minimo',
        planes: [{ historial: 'semanas_y_suelta', inicioPlan: '2026-11-02' }],
      }),
      AHORA,
    );
    expect(avisos.some((a) => a.id.startsWith('apoyo'))).toBe(false);
  });

  it('sin duración definida, los textos no mencionan minutos', () => {
    const sinDuracion = { habitos: [habito('a', { duracion_min: 0 })] };
    const [suave] = planificarAvisos(datos(sinDuracion), AHORA);
    expect(suave?.cuerpo).toBe('Es un buen momento para tu hábito.');
    const [corto] = planificarAvisos(
      datos({ ...sinDuracion, estilo: 'recordatorio_y_animo', estrategias: ['distraccion'] }),
      AHORA,
    );
    expect(es.avisos.animoCorto).toContain(corto?.cuerpo);
  });

  it('una duración de más de una hora se escribe en horas', () => {
    const [primero] = planificarAvisos(
      datos({ habitos: [habito('a', { duracion_min: 85 })] }),
      AHORA,
    );
    expect(primero?.cuerpo).toBe('Es un buen momento para tus 1 h 25 min.');
  });
});
