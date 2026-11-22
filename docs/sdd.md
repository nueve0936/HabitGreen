# Habit Green: Planeación y SDD del MVP (v5)undefined · Estirarme → `estirarme` · Salir al aire libre → `aire_libre` · Hacer pausas activas → `pausas_activas` |undefined · Leer más → `leer_mas` · Ordenar mi espacio → `ordenar_espacio` · Practicar una habilidad → `practicar_habilidad` · Concentrarme mejor → `concentrarme` |undefined · Agradecer más → `agradecer_mas` · Escribir lo que siento → `escribir_diario` · Meditar → `meditar` · Hacer algo creativo → `crear_algo` |undefined · Pagar a tiempo → `pagar_a_tiempo` · Aprender de finanzas → `aprender_finanzas` · Planear mis compras → `planear_compras` · Ordenar mis cuentas → `ordenar_cuentas` |undefined · Escuchar mejor → `escuchar_mejor` · Ayudar a alguien → `ayudar_a_alguien` · Agradecer a otros → `agradecer_a_otros` · Retomar una amistad → `retomar_amistad` |

Documento de planeación y diseño de software para la app móvil Habit Green (React Native + Expo). Alcance: MVP en 3 semanas, con base para escalar a tiendas.

Cambios de la v5:

- Demo **solo en Android** con development build. iOS se valida después.
- IA con **nivel gratuito (Gemini)** detrás de la interfaz `AiProvider`, que también admite Claude y OpenAI (3.2, 5.8).
- **Geofencing básico vuelve** como última entrega y primer recorte. Lottie, Sentry y CI quedan fuera de la demo (2.5).
- Cronograma por **entregas verticales** (2.2).
- `generate-plan` devuelve un **borrador**: la app guarda el plan al confirmar. Sin conexión no se puede crear el plan (5.8).
- Progresión definida: ventana de 14 días, mínimo de ocurrencias, límite de 4 hábitos del plan con desbloqueo a los 90 días (6.3).
- Rachas por hábito (8). Hábitos archivados en vez de borrados. Categoría fija. Jardín con las 5 plantas desde el inicio. Un objeto puede estar en varias plantas a la vez, con uno de cada tipo por planta.
- Correcciones: `uncomplete_habit` con la misma tolerancia que `complete_habit`, campo `notificar` para el estilo `minimo`, zona horaria actualizada desde el dispositivo y sin notificación matutina.

Cambios de la v4:

- Alcance: **demo funcional** (build de preview) hecha por **una sola persona**. Quedan fuera de la demo el geofencing y Lottie (2.2, 2.5).
- Se mantiene el offline completo, con un **punto de control al final del día 9** (2.4).
- Reprogramación a un **día libre fuera del patrón** con la nueva tabla `habit_occurrences` (4, 6.2).
- Notificaciones con **ventana móvil** de avisos con fecha concreta, por el límite de 64 de iOS (7.1).
- Nueva sección de sincronización (3.4).
- Modo tradicional con valores por defecto y mensaje suave al llegar al tope de monedas (6.1, 6.5).

Cambios de la v3:

- Formulario refinado: textos y ayudas por pregunta. En Social, `tiempo_sin_celular` se reemplaza por `tiempo_de_calidad`.
- Regla de precedencia entre preguntas: **la P7 decide cuántas notificaciones llegan; la P6 solo ajusta su contenido o momento** (5.6).
- El catálogo semilla agrega `dias_semana` por fila, `duracion_reducida_min` y `momento_fijo` (5.7). Se revisan las filas con saltos grandes o frecuencias poco realistas.
- Ritmo de XP: **4 XP por nivel** (antes 100), con **tope de 1 hábito por planta al día** que suma XP y tope de 5 hábitos al día que dan monedas (6.1).
- Precios de los 15 accesorios (6.4).
- Se agregan la RPC `uncomplete_habit` y las marcas `xp_otorgado` / `monedas_otorgadas` en `habit_logs`.
- Corrección: el catálogo tiene 16 objetivos (no 14) × 3 niveles = 48 filas base.

Cambios de la v2 (se mantienen): formulario con claves, catálogo semilla, motor determinista con IA solo para textos, guía de UX/UI aplicada a React Native.

## 1. Resumen y alcance

**Producto.** Habit tracker con dos modos: (a) tradicional, donde el usuario crea sus hábitos, y (b) guiado, donde un formulario de 7 preguntas genera un plan que arranca con poca carga y se adapta con el tiempo.

**Público.** Personas de 22 a 45 años, incluidas quienes les cuesta iniciar y sostener hábitos. Idioma inicial: español (tuteo).

**Funcionalidades mínimas del MVP**

1. Formulario inicial de 7 preguntas y generación del plan.
2. Hábitos con 5 categorías fijas (Salud Física, Trabajo / Estudio, Salud Mental, Finanzas, Social).
3. Recordatorios por hora, día y ubicación.
4. Estadísticas semanales, mensuales y anuales.
5. Recompensas: una planta por categoría (3 fases), monedas y accesorios.
6. Progresión adaptativa y reprogramación de hábitos fallidos.

**Fuera del MVP:** categorías creadas por el usuario (el modelo ya lo contempla), push remotos, cron en servidor, funciones sociales, pagos, modo oscuro, insignias.

**Fuera de la demo (se agregan antes de publicar):** iOS, Lottie, Sentry, GitHub Actions, temporizador de `distraccion` y eliminar cuenta. (El formulario para quien empezó creando sus hábitos ya está: Perfil → Mis planes.)

## 2. Planeación del proyecto

### 2.1 Orden de prioridad

Formulario → plan → hábitos y categorías → notificaciones → recompensas → estadísticas → geolocalización (al final y en versión básica).

### 2.2 Cronograma de 3 semanas (una persona, demo funcional en Android)

La meta es una **build de preview en Android (APK)** con el flujo completo. Se desarrolla con una development build de Android desde la entrega 3. La UI de las pantallas principales sale de los mockups (Figma); las secundarias y los estados se diseñan con las reglas de la sección 9.

**Forma de trabajo:** una persona a medio tiempo, con poca experiencia en el stack. Claude escribe el código por partes y explica cada pieza. El usuario prueba cada entrega con su criterio de prueba antes de pasar a la siguiente. El detalle de tareas y su estado vive en `docs/backlog.md`.

**Entregas verticales.** Al terminar cada una, la app funciona de punta a punta con lo que ya existe. Así, si el tiempo se acaba, siempre hay algo que mostrar.

| # | Entrega | Días (aprox.) | Contenido |
| --- | --- | --- | --- |
| 1 | Base | 1–3 | Proyecto Expo + Router + NativeWind con tokens y Lexend Deca. Supabase con esquema, RLS y catálogo semilla. Auth (registro, confirmación de correo, inicio de sesión y recuperación). Componentes base. |
| 2 | Formulario y plan | 4–7 | Formulario de 7 pasos. Motor de plan. `generate-plan` con `AiProvider` (Gemini). Revisión del plan y «Empezar». |
| 3 | Hoy y hábitos offline | 8–9 | SQLite, repositorios, cola de sincronización, Hoy, Hábitos, creación manual, check-in. **Punto de control** (2.4). |
| 4 | Recompensas | 10–11 | `complete_habit` / `uncomplete_habit` con topes, jardín, tienda y accesorios. Animaciones con Reanimated. |
| 5 | Notificaciones | 12–13 | Ventana móvil, estilos de la P7, precedencia P7/P6 y ánimo rotativo. |
| 6 | Reprogramación | 14 | `habit_occurrences`, detección al abrir y día libre. |
| 7 | Estadísticas y rachas | 15–16 | Semana, mes y año. Rachas por hábito. |
| 8 | Progresión | 17 | Reglas, límite de hábitos del plan y `adjust-plan`. |
| 9 | Cierre | 18–19 | Pruebas en dispositivo Android, lista 9.7, corrección de errores y APK. |
| 10 | Geofencing básico | 20–21 | Lugares por hábito y notificación al entrar. **Primer recorte** si falta tiempo; en ese caso, los días 20–21 son margen. |

### 2.3 Requisitos previos

La lista con su estado vive en `docs/backlog.md` («Antes de empezar»). Además de las cuentas, la Entrega 1 necesita:

- Remoto de GitHub con la rama `main`.
- `.env` local con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (plantilla en `.env.example`; `.env` está en `.gitignore`).
- Supabase CLI instalada y vinculada al proyecto (`supabase link`).
- Auth de Supabase: URLs de redirección con el esquema `habitgreen://` (y `exp://` para Expo Go) y SMTP propio (por ejemplo, Resend). El SMTP integrado tiene un límite muy bajo y solo envía a los correos del equipo del proyecto.
- `app.json` con `scheme: "habitgreen"` y `android.package: "com.habitgreen.app"`.

### 2.4 Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Poca experiencia con el stack y medio tiempo (unas 75 h en total, según el backlog) | Alto | Entregas verticales con criterio de prueba. Claude implementa y explica; el usuario verifica cada entrega. Recortes en el orden de 2.5. |
| Geofencing requiere development build y permiso de ubicación en segundo plano | Alto | Última entrega y primer recorte. Si no alcanza, queda para v1.1. |
| La IA devuelve JSON inválido o textos poco seguros | Medio | La IA solo escribe textos; los números salen del catálogo. Validar con Zod, reintentar una vez y usar los textos del catálogo si falla. |
| Límites del nivel gratuito de Gemini (por minuto y por día) | Medio | Al recibir un error de cuota, se usan los textos del catálogo sin mostrar error. `AiProvider` permite cambiar a Claude u OpenAI con variables de entorno. |
| Alarmas exactas en Android 12+ (`SCHEDULE_EXACT_ALARM`) | Medio | Verificar en la documentación de `expo-notifications` del SDK actual. Probar en un dispositivo físico desde la entrega 5. |
| Sincronización offline con conflictos | Medio | Registros por día con clave única (hábito + fecha). «Gana el último». Los topes diarios se recalculan en el servidor al sincronizar. |
| Arte tarde o que no contraste con el fondo | Medio | Placeholders con la misma convención de nombres. Pedir PNG con fondo transparente y contorno oscuro, y mostrar las plantas sobre una tarjeta con tinte. |
| Contraste de los colores del sistema (ver 9.6) | Medio | Reglas en los componentes base, no en cada pantalla; revisión en la semana 3. |
| Farmeo de XP o monedas con hábitos manuales triviales | Medio | Topes diarios: 1 hábito por planta suma XP y 5 hábitos dan monedas (6.1). |
| Alcance excesivo para 3 semanas con una sola persona | Alto | Lottie, Sentry y CI fuera desde el inicio. Geofencing al final. Punto de control del día 9 y recortes en el orden de 2.5. |
| Offline completo (cola, reconciliación de recompensas) más lento de lo estimado | Alto | **Punto de control al final del día 9:** si la sincronización no funciona de punta a punta (crear hábito, completar, deshacer, reconectar), se pasa a «solo check-in offline»: lectura con caché y cola solo para `complete_habit` / `uncomplete_habit`. |
| Límite de notificaciones programadas (64 en iOS) | Medio | Ventana móvil con un tope de 60 (7.1), aunque la demo sea en Android, para no rehacerlo al llegar a iOS. |

### 2.5 Recortes

**Fuera de la demo desde el inicio:** iOS, Lottie (quedan las animaciones de Reanimated), Sentry, GitHub Actions, el temporizador de `distraccion` y eliminar cuenta.

**Si el tiempo aprieta, en este orden:**

1. Geofencing básico (quedan solo recordatorios por hora y día).
2. Offline completo → solo check-in offline (punto de control del día 9). SQLite sigue siendo una caché completa, así que las estadísticas y la reprogramación siguen calculándose en local. Solo se simplifica la subida: la cola envía check-ins y el resto de cambios requiere conexión.
3. `adjust-plan` con IA (quedan las reglas locales y los textos del catálogo).
4. Estadísticas anuales (quedan semana y mes).

## 3. Arquitectura

### 3.1 Vista general

La app es offline-first: las acciones se guardan primero en local y se sincronizan con Supabase en segundo plano. La IA nunca se llama desde la app.

```
App (Expo / React Native)
  UI: NativeWind (tokens) + Reanimated
  Estado: Zustand (UI/sesión/formulario) + TanStack Query (servidor)
  Local: expo-sqlite (hábitos, registros, cola de sincronización)
  Dominio: motor de plan, catálogo, progresión, reprogramación, recompensas (funciones puras)
  Nativo: expo-notifications, expo-location + TaskManager
        |
        v  HTTPS + JWT
Supabase
  Auth | Postgres + RLS + RPC | Edge Functions
        |
        v
AiProvider: Gemini (nivel gratuito, por defecto) | Claude | OpenAI
  solo desde Edge Functions
```

### 3.2 Decisiones técnicas

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Navegación | Expo Router | Deep links y tipado simples. |
| Backend | Supabase | Auth, Postgres, RLS y funciones en un solo servicio. |
| Local | expo-sqlite | Funciona en Expo Go y permite estadísticas offline. |
| Estado | Zustand + TanStack Query | Separa UI de datos remotos. Como la app lee de SQLite, TanStack Query se limita a llamadas que requieren red: `generate-plan`, `adjust-plan` y Auth. En la Entrega 2 todavía no se instala: `generate-plan` es una sola llamada con estado local en la pantalla. Se agrega si lo justifican `adjust-plan` o la sincronización. |
| Persistencia antes de SQLite | `zustand/persist` sobre el almacén clave-valor de `expo-sqlite` | En la Entrega 2 todavía no hay esquema local: el avance del formulario se guarda así y `app_config` se lee directo de Supabase. Desde la Entrega 3 pasa a SQLite. |
| Iconos | `lucide-react-native` | Iconos de línea con trazo de 2 px y tamaño 24, como pide la guía. Verificar compatibilidad con el SDK antes de instalar. |
| Gráficas | Propias: barras con `View` y línea con `react-native-svg` (ya instalado) | Son 7, 6 o 12 valores: así los tokens, el «hoy» y la accesibilidad quedan bajo control, sin otra dependencia (Entrega 7). |
| UI | NativeWind con tokens de la guía | Un solo origen de colores y espaciados. |
| Tipografía | Lexend Deca vía `@expo-google-fonts/lexend-deca` | La usan los mockups de Figma; respaldo del sistema. |
| Plan | **Motor determinista + IA solo para textos** | El plan nunca excede el tiempo declarado, aunque la IA falle. |
| IA | **Interfaz `AiProvider`** con implementaciones para Gemini (por defecto, nivel gratuito), Claude y OpenAI. Se elige con `AI_PROVIDER`. | La IA debe ser gratuita para la demo; cambiar de proveedor no toca el resto del código. |
| Notificaciones | **P7 decide la cantidad, P6 ajusta** | Evita combinaciones contradictorias. |
| Reprogramación | Lógica local al abrir la app | Evita depender de un cron en el MVP. |
| Plataforma de la demo | Solo Android | Las builds de Android son gratuitas y no requieren cuenta de Apple. El código sigue siendo multiplataforma. |
| Builds | Development build de Android desde la entrega 3 | Necesaria para geofencing y alarmas fiables. Expo Go sirve en las entregas 1 y 2. |
| Animaciones | Solo Reanimated | Lottie queda fuera de la demo. |

### 3.3 Estructura del proyecto

Las rutas viven en `src/app/`, como indica `AGENTS.md`. Solo hay pantallas ahí; el resto del código va fuera.

```
src/
  app/
    (auth)/            # login, registro
    (onboarding)/      # modo, formulario (7 pasos), generando, revisión del plan
    (tabs)/            # hoy, hábitos, estadísticas, jardín, perfil
    habit/[id].tsx
    store.tsx
  components/ ui/    # Button, Card, Field, OptionChip, TabBar, Alert, ProgressSteps
  theme/             # tokens (colores, tipografía, espaciado, radios, sombras)
  features/
    onboarding/      # pantallas, schemas, claves, mapeo
    plan/            # motor de plan, catálogo, prompts
    habits/ rewards/ stats/ reminders/
  db/ sync/ lib/ schemas/
  i18n/es.ts         # textos de interfaz
supabase/
  migrations/ functions/ (generate-plan, adjust-plan)
assets/ plants/ accessories/ icons/ animations/
```

**Código compartido con las Edge Functions.** El motor de plan (`src/features/plan/domain/plan-engine.ts`) y los esquemas Zod (`src/schemas/onboarding.ts` y `src/schemas/plan.ts`) se escriben en TypeScript sin dependencias de React Native ni de Expo, con imports relativos. `scripts/sync-shared.mjs` (`npm run functions:sync`) los copia a `supabase/functions/_shared/generated/` y reescribe los imports relativos con la extensión `.ts`, que Deno exige. Los scripts `functions:serve` y `functions:deploy` hacen la copia antes de servir o publicar. La copia no se edita a mano y no se sube al repositorio (`supabase/.gitignore`). Hay una sola fuente de verdad. Cada función tiene su `deno.json` con el import map (`"zod": "npm:zod@<misma versión que la app>"`), como recomienda Supabase.

### 3.4 Sincronización (offline completo)

| Tema | Regla |
| --- | --- |
| Identificadores | UUID generados en el cliente para `habits`, `habit_schedules`, `habit_logs`, `habit_occurrences`, `habit_places`, `plans` y `user_accessories`, para poder crear sin conexión. |
| Cola de salida | Tabla local `outbox` (id, operación, payload, creado_en, intentos). Se procesa en orden. Un `complete` seguido de un `uncomplete` del mismo hábito y fecha se compactan (se eliminan ambos) solo si el `complete` nunca se intentó enviar: un intento sin respuesta pudo llegar al servidor, y entonces se mandan los dos en orden. |
| Carga inicial | Al iniciar sesión con SQLite vacío se descargan perfil, `user_settings`, `app_config`, categorías, catálogo, hábitos, horarios, ocurrencias y registros de los últimos 365 días, `plant_progress`, `wallets` y accesorios. |
| Descarga incremental | Por `updated_at` mayor a la última sincronización. Todas las tablas sincronizadas llevan `updated_at` (actualizado por un trigger). |
| Borrados | Las tablas sincronizadas no borran filas: llevan `eliminado_en` (timestamptz, nulo) y un borrado actualiza `eliminado_en` y `updated_at`, para que la descarga incremental lo propague a otros dispositivos. Aplica a `habit_logs` (deshacer), `habit_places` y `user_accessories`. Las restricciones únicas siguen valiendo: completar de nuevo un hábito deshecho reutiliza su fila y limpia `eliminado_en`. Las consultas y las políticas de lectura filtran `eliminado_en is null`. |
| Conflictos | Entidades editables (hábitos, horarios, ajustes): gana el último `updated_at`. Registros: la restricción única (hábito + fecha) y la idempotencia de las RPC. |
| Recompensas | La app calcula XP y monedas de forma optimista. Después de sincronizar, `plant_progress` y `wallets` se reemplazan por los valores del servidor. Un cambio de fase ya celebrado no se vuelve a animar. |
| Validación de fecha | `complete_habit` y `uncomplete_habit` aceptan fechas de hasta 7 días atrás en la zona horaria del perfil, para tolerar periodos sin conexión, y nunca fechas futuras. La interfaz solo permite marcar y deshacer el día de hoy. |
| Zona horaria | Al abrir la app, si la zona del dispositivo es distinta de `profiles.zona_horaria`, se actualiza el perfil antes de sincronizar. Así un check-in de «hoy» nunca llega al servidor como fecha futura. |
| Rechazos | Si el servidor rechaza una operación (fecha fuera de rango, hábito eliminado), se descarta, se registra en el log de la app (Sentry antes de publicar) y se refresca el estado local. |
| Cuándo sincroniza | Al abrir la app, al volver a primer plano, al recuperar conexión y después de cada operación si hay red. |
| Respuestas del formulario | `onboarding_answers` se copia al teléfono, solo de bajada: el momento (P5) y el historial (P3) deciden algunos avisos (5.6 y 7.1). |
| Implementación (Entrega 3) | Esquema local en `src/db/local-schema.ts`: una sola descripción por tabla crea la tabla, convierte las filas (booleanos 0/1, arreglos y `jsonb` como JSON) y arma la descarga. Si cambia la versión del esquema local, las tablas espejo se recrean y se descargan completas; la `outbox` se conserva. La red se detecta con `expo-network`. Hábitos, horarios y ocurrencias se suben por upsert con RLS; los cambios parciales (pausar, archivar, editar, cerrar un horario, subir el presupuesto, equipar accesorios) con la operación `update`, porque el upsert exige la fila completa; los check-ins y «Eliminar», por las RPC (`complete_habit`, `uncomplete_habit` y `archivar_habito`). Si el servidor rechaza una de estas, además de la fila se vuelven a leer el monedero y las plantas, porque su cálculo optimista nunca se aplicó allá. El plan y los ajustes del modo tradicional se guardan directo en Supabase (ya exigen conexión) y bajan con la sincronización. El perfil guarda una copia local para abrir la app sin conexión. Si al abrir sin red el token ya venció, se usa la sesión guardada en el teléfono y Supabase la renueva al volver la conexión. Sin conexión la sesión no se cierra, salvo que pasen **más de 60 días sin ninguna conexión** con el servidor (se cuenta desde la última renovación del token o inicio de sesión): entonces se borra la sesión guardada, pero no los datos locales, que se suben al volver a entrar con la misma cuenta. Si la sesión se cierra sola (esos 60 días, o desde otro lado), la bienvenida y el inicio de sesión muestran «Tu sesión caducó. Vuelve a iniciar sesión.» una sola vez, durante 10 segundos, y se desvanece al quitarse (decisión del usuario, pulidos antes del APK); la sincronización no envía nada mientras no haya un token válido. Al cerrar sesión se intenta subir lo pendiente y se vacía la base local, aunque falle el cierre en Supabase. La base local anota de qué cuenta son sus datos: al entrar, antes de mostrar las pestañas, si es de otra cuenta se vacía y se cancelan sus avisos; con la misma cuenta se conserva todo. |
| RPC de check-in en la Entrega 3 | `complete_habit(p_log_id, p_habit_id, p_fecha)` y `uncomplete_habit(p_habit_id, p_fecha)` en versión mínima: validan dueño, hábito no archivado (solo al completar) y la ventana de 7 días; son idempotentes y no dan recompensas. La Entrega 4 agrega los topes sin cambiar los parámetros. |

## 4. Modelo de datos (Postgres)

Todas las tablas de usuario llevan `user_id` y RLS: cada usuario solo lee y escribe sus propias filas.

| Tabla | Campos principales | Notas |
| --- | --- | --- |
| `profiles` | id (= auth.uid), nombre, zona_horaria, modo (`tradicional` o `guiado`), onboarding_completo | |
| `onboarding_answers` | user_id, respuestas (jsonb con claves), version_formulario | Ejemplo: `{areas:["salud_fisica","social"],objetivos:["mover_mas","tiempo_de_calidad"],historial:"empieza_y_deja",tiempo:"10_20",momento:"noche",obstaculo:"olvido",acompanamiento:"recordatorio_suave"}`. `version_formulario` = 3. |
| `user_settings` | user_id, presupuesto_min, estilo_notificaciones, estrategias (text[]), horas_por_momento (jsonb), segundo_aviso (bool), **ultima_evaluacion (date)**, **limite_plan_desbloqueado (bool)** | Derivados del formulario (o valores por defecto en modo tradicional, 6.5); el usuario los edita en Perfil. `segundo_aviso` sale de la precedencia 5.6. Los dos últimos campos sirven a la progresión (6.3). |
| `categories` | id, clave, nombre, es_sistema, user_id (nulo si es del sistema) | Las 5 del MVP son del sistema. |
| `habit_catalog` | objetivo, nivel (1–3), variante (`base` o `sin_recursos`), titulo, descripcion, duracion_min, **duracion_reducida_min**, **dias_semana (int[], ISO 1 = lunes … 7 = domingo)**, **momento_fijo** (nulo o clave de momento), sin_recursos (bool), categoria | Catálogo semilla editable sin publicar versión (5.7). |
| `plans` | id, user_id, origen (`ia` o `catalogo`), json_plan, activo, creado_en, **area**, **respuestas** (jsonb: área, objetivos e historial del plan), **ultima_evaluacion (date)**, **limite_desbloqueado (bool)** | **Un plan por área** (varios planes por usuario, decisión del usuario del 20 nov): índice único `(user_id, area)` entre los activos. Se crea cuando el usuario confirma el plan (5.8), con UUID del cliente; si el borrador trae hábitos de dos áreas, se guarda un plan por área. Cada plan tiene su propia revisión de 7 días (`ultima_evaluacion`) y su desbloqueo de 90 días, contados desde su `creado_en`. Las respuestas globales (P4 a P7) siguen en `onboarding_answers`, y el tiempo diario en `user_settings`. |
| `habits` | id, user_id, category_id, plan_id (nulo si es manual), objetivo (nulo si es manual), nivel, usa_duracion_reducida (bool), titulo, descripcion, duracion_min, activo, **archivado_en (timestamptz, nulo)** | `category_id` no cambia después de crear el hábito. «Eliminar» = archivar: se oculta, se cancelan sus avisos y su historial se conserva. `activo` = falso significa pausado. `duracion_min` es 0 solo en hábitos manuales sin duración definida (restricción de la base). |
| `habit_schedules` | id, habit_id, dias_semana (int[]), hora (time, nulo si es flexible), flexible (bool), **notificar (bool)**, **vigente_desde (date)**, **vigente_hasta (date, nulo si es el actual)** | La hora del recordatorio vive solo aquí. Al editar un horario se cierra el vigente y se crea otro, para que las estadísticas pasadas no cambien. `notificar` vale verdadero por defecto, salvo con el estilo `minimo` (7.1). |
| `habit_occurrences` | id, habit_id, fecha_original (date), fecha_nueva (date, nula si se descarta), estado (`movida`, `descartada`), creado_en | Excepciones al patrón semanal (6.2). Única por (habit_id, fecha_original). |
| `habit_logs` | id, habit_id, category_id, fecha (date), estado (`hecho`), completado_en, **xp_otorgado (bool)**, **monedas_otorgadas (bool)** | Único por (habit_id, fecha). Las marcas permiten aplicar y revertir los topes diarios. La reprogramación vive en `habit_occurrences`, no aquí. |
| `habit_places` | id, habit_id, nombre, lat, lng, radio_m | Lugares para geofencing (7.2), hasta 3 por hábito. Reemplaza a la tabla `reminders`: la hora ya vive en `habit_schedules`. |
| `plant_progress` | user_id, category_id, xp, nivel, fase | Único por (user_id, category_id). |
| `wallets` | user_id, saldo | |
| `coin_transactions` | id, user_id, monto, motivo, ref_id, creado_en | Auditoría. |
| `accessories` | id, tipo (`sombrero`, `lentes`, `maceta`), nombre, precio, orden (1–5), imagen | 15 en total; precios en 6.4. |
| `user_accessories` | user_id, accessory_id, categorias_equipadas (lista de plantas; vacía si no está equipado) | Un mismo objeto puede llevarlo más de una planta a la vez; cada planta lleva como máximo un sombrero, unos lentes y una maceta (decisión del usuario, pulidos antes del APK). Equiparlo en otra planta no lo quita de la anterior. |
| `ai_requests` | id, user_id, funcion, estado, tokens, creado_en | Límites de uso. |
| `app_config` | clave, valor (jsonb) | Constantes de recompensas y topes, umbrales de progresión, horas por defecto y precios. La app la cachea en SQLite. |

## 5. Formulario inicial y plan

### 5.1 Pasos, textos y claves

Una pregunta por pantalla, con `ProgressSteps` («Paso 3 de 7»), ayuda breve debajo del título y opción de volver sin perder respuestas. Los textos viven en `i18n/es.ts`; en la base de datos solo se guardan claves.

| # | Pregunta | Ayuda | Tipo | Opciones (texto → clave) |
| --- | --- | --- | --- | --- |
| 1 | ¿En qué áreas te gustaría empezar? | Elige hasta 2. Podrás sumar más cuando estas ya sean parte de tu día. | Hasta 2 | Salud física → `salud_fisica` · Trabajo / Estudio → `trabajo` · Salud mental → `salud_mental` · Finanzas → `finanzas` · Social → `social` |
| 2 | ¿Qué te gustaría lograr primero? | Elige hasta 2. | Hasta 2, solo de las áreas elegidas | Ver 5.2 |
| 3 | Cuando has intentado crear un hábito, ¿qué suele pasar? | No hay respuesta mala: nos ayuda a empezar a tu ritmo. | Única | Es mi primera vez → `primera_vez` · Empiezo con ganas, pero lo dejo en pocos días → `empieza_y_deja` · Lo sostengo unas semanas y luego lo suelto → `semanas_y_suelta` · Casi siempre logro mantenerlo → `mantiene` |
| 4 | ¿Cuánto tiempo al día te gustaría dedicarle? | Es tu límite. Empezaremos con menos para que sea fácil. | Única | Menos de 10 min → `menos_10` · 10 a 20 min → `10_20` · 20 a 40 min → `20_40` · Más de 40 min → `mas_40` |
| 5 | ¿En qué momento del día tienes más espacio libre? | Podrás ajustar la hora exacta al revisar tu plan. | Única | Mañana → `manana` · Mediodía → `mediodia` · Tarde → `tarde` · Noche → `noche` · Varía mucho, mi horario cambia → `varia` |
| 6 | ¿Qué es lo que más se te complica para ser constante? | Elige la que más se parezca a ti. | Única | No me alcanza el tiempo → `poco_tiempo` · Se me olvida → `olvido` · Pierdo la motivación → `motivacion` · Me desanimo cuando fallo un día → `desanimo` · Me distraigo fácilmente → `distraccion` · No tengo los recursos o el espacio → `recursos` |
| 7 | ¿Cómo te gustaría que Habit Green te acompañe? | Puedes cambiarlo cuando quieras en Perfil. | Única | Un resumen cada noche con lo de mañana → `resumen_nocturno` · Un aviso suave a la hora de cada hábito → `recordatorio_suave` · Avisos con mensajes de ánimo → `recordatorio_y_animo` · Lo mínimo, prefiero llevarlo yo → `minimo` |

### 5.2 Objetivos por área (pregunta 2)

La pantalla muestra las opciones agrupadas por área con encabezados H3.

| Área | Opciones (texto → clave) |
| --- | --- |
| `salud_fisica` | Moverme más → `mover_mas` · Dormir mejor → `dormir_mejor` · Comer mejor → `comer_mejor` · Tomar más agua → `tomar_agua` |
| `trabajo` | Organizar mejor mi día → `organizar_dia` · Procrastinar menos → `procrastinar_menos` · Aprender algo nuevo → `aprender_algo` |
| `salud_mental` | Manejar mejor el estrés → `manejar_estres` · Desconectarme de las pantallas → `desconectar_pantallas` · Tomarme tiempo para mí → `tiempo_para_mi` |
| `finanzas` | Saber en qué gasto → `saber_gastos` · Empezar a ahorrar → `empezar_ahorrar` · Evitar compras impulsivas → `evitar_impulsivas` |
| `social` | Mantener contacto con las personas que quiero → `mantener_contacto` · Pasar tiempo de calidad con alguien → `tiempo_de_calidad` · Conocer gente nueva → `conocer_gente` |

`tiempo_de_calidad` reemplaza a `tiempo_sin_celular` para no duplicar `desconectar_pantallas`: se centra en la presencia con otra persona, no en el celular.

### 5.3 Validación (Zod)

- Pregunta 1: 1 a 2 valores. Pregunta 2: 1 a 2 valores, todos pertenecientes a las áreas elegidas.
- Si el usuario cambia las áreas en la pregunta 1, se eliminan los objetivos que ya no corresponden.
- Preguntas 3 a 7: una opción obligatoria.
- Al elegir un tercer elemento, este entra y se quita el primero que se eligió, sin mensaje de advertencia (decisión del usuario en la revisión de diseño). Si se reemplaza un área, se descartan sus objetivos.
- El avance se guarda en Zustand y se persiste en local (`zustand/persist` sobre `expo-sqlite`, 3.2) para retomarlo si se cierra la app.

### 5.4 Parámetros derivados (motor de plan, funciones puras)

| Entrada | Salida |
| --- | --- |
| P1 y P2 | **Un área por plan** (varios planes por usuario, decisión del usuario del 20 nov) y un hábito ancla por objetivo (máximo 2, solo de esa área). Las sugerencias de «Agregar otro hábito» también son solo de esa área. |
| P3 | Nivel inicial: `primera_vez`, `empieza_y_deja`, `semanas_y_suelta` → 1; `mantiene` → 2. Con `semanas_y_suelta` se activan mensajes de apoyo en las semanas 3 y 4. |
| P4 | `presupuesto_min`: 10, 20, 40 o 60. |
| P5 | Hora del recordatorio: `manana` 08:00, `mediodia` 13:00, `tarde` 17:00, `noche` 20:30; `varia` → flexible (ventana 17:00 y segundo aviso a las 20:00). Configurable en `app_config`. Si la fila del catálogo tiene `momento_fijo`, ese momento gana sobre la P5. |
| P6 | `estrategias` (ver 5.5). |
| P7 | `estilo_notificaciones` (ver 5.6 y sección 7). |

**Reglas del motor**

1. Duración máxima por hábito = `presupuesto_min / número de hábitos con duración`. Los hábitos **sin duración** (recordatorios como tomar agua, anotar un gasto o enviar un mensaje: todo lo que no consiste en hacer algo durante un tiempo) duran 0 minutos en el catálogo, no gastan tiempo del día y dicen «Sin duración fija». En el nivel 1 no tienen versión corta: si cuesta, se ofrece apoyo. Cualquier hábito, también del plan, se puede editar a «Sin definir» (decisión del usuario, 20 nov; lista de 23 filas en la migración `20261121000002_habitos_sin_duracion.sql`).
2. Para cada hábito se toma el nivel inicial; si su duración excede el máximo, se baja de nivel. Todos los hábitos de nivel 1 duran 5 minutos o menos, así que siempre cabe al menos el nivel 1.
3. Los días de la semana salen de `dias_semana` de la fila del catálogo (ya no hay una regla global por nivel).
4. Con `poco_tiempo`, la duración es `duracion_reducida_min` de la fila.
5. Con `recursos`, se usa la variante `sin_recursos` cuando la fila base no lo es.
6. Si hay `momento_fijo`, la hora del recordatorio sale de ese momento; si no, de la P5.

### 5.5 Estrategias de apoyo (pregunta 6)

| Clave | Efecto |
| --- | --- |
| `poco_tiempo` | Duración = `duracion_reducida_min`; el resumen destaca «hábitos de pocos minutos». |
| `olvido` | Segundo aviso si el hábito no se completó, según la precedencia de 5.6. |
| `motivacion` | Mensajes de ánimo en los avisos y celebración más visible al completar (planta y monedas). |
| `desanimo` | Reprogramación automática y silenciosa con aviso suave; ningún texto menciona fallos o rachas rotas. |
| `distraccion` | Un solo aviso breve por hábito y temporizador opcional al abrir el hábito. |
| `recursos` | Solo variantes del catálogo sin equipo ni espacio especial. |

### 5.6 Precedencia entre P7 y P6

Regla general: **la P7 decide cuántas notificaciones llegan; la P6 solo ajusta su contenido o su momento.**

| Combinación | Regla |
| --- | --- |
| `olvido` + `recordatorio_suave` o `recordatorio_y_animo` | Segundo aviso 2 h después de la hora del hábito si no se completó. |
| `olvido` + `minimo` | Sin segundo aviso. La revisión del plan muestra el interruptor «Segundo aviso», apagado por defecto. |
| `olvido` + `resumen_nocturno` | Como no hay aviso por hábito, se agrega uno solo al día a la hora del momento (P5 o `momento_fijo`), no «2 h después». |
| `olvido` + `varia` | La ventana ya tiene avisos a las 17:00 y 20:00; no se suma nada. |
| `distraccion` + `recordatorio_y_animo` | Un solo aviso por hábito, con el ánimo dentro del mismo texto, de una línea. |
| `distraccion` + cualquier estilo | Nunca más de un aviso por hábito al día. |
| `motivacion` + `minimo` | Sin avisos extra; el ánimo se muestra solo dentro de la app (celebraciones). |
| `desanimo` + cualquier estilo | Solo cambia el tono y activa la reprogramación silenciosa. |

### 5.7 Catálogo de hábitos semilla

35 objetivos (7 por área) × 3 niveles = 105 filas base, más variantes `sin_recursos` donde hace falta. Las 19 metas que llevaron cada área a 7 (decisión del usuario, 22 nov) están en `20261122000001_metas_nuevas.sql`, con títulos validados por el usuario. Son acciones generales y de bajo riesgo; no hay consejos médicos, dietas ni de inversión, ni cantidades sensibles (calorías, montos, horas de sueño). Los textos son editables en `habit_catalog`.

**Principios**

1. Nivel 1 de 5 minutos o menos, con un verbo concreto y un final claro.
2. Entre un nivel y el siguiente, como máximo el doble o el triple de duración o de frecuencia.
3. Se progresa en una sola dimensión a la vez: duración, frecuencia o complejidad.
4. El usuario elige las cantidades sensibles («una cantidad pequeña que yo elija»).

**Campos nuevos**

- `dias_semana`: días ISO (1 = lunes … 7 = domingo). Patrones por defecto: 1 día → [7]; 2 → [2,5]; 3 → [1,3,5]; 4 → [1,2,4,6]; 5 → [1,2,3,4,5]; 6 → [1,2,3,4,5,6]. Algunas filas usan otro día (por ejemplo, sábado para actividades sociales).
- `duracion_reducida_min`: versión corta para `poco_tiempo` y para días difíciles.
- `momento_fijo`: si existe, gana sobre la P5 (por ejemplo, `dormir_mejor` siempre es de noche).

**Catálogo**

Min = `duracion_min`; Red. = `duracion_reducida_min`; — = sin momento fijo.

| Objetivo | Nv | Título | Min | Red. | Días | Momento fijo | Sin recursos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mover_mas` | 1 | Caminar 5 min | 5 | 2 | 1,2,4,6 | — | Sí |
| `mover_mas` | 2 | Caminar 15 min | 15 | 5 | 1,2,3,4,5 | — | Sí |
| `mover_mas` | 3 | Caminar o moverme 30 min | 30 | 10 | 1,2,3,4,5 | — | Sí |
| `dormir_mejor` | 1 | Dejar el celular lejos de la cama | 2 | 1 | 1,2,4,6 | `noche` | Sí |
| `dormir_mejor` | 2 | Rutina de 10 min antes de dormir | 10 | 5 | 1,2,3,4,5 | `noche` | Sí |
| `dormir_mejor` | 3 | Hora fija para acostarme y rutina de 20 min | 20 | 10 | 1,2,3,4,5,6 | `noche` | Sí |
| `comer_mejor` | 1 | Sumar una fruta o verdura a una comida | 5 | 2 | 1,2,4,6 | — | Sí |
| `comer_mejor` | 2 | Planear mis comidas del día | 10 | 5 | 1,2,3,4,5 | `manana` | Sí |
| `comer_mejor` | 3 | Preparar una comida casera | 30 | 15 | 1,3,5 | — | No |
| `comer_mejor` | 3 (sin recursos) | Elegir una opción con verdura al comer fuera | 10 | 5 | 1,2,3,4,5 | — | Sí |
| `tomar_agua` | 1 | Tomar un vaso de agua al despertar | 1 | 1 | 1,2,4,6 | `manana` | Sí |
| `tomar_agua` | 2 | Un vaso de agua con cada comida | 3 | 1 | 1,2,3,4,5 | — | Sí |
| `tomar_agua` | 3 | Rellenar mi botella tres veces al día | 5 | 3 | 1,2,3,4,5,6 | — | Sí |
| `organizar_dia` | 1 | Escribir mi prioridad del día | 3 | 1 | 1,2,4,6 | — | Sí |
| `organizar_dia` | 2 | Planear mi día en 3 tareas | 10 | 5 | 1,2,3,4,5 | — | Sí |
| `organizar_dia` | 3 | Plan del día y revisión por la noche | 15 | 8 | 1,2,3,4,5 | — | Sí |
| `procrastinar_menos` | 1 | 5 min en la tarea que estoy evitando | 5 | 2 | 1,2,4,6 | — | Sí |
| `procrastinar_menos` | 2 | Bloque de enfoque de 15 min | 15 | 5 | 1,2,3,4,5 | — | Sí |
| `procrastinar_menos` | 3 | Bloque de enfoque de 25 min | 25 | 10 | 1,2,3,4,5 | — | Sí |
| `aprender_algo` | 1 | Leer o estudiar 5 min | 5 | 2 | 1,2,4,6 | — | Sí |
| `aprender_algo` | 2 | Estudiar 15 min | 15 | 5 | 1,2,3,4,5 | — | Sí |
| `aprender_algo` | 3 | Estudiar 30 min | 30 | 10 | 1,2,3,4,5 | — | Sí |
| `manejar_estres` | 1 | Respirar profundo 2 min | 2 | 1 | 1,2,4,6 | — | Sí |
| `manejar_estres` | 2 | Pausa de respiración de 5 min | 5 | 2 | 1,2,3,4,5 | — | Sí |
| `manejar_estres` | 3 | Pausa guiada de 10 min | 10 | 5 | 1,2,3,4,5,6 | — | Sí |
| `desconectar_pantallas` | 1 | Dejar el celular boca abajo 5 min | 5 | 2 | 1,2,4,6 | — | Sí |
| `desconectar_pantallas` | 2 | 15 min sin pantallas | 15 | 5 | 1,2,3,4,5 | — | Sí |
| `desconectar_pantallas` | 3 | 30 min sin pantallas | 30 | 10 | 1,2,3,4,5 | — | Sí |
| `tiempo_para_mi` | 1 | 5 min para algo que disfruto | 5 | 2 | 1,2,4,6 | — | Sí |
| `tiempo_para_mi` | 2 | 15 min para mí | 15 | 5 | 1,2,3,4,5 | — | Sí |
| `tiempo_para_mi` | 3 | 30 min para mí | 30 | 10 | 1,3,5,6 | — | Sí |
| `saber_gastos` | 1 | Anotar un gasto del día | 2 | 1 | 1,2,4,6 | `noche` | Sí |
| `saber_gastos` | 2 | Anotar todos mis gastos del día | 5 | 2 | 1,2,3,4,5 | `noche` | Sí |
| `saber_gastos` | 3 | Anotar mis gastos todos los días | 5 | 2 | 1,2,3,4,5,6 | `noche` | Sí |
| `empezar_ahorrar` | 1 | Apartar una cantidad pequeña que yo elija | 3 | 1 | 7 | — | Sí |
| `empezar_ahorrar` | 2 | Apartar mi cantidad y revisar mi meta | 5 | 3 | 7 | — | Sí |
| `empezar_ahorrar` | 3 | Revisión semanal de ahorro y gastos pequeños | 10 | 5 | 7 | — | Sí |
| `evitar_impulsivas` | 1 | Esperar antes de una compra no planeada | 2 | 1 | 1,2,4,6 | — | Sí |
| `evitar_impulsivas` | 2 | Hacer una lista antes de comprar | 5 | 2 | 1,3,5 | — | Sí |
| `evitar_impulsivas` | 3 | Revisar compras y suscripciones de la semana | 10 | 5 | 7 | — | Sí |
| `mantener_contacto` | 1 | Enviar un mensaje a alguien | 5 | 2 | 1,2,4,6 | — | Sí |
| `mantener_contacto` | 2 | Escribir o llamar con calma a alguien | 10 | 5 | 1,2,4,6 | — | Sí |
| `mantener_contacto` | 3 | Llamada de 20 min | 20 | 10 | 3,6 | — | Sí |
| `tiempo_de_calidad` | 1 | 5 min de atención plena con alguien | 5 | 2 | 1,3,5 | — | Sí |
| `tiempo_de_calidad` | 2 | 15 min de calidad con alguien | 15 | 5 | 1,2,4,6 | — | Sí |
| `tiempo_de_calidad` | 3 | 30 min de una actividad juntos | 30 | 15 | 1,3,6 | — | Sí |
| `conocer_gente` | 1 | Iniciar una conversación breve con alguien | 5 | 2 | 2,5 | — | Sí |
| `conocer_gente` | 2 | Proponer un plan o responder una invitación | 15 | 5 | 6 | — | Sí |
| `conocer_gente` | 3 | Asistir a una actividad o grupo | 40 | 20 | 6 | — | Sí |

Notas:

- `saber_gastos` nivel 3 mantiene el registro diario; la revisión semanal se ofrece como hábito nuevo en la progresión.
- `empezar_ahorrar` es semanal en los 3 niveles y progresa en complejidad.
- `desconectar_pantallas` pasa de 5 → 20 → 40 a 5 → 15 → 30 para no bloquear la progresión con presupuestos bajos.
- `conocer_gente` deja de ser diario; los niveles 2 y 3 son semanales.

### 5.8 Edge Function `generate-plan`

1. Verifica el JWT y aplica un límite diario (`AI_DAILY_LIMIT`, registrado en `ai_requests`). Cuenta las llamadas a la IA de las últimas 24 h (estados `ok`, `error` y `cuota`). Al llegar al límite no se bloquea al usuario: se usa el plan de catálogo (estado `limite`). Sin secretos de IA, el estado es `sin_proveedor`.
2. Valida las respuestas con Zod.
3. **Ejecuta el motor de plan** (5.4) y obtiene los hábitos con duración, nivel, días y horario ya definidos.
4. Envía a la IA, por medio de `AiProvider`, solo claves y parámetros (sin nombre ni correo) y pide JSON con textos: resumen del plan, título y descripción personalizados por hábito.
5. Valida con Zod. Si falla, reintenta una vez; si vuelve a fallar o el proveedor responde con un error de cuota, usa los textos del catálogo.
6. **Devuelve un borrador sin guardarlo.** Solo se escribe en `ai_requests`.

**Guardado al confirmar.** La pantalla de revisión trabaja sobre el borrador (cambiar hora, bajar nivel, quitar). Para «Bajar nivel», el borrador trae las versiones de los niveles inferiores de cada hábito (`alternativas`, con textos del catálogo). Al bajar de nivel se conserva la hora elegida. El plan conserva al menos un hábito, así que «Quitar» no aparece en el último. En la demo, «Empezar» guarda directo en Supabase con upserts y UUID del cliente, así que reintentar no duplica filas. Desde la Entrega 3 pasa a SQLite. Al pulsar «Empezar», la app crea en SQLite `plans`, `habits`, `habit_schedules` y `user_settings`, con UUID del cliente, y los sincroniza (3.4). Si el usuario abandona la revisión, en la base no queda nada guardado; el borrador sí se queda en el almacén clave-valor del teléfono, y si la app se cierra durante el formulario o la revisión, al abrirla vuelve a esa pantalla con la pila completa (Empezar → modo → pasos), así que «atrás» sigue llevando al paso anterior y no se pide otro plan a la IA (decisión del usuario, pulidos antes del APK).

**Sin conexión.** El formulario se puede llenar sin red (el avance se guarda en local), pero «Crear mi plan» requiere conexión. Sin red se muestra «Necesitas conexión para crear tu plan» con un botón «Reintentar».

**Proveedor.** `AI_PROVIDER` (`gemini`, `claude` u `openai`) elige la implementación. Por defecto se usa Gemini con su nivel gratuito (Google AI Studio). Ese nivel tiene límites de uso y Google puede usar los datos enviados para mejorar sus productos: por eso solo se envían claves del formulario.

### 5.9 Esquema de la respuesta de la IA (Zod)

La IA no decide números, días ni horarios. El código los fusiona después.

```ts
const Objetivo = z.enum([
  "mover_mas","dormir_mejor","comer_mejor","tomar_agua",
  "organizar_dia","procrastinar_menos","aprender_algo",
  "manejar_estres","desconectar_pantallas","tiempo_para_mi",
  "saber_gastos","empezar_ahorrar","evitar_impulsivas",
  "mantener_contacto","tiempo_de_calidad","conocer_gente",
]);

const TextoHabito = z.object({
  objetivo: Objetivo,
  titulo: z.string().min(3).max(60),
  descripcion: z.string().max(200),
});

const RespuestaIA = z.object({
  resumen: z.string().max(300),
  habitos: z.array(TextoHabito).min(1).max(2),
});
```

La validación también comprueba que la IA devuelva exactamente los objetivos pedidos. El plan final (`Plan`) es el resultado de combinar `RespuestaIA` con el motor.

### 5.10 Seguridad y calidad de la IA

- La clave de la API vive solo en los secretos de la Edge Function.
- No se insertan textos libres del usuario en el prompt; solo claves de opción.
- El prompt prohíbe consejos médicos, dietas extremas, de inversión, cantidades sensibles y mensajes con culpa.
- Si una persona elige `manejar_estres` en Salud Mental, la pantalla de revisión puede mostrar una nota informativa para buscar apoyo profesional si el malestar es intenso, sin diagnósticos.
- El borrador de los prompts de `generate-plan` y `adjust-plan` está en `docs/textos.md`.

## 6. Lógica de negocio

### 6.1 Recompensas (oculta al usuario)

| Regla | Valor |
| --- | --- |
| XP por hábito completado | 2 |
| XP por nivel | **4** (2 hábitos por nivel) |
| Nivel máximo | 30 |
| Fase 1 / 2 / 3 | Niveles 0–14 / 15–29 / 30 |
| Hábitos para la fase 2 / 3 | 30 / 60 por planta |
| Tope de XP | **1 hábito por planta al día** suma XP |
| Monedas por hábito completado | 10 |
| Tope de monedas | **5 hábitos al día** dan monedas (50 monedas máximo) |

- Cada categoría tiene su planta. El XP va a la planta de la categoría del hábito.
- Nivel = `min(30, floor(xp / 4))`. Fase = 1 si nivel ≤ 14, 2 si nivel ≤ 29, 3 si nivel = 30.
- En nivel 30 la planta deja de acumular XP. Las monedas siguen.
- El usuario nunca ve XP ni niveles; solo ve la planta, su cambio de fase y mensajes de celebración. El saldo de monedas sí es visible.
- No hay penalización: nunca se resta XP ni monedas por no cumplir.
- Un registro por hábito y fecha (restricción única en `habit_logs`). Deshacer el mismo día revierte lo que ese registro otorgó.
- Los topes se cuentan por `fecha` del hábito en la zona horaria del usuario. Los hábitos que superan el tope se registran igual y cuentan para estadísticas y progresión; solo no suman XP o monedas.
- **Mensaje del tope de monedas:** al completar un hábito cuando ya se otorgaron las monedas de 5 hábitos ese día, no aparece la animación de moneda y se muestra un mensaje suave: «¡Hoy ya ganaste todas tus monedas! Este hábito igual cuenta para tu progreso». El tope de XP no se comunica, porque el XP no es visible.

**Ritmo esperado**

| Perfil | Fase 2 | Fase 3 |
| --- | --- | --- |
| Típico (un hábito por planta, 5 días por semana, 70 % de cumplimiento ≈ 3.5 por semana) | ~2 meses | ~4 meses |
| Constante (diario, 100 %) | ~1 mes | ~2 meses |

La fase 2 del perfil típico coincide con la mediana de 66 días para automatizar un hábito (Lally y colaboradores, 2009).

**RPC `complete_habit(habit_id, fecha)`:**

1. Inserta el registro; si existe una fila marcada con `eliminado_en`, la reutiliza (3.4). Si ya existe activa, no hace nada.
2. Si ningún otro registro de esa planta en esa fecha tiene `xp_otorgado` y el nivel es menor a 30, suma 2 XP a `plant_progress`, recalcula nivel y fase y marca `xp_otorgado`.
3. Si el usuario tiene menos de 5 registros con `monedas_otorgadas` en esa fecha, suma 10 monedas, registra la transacción y marca `monedas_otorgadas`.
4. Devuelve si hubo cambio de fase, para disparar la animación.

**RPC `uncomplete_habit(habit_id, fecha)`:** la interfaz solo lo ofrece para hoy. El servidor acepta la misma tolerancia de 7 días que `complete_habit` (3.4), para que un «deshacer» hecho sin conexión cerca de la medianoche no se rechace.

1. Marca el registro con `eliminado_en` (borrado suave, 3.4), quita sus marcas y revierte el XP y las monedas que tenía.
2. Si revirtió XP y otro registro de la misma planta y fecha no lo tenía, le transfiere el XP. Lo mismo con monedas para el primer registro del día sin ellas.

La app calcula lo mismo en local para respuesta inmediata y reconcilia al sincronizar. El servidor es la fuente de verdad. Las constantes viven en `app_config`, cacheadas en SQLite.

**Implementación (Entrega 4).** Las dos RPC devuelven jsonb (`{xp, monedas, fase_anterior, fase}`) y bloquean el monedero del usuario al empezar, para que dos check-ins simultáneos no cuenten doble los topes. Son idempotentes: completar algo ya completado o deshacer algo ya deshecho no otorga ni quita nada. **Al deshacer, el saldo nunca baja de 0**: si las monedas ya se gastaron, se quita solo lo que hay. En el teléfono, `src/features/rewards/domain/recompensas.ts` replica el cálculo; la sincronización sube la cola antes de descargar, así que los valores del servidor reemplazan a los locales.

**Protección de monedas (decisión del usuario, migración `20261105000001`).** La app no puede comprobar que un hábito se hizo de verdad; estas reglas acotan el abuso al tope de 50 monedas diarias:

- **Pago único por hábito y día.** Al desmarcar se devuelve lo que alcance del saldo. Si se devolvió completo, el lugar queda libre y volver a marcar paga. Si no, `habit_logs.monedas_sin_devolver` queda en verdadero: ese hábito no vuelve a pagar ese día, ese pago sigue contando para el tope y no se transfiere a otro registro.
- **Eliminar también devuelve.** La RPC `archivar_habito(p_habit_id, p_fecha)` archiva y, si el hábito tiene monedas en esa fecha, devuelve lo que alcance y marca `monedas_sin_devolver`. El registro y el XP se conservan.
- **Validaciones de `complete_habit`.** Rechaza hábitos en pausa (`P0002`) o que no tocan esa fecha según su horario vigente o una ocurrencia movida (`no_programado`). Una fecha anterior a otro registro ya recibido se guarda sin XP ni monedas: evita cobrar días pasados atrasando el reloj, y la cola envía en orden, así que el uso normal sin conexión no se afecta. En el teléfono, si la fecha es anterior al último registro, no se marca y se muestra «Revisa la fecha de tu teléfono: parece estar atrasada».

### 6.2 Reprogramación de hábitos fallidos

Reprogramar es **mover la ocurrencia a un día libre, fuera del patrón semanal del hábito**. El día original no cuenta como fallado.

**Detección.** Al abrir la app se buscan ocurrencias programadas de los últimos 7 días (sin contar hoy) que no tengan registro ni excepción en `habit_occurrences`. Aplica a los dos modos. **Por hábito se ofrece solo el día más reciente sin hacer**; los anteriores se dejan pasar sin mensaje y se guardan como `descartada` cuando se resuelve la propuesta, para no traer una pila de pendientes (decisión del usuario). La lógica está en `src/features/reschedule/domain/reprogramar.ts`.

**Día destino.** Es el primer día, de hoy a 7 días después, que cumple todo esto (también debe tener horario vigente, así que respeta la fecha de fin del hábito):

1. No está en `dias_semana` del hábito.
2. No tiene ya otra ocurrencia movida del mismo hábito.
3. La suma de duraciones programadas ese día más la de este hábito no supera `presupuesto_min`. Un hábito «Sin duración fija» siempre cabe. Las propuestas se asignan de la más antigua a la más reciente y cada una cuenta las anteriores, para que no caigan juntas en un día que se pasaría.

Si ningún día cumple, se ofrece descartarla («La dejamos para la próxima»).

**Hábitos sin día libre.** Si el patrón del hábito ocupa los 7 días, no se reprograma: la ocurrencia se omite en silencio (sin mensaje) y cuenta como programada y no hecha.

**Editar un horario con ocurrencias movidas.** Si el nuevo horario incluye la `fecha_nueva` de una ocurrencia movida pendiente, esa ocurrencia se marca `descartada`: el día ya tiene la ocurrencia normal del hábito.

**Interacción.**

- **Tarjeta arriba de la lista de Hoy** (no un diálogo, decisión del usuario), una propuesta a la vez con «1 de N»: aceptar, elegir otro día libre o descartar. El mensaje es neutro: «Movimos «{hábito}» al {día}. Puedes cambiarlo». Sin día libre: «Esta semana está completa para «{hábito}». La dejamos para la próxima.» con «Entendido». Al mover una ocurrencia («Está bien» o un día del diálogo) sale un aviso flotante de éxito: «Listo: «{hábito}» quedó para el jueves 19» («para hoy», «para mañana»); al dejarla no hay aviso, porque nada cambió de día (decisión del usuario, pulidos antes del APK).
- Con `desanimo`, se mueve automáticamente y solo se muestra un aviso suave.
- Una ocurrencia movida que tampoco se completa no se vuelve a mover ni a ofrecer, sin mensaje y sin escribir nada: cuenta como programada y no hecha en su fecha nueva (aprobado por el usuario).
- La ocurrencia movida genera su aviso en la nueva fecha (ventana móvil, 7.1).

**Efecto en estadísticas y progresión.**

| Caso | Cuenta como programado | Cuenta como hecho |
| --- | --- | --- |
| Fecha original de una ocurrencia `movida` | No | No |
| Fecha nueva de una ocurrencia `movida` | Sí | Si tiene registro |
| Ocurrencia `descartada` | Sí | No |

### 6.3 Progresión (sobrecarga progresiva)

Solo aplica a los hábitos del plan (`objetivo` no nulo). Los hábitos manuales no suben ni bajan de nivel.

**Cuándo se evalúa.** Al abrir la app, plan por plan: si pasaron 7 días o más desde el `ultima_evaluacion` de ese plan (o desde que se creó). Se evalúan solo los hábitos de ese plan, el hábito nuevo que se propone es de su misma área y se actualiza su fecha. Las tarjetas de los planes que no tocaban se quedan. El tiempo diario y el contador de subidas siguen siendo del usuario.

**Cómo se mide.** Cumplimiento = hechos / programados (con las reglas de ocurrencias de 6.2) en una ventana de los **últimos 14 días**. Los hábitos con 1 o 2 días por semana usan una ventana de **28 días**. Si la ventana tiene menos de 4 ocurrencias programadas (por ejemplo, un hábito recién creado), no se evalúa ese hábito.

| Cumplimiento en la ventana | Acción |
| --- | --- |
| ≥ 85 % | Subir un nivel del hábito (siguiente fila del catálogo) o proponer un hábito nuevo, incluso de otra área, sin pasar de `presupuesto_min` ni del límite de hábitos del plan. El usuario acepta o pospone. |
| 50 % a 84 % | Mantener. |
| < 50 % | Bajar un nivel, con mensaje de apoyo. En el nivel 1 se pasa a `duracion_reducida_min` (`usa_duracion_reducida`); si ya la usa, se mantiene y solo se muestra el mensaje de apoyo. |

**Si el siguiente nivel no cabe en el presupuesto:** (1) mantener el nivel y proponer un hábito nuevo de nivel 1; (2) si tampoco cabe, sugerir subir el tiempo diario en Perfil con un mensaje sin presión.

Al llegar al nivel 3 con ≥ 85 % se propone un hábito nuevo (por ejemplo, la revisión semanal de gastos después de `saber_gastos`).

**Límite de hábitos del plan.**

- Como máximo **4 hábitos activos del plan**. El formulario crea 1 o 2; la progresión puede proponer hasta completar 4.
- **Desbloqueo:** a los 90 días desde `plans.creado_en`, si el cumplimiento de los hábitos del plan en los últimos 28 días es ≥ 85 %, se marca `limite_plan_desbloqueado`. Desde entonces solo limita `presupuesto_min`.
- Los hábitos manuales no cuentan para estos 4. **Límite total del usuario guiado:** hasta 3 hábitos activos contando los del plan y los propios (los pausados y archivados no cuentan), más 1 por cada vez que un hábito del plan sube de nivel (bajar no resta; se cuenta en `user_settings.subidas_plan`). Con el límite del plan desbloqueado (90 días) ya no hay límite. La progresión tampoco propone un hábito nuevo si ya se llegó a este límite, y «Reanudar» (menú ⋮) lo respeta: con el límite alcanzado sale «Ya tienes {n} hábitos activos.», «Para reanudar este, pausa o elimina otro. Conforme avances en tu plan podrás tener más.» y el hábito sigue en pausa. Al tocar «+» con el límite alcanzado sale un diálogo: «Ya tienes {n} hábitos.», «Para sumar otro, pausa o elimina uno. Conforme avances en tu plan podrás agregar más.» y «Entendido»; no se abre el asistente. El modo tradicional no tiene límite (decisión del usuario, pulidos antes del APK).

La IA (`adjust-plan`) solo redacta textos cuando se agrega un hábito o se cambia de nivel; la decisión es código. Sin conexión, o si la IA falla, se usan los textos del catálogo. Al cambiar de nivel, el título personalizado se reemplaza por el del nuevo nivel. Los umbrales viven en `app_config`.

**Decisiones del usuario (Entrega 8).**

- **Dónde:** tarjetas en Hoy, como la reprogramación (una a la vez, «1 de N», después de las de reprogramación; nunca las dos a la vez).
- **Bajar es automático** y su tarjeta ofrece «Entendido» y «Mantenerlo como estaba» (deshace el cambio). Subir y el hábito nuevo se proponen con «Sí, vamos» y «Más adelante».
- **Hábito nuevo:** se propone uno solo, el nivel 1 del primer objetivo que el usuario no tiene en el plan (sin contar archivados), primero de sus áreas, que quepa en el presupuesto.
- **Ventana:** se mide desde el último cambio de nivel (`habits.nivel_desde`), como mucho los 14 o 28 días, hasta ayer (hoy no cuenta). Con menos de 4 ocurrencias el hábito espera a la siguiente revisión.

**Detalles de implementación.**

- «Más adelante» solo cierra la tarjeta: la propuesta vuelve en la siguiente revisión si el cumplimiento sigue igual.
- Como mucho una tarjeta de hábito nuevo (o de «día completo») por revisión. Con el límite de hábitos del plan alcanzado y sin desbloquear no se propone ninguno ni se muestra nada.
- Desde la versión corta, subir primero vuelve a la duración normal del mismo nivel; con `poco_tiempo` la corta es la normal y sube de nivel.
- En el nivel 1 corto con menos del 50 % no hay cambio: solo una tarjeta de apoyo.
- Al cambiar de nivel se conservan la hora y los avisos del hábito; título, descripción, duración y días salen del catálogo (si cambian los días, se crea una versión nueva del horario desde hoy).
- El desbloqueo de los 90 días se guarda en silencio (`user_settings.limite_plan_desbloqueado`).
- La revisión escribe todo en SQLite y lo sube con la cola: las bajadas, `ultima_evaluacion` y el desbloqueo. Espera a que termine la sincronización en curso. Las tarjetas pendientes viven solo en el teléfono (tabla local `progresion_tarjetas`), para no perderse si se cierra la app; no se sincronizan.
- `adjust-plan` recibe solo claves y números (objetivo, nivel, dirección, duración, días, historial, obstáculo); el título base lo toma del catálogo. Devuelve `{titulo, descripcion}`, validado con Zod; la app lo guarda solo si el hábito sigue en ese nivel con el título del catálogo. La lógica está en `src/features/progression/domain/progresion.ts`.

### 6.4 Tienda y precios

| Orden | Precio (monedas) |
| --- | --- |
| 1 | 30 |
| 2 | 60 |
| 3 | 100 |
| 4 | 150 |
| 5 | 250 |

- Mismos precios para los 3 tipos (sombrero, lentes, maceta): 590 por tipo y 1,770 en total.
- El usuario típico gana unas 70 monedas por semana: el primer accesorio llega en la primera semana y la colección completa en unos 6 meses.
- Los precios viven en `app_config` y en `accessories.precio`.
- Un mismo objeto puede llevarlo más de una planta a la vez; cada planta lleva como máximo un sombrero, unos lentes y una maceta (decisión del usuario, pulidos antes del APK). Equiparlo en otra planta no lo quita de la anterior; si esa planta ya llevaba otro del mismo tipo, se le cambia solo a ella. Quitarlo de una planta no lo quita de las demás.
- Los nombres de los 15 accesorios los define el usuario. Mientras tanto se usan los nombres provisionales de `docs/textos.md`.
- **Comprar necesita conexión** (RPC `comprar_accesorio`, que revisa el saldo real; comprar algo que ya es tuyo no cobra otra vez). Sin red: «Necesitas conexión para comprar». **Equipar y quitar funcionan sin conexión** con la operación `update` de la cola sobre `user_accessories`.
- Equipar y quitar se hace desde la pestaña «Objetos» de los detalles de la planta (9.4).
- Arte provisional (Entrega 4): una imagen genérica para plantas y otra para accesorios en las rutas de 9.8; se reemplazan con el mismo nombre de archivo.

### 6.5 Modo tradicional

Quien elige «Prefiero crear mis hábitos» no responde el formulario. Se crea `user_settings` con valores por defecto, todos editables en Perfil:

| Ajuste | Valor por defecto |
| --- | --- |
| `presupuesto_min` | 20 |
| `estilo_notificaciones` | `recordatorio_suave` |
| `estrategias` | vacío |
| Hora del recordatorio | La que el usuario elige al crear cada hábito |
| `segundo_aviso` | Apagado |
| `horas_por_momento` | Vacío: se usan las de `app_config`. Desde Perfil se cambian las horas generales (hábitos nuevos, resumen y horario flexible); cada hábito conserva su hora. |

- Los hábitos manuales (`objetivo` nulo) **no entran en la progresión**: no suben ni bajan de nivel.
- Sí aplican la reprogramación (6.2), las recompensas, los topes y las estadísticas.
- **El presupuesto no limita la creación.** Si un hábito nuevo hace que la suma de un día supere `presupuesto_min`, se muestra un aviso suave y `presupuesto_min` sube a esa suma. La reprogramación usa el valor actualizado. **Nunca baja solo**, aunque se pausen, eliminen o acorten hábitos: es un ajuste del usuario, que lo baja en Perfil, y la progresión (6.3) lo usa para decidir si caben niveles o hábitos nuevos.
- Al crear un hábito manual se piden: nombre, categoría (fija después de crearlo), duración, días, hora y si se quiere aviso.
- **Asistente de crear y editar (revisión de diseño):** tres pasos (mockups «Crear hábito #1–#3»): 1) nombre (3 a 30 caracteres) y descripción opcional (hasta 100), con contador «n/30» y «n/100» bajo cada campo (decisión del usuario, pulidos antes del APK; al editar, un nombre o descripción que ya era más largo, como los títulos del catálogo, se respeta pero no puede crecer); 2) categoría (fija al editar); 3) días de la semana (al menos uno) y una lista con **Recordatorios** (hora con el reloj de Android, o «Ninguno»), **Duración** (ruedas de horas y minutos, como las de fecha; tocar el número del centro permite escribirlo. Los hábitos propios llegan hasta 23 h 59 min y al crearlos empiezan en «Sin duración fija», guardado como 0; no hay botón aparte: basta dejar las ruedas en 0 h 0 min. Sin duración no se muestra en la tarjeta, cuenta 0 en el tiempo diario y los avisos no mencionan minutos. Los del plan siempre tienen duración (con 0 h 0 min «Aceptar» se apaga) y su máximo es `presupuesto_min` entre los hábitos activos del plan, sin bajar de lo que ya tienen), **Fecha de inicio** y **Fecha de fin** (selector de mes y día; el año es la próxima vez que ocurre la fecha). Inicio y fin se guardan en `vigente_desde` y `vigente_hasta` del horario: al crear, el inicio es hoy o después; al editar, el fin cambia en el mismo horario y el inicio solo si el hábito todavía no empieza. **Sin recordatorio** = horario sin hora y `notificar` falso (migración `20261104000001`). Al crear se vuelve a la pestaña Hábitos. «Recordatorio» empieza siempre en «Ninguno»: los recordatorios necesitan el permiso de avisos, que se pide al elegir una hora (7.1). El reloj abre en la hora de «Mañana» de Perfil. Las frecuencias por mes, por año y «cada cierto tiempo» quedan para después de la demo.
- **Salir con cambios sin guardar** (decisión del usuario): la X o «atrás» en el primer paso abren un diálogo «¿Guardar los cambios?» con «Guardar» (valida; si falta algo, lleva al paso del primer error), «Descartar» y «Cancelar». Sin cambios, sale directo. Aplica a crear y a editar.
- **Borrador al crear** (decisión del usuario, pulidos antes del APK): lo escrito y el paso se guardan en el teléfono mientras se crea un hábito. Si la app se cierra a medias, al volver a «Crear hábito» sale «Tienes un hábito sin terminar. ¿Seguimos?» con «Cancelar» (borra el borrador y abre el asistente vacío) y «Seguir» (que abre en el paso donde iba); «atrás» cierra sin decidir y lo conserva. Se borra al guardar, al descartar, al salir sin cambios o a los 7 días; una fecha de inicio que quedó en el pasado pasa a hoy. Al editar no hay borrador.
- El aviso de presupuesto también se aplica al editar la duración o los días de un hábito.
- **Sin modo fijo** (decisión del usuario, 20 nov): quien empezó creando sus hábitos puede crear un plan desde Perfil → Mis planes (su primer plan pregunta los 7 pasos y guarda sus ajustes), y cualquiera puede terminar un plan.

### 6.6 Mezcla de modos

- Un usuario guiado puede crear hábitos manuales con las mismas reglas que en 6.5: sin progresión, sin contar para el límite de 4 hábitos del plan y con el aviso de presupuesto.
- `profiles.modo` indica cómo empezó el usuario; no restringe qué tipo de hábitos puede tener. Perfil ya no lo muestra.
- **Mis planes** (Perfil): un plan por área, cada uno con sus hábitos («(en pausa)» si lo están) y «Terminar plan». «Crear plan» (necesita conexión) abre el formulario en la ruta `/plan-nuevo`, dentro de la app: si el usuario ya hizo el formulario, solo pregunta 3 pasos (P1 «¿Para qué área es este plan?», P2 y P3) y reusa P4 a P7; si no, los 7. Las áreas que ya tienen plan salen deshabilitadas con «Ya tienes un plan de esta área». El plan nuevo se acomoda en el tiempo que dejan libre los hábitos que ya tiene (el día más cargado): si no alcanza, arranca en el nivel 1; si aun así pasa del tiempo diario, la revisión avisa «Este plan pasa tu tiempo diario por {n} min…» y al guardar el tiempo diario sube a lo necesario. Un plan siguiente no toca los ajustes ni las respuestas globales. Al guardar se vuelve a Hoy.
- **Detalle del plan** (`/detalle-plan/[id]`, al tocar una tarjeta de Mis planes; decisión del usuario, acomodo «secciones apiladas»): encabezado con el área, «Desde el {día} de {mes}» y «Tu meta: {objetivos}»; «Resumen» en una tarjeta (cómo vas: hechos de las últimas 2 semanas con la barra de Hoy o, con menos de 4 días programados, «Todavía es pronto para medir…»; próxima revisión: días que faltan y «Cada 7 días vemos cómo te fue y te proponemos ajustes.») y, debajo, la propuesta pendiente de ese plan con sus mismos botones; si un hábito va por debajo del 50 % en su ventana, su fila sugiere «¿Lo hacemos más ligero?»; «Hábitos del plan» (filas tocables con días, hora, duración o «Sin duración fija», racha y «En pausa»; tocar abre la edición; el ⋮ suma «Hacerlo más ligero» y «Sacar del plan» a Editar, Pausar o Reanudar y Eliminar); «Agregar un hábito al plan» (si hay lugar) y, abajo del todo, «Terminar plan» como botón principal verde con confirmación (critique de Impeccable y decisión del usuario).
- **Acciones a mano** (aprobadas por el usuario, cambian la progresión): **hacerlo más ligero** baja el hábito un paso ahora, con el mismo paso que la revisión (nivel anterior o versión corta), reinicia su ventana y pide textos a la IA; no aparece si ya está en su paso más ligero. **Sacar del plan** lo deja como hábito propio con su historial (si era el último, el plan se termina). **Agregar un hábito al plan** ofrece las 3 versiones del catálogo de cada meta libre de su área (primero las más ligeras), de 4 en 4 con «Sugerir otros hábitos»; las de nivel 2 o 3 dicen «Este empieza un poco más retador» y el hábito entra en el nivel elegido. Respeta los límites y, si no cabe en el tiempo diario, lo avisa y lo sube a lo necesario. Subir de nivel sigue siendo solo con la revisión.
- **Un solo toque por acción** (pulidos): los botones, diálogos, tarjetas y filas tocables ignoran un segundo toque mientras la acción está en curso (o 600 ms), para no abrir la misma pantalla dos veces ni repetir una acción (`src/lib/candado.ts`).
- **Terminar plan** (con confirmación): el plan queda inactivo y sus hábitos pasan a ser propios, con su historial, racha y planta; ya no suben ni bajan de nivel. Se quitan sus tarjetas de progresión. Funciona sin conexión.

## 7. Notificaciones y ubicación

### 7.1 Recordatorios por hora y día

**Ventana móvil.** No se usan disparadores semanales repetitivos, porque no se pueden cancelar para un solo día (segundo aviso) y su texto es fijo (ánimo rotativo, resumen con los hábitos de mañana). En su lugar, `expo-notifications` programa **avisos con fecha concreta para los próximos 7 días** (propuesta), con el texto ya resuelto. Los textos están en `docs/textos.md`.

| Tema | Regla |
| --- | --- |
| Cuándo se recalcula | Al abrir la app y al volver a primer plano. Al crear, editar, pausar o eliminar un hábito. Al completar o deshacer, lo que cancela el segundo aviso de ese día. Al cambiar ajustes y al reprogramar. |
| Tope | iOS permite 64 notificaciones programadas por app. Aunque la demo sea en Android, se usa el mismo tope de 60 para no rehacerlo después. Si sobran, se ordenan por fecha y se recortan los días más lejanos. Los segundos avisos solo se programan para hoy y mañana. |
| Sin abrir la app | El último aviso de la ventana (día 7) incluye una invitación suave a abrir la app para seguir recibiendo avisos. Opcional: refrescar en segundo plano con `expo-background-task` (no garantizado). |
| Android | Canal propio (`recordatorios`, importancia normal). Sin alarmas exactas (`SCHEDULE_EXACT_ALARM`): en Android 14 o superior exigirían pasar por Ajustes, así que el aviso puede llegar unos minutos tarde. |

- Estilos (pregunta 7):

| Clave | Comportamiento |
| --- | --- |
| `resumen_nocturno` | Una notificación a las 21:00 con los hábitos de mañana. |
| `recordatorio_suave` | Una notificación por hábito a su hora. |
| `recordatorio_y_animo` | Notificación por hábito con mensaje de ánimo rotativo: al programar cada aviso se toma el siguiente mensaje de la lista, sin repetir dos días seguidos. |
| `minimo` | Solo los hábitos con `habit_schedules.notificar` activado. Los hábitos nuevos se crean sin recordatorio con cualquier estilo. «Avisarme» es la fila «Recordatorios» del hábito: elegir una hora activa `notificar` y «Ninguno» lo apaga; no hay un interruptor aparte. |

- La P6 ajusta estos estilos según la tabla de precedencia (5.6): la P7 decide cuántas notificaciones llegan.
- Si el momento es flexible (`varia`): aviso a la hora de «Tarde» (17:00) y segundo aviso 3 h después (20:00) si no hay respuesta. Así sigue la hora que la persona ponga en Perfil.
- Si la fila del catálogo tiene `momento_fijo`, la hora sale de ese momento.
- Canal de Android configurado. Los permisos se piden en contexto, con una explicación previa y no al abrir la app: en la revisión del plan (si se responde que no, el plan se guarda **sin horas**: sus hábitos quedan en «Ninguno» y la persona elige la hora de cada uno después, momento en que se le vuelve a pedir el permiso) y **cada vez que la persona elige la hora de un recordatorio sin tener el permiso**, porque sin él el recordatorio no sonaría. Ahí la hora solo queda puesta si el permiso se concede; si Android ya no deja preguntar, el mensaje ofrece «Abrir ajustes». Si un hábito ya tiene recordatorio y los avisos están apagados, el formulario lo dice y ofrece activarlos. Perfil muestra el mismo aviso.
- El contenido de las notificaciones es amable y sin culpa; nunca menciona fallos.
- No existe una notificación matutina de reprogramación: la reprogramación se detecta al abrir la app y la ocurrencia movida recibe su aviso normal en la nueva fecha.
- **Apoyo de las semanas 3 y 4** (`semanas_y_suelta`): un mensaje por semana dentro de la app (en Hoy). Si el estilo no es `minimo`, también una notificación el lunes de esas semanas, a la hora del momento de la P5.
- **Cómo se programa.** Cada recálculo lee SQLite, decide todos los avisos de la ventana con una función pura (`planificarAvisos`), cancela los programados y vuelve a programar; si lo planeado no cambió, no toca nada. El ánimo rotativo se elige por fecha y hábito, así nunca se repite dos días seguidos sin guardar estado. Con `olvido` y `resumen_nocturno`, el aviso diario lista los hábitos pendientes del día. La invitación del día 7 llega un minuto después del último aviso. Al cerrar sesión se cancelan todos.

### 7.2 Recordatorios por ubicación (versión básica, última entrega)

Es la entrega 10 y el primer recorte si falta tiempo (2.5).

- `expo-location` con geofencing y `expo-task-manager`. Se ofrece desde el detalle de un hábito (no en el formulario). Los lugares se guardan en `habit_places`.
- Hasta 3 lugares por hábito, radio de 100–200 m.
- **Tope de regiones:** 20 activas en total, el límite de iOS, para no rehacerlo después. Si se supera, se priorizan los hábitos programados para hoy y, entre ellos, los creados más recientemente.
- Al entrar a la región se dispara una notificación local, una vez al día por hábito y solo si el hábito está programado para hoy y no está hecho. La fecha del último aviso por hábito se guarda en SQLite, donde la tarea en segundo plano puede leerla.
- Requiere development build, permiso de ubicación en segundo plano y los textos de permiso en `app.json`. Sin permiso, el hábito sigue con su recordatorio por hora.
- La ubicación no se envía a la IA, no se sincroniza fuera de `habit_places` y no se usa para otros fines.

## 8. Estadísticas

| Vista | Métrica | Gráfica |
| --- | --- | --- |
| Semanal | Cumplimiento diario (hechos / programados) | Barras por día |
| Mensual | Cumplimiento por semana y por categoría | Barras |
| Anual | Cumplimiento por mes | Línea |

- Cálculo desde SQLite para que funcionen sin conexión. **Sin filtro por hábito (decisión del usuario, Entrega 7):** los hábitos se agrupan bajo el encabezado de su área, como en Hábitos, y cada uno tiene su propia cuadrícula. **Filtro por área (decisión del usuario, Entrega 7):** en Semanal y Mensual se puede ver «Todos» (todo, como antes) o una sola área; con un área, la frase, las barras y las secciones cuentan solo sus hábitos. Las opciones son las áreas con hábitos en el periodo; el filtro se conserva al cambiar de periodo y de pestaña, y vuelve a «Todos» si el área se queda sin hábitos en el periodo que se ve. Con una sola área no se muestra. Se puede ir a periodos anteriores con flechas, hasta el del primer horario.
- **Qué cuenta (decisiones del usuario, Entrega 7).** Una ocurrencia es un día del patrón vigente o un día al que llegó por reprogramación. Una movida cuenta en su fecha nueva y no en la original; una descartada cuenta como no hecha. **Hoy solo suma lo ya hecho:** lo pendiente de hoy no entra en «de N» ni rompe la racha. Un hábito **archivado** cuenta hasta el día anterior a archivarlo. Uno **en pausa** cuenta hasta su último registro (no se guarda desde cuándo está en pausa), así que pausar no se ve como fallos y su racha queda congelada.
- **Periodos:** semana ISO (lunes a domingo, barras por día), mes natural (barras por semana recortada al mes, con etiquetas «3–9») y año natural (línea por mes, cortada en los meses sin días). Sin porcentajes: «Cumpliste 12 de 15 esta semana» («esa semana» en periodos pasados). Sin nada que contar: «Todavía no hay nada que contar esta semana.» o «No tenías hábitos esa semana.». La carga inicial baja 365 días de registros, así que la mejor racha mira ese tiempo.
- Los hábitos que superan los topes de XP o monedas cuentan igual en las estadísticas.
- Los hábitos archivados conservan su historial y siguen contando en los periodos pasados.
- **Rachas por hábito:** número de ocurrencias programadas seguidas que se completaron. Los días no programados no la rompen. Una ocurrencia movida cuenta en su fecha nueva. Una ocurrencia descartada o no hecha la rompe. Se muestran la racha actual y la mejor racha. Al romperse, se destaca el mejor valor histórico con una invitación a retomar, nunca «perdiste tu racha». Con `desanimo`, solo se muestra la mejor racha.
- Estilo: gráficas sobre tarjeta `campo` con sombra; barras en `accent`, pista en `divisor`, etiquetas en `ink`. Cada gráfica incluye un resumen en texto («Cumpliste 5 de 7 hábitos esta semana») para lectores de pantalla.

## 9. Diseño de pantallas y sistema visual

**Antes de diseñar o implementar cualquier pantalla o componente se consulta [`docs/Guía de UX UI.md`](Guía%20de%20UX%20UI.md).** Es la fuente de verdad de las reglas visuales: paleta y tokens, contrastes medidos, tipografía, espaciado, componentes y reglas de Android (Material). Esta sección 9 describe qué lleva cada pantalla. Si una regla visual de esta sección difiere de la guía, gana la guía y se corrige aquí.

**Los mockups (Figma) mandan en composición y estilo.** Cuando difieran, se actualiza esta sección para reflejarlos. Si un mockup rompe una regla de accesibilidad de la guía (contraste, zona táctil de 48 dp, estados solo por color), se aplica el ajuste mínimo y se anota aquí; la lista de desviaciones está en la sección 9 de la guía. Los mockups cubren las pantallas principales; las secundarias y los estados vacío, de carga y de error se diseñan con las reglas de la guía.

### 9.1 Mapa de navegación

| Zona | Pantallas |
| --- | --- |
| Auth | Bienvenida, registro, inicio de sesión, recuperación |
| Onboarding | Elección de modo, formulario (7 pasos), generando plan, revisión del plan |
| Pestañas (5) | Hoy, Hábitos, Estadísticas, Jardín, Perfil |
| Otras | Crear/editar hábito, recordatorios, tienda, detalles de la planta (fases, hábitos y objetos), ajustes de notificaciones |

La barra inferior tiene exactamente 5 ítems, el máximo recomendado por la guía.

### 9.2 Tokens

Los valores vigentes y sus contrastes están en `docs/Guía de UX UI.md`, secciones 1 y 2, y en `src/theme/tokens.js`. Resumen:

| Token | HEX | Uso |
| --- | --- | --- |
| `bg` | #FBFBF6 | Fondo liso de pantalla |
| `campo` | #FFFFFF | Tarjetas, campos, barra inferior, menús y diálogos |
| `accent` | #2E7D4F | Botón principal, selección, casilla marcada, barra de avance, pestaña activa |
| `accent-oscuro` | #24663F | Botón principal presionado |
| `accent-claro` | #DFF2E4 | Estado presionado, píldora de la pestaña activa, etiquetas |
| `borde` | #859488 | Bordes de controles |
| `divisor` | #D6E8DB | Líneas, pistas de barras, botón deshabilitado |
| `error` | #B8493D | Borde, icono y texto de error |
| `error-claro` | #FBE3DF | Fondo de los avisos de error |
| `moneda`, `moneda-claro`, `moneda-fondo`, `moneda-texto` | #B7791F, #E9B44C, #FFF0CC, #7A4F0E | Monedas y saldo |
| `tintes` | Uno por área | Tarjetas del Jardín e iconos de categoría |
| `ink` | #1E2A22 | Texto e iconos neutros |
| `ink-soft` | #566459 | Texto de apoyo |

Tipografía (Lexend Deca, como en los mockups): H1 32/700, H2 24/700, H3 20/600, cuerpo 16/400, pequeño 14/400, botón 19/700. Espaciado en múltiplos de 8; márgenes de 16 a 32 dp; radios 12 (campos), 16 (botón de acción), 20 (tarjetas), 999 (píldoras y casillas).

### 9.3 Componentes (React Native)

**Renovación visual (decisión del usuario).** Dirección «Jardín alegre», con referencias de acabado en Finch y en Todoist o TickTick: fondo casi blanco y liso, un verde como color principal, un tinte por área y un dorado para las monedas, sin bordes oscuros. Reemplaza los colores de Figma en la app; el acomodo de los mockups no cambia, y las pantallas de Figma no se modifican. Login y registro piden solo correo (sin «nombre de usuario» ni botones de Google y Facebook, que quedan para antes de publicar).

| Componente | Especificación |
| --- | --- |
| `Button` primario | Fondo `accent`, texto blanco 19/700, alto 48 dp, sin borde. Presionado: `accent-oscuro`. Deshabilitado: `divisor` con texto `ink-soft`. **Uno por pantalla.** |
| `Button` secundario | Transparente, texto `ink`, borde 2 px `borde`. |
| `Button` terciario | Texto `ink` subrayado, sin borde, área táctil mínima 48 dp. |
| `ActionSquare` | Botón cuadrado `accent` de 48 dp con icono blanco («+» y bolsa de la Tienda). |
| `Card` | Fondo `campo`, radio 20, relleno 16, sombra suave. Presionada: `accent-claro`. |
| `Field` | Fondo `campo`, borde 2 px `borde`, radio 12, alto 48. Etiqueta siempre visible sobre el campo. **Enfocado: borde `accent`.** Error: borde `error` y una X dentro del campo; el mensaje va debajo o, en login y registro, en un solo aviso bajo los campos. Válido (registro, tras intentar enviar): marca de verificación dentro del campo. |
| `OptionChip` (opciones del formulario) | Alto mínimo 48 px, con sombra. No seleccionado: fondo `campo` y borde 2 px `divisor`. **Seleccionado: relleno `accent-claro`, borde 2 px `accent`, icono de verificación y texto en negrita** (no depende del color). Rol de accesibilidad `radio` o `checkbox` con estado `selected`. |
| Avisos de login y registro | Un solo `Alert` de error bajo los campos al pulsar el botón (mockups «Login/Registrar #1.1–1.3»): campos vacíos («Por favor, ingresa tu correo y contraseña» / «Por favor, llena cada uno de los campos»), contraseñas distintas, credenciales incorrectas («Tu correo o contraseña son incorrectos») y sin conexión («No hay conexión a internet. Inténtalo más tarde»). Con error del servidor se marcan todos los campos. |
| `ProgressSteps` | Barra «3/7» dentro de una píldora: pista `divisor`, relleno `accent` y texto blanco. |
| `TabBar` | Fondo `campo`, texto e iconos `ink`. Activo: píldora `accent-claro` detrás del icono `accent` y texto en negrita. La pestaña de estadísticas se llama «Progreso». |
| `Alert` | Error `error-claro`/`error`; advertencia #F4D9A8/#A86F42; éxito #DFF2E4/#2E7D4F; informativo #E8ECE6/`ink-soft`. Siempre icono + texto. |
| `PlantPanel` | Tarjeta con el tinte de su área, sin sombra, y radio 20; la planta (PNG transparente) va centrada. |

### 9.4 Pantallas clave

**Bienvenida y elección de modo.** Después de confirmar la cuenta se ve «Empezar» (mockup) y, al pulsarla, la elección de modo con dos opciones: «Quiero un plan para mí» (guiado) y «Prefiero crear mis hábitos» (tradicional). El único botón principal es «Continuar», que se habilita al elegir una.

**Formulario (7 pasos).** Una pregunta por pantalla. La flecha «atrás» y `ProgressSteps` quedan fijos arriba y el botón «Siguiente» fijo abajo; solo se desplaza la pregunta (decisión del usuario: sin botón «Atrás» abajo, se queda la flecha). Arriba: `ProgressSteps`. Cuerpo: título H2, ayuda en texto pequeño (5.1) y opciones como `OptionChip` en lista vertical. Pie fijo: botón secundario «Atrás» y CTA «Siguiente» (en el paso 7, «Crear mi plan»). La pregunta 2 muestra las opciones agrupadas por área con encabezados H3.

**Generando plan** (mockup «Encuesta Inicial: Preparando»). Planta que crece, «Estamos preparando algo único…», «Armamos tu plan con base en tus respuestas. Solo tomará unos segundos.» y tres pasos («Revisando tus metas», «Eligiendo micro-pasos pequeños», «Ajustando a tu ritmo») que pasan de reloj a verificación cada 1.2 s; el último espera la respuesta. Si tarda más de 10 s se muestra «Sigue en proceso» y, si falla, se muestra el plan de catálogo sin mostrar errores técnicos.

**Revisión del plan** (mockups «Tu plan está listo», «Editar hábito», «Quitar» y «Sugerencias de hábitos»). Título «Tu plan está listo» y una tarjeta clara por hábito (verificación verde, título, duración, días y hora, etiqueta de categoría) con los enlaces «Editar» y «Quitar». «Editar» abre una hoja inferior con nombre, frecuencia (todos los días o días específicos) y hora del recordatorio (reloj de Android, sujeto a cambio) o «Sin recordatorio». «Quitar» pide confirmación en un diálogo. «+ Agregar otro hábito» abre las sugerencias: 4 hábitos de nivel 1 de objetivos no elegidos (los de las áreas elegidas primero, devueltos por `generate-plan` en `sugerencias`) y «Sugerir otros hábitos» muestra los 4 siguientes; al agregar se confirma en un diálogo. **El plan inicial admite hasta 3 hábitos**; si un día supera `presupuesto_min`, este sube a la suma (como en 6.5). «Bajar nivel» ya no se ofrece aquí. Si aplica la precedencia de 5.6, se muestra el interruptor «Segundo aviso». Nota al pie «Si un día no puedes, tu meta se ajusta sin perder progreso» y CTA «Confirmar plan». En este punto se pide el permiso de notificaciones con un texto previo que explica para qué sirve.

**Colores fuera de la paleta (mockups del plan).** Los diálogos de confirmación y los enlaces «Quitar» y «Agregar» usan `peligro` (#C62828) y `confirmar` (#2E7D4F); los botones de esos colores llevan texto blanco (contraste mayor a 5:1). Las píldoras elegidas de «Editar hábito» van rellenas de `accent` con texto blanco. Las opciones que se ponen en negritas al elegirse reservan el ancho del texto en negritas para no moverse (`StableBoldText`).

**Cambiar de pestaña.** Se toca la barra inferior o se desliza en horizontal entre pantallas (`TopTabs` de `expo-router/js-top-tabs`, con la barra abajo). Las pantallas fuera de las pestañas no se deslizan.

**Hoy** (mockup «Pantalla Dashboard»). De la barra de avance hacia arriba queda fijo y solo se desplazan los hábitos; con letra del sistema de 1.5× o más, o una pantalla muy baja, se desplaza toda la pantalla para no dejar la lista sin espacio. Título «Hoy» y saldo de monedas arriba; la planta más avanzada del usuario, con sus objetos (fase más alta; en un empate, una con hábitos y después el orden de las áreas), de 160 dp o de 120 dp si la pantalla mide menos de 760 dp de alto, con «Tu planta crece con cada paso» (ajuste al texto del mockup, decisión del usuario); «Pendientes de hoy», que cambia a «¡Todo listo por hoy!» cuando todo está hecho, con una barra de avance y «N de M hechos»; tarjetas claras con casilla redonda. Al marcar: casilla rellena de `accent` con ✓ blanca, título tachado y la moneda animada; tocar la casilla otra vez lo deshace. Los avisos del check-in (tope de monedas, pago ya recibido, error) son flotantes y temporales (`Snackbar`), para no mover las tarjetas mientras se marcan. Arriba de la lista va la tarjeta de reprogramación (6.2), y un hábito que llegó movido muestra «Reprogramado para hoy» bajo su hora. Cuando no hay reprogramación pendiente, ahí mismo van las tarjetas de progresión (6.3). **Cambio de día con la app abierta** (pulidos antes del APK): a la medianoche y al volver al frente, si cambió la fecha, todas las pantallas vuelven a leer sus datos en silencio (decisión del usuario); Progreso pasa al nuevo hoy si lo estabas viendo, y se cierran el diálogo de días de la reprogramación, el menú ⋮ y la confirmación de eliminar. Si se toca la casilla de una lista que todavía era de ayer, no se marca nada: la lista se actualiza y sale «Cambió el día. Ya actualizamos tu lista.». **Día sin hábitos programados** (decisión del usuario, pulidos antes del APK): se quitan «Pendientes de hoy» y la barra, y en el lugar de la lista va, centrado, un sol `accent`, «Hoy no tienes pendientes» (H2), «Disfruta el día. Tus hábitos vuelven pronto.» y un botón con borde «Ver mis hábitos» que abre la pestaña Hábitos.

**Hábitos** (mockups «Hábitos #1–#2»). Título y botón «+» (acción principal única), fijos arriba; solo se desplaza la lista. Una sección por categoría con hábitos (icono sobre el tinte del área y nombre), sin filtros por ahora. Cada tarjeta tiene la misma casilla que en Hoy, activa solo si el hábito toca hoy (si no, «No toca hoy»), y el menú ⋮ con Editar, Pausar o Reanudar y Eliminar.

**Ajustes por los mockups (Entrega 3).** Hoy sigue el mockup «Inicio»: saludo, monedas arriba a la derecha, la frase de la planta y «Pendientes de hoy»; sin hábitos muestra «Tu jardín está listo para empezar» con el CTA «Crear mi primer hábito». En Hábitos se mantiene la agrupación por categoría (decisión del usuario) en lugar de «pendientes / diarios» del mockup, para que el check-in viva solo en Hoy; de él se toman el «+» y el menú ⋮ (Editar, Pausar o Reanudar, Eliminar), que se abre como hoja inferior. Crear hábito sigue el orden del mockup (nombre, descripción, categoría con iconos, frecuencia) y agrega duración, hora y «Avisarme» (6.5). La barra conserva las 5 pestañas.

**Jardín** (mockup «Plantas #1»). Título «Jardín», saldo de monedas y un botón cuadrado con icono de bolsa arriba a la derecha, que abre la Tienda (acción principal única); este encabezado queda fijo y solo se desplazan las plantas. Las 5 plantas desde el primer día, en 2 columnas: tarjetas con el tinte de su área, con la imagen de la planta en su fase actual, sus accesorios equipados y el nombre de la categoría; sin números de nivel ni barras de XP. Las plantas de áreas sin hábitos se ven en fase 1 con el texto «Sin hábitos aún»; la explicación completa («Crece cuando agregues un hábito de esta área») va en Detalles y en el lector de pantalla. Tocar una planta abre sus detalles. Si las categorías aún no se han descargado, se muestra un estado vacío. **Desviación del mockup (decisión del usuario):** el saldo junto a la bolsa, para saber si alcanza antes de entrar a la Tienda.

**Detalles de la planta** (mockups «Detalles #1: Hábitos», «#2: Objetos» y «#2.1: Objeto seleccionado»; ruta `src/app/planta/[categoria].tsx`, que reemplaza a la pantalla de equipar). Funciona sin conexión: todo sale de SQLite y equipar va por la cola de salida.

- **Parte superior.** Flecha atrás e imagen grande de la planta en un **carrusel horizontal paginado con las 3 fases**, que abre en la fase actual. Debajo, el nombre de la categoría y después 3 puntos tocables de 48 dp, para que no dependa solo del gesto; el punto actual se distingue también por tamaño. Esta parte queda fija.
- **Fases bloqueadas.** Las fases que la planta aún no alcanza se ven como silueta con candado y el texto «Sigue cuidando tu planta para descubrirla». Nunca se muestran XP, niveles ni cuánto falta (6.1). Se desbloquean solas al llegar a esa fase; no se compran. La vista siempre refleja la fase de `plant_progress`, así que si deshacer un hábito regresa la planta de fase, esa fase vuelve a verse bloqueada.
- **Accesorios.** Los equipados se ven sobre la imagen de la fase actual. No se nombran en pantalla; solo el lector de pantalla los dice («Lleva: …»).
- **Panel inferior.** Fondo `campo` con las esquinas superiores redondeadas y dos pestañas, **Hábitos** y **Objetos**; la activa va subrayada y en negritas. Se cambia tocando la pestaña o deslizando en horizontal dentro del panel, sin interferir con el carrusel de arriba.
  - **Hábitos:** los hábitos de esa categoría con la tarjeta de casilla (marcar los de hoy y menú ⋮). Se aparta de la tarjeta simple del mockup para ser consistente con Hoy y Hábitos (decisión del usuario). Si no hay: «Crece cuando agregues un hábito de esta área» y «Agregar hábito», con el área ya elegida.
  - **Objetos:** los accesorios comprados del tipo elegido, en 3 columnas, con las pestañas **Sombreros, Lentes y Macetas** fijas abajo. Tocar uno se lo pone a esta planta al instante, sin confirmación, y reemplaza al del mismo tipo (6.4), aunque otra planta también lo lleve; tocar el puesto se lo quita solo a esta planta. El puesto lleva relleno `accent-claro`, borde `accent` y ✓. TalkBack anuncia si otra planta también lo lleva. Sin compras de ese tipo: un texto y un enlace a la Tienda.

**Tienda** (mockups «Tienda #1–#3»). Regresar, título y monedero quedan fijos; solo se desplaza la lista. Secciones por tipo en una cuadrícula de 3 columnas (2 con letra de 1.5× o más), con tarjetas `campo` de imagen, nombre y precio en monedas (6.4). Los accesorios sin saldo suficiente dicen «Te faltan N monedas» (no solo atenuados) y los propios, «Es tuyo». Tocar una tarjeta abre una hoja inferior:

- **Te alcanza:** «¿Comprar {objeto}?», con precio, tu saldo y cuánto te quedará; «Comprar por N» y «Ahora no».
- **No te alcanza:** la misma hoja, con cuánto te falta y solo «Ahora no».
- **Comprado o ya es tuyo:** «¡Ya es tuyo!», con tu saldo; «Equipar ahora» y «Seguir en la tienda».

**«Equipar ahora»** pone el objeto y abre Detalles → Objetos, en el tipo de ese objeto. La planta se elige sola, sin pedir nada: la planta desde la que se abrió la Tienda; si no, entre las que todavía no lo llevan (o entre todas, si todas lo llevan): la primera con hábitos que tenga ese tipo libre; la primera con hábitos; la primera con ese tipo libre; o la primera. Desde Jardín, «atrás» regresa a Jardín. Si la planta ya llevaba otro objeto de ese tipo, se reemplaza sin confirmación y Detalles muestra un aviso flotante: «Le pusimos {nuevo} en lugar de {anterior}.» (decisión del usuario, pulidos antes del APK).

**Estadísticas** (pestaña «Progreso»; sin mockup propio: el usuario partió de la pantalla vieja «Calendario» de Figma y eligió entre maquetas de Impeccable). Título y pestañas **Diario / Semanal / Mensual** fijos (`SegmentedControl`, activa con ✓ y negritas); son estado de la pantalla y se cambian solo tocando, porque la barra principal ya se desliza en horizontal (por eso no es un Drawer ni un Stack). **Botón «Hoy»** a la derecha del título (píldora `campo` con borde, icono de calendario y negritas; TalkBack: «Volver a hoy»): aparece solo cuando te alejaste (otro día en Diario u otro periodo en Semanal y Mensual) y regresa a hoy y al periodo actual; el encabezado mide 48 dp para que aparecer no mueva nada. **Diario:** «‹ 16–22 nov ›» (las mismas flechas que en Semanal) y debajo los 7 días de esa semana, de lunes a domingo, fijos: fichas que llenan el ancho de la pantalla (márgenes de 12 dp, zona táctil de 48 dp). Las flechas cambian de semana y queda el mismo día de la semana. **Decisión del usuario tras probarlo:** primero se deslizaba por semanas, pero el gesto cambiaba de pantalla y la lista rebotaba al deslizar rápido, así que se cambió por flechas. Va de la semana del primer horario (como mucho un año atrás) a la que contiene hoy + 7. La elegida lleva borde `accent`, fondo `accent-claro` y negritas; hoy dice «Hoy». Debajo, resumen («Llevas 1 de 3 hoy», «Hiciste 2 de 3 el lunes 16», «El jueves 19 te tocan 3 hábitos») con barra hasta hoy, y los hábitos del día por hora: hoy con la tarjeta de casilla de Hoy (se marcan aquí mismo), los demás días solo consulta («Hecho», «Sin marcar», «Te toca», «· Reprogramado»). **Filtro por área** (Semanal y Mensual; opción B de las maquetas, elegida por el usuario): un campo select de 48 dp entre las flechas y la tarjeta del resumen, con «Todos» o el icono y el nombre del área; al tocarlo sale una hoja inferior «Mostrar» (como la de la Tienda) con «Todos» y las áreas, filas de 56 dp y la elegida con fondo `accent-claro`, ✓ y negritas. Elegir aplica y cierra; tocar fuera o «atrás» cierra sin cambiar. TalkBack: «Filtrar por área: Todos». **Semanal:** «‹ 16–22 nov ›», la tarjeta con la frase y las barras por día, una leyenda y, por área, una tarjeta por hábito con su racha y sus 7 celdas bajo la letra y el número del día. **Mensual:** las flechas con un selector compacto **Mes / Año**; en Mes, la frase con barras por semana y, por área, tarjetas con el nombre, «5 de 6» y la racha a la izquierda y el mini calendario a la derecha; en Año, la línea por mes y una cuadrícula de 7 filas por semana del año por hábito. **Celdas:** hecho = relleno `accent` (con ✓ en la semana), sin marcar = contorno `borde`, pendiente hoy = contorno punteado `accent`, te toca = contorno punteado `borde`, no toca = punto; la forma distingue el estado. **Racha:** cuadro `accent-claro` de 36 dp con el número y una llama `accent`; rota, «Mejor: n» con la llama en `ink-soft`; con `desanimo`, solo la mejor. Cada tarjeta de hábito es un solo elemento para TalkBack con su conteo, su racha y (en la semana) el estado de cada día.

**Perfil** (decisión del usuario, «índice con pantallas»): arriba la cuenta (círculo con la inicial y el correo); una tarjeta con tres filas que resumen y abren lo suyo: **Mis planes** («2 planes», «1 plan» o «Sin planes»; abre `/mis-planes`), **Avisos y horas** (el estilo debajo o, con los avisos apagados en Android, «Avisos apagados» con icono de alerta; abre `/avisos-horas`) y **Tiempo diario** (el valor; abre las ruedas); el aviso de tiempo corto debajo y «Cerrar sesión» al final. Cabe en una sola pantalla. La pantalla **Avisos y horas** contiene: **Avisos** (si Android los tiene apagados, un aviso con «Abrir ajustes», porque tras «Ahora no» la app ya no vuelve a preguntar; estilo y segundo aviso, este solo con estilos por hábito), **Horas** (Mañana, Mediodía, Tarde y Noche, más Resumen nocturno con ese estilo; son las generales: hábitos nuevos, resumen y horario flexible, y cada hábito conserva su hora), **Tiempo diario** (ruedas de horas y minutos, como las de la duración, de 1 min a 8 h; tocar el número del centro permite escribirlo. Si el tiempo ya subió solo por encima de 8 h al crear hábitos, se respeta ese máximo. Debajo del total se ve cuánto suma el día con más hábitos; se puede bajar de ahí y solo se avisa con suavidad, sin tocar los hábitos. La fila muestra el valor en horas y minutos, por ejemplo «1 h 30 min»). Cada cambio se guarda al momento y funciona sin conexión (`update` de `user_settings`). La sección de privacidad y «Eliminar cuenta» (con confirmación explícita) quedan fuera de la demo y se agregan antes de publicar.

### 9.5 Distribución del color

Fondo y tarjetas casi blancos en lo más amplio; tintes de área y dorado donde el contenido lo pide; `accent`, reservado a acciones y estados. Detalle en la guía de UX/UI, sección 7.

### 9.6 Accesibilidad y contraste

Las combinaciones medidas y las prohibidas están en la guía de UX/UI, sección 2.

Reglas complementarias:

- Áreas táctiles de 48 × 48 dp o más (guía de accesibilidad de Android); botones de 48 dp. Si el elemento visible es más chico (los cuadros de días), se amplía la zona táctil con `hitSlop`.
- Cada elemento interactivo tiene `accessibilityRole`, `accessibilityLabel` y `accessibilityState`.
- Escalado de texto del sistema permitido hasta 2× (Android llega a 200 %); solo las etiquetas de la barra de pestañas se limitan a 1.3×. Los diseños no usan alturas fijas para texto.
- **Revisión contra las guías de Android.** Texto con al menos 4.5:1 y bordes de controles con al menos 3:1, calculados en la guía de UX/UI; el texto de ejemplo de los campos va en #46484E al 80 % (al 50 % daba 2.45:1). En Android la pantalla se ajusta al teclado (`KeyboardAvoidingView` con `height`) y el botón «atrás» del sistema regresa al paso anterior del asistente. Observaciones sin cambio: márgenes de 32 dp (los mockups; Material sugiere 16), botón «+» arriba (Material sugiere un botón flotante abajo), solo orientación vertical (las tabletas quedan para antes de publicar).
- Movimiento: duraciones de 150–250 ms con ease-out; con `isReduceMotionEnabled` las animaciones de evolución y celebración se sustituyen por un cambio de imagen con fundido corto.
- Ningún estado depende solo del color.
- Solo tema claro; `userInterfaceStyle: light` en `app.json`.
- Prueba con simulación de daltonismo (deuteranopía y protanopía), donde el verde y el rojo de error pueden acercarse.

### 9.7 Lista de verificación de UX/UI (antes de entregar)

Se usa la lista de la sección 10 de [`docs/Guía de UX UI.md`](Guía%20de%20UX%20UI.md): contrastes calculados, zonas táctiles de 48 dp, estados que no dependen solo del color, un solo botón principal, letra del sistema al 200%, TalkBack, teclado, botón «atrás» del sistema, estados de carga, vacío y error, y prueba de daltonismo. Antes de publicar se agrega la prueba con VoiceOver en iOS.

### 9.8 Arte de plantas y accesorios

- Ruta: `assets/plants/{categoria}/fase{1-3}.png` y `assets/accessories/{tipo}/{n}.png`.
- Las plantas y los accesorios usan PNG con fondo transparente, lienzo cuadrado uniforme (por ejemplo 1024 × 1024) y contorno oscuro (#2C1E18), para que se distingan sobre la tarjeta con el tinte de su área.
- Cada accesorio va centrado en su propio lienzo, para verse bien en la Tienda. `src/features/rewards/imagenes.ts` lo coloca sobre la planta con una tabla de posición y tamaño por tipo y fase.
- Paleta de las plantas coordinada con la del sistema; evitar verdes casi iguales a `accent` y a los tintes.

## 10. Seguridad y privacidad

- RLS en todas las tablas. Las RPC verifican `auth.uid()`.
- Tokens de sesión en `expo-secure-store`.
- Variables públicas en `EXPO_PUBLIC_*`. Secretos de IA solo en Supabase.
- Política de privacidad y eliminación de cuenta dentro de la app (requisito de las tiendas); la eliminación borra los datos en cascada. Ninguna de las dos entra en la demo; se agregan antes de publicar.
- Auth: confirmación de correo obligatoria. La recuperación de contraseña usa un **código** que llega por correo y se escribe en la app (`verifyOtp` con tipo `recovery`), no un enlace: el enlace depende de que el navegador abra la app y falla en Expo Go o si el correo se lee en otro dispositivo. La plantilla está en `supabase/templates/recuperar-contrasena.html` y se copia a mano en el panel de Supabase.
- El nivel gratuito de Gemini puede usar los datos enviados para mejorar los productos de Google; por eso al proveedor solo llegan claves del formulario. Antes de publicar, revisar si se cambia a un nivel de pago o a otro proveedor.
- Las respuestas del formulario incluyen datos sensibles (salud, finanzas): se guardan solo como claves, no hay texto libre, y al proveedor de IA solo se envían claves y parámetros, sin nombre ni correo.

## 11. Calidad, observabilidad y entrega

| Área | Herramienta | Alcance en el MVP |
| --- | --- | --- |
| Estática | ESLint + Prettier + `tsc --noEmit` | Antes de cerrar cada entrega. |
| Pruebas | Jest + React Native Testing Library | Motor de plan (cada combinación de P3, P4, P5, P6, P7, `momento_fijo`, `duracion_reducida_min`, variante sin recursos y el recorte por presupuesto), precedencia P7/P6, validación del formulario (límite de 2, objetivos filtrados por área), nivel y fase con 4 XP por nivel, topes diarios, progresión (incluido el bloqueo por presupuesto), reprogramación, esquemas Zod. Una prueba del flujo del formulario. |
| Pruebas de base de datos | Casos SQL/RPC | `complete_habit`: idempotencia, tope nivel 30, tope de 1 XP por planta al día, tope de 5 monedas al día. `uncomplete_habit`: reversión y transferencia de XP y monedas. |
| Accesibilidad | Revisión manual con TalkBack y la lista 9.7 | Entrega 9. |
| Errores | Sentry | Fuera de la demo; se agrega antes de publicar. |
| CI | GitHub Actions | Fuera de la demo. Lint, tipos y pruebas se corren a mano antes de cerrar cada entrega. |
| Entrega | EAS Build | Perfiles `development` (Android, desde la entrega 3) y `preview` (APK de la demo). `production` y EAS Submit, antes de publicar. |

### Definición de terminado (MVP)

- El flujo completo funciona en Android (APK de preview): formulario → plan → hábitos → check-in → planta y monedas → estadísticas.
- Funciona sin conexión para ver y completar hábitos, y sincroniza al reconectar.
- Las notificaciones por hora y día llegan en un dispositivo Android físico.
- Cumple la lista de verificación 9.7.
- Sin errores críticos abiertos y pruebas de la lógica de negocio en verde.

## 12. Escalabilidad hacia las tiendas

- Categorías propias: `categories` ya admite `user_id`; falta definir qué planta se asigna.
- Catálogo, accesorios y plantas administrables desde la base de datos.
- Recompensas después de la fase 3 (por ejemplo, flores o accesorios exclusivos), ya que la planta deja de crecer.
- Push remotos con `expo-notifications` y tokens en Supabase.
- Cron de reprogramación y resúmenes en el servidor.
- iOS: validar en un iPhone (requiere cuenta de Apple Developer para builds instalables).
- Inicio de sesión con Apple y Google (Apple lo exige si se ofrece otro inicio social).
- Sentry, GitHub Actions, Lottie, eliminar cuenta y política de privacidad (fuera de la demo).
- Internacionalización: textos en `i18n/` desde ahora.
- Modo oscuro: requeriría una segunda paleta con sus propios contrastes (la guía actual no la define).
- Actualizaciones OTA con EAS Update.

## 13. Preguntas abiertas

**Resueltas en la v5**

- Fase 3 justo en el nivel 30. `semanas_y_suelta` empieza en nivel 1. Horas por defecto 08:00, 13:00, 17:00, 20:30 y resumen a las 21:00. Los hábitos simultáneos descuentan del presupuesto.
- Proveedor de IA: Gemini con nivel gratuito detrás de `AiProvider` (3.2, 5.8).
- Cuenta obligatoria con confirmación de correo (10).
- Progresión: ventana de 14 días (28 para hábitos de 1–2 días por semana), mínimo 4 ocurrencias, límite de 4 hábitos del plan con desbloqueo a los 90 días (6.3).
- Rachas por hábito (8). Check-in solo hoy (3.4). Sin notificación matutina (7.1).
- Onboarding sin conexión: se bloquea con mensaje (5.8). Mezcla de modos (6.6). Jardín con las 5 plantas (9.4). Accesorios en una planta a la vez (6.4).
- Textos: Claude los redacta en `docs/textos.md` para revisión.

**Resueltas antes (v3 y v4)**

- Ritmo de la planta, días por semana del catálogo, precios, `tiempo_de_calidad`, precedencia P6/P7, reprogramación a un día libre, ventana móvil de notificaciones y modo tradicional.

**Siguen abiertas**

1. **Nombres de los 15 accesorios.** Los define el usuario; mientras tanto, nombres provisionales en `docs/textos.md`.
2. **Catálogo semilla.** Validar los textos de 5.7 antes de la entrega 2.
3. **Textos.** Revisar y aprobar el borrador de `docs/textos.md`.
4. **Propuestas por validar.** Tolerancia de 7 días en el servidor. (La ventana de 7 días de notificaciones y reprogramación y el no volver a ofrecer una ocurrencia movida ya los aprobó el usuario.)
5. **Pruebas SQL de las RPC (antes de la Entrega 4).** `supabase test db` (pgTAP) necesita Docker Desktop en Windows. Decidir entre instalar Docker o correr las pruebas contra un proyecto de Supabase de desarrollo, separado del de la demo.
