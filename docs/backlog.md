# Habit Green: backlog de la demo

Tareas de la demo de 3 semanas, ordenadas en **entregas verticales**. Al terminar cada una, la app funciona de punta a punta con lo que ya existe. El diseño de cada tarea está en `docs/sdd.md`; las secciones se citan entre paréntesis.

**Cómo se usa**

- Se trabaja una entrega a la vez y en orden. Claude implementa y explica; tú pruebas.
- Una entrega se cierra cuando pasa su **criterio de prueba** en tu teléfono Android y `npm run lint`, `npm run typecheck` y `npm test` están en verde.
- Estados: `pendiente`, `en curso`, `hecho`, `recortado`.
- Las horas son de tu tiempo (revisar, probar, configurar cuentas), no de escritura de código. Las de UI son provisionales hasta revisar los mockups de Figma.

**Antes de empezar**

| Necesario | Para | Estado |
| --- | --- | --- |
| Proyecto en Supabase | Entrega 1 | listo |
| Remoto de GitHub conectado al repo local (rama `master`) | Entrega 1 | listo |
| `.env` local con las claves públicas de Supabase (copiar `.env.example`) | Entrega 1 | listo |
| Supabase CLI (`npx supabase`, ya en el proyecto) con sesión iniciada y vinculada (`supabase link`) | Entrega 1 | listo |
| Auth de Supabase: URLs de redirección (`habitgreen://**`, `exp://**`), Site URL `habitgreen://`, SMTP propio con Gmail (necesario para editar plantillas) y plantilla de recuperación con código. Antes de publicar: SMTP con dominio propio (Resend o similar) | Entrega 1 | listo |
| Pruebas SQL: Docker Desktop con `npx supabase db start` (ya funciona en tu equipo) | Entrega 4 | listo |
| Enlace de Figma con permiso de lectura (MCP de Figma conectado) | Entrega 1 (componentes base) | listo |
| Clave de Google AI Studio (gratuita), guardada como secreto de Supabase (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_DAILY_LIMIT`) | Entrega 2 | listo |
| Cuenta de Expo (EAS) con sesión iniciada y proyecto vinculado (`@nueve_36/HabitGreen`, `projectId` en `app.json`) | Entrega 3 | listo |
| Teléfono Android físico con Expo Go | Entrega 1 | listo |
| Arte: 5 plantas × 3 fases y 15 accesorios en el mismo lienzo cuadrado (PNG transparente) | Entrega 4 (se puede avanzar con placeholders) | pendiente |

## Entrega 1: Base (días 1–3, ~10 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 1.1 | Expo Router con rutas en `src/app/`, TypeScript estricto, ESLint, Prettier y scripts `lint`, `typecheck`, `test` | 3.3 | hecho |
| 1.2 | NativeWind con los tokens, Lexend Deca, `src/theme` | 9.2 | hecho |
| 1.3 | Supabase: migraciones del esquema completo, RLS, semilla de categorías, catálogo, accesorios y `app_config` | 4, 5.7 | hecho |
| 1.4 | Auth: registro, confirmación de correo, inicio de sesión, recuperación con código por correo, sesión en `expo-secure-store` | 10 | hecho |
| 1.5 | Componentes base a partir de los mockups: `Button`, `Card`, `Field`, `OptionChip`, `ProgressSteps`, `Alert`, `TabBar` | 9.3 | hecho |
| 1.6 | Navegación: pestañas vacías (Hoy, Hábitos, Estadísticas, Jardín, Perfil) y elección de modo | 9.1, 9.4 | hecho |

**Criterio de prueba:** te registras, confirmas el correo, cierras la app, la vuelves a abrir con la sesión iniciada y navegas entre las 5 pestañas. Recuperar la contraseña con el código del correo te deja crear una nueva y entrar con ella.

## Entrega 2: Formulario y plan (días 4–7, ~12 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 2.1 | Esquemas Zod del formulario, claves y textos en `i18n/es.ts` | 5.1–5.3 | hecho |
| 2.2 | Formulario de 7 pasos con Zustand (sin React Hook Form: son solo opciones, no campos de texto); P2 filtrada por área; límite de 2 con mensaje; avance guardado | 5.1–5.3 | hecho |
| 2.3 | Motor de plan (funciones puras) con pruebas de Jest | 5.4–5.6 | hecho |
| 2.4 | Código compartido con las Edge Functions (`npm run functions:sync` copia a `supabase/functions/_shared/generated`) | 3.3 | hecho |
| 2.5 | `AiProvider` con implementación de Gemini; `generate-plan` que devuelve un borrador; respaldo con textos del catálogo | 5.8–5.10 | hecho |
| 2.6 | Pantallas «Generando plan» y «Revisión del plan» (cambiar hora, bajar nivel, quitar, segundo aviso); bloqueo sin conexión | 5.8, 9.4 | hecho |
| 2.7 | «Empezar»: guardar plan, hábitos, horarios y `user_settings` (directo en Supabase, porque crear el plan exige conexión; la sincronización lo baja a SQLite) | 5.8 | hecho |
| 2.8 | Modo tradicional: `user_settings` por defecto al elegirlo | 6.5 | hecho |

**Criterio de prueba:** respondes el formulario (probando volver y el límite de 2), ves un plan con textos personalizados por la IA y lo confirmas. En Supabase aparecen tus hábitos. Con el modo avión, «Crear mi plan» muestra el mensaje de conexión.

## Entrega 3: Hoy y hábitos offline (días 8–9, ~10 h) — punto de control

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 3.1 | Development build de Android con EAS (`eas.json`, `npm run build:dev`, `npm run start:dev`). Para probar en modo avión, el código llega por cable: `adb reverse tcp:8081 tcp:8081` y `npm run start:usb` | 3.2 | hecho |
| 3.2 | SQLite: esquema local, migraciones y repositorios en `src/db` | 3.4 | hecho |
| 3.3 | Sincronización: carga inicial, descarga incremental, `outbox` y cuándo sincroniza; zona horaria; RPC mínimas `complete_habit` y `uncomplete_habit` (sin recompensas, se completan en la 4.1) | 3.4 | hecho |
| 3.4 | Pantalla Hoy: hábitos del día y check-in (solo hoy) con deshacer | 9.4 | hecho |
| 3.5 | Pantalla Hábitos: lista por categoría, crear manual (con aviso de presupuesto), editar horario (versionado), pausar y archivar | 4, 6.5, 6.6 | hecho |

**Revisión de diseño:** Hoy, Hábitos y el asistente de 3 pasos se rehicieron según los mockups (SDD 6.5 y 9.4): check-in también desde Hábitos, fechas de inicio y fin y hábitos sin recordatorio.

**Criterio de prueba:** con el modo avión, creas un hábito, lo completas y lo deshaces. Al quitar el modo avión, todo aparece en Supabase. Al iniciar sesión en un teléfono limpio, se descarga todo.
**Punto de control:** si esto no funciona al final del día 9, se pasa a «solo check-in offline» (SDD 2.5).

## Entrega 4: Recompensas (días 10–11, ~8 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 4.1 | RPC `complete_habit` y `uncomplete_habit` con topes y tolerancia de 7 días; pruebas SQL | 6.1 | hecho |
| 4.2 | Cálculo local optimista de XP y monedas, y reconciliación al sincronizar | 3.4, 6.1 | hecho |
| 4.3 | Check-in con animación de moneda (Reanimated) y mensaje del tope de monedas; celebración de cambio de fase | 6.1 | hecho |
| 4.4 | Jardín con las 5 plantas y accesorios equipados (placeholders si el arte no ha llegado) | 9.4, 9.8 | hecho |
| 4.5 | Tienda según el mockup: comprar, saldo, «Te faltan N monedas», «Equipar ahora»; equipar en una sola planta | 6.4, 9.4 | hecho |
| 4.6 | Detalles de la planta: carrusel de fases con bloqueo, pestañas Hábitos y Objetos, y Jardín según el mockup | 6.1, 6.4, 9.4 | hecho |
| 4.7 | Protección de monedas: pago único por hábito y día, eliminar devuelve, validaciones de `complete_habit` y reloj atrasado; deslizar entre pestañas y parte superior de Hoy fija | 6.1, 9.4 | hecho |
| 4.8 | Refinar con Impeccable: Jardín, Hoy y Hábitos (planta en Hoy, aviso flotante, encabezado fijo) | 9.4 | hecho |
| 4.9 | Renovación visual «Jardín alegre» en toda la app: tokens, botones, casillas, barra inferior y monedas | 9.2, 9.3 | hecho |

**Criterio de prueba:** completas 6 hábitos en un día y el sexto muestra el mensaje del tope. Compras un accesorio, lo equipas en una planta y luego en otra, y desaparece de la primera.

## Entrega 5: Notificaciones (días 12–13, ~8 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 5.1 | Permiso en contexto (revisión del plan) y canal de Android; verificar alarmas exactas | 7.1 | hecho |
| 5.2 | Ventana móvil de 7 días con tope de 60 y recálculo en cada evento | 7.1 | hecho |
| 5.3 | Estilos de la P7, precedencia P7/P6, segundo aviso, momento flexible y `notificar` («Avisarme») | 5.6, 7.1 | hecho |
| 5.4 | Textos: ánimo rotativo, resumen nocturno, apoyo de las semanas 3 y 4 | 7.1, `textos.md` | hecho |
| 5.5 | Ajustes en Perfil: tiempo diario (`presupuesto_min`), estilo de avisos, horas por momento y segundo aviso; funciona sin conexión vía la cola (`update` de `user_settings`). El tiempo diario usa las ruedas de horas y minutos (1 min a 8 h) | 6.5, 7.1, 9.4 | hecho |

**Criterio de prueba:** con un hábito programado 2 minutos en el futuro, llega el aviso. Al completarlo antes, el segundo aviso no llega. Cambiar el estilo a `minimo` deja de enviar avisos de hábitos sin «Avisarme». En Perfil cambias tu tiempo diario y el cambio llega a Supabase.

## Entrega 6: Reprogramación (día 14, ~4 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 6.1 | Detección al abrir la app, búsqueda de día libre y `habit_occurrences` | 6.2 | pendiente |
| 6.2 | Interfaz: aceptar, elegir otro día o descartar; modo silencioso con `desanimo`; hábitos de 7 días se omiten | 6.2 | pendiente |

**Criterio de prueba:** con datos de prueba de un hábito no hecho ayer, al abrir la app se ofrece moverlo a un día libre y aparece en Hoy ese día con su aviso.

## Entrega 7: Estadísticas y rachas (días 15–16, ~6 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 7.1 | Agregaciones desde SQLite con las reglas de ocurrencias y hábitos archivados | 8 | pendiente |
| 7.2 | Gráficas de semana, mes y año con resumen en texto; filtros | 8 | pendiente |
| 7.3 | Rachas por hábito (actual y mejor) | 8 | pendiente |

**Criterio de prueba:** después de unos días de uso, las gráficas coinciden con lo que marcaste, y con el modo avión siguen funcionando.

## Entrega 8: Progresión (día 17, ~4 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 8.1 | Reglas de progresión (funciones puras con pruebas), límite de 4 hábitos del plan y desbloqueo a los 90 días | 6.3 | pendiente |
| 8.2 | Interfaz de propuesta (aceptar o posponer) y `adjust-plan` con respaldo de catálogo | 6.3 | pendiente |

**Criterio de prueba:** las pruebas de Jest cubren los casos de la tabla de 6.3. Con datos de prueba de 14 días al 90 %, al abrir la app se propone subir de nivel.

## Entrega 9: Cierre (días 18–19, ~6 h)

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 9.1 | Recorrido completo en el teléfono, lista 9.7 con TalkBack y texto al 130 % | 9.7 | pendiente |
| 9.2 | Corrección de errores | — | pendiente |
| 9.3 | APK de preview con EAS | 11 | pendiente |

**Criterio de prueba:** instalas el APK en un teléfono limpio y haces el flujo completo de la definición de terminado sin errores.

## Entrega 10: Geofencing básico (días 20–21, ~6 h) — primer recorte

| # | Tarea | SDD | Estado |
| --- | --- | --- | --- |
| 10.1 | `habit_places`: agregar hasta 3 lugares desde el detalle del hábito | 7.2 | pendiente |
| 10.2 | Geofencing con tope de 20 regiones, una notificación al día por hábito y permiso en segundo plano | 7.2 | pendiente |

**Criterio de prueba:** al llegar a un lugar guardado, llega un aviso del hábito si está programado para hoy y no está hecho.
Si al terminar la entrega 9 no quedan al menos 2 días, esta entrega se marca `recortado` y esos días son margen.
