-- Habit Green: datos semilla (SDD 5.7, 6.1, 6.3, 6.4 y docs/textos.md).
-- Los textos del catálogo y los nombres de los accesorios son provisionales y editables aquí.

-- ---------------------------------------------------------------------------
-- Categorías del sistema (5 fijas del MVP)
-- ---------------------------------------------------------------------------

insert into public.categories (clave, nombre, es_sistema) values
  ('salud_fisica', 'Salud Física', true),
  ('trabajo', 'Trabajo / Estudio', true),
  ('salud_mental', 'Salud Mental', true),
  ('finanzas', 'Finanzas', true),
  ('social', 'Social', true);

-- ---------------------------------------------------------------------------
-- Catálogo de hábitos: 16 objetivos × 3 niveles + variante sin recursos (SDD 5.7)
-- ---------------------------------------------------------------------------

insert into public.habit_catalog
  (objetivo, categoria, nivel, variante, titulo, duracion_min, duracion_reducida_min, dias_semana, momento_fijo, sin_recursos)
values
  ('mover_mas', 'salud_fisica', 1, 'base', 'Caminar 5 min', 5, 2, '{1,2,4,6}', null, true),
  ('mover_mas', 'salud_fisica', 2, 'base', 'Caminar 15 min', 15, 5, '{1,2,3,4,5}', null, true),
  ('mover_mas', 'salud_fisica', 3, 'base', 'Caminar o moverme 30 min', 30, 10, '{1,2,3,4,5}', null, true),
  ('dormir_mejor', 'salud_fisica', 1, 'base', 'Dejar el celular lejos de la cama', 2, 1, '{1,2,4,6}', 'noche', true),
  ('dormir_mejor', 'salud_fisica', 2, 'base', 'Rutina de 10 min antes de dormir', 10, 5, '{1,2,3,4,5}', 'noche', true),
  ('dormir_mejor', 'salud_fisica', 3, 'base', 'Hora fija para acostarme y rutina de 20 min', 20, 10, '{1,2,3,4,5,6}', 'noche', true),
  ('comer_mejor', 'salud_fisica', 1, 'base', 'Sumar una fruta o verdura a una comida', 5, 2, '{1,2,4,6}', null, true),
  ('comer_mejor', 'salud_fisica', 2, 'base', 'Planear mis comidas del día', 10, 5, '{1,2,3,4,5}', 'manana', true),
  ('comer_mejor', 'salud_fisica', 3, 'base', 'Preparar una comida casera', 30, 15, '{1,3,5}', null, false),
  ('comer_mejor', 'salud_fisica', 3, 'sin_recursos', 'Elegir una opción con verdura al comer fuera', 10, 5, '{1,2,3,4,5}', null, true),
  ('tomar_agua', 'salud_fisica', 1, 'base', 'Tomar un vaso de agua al despertar', 1, 1, '{1,2,4,6}', 'manana', true),
  ('tomar_agua', 'salud_fisica', 2, 'base', 'Un vaso de agua con cada comida', 3, 1, '{1,2,3,4,5}', null, true),
  ('tomar_agua', 'salud_fisica', 3, 'base', 'Rellenar mi botella tres veces al día', 5, 3, '{1,2,3,4,5,6}', null, true),
  ('organizar_dia', 'trabajo', 1, 'base', 'Escribir mi prioridad del día', 3, 1, '{1,2,4,6}', null, true),
  ('organizar_dia', 'trabajo', 2, 'base', 'Planear mi día en 3 tareas', 10, 5, '{1,2,3,4,5}', null, true),
  ('organizar_dia', 'trabajo', 3, 'base', 'Plan del día y revisión por la noche', 15, 8, '{1,2,3,4,5}', null, true),
  ('procrastinar_menos', 'trabajo', 1, 'base', '5 min en la tarea que estoy evitando', 5, 2, '{1,2,4,6}', null, true),
  ('procrastinar_menos', 'trabajo', 2, 'base', 'Bloque de enfoque de 15 min', 15, 5, '{1,2,3,4,5}', null, true),
  ('procrastinar_menos', 'trabajo', 3, 'base', 'Bloque de enfoque de 25 min', 25, 10, '{1,2,3,4,5}', null, true),
  ('aprender_algo', 'trabajo', 1, 'base', 'Leer o estudiar 5 min', 5, 2, '{1,2,4,6}', null, true),
  ('aprender_algo', 'trabajo', 2, 'base', 'Estudiar 15 min', 15, 5, '{1,2,3,4,5}', null, true),
  ('aprender_algo', 'trabajo', 3, 'base', 'Estudiar 30 min', 30, 10, '{1,2,3,4,5}', null, true),
  ('manejar_estres', 'salud_mental', 1, 'base', 'Respirar profundo 2 min', 2, 1, '{1,2,4,6}', null, true),
  ('manejar_estres', 'salud_mental', 2, 'base', 'Pausa de respiración de 5 min', 5, 2, '{1,2,3,4,5}', null, true),
  ('manejar_estres', 'salud_mental', 3, 'base', 'Pausa guiada de 10 min', 10, 5, '{1,2,3,4,5,6}', null, true),
  ('desconectar_pantallas', 'salud_mental', 1, 'base', 'Dejar el celular boca abajo 5 min', 5, 2, '{1,2,4,6}', null, true),
  ('desconectar_pantallas', 'salud_mental', 2, 'base', '15 min sin pantallas', 15, 5, '{1,2,3,4,5}', null, true),
  ('desconectar_pantallas', 'salud_mental', 3, 'base', '30 min sin pantallas', 30, 10, '{1,2,3,4,5}', null, true),
  ('tiempo_para_mi', 'salud_mental', 1, 'base', '5 min para algo que disfruto', 5, 2, '{1,2,4,6}', null, true),
  ('tiempo_para_mi', 'salud_mental', 2, 'base', '15 min para mí', 15, 5, '{1,2,3,4,5}', null, true),
  ('tiempo_para_mi', 'salud_mental', 3, 'base', '30 min para mí', 30, 10, '{1,3,5,6}', null, true),
  ('saber_gastos', 'finanzas', 1, 'base', 'Anotar un gasto del día', 2, 1, '{1,2,4,6}', 'noche', true),
  ('saber_gastos', 'finanzas', 2, 'base', 'Anotar todos mis gastos del día', 5, 2, '{1,2,3,4,5}', 'noche', true),
  ('saber_gastos', 'finanzas', 3, 'base', 'Anotar mis gastos todos los días', 5, 2, '{1,2,3,4,5,6}', 'noche', true),
  ('empezar_ahorrar', 'finanzas', 1, 'base', 'Apartar una cantidad pequeña que yo elija', 3, 1, '{7}', null, true),
  ('empezar_ahorrar', 'finanzas', 2, 'base', 'Apartar mi cantidad y revisar mi meta', 5, 3, '{7}', null, true),
  ('empezar_ahorrar', 'finanzas', 3, 'base', 'Revisión semanal de ahorro y gastos pequeños', 10, 5, '{7}', null, true),
  ('evitar_impulsivas', 'finanzas', 1, 'base', 'Esperar antes de una compra no planeada', 2, 1, '{1,2,4,6}', null, true),
  ('evitar_impulsivas', 'finanzas', 2, 'base', 'Hacer una lista antes de comprar', 5, 2, '{1,3,5}', null, true),
  ('evitar_impulsivas', 'finanzas', 3, 'base', 'Revisar compras y suscripciones de la semana', 10, 5, '{7}', null, true),
  ('mantener_contacto', 'social', 1, 'base', 'Enviar un mensaje a alguien', 5, 2, '{1,2,4,6}', null, true),
  ('mantener_contacto', 'social', 2, 'base', 'Escribir o llamar con calma a alguien', 10, 5, '{1,2,4,6}', null, true),
  ('mantener_contacto', 'social', 3, 'base', 'Llamada de 20 min', 20, 10, '{3,6}', null, true),
  ('tiempo_de_calidad', 'social', 1, 'base', '5 min de atención plena con alguien', 5, 2, '{1,3,5}', null, true),
  ('tiempo_de_calidad', 'social', 2, 'base', '15 min de calidad con alguien', 15, 5, '{1,2,4,6}', null, true),
  ('tiempo_de_calidad', 'social', 3, 'base', '30 min de una actividad juntos', 30, 15, '{1,3,6}', null, true),
  ('conocer_gente', 'social', 1, 'base', 'Iniciar una conversación breve con alguien', 5, 2, '{2,5}', null, true),
  ('conocer_gente', 'social', 2, 'base', 'Proponer un plan o responder una invitación', 15, 5, '{6}', null, true),
  ('conocer_gente', 'social', 3, 'base', 'Asistir a una actividad o grupo', 40, 20, '{6}', null, true);

-- ---------------------------------------------------------------------------
-- Accesorios: 15 con nombres provisionales (docs/textos.md §7) y precios de SDD 6.4
-- ---------------------------------------------------------------------------

insert into public.accessories (tipo, orden, nombre, precio, imagen) values
  ('sombrero', 1, 'Gorra', 30, 'accessories/sombrero/1.png'),
  ('sombrero', 2, 'Sombrero de paja', 60, 'accessories/sombrero/2.png'),
  ('sombrero', 3, 'Boina', 100, 'accessories/sombrero/3.png'),
  ('sombrero', 4, 'Corona de flores', 150, 'accessories/sombrero/4.png'),
  ('sombrero', 5, 'Corona dorada', 250, 'accessories/sombrero/5.png'),
  ('lentes', 1, 'Lentes redondos', 30, 'accessories/lentes/1.png'),
  ('lentes', 2, 'Lentes de sol', 60, 'accessories/lentes/2.png'),
  ('lentes', 3, 'Lentes de corazón', 100, 'accessories/lentes/3.png'),
  ('lentes', 4, 'Lentes de estrella', 150, 'accessories/lentes/4.png'),
  ('lentes', 5, 'Monóculo', 250, 'accessories/lentes/5.png'),
  ('maceta', 1, 'Maceta de barro', 30, 'accessories/maceta/1.png'),
  ('maceta', 2, 'Maceta de rayas', 60, 'accessories/maceta/2.png'),
  ('maceta', 3, 'Maceta colgante', 100, 'accessories/maceta/3.png'),
  ('maceta', 4, 'Maceta de cerámica', 150, 'accessories/maceta/4.png'),
  ('maceta', 5, 'Maceta dorada', 250, 'accessories/maceta/5.png');

-- ---------------------------------------------------------------------------
-- Configuración: constantes de negocio en un solo lugar (definición 6)
-- ---------------------------------------------------------------------------

insert into public.app_config (clave, valor) values
  ('recompensas', '{
    "xp_por_habito": 2,
    "xp_por_nivel": 4,
    "nivel_maximo": 30,
    "nivel_inicio_fase_2": 15,
    "nivel_inicio_fase_3": 30,
    "tope_habitos_con_xp_por_planta_dia": 1,
    "monedas_por_habito": 10,
    "tope_habitos_con_monedas_dia": 5
  }'),
  ('precios_accesorios', '[30, 60, 100, 150, 250]'),
  ('presupuestos', '{
    "menos_10": 10,
    "10_20": 20,
    "20_40": 40,
    "mas_40": 60,
    "tradicional_por_defecto": 20
  }'),
  ('horas_por_momento', '{
    "manana": "08:00",
    "mediodia": "13:00",
    "tarde": "17:00",
    "noche": "20:30",
    "flexible_aviso": "17:00",
    "flexible_segundo_aviso": "20:00",
    "resumen_nocturno": "21:00"
  }'),
  ('progresion', '{
    "umbral_subir": 0.85,
    "umbral_bajar": 0.5,
    "ventana_dias": 14,
    "ventana_dias_baja_frecuencia": 28,
    "dias_por_semana_baja_frecuencia": 2,
    "minimo_ocurrencias": 4,
    "dias_entre_evaluaciones": 7,
    "limite_habitos_plan": 4,
    "dias_para_desbloqueo": 90,
    "ventana_desbloqueo_dias": 28
  }'),
  ('notificaciones', '{
    "ventana_dias": 7,
    "tope_programadas": 60,
    "horas_segundo_aviso": 2
  }'),
  ('reprogramacion', '{
    "dias_atras": 7,
    "dias_adelante": 7
  }'),
  ('servidor', '{
    "tolerancia_dias_check_in": 7
  }');
