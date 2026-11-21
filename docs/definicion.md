# Habit Green: Definición del proyecto (v5)

Archivo de contexto para desarrollo. Resume qué se construye, con qué stack, las reglas de negocio, el formulario inicial y el sistema visual. Si algo contradice al SDD, gana el SDD. Si hay una duda de negocio sin resolver, se pregunta antes de inventar.

Cambios de la v5:

- Demo **solo en Android** (development build); iOS después.
- IA gratuita: **Gemini** (nivel gratuito) detrás de `AiProvider`, que también admite Claude y OpenAI.
- **Geofencing básico vuelve** como última entrega. Lottie, Sentry y CI quedan fuera de la demo.
- Plan guardado al confirmar; sin conexión no se puede crear el plan.
- Progresión, límite de hábitos del plan, rachas, archivar hábitos, jardín y accesorios definidos (sección 6).

Cambios de la v4:

- Meta de las 3 semanas: **demo funcional** (build de preview), desarrollada por una sola persona. Geofencing y Lottie quedan fuera de la demo.
- Reprogramar = mover a un **día libre fuera del patrón** (`habit_occurrences`).
- Notificaciones con **ventana móvil** de avisos con fecha (SDD 7.1).
- Modo tradicional con valores por defecto. Mensaje suave al llegar al tope de monedas.
- Las rutas de Expo Router viven en `src/app/`.

Cambios de la v3:

- En Social, `tiempo_sin_celular` se reemplaza por `tiempo_de_calidad`.
- Regla de precedencia: la P7 decide cuántas notificaciones llegan; la P6 solo ajusta su contenido o momento.
- El catálogo semilla agrega `dias_semana` por fila, `duracion_reducida_min` y `momento_fijo`.
- Ritmo de XP: 4 XP por nivel, con tope de 1 hábito por planta al día que suma XP y 5 hábitos al día que dan monedas.
- Precios de los accesorios: 30, 60, 100, 150 y 250 monedas por tipo.

## 1. Qué es

App móvil (iOS y Android) de seguimiento de hábitos con dos modos:

- **Tradicional:** el usuario crea y gestiona sus hábitos.
- **Guiado:** un formulario de 7 preguntas genera un plan de hábitos que arranca con poca carga y se adapta con el tiempo.

Público: personas de 22 a 45 años, incluidas quienes les cuesta empezar o sostener hábitos. Idioma inicial: español (tú). Plazo del MVP: 3 semanas. Debe poder escalar y publicarse en App Store y Google Play.

## 2. Alcance del MVP

1. Formulario inicial y plan generado (catálogo de hábitos + IA).
2. Hábitos con 5 categorías fijas: Salud Física, Trabajo / Estudio, Salud Mental, Finanzas, Social.
3. Recordatorios por hora, día y ubicación.
4. Estadísticas semanales, mensuales y anuales.
5. Recompensas: una planta por categoría (3 fases), monedas y accesorios.
6. Progresión adaptativa y reprogramación de hábitos fallidos.

**Fuera del MVP:** categorías creadas por el usuario, push remotos, cron en servidor, funciones sociales, pagos, modo oscuro, insignias.

**Demo de las 3 semanas:** APK de preview para **Android** con el flujo completo y offline. Se construye en 10 entregas verticales; la última es el geofencing básico, que es el primer recorte si falta tiempo. No incluye iOS, Lottie (animaciones con Reanimated), Sentry, GitHub Actions, el temporizador de `distraccion` ni eliminar cuenta. Detalle, punto de control y recortes en SDD 2. Tareas y estado en `docs/backlog.md`.

**Forma de trabajo:** una persona a medio tiempo, con poca experiencia en el stack. Claude implementa por partes y explica cada pieza; el usuario prueba cada entrega antes de seguir.

**Orden de prioridad:** formulario → plan → hábitos y categorías → notificaciones → recompensas → estadísticas → geolocalización (al final, versión básica).

## 3. Stack

| Capa | Tecnología |
|---|---|
| App | Expo (SDK actual) + React Native + TypeScript estricto |
| Navegación | Expo Router |
| UI | NativeWind 4 (tokens en `src/theme/tokens.js`), Reanimated, Lexend Deca con `@expo-google-fonts/lexend-deca` |
| Estado | Zustand (UI y formulario), TanStack Query (servidor) |
| Local / offline | expo-sqlite (datos y cola de sincronización) |
| Formularios | React Hook Form + Zod |
| Backend | Supabase: Postgres, Auth, RLS, RPC, Edge Functions |
| IA | Interfaz `AiProvider`: Gemini con nivel gratuito (por defecto), Claude u OpenAI. Solo desde Edge Functions, salida JSON validada con Zod |
| Notificaciones | expo-notifications (locales) |
| Ubicación | expo-location + expo-task-manager (geofencing) |
| Gráficas | Propias: barras con `View` y la línea del año con `react-native-svg` (sin librería de gráficas) |
| Calidad | ESLint, Prettier, Jest (Sentry antes de publicar) |
| Entrega | EAS Build: development build de Android y APK de preview (GitHub Actions y EAS Submit antes de publicar) |

Evitar módulos nativos personalizados. Usar la development build de Android desde la entrega 3 (necesaria para geofencing y alarmas fiables); Expo Go sirve en las entregas 1 y 2.

## 4. Estructura del repositorio

```
src/
  app/                # Expo Router (solo pantallas)
    (auth)/           # login, registro
    (onboarding)/     # modo, formulario (7 pasos), plan generado
    (tabs)/           # hoy, hábitos, estadísticas, jardín, perfil
    habit/[id].tsx
    store.tsx
  components/ ui/ theme/      # tokens y componentes base
  features/                   # onboarding, habits, rewards, stats, reminders, plan
    onboarding/catalog/       # claves de respuestas y catálogo de hábitos semilla
  db/ sync/ lib/ schemas/
  i18n/es.ts                  # textos de interfaz
supabase/
  migrations/
  functions/          # generate-plan, adjust-plan, _shared/, deno.json
assets/
  plants/{categoria}/fase{1-3}.png
  accessories/{tipo}/{n}.png
  icons/              # iconos de línea 24 px, trazo 2 px
```

## 5. Formulario inicial

Siete pasos, una pregunta por pantalla, con progreso visible («Paso 3 de 7»), una línea de ayuda bajo cada pregunta y opción de volver sin perder respuestas. Las respuestas se guardan como **claves estables**, no como texto. El texto visible vive en archivos de idioma (textos completos en SDD 5.1).

| # | Pregunta | Ayuda | Tipo | Claves |
|---|---|---|---|---|
| 1 | ¿En qué áreas te gustaría empezar? | Elige hasta 2. Podrás sumar más cuando estas ya sean parte de tu día. | Hasta 2 | `salud_fisica`, `trabajo`, `salud_mental`, `finanzas`, `social` |
| 2 | ¿Qué te gustaría lograr primero? | Elige hasta 2. | Hasta 2, solo de las áreas elegidas | Ver tabla de objetivos |
| 3 | Cuando has intentado crear un hábito, ¿qué suele pasar? | No hay respuesta mala: nos ayuda a empezar a tu ritmo. | Única | `primera_vez`, `empieza_y_deja`, `semanas_y_suelta`, `mantiene` |
| 4 | ¿Cuánto tiempo al día te gustaría dedicarle? | Es tu límite. Empezaremos con menos para que sea fácil. | Única | `menos_10`, `10_20`, `20_40`, `mas_40` |
| 5 | ¿En qué momento del día tienes más espacio libre? | Podrás ajustar la hora exacta al revisar tu plan. | Única | `manana`, `mediodia`, `tarde`, `noche`, `varia` |
| 6 | ¿Qué es lo que más se te complica para ser constante? | Elige la que más se parezca a ti. | Única | `poco_tiempo`, `olvido`, `motivacion`, `desanimo`, `distraccion`, `recursos` |
| 7 | ¿Cómo te gustaría que Habit Green te acompañe? | Puedes cambiarlo cuando quieras en Perfil. | Única | `resumen_nocturno`, `recordatorio_suave`, `recordatorio_y_animo`, `minimo` |

**Objetivos (pregunta 2)**

| Área | Claves |
|---|---|
| `salud_fisica` | `mover_mas`, `dormir_mejor`, `comer_mejor`, `tomar_agua` |
| `trabajo` | `organizar_dia`, `procrastinar_menos`, `aprender_algo` |
| `salud_mental` | `manejar_estres`, `desconectar_pantallas`, `tiempo_para_mi` |
| `finanzas` | `saber_gastos`, `empezar_ahorrar`, `evitar_impulsivas` |
| `social` | `mantener_contacto`, `tiempo_de_calidad`, `conocer_gente` |

Validación: al menos 1 área y 1 objetivo; máximo 2 de cada; los objetivos deben pertenecer a las áreas elegidas. El límite de 2 protege la poca carga inicial: se agregan áreas cuando el usuario ya sostiene las primeras.

### Mapeo respuesta → plan

| Pregunta | Efecto |
|---|---|
| 1 y 2 | Un hábito ancla por objetivo elegido (máximo 2 hábitos iniciales). |
| 3 | Nivel de arranque: `primera_vez`, `empieza_y_deja` y `semanas_y_suelta` empiezan en nivel 1 (micro-paso mínimo); `mantiene` empieza en nivel 2. `semanas_y_suelta` recibe mensajes de apoyo en las semanas 3 y 4. |
| 4 | Presupuesto diario total: 10, 20, 40 o 60 min. La duración de cada hábito no excede presupuesto / número de hábitos. |
| 5 | Momento de los recordatorios: 08:00, 13:00, 17:00 o 20:30. `varia` activa recordatorio flexible en ventana. Si la fila del catálogo tiene `momento_fijo`, ese momento gana. El usuario puede cambiar la hora al revisar el plan. |
| 6 | `poco_tiempo`: duración = `duracion_reducida_min`. `olvido`: segundo aviso según la precedencia. `motivacion`: mensajes de ánimo y celebraciones más visibles. `desanimo`: reprogramación automática y silenciosa, tono sin culpa. `distraccion`: aviso único y breve, con temporizador opcional. `recursos`: solo variantes sin equipo ni espacio especial. |
| 7 | Estilo de notificaciones (ver sección 11). |

### Precedencia P7 / P6

La P7 decide cuántas notificaciones llegan; la P6 solo ajusta su contenido o momento.

| Combinación | Regla |
|---|---|
| `olvido` + `recordatorio_suave` / `recordatorio_y_animo` | Segundo aviso 2 h después si no se completó. |
| `olvido` + `minimo` | Sin segundo aviso; interruptor «Segundo aviso» apagado en la revisión del plan. |
| `olvido` + `resumen_nocturno` | Un solo aviso diurno a la hora del momento. |
| `olvido` + `varia` | Sin aviso extra (la ventana ya tiene 17:00 y 20:00). |
| `distraccion` + `recordatorio_y_animo` | Un solo aviso con el ánimo en el mismo texto, de una línea. |
| `motivacion` + `minimo` | Ánimo solo dentro de la app. |
| `desanimo` + cualquiera | Solo tono y reprogramación silenciosa. |

### Catálogo semilla

16 objetivos × 3 niveles (48 filas) más variantes sin recursos. Cada fila tiene `titulo`, `duracion_min`, `duracion_reducida_min`, `dias_semana` (int[] ISO, 1 = lunes … 7 = domingo), `momento_fijo` (opcional) y `sin_recursos`. El catálogo completo está en SDD 5.7. Principios: nivel 1 de 5 minutos o menos; saltos de máximo el doble o el triple; una dimensión de progreso a la vez; sin cantidades sensibles.

## 6. Reglas de negocio (no cambiar sin aprobación)

### Recompensas (el usuario nunca ve XP, niveles ni fases numéricas)

| Regla | Valor |
|---|---|
| XP por hábito completado | 2 |
| XP por nivel | 4 |
| Nivel máximo | 30 |
| Fase 1 / 2 / 3 | Niveles 0–14 / 15–29 / 30 (30 y 60 hábitos por planta) |
| Tope de XP | 1 hábito por planta al día |
| Monedas por hábito completado | 10 |
| Tope de monedas | 5 hábitos al día (50 monedas) |
| Accesorios | 15: 5 sombreros, 5 lentes, 5 macetas |
| Precios por tipo | 30, 60, 100, 150, 250 (1,770 en total) |

- Cada categoría tiene su planta; el XP va a la planta de la categoría del hábito.
- Nivel = `min(30, floor(xp / 4))`.
- En nivel 30 la planta deja de sumar XP. Las monedas siguen.
- Un registro por hábito y fecha (único por `habit_id + fecha`). `habit_logs` marca `xp_otorgado` y `monedas_otorgadas`.
- Los hábitos que superan los topes se registran igual y cuentan para estadísticas y progresión.
- Deshacer el mismo día (`uncomplete_habit`) devuelve lo otorgado hasta donde alcance el saldo. Si se devolvió completo, lo transfiere a otro registro del mismo día que no lo recibió; si no, ese hábito no vuelve a pagar ese día y el pago sigue contando para el tope (SDD 6.1).
- Nunca se resta XP ni monedas por fallar.
- Al completar un hábito con el tope de monedas ya alcanzado: sin animación de moneda y mensaje suave «¡Hoy ya ganaste todas tus monedas! Este hábito igual cuenta para tu progreso». El tope de XP no se comunica.
- Las constantes viven en un solo módulo/tabla de configuración (`app_config`, cacheada en SQLite).
- El servidor es la fuente de verdad: la lógica vive en las RPC `complete_habit` y `uncomplete_habit`; la app la replica en local y reconcilia al sincronizar.
- Ritmo esperado: usuario típico, fase 2 en ~2 meses y fase 3 en ~4; usuario constante, ~1 y ~2 meses.

### Reprogramación

- Al abrir la app se detectan ocurrencias programadas de los últimos días sin registro. No hay notificación matutina.
- Se ofrece moverlas a un **día libre fuera del patrón semanal** del hábito, dentro de los próximos 7 días y sin superar el presupuesto diario. El usuario puede elegir otro día libre o descartar. Se guarda en `habit_occurrences`.
- El día original de una ocurrencia movida no cuenta como fallado. Una ocurrencia movida no se vuelve a mover.
- Tono sin culpa. Con `desanimo` la reprogramación es automática y silenciosa.
- Un hábito que ocupa los 7 días no se reprograma: se omite en silencio.
- Aplica en los dos modos. Detalle en SDD 6.2.

### Modo tradicional

- Sin formulario: `presupuesto_min` 20, `recordatorio_suave`, hora elegida al crear cada hábito y segundo aviso apagado. Todo se edita en Perfil.
- Los hábitos manuales no entran en la progresión (no suben ni bajan de nivel). Sí tienen reprogramación, recompensas y estadísticas.
- El presupuesto no limita la creación: si se excede, aviso suave y `presupuesto_min` sube a la suma real.
- El usuario guiado también puede crear hábitos manuales con estas reglas. El tradicional no puede hacer el formulario (v1.1).

### Hábitos

- La categoría se fija al crear el hábito y no cambia.
- «Eliminar» archiva: se oculta y se cancelan sus avisos, pero el historial se conserva. Si dio monedas ese día, se devuelven hasta donde alcance el saldo y el pago sigue contando para el tope (SDD 6.1).
- El check-in solo se puede marcar y deshacer para hoy.
- Rachas por hábito: ocurrencias programadas seguidas completadas; los días no programados no la rompen.

### Progresión (evaluada al abrir la app cada 7 días)

Solo para hábitos del plan. Cumplimiento en los últimos 14 días (28 para hábitos de 1–2 días por semana), con un mínimo de 4 ocurrencias en la ventana.

| Cumplimiento | Acción |
|---|---|
| ≥ 85 % | Subir un nivel de micro-paso o proponer un hábito nuevo (incluida otra área). El usuario acepta. |
| 50 % a 84 % | Mantener |
| < 50 % | Bajar un nivel. En el nivel 1, usar `duracion_reducida_min`. |

- Si el siguiente nivel no cabe en el presupuesto: mantener y proponer un hábito nuevo de nivel 1; si tampoco cabe, sugerir subir el tiempo diario en Perfil, sin presión.
- **Límite:** máximo 4 hábitos activos del plan. A los 90 días del plan, con ≥ 85 % en los últimos 28 días, se desbloquea y solo limita el presupuesto. Límite total del usuario guiado (plan y manuales juntos): hasta 3 hábitos activos, más 1 por cada subida de nivel del plan, y sin límite tras el desbloqueo; la progresión no propone hábitos nuevos si ya se llegó. En el modo tradicional no hay límite.
- La IA interviene en el plan inicial y al redactar niveles nuevos. Las reglas de progresión son código propio.
- Decisiones de la Entrega 8 (detalle en SDD 6.3): tarjetas en Hoy; bajar es automático con «Mantenerlo como estaba»; se propone un solo hábito nuevo sugerido; la ventana cuenta desde el último cambio de nivel.

### Plan

- Los números (duración, nivel, días, horario) salen de código y del catálogo de hábitos semilla. La IA solo personaliza textos dentro de esos límites.
- Si la IA falla dos veces o se supera la cuota gratuita, se usa el plan de catálogo sin personalizar.
- `generate-plan` devuelve un borrador; la app guarda el plan cuando el usuario pulsa «Empezar». Sin conexión no se puede crear el plan («Necesitas conexión para crear tu plan»).

### Jardín y tienda

- Las 5 plantas se ven desde el inicio; las de áreas sin hábitos, en fase 1 con una invitación a agregar un hábito.
- Un mismo objeto puede estar en varias plantas a la vez; cada planta lleva como máximo uno de cada tipo. Nombres de los 15 accesorios: provisionales hasta que el usuario los defina.

## 7. IA: reglas

- La API key nunca está en la app. Solo en secretos de Supabase.
- Toda respuesta se valida con Zod. El campo de estrategias de apoyo es un enum, no texto libre.
- Límite de uso por usuario (`ai_requests`).
- El prompt no da consejos médicos, dietas extremas ni de inversión, ni cantidades sensibles.
- No se envían nombre ni correo al proveedor.
- Proveedor y modelo configurables por variable de entorno (`AI_PROVIDER`, `AI_MODEL`), detrás de la interfaz `AiProvider`. Por defecto, Gemini con nivel gratuito: puede usar los datos enviados, por eso solo se envían claves del formulario.

## 8. Diseño visual (guía de UX/UI aplicada a React Native)

**Las reglas visuales completas y vigentes están en `docs/Guía de UX UI.md`; consúltala antes de cualquier trabajo visual.** Este resumen puede quedarse atrás; si difiere, gana la guía.

### Tokens (en `tailwind.config.js` y `src/theme`)

| Token | HEX | Uso |
|---|---|---|
| `bg` | `#FBFBF6` | Fondo de pantalla |
| `campo` | `#FFFFFF` | Tarjetas, campos, barra inferior, menús y diálogos |
| `accent` | `#2E7D4F` | Botón principal, selección, barra de avance, pestaña activa |
| `accent-oscuro` | `#24663F` | Botón principal presionado |
| `accent-claro` | `#DFF2E4` | Estado presionado, píldora activa, etiquetas |
| `borde` | `#859488` | Bordes de controles |
| `divisor` | `#D6E8DB` | Líneas, pistas de barras, deshabilitado |
| `error` | `#B8493D` | Borde, icono y texto de error |
| `error-claro` | `#FBE3DF` | Fondo de error |
| `moneda-fondo` y `moneda-texto` | `#FFF0CC` y `#7A4F0E` | Saldo de monedas |
| `ink` | `#1E2A22` | Texto |
| `ink-soft` | `#566459` | Texto de apoyo |

Más los tintes por área y las alertas de la guía.

### Reglas

- Los colores se usan solo por tokens, nunca hex sueltos en componentes.
- Figma manda en el acomodo; los colores de la app son los de la guía. Las pantallas de Figma no se modifican.
- Un solo botón principal por pantalla: relleno `accent` con texto blanco de 19 px en negritas (5:1), sin borde.
- Tarjetas `campo` con sombra suave (color `ink`, opacidad 0.10, radio 8, offset y 2; Android: `elevation` 2).
- No comunicar estados solo con color: siempre icono y texto (una opción seleccionada lleva icono de verificación).
- Tipografía Lexend Deca, como en los mockups (respaldo: sistema). H1 32/700, H2 24/700, H3 20/600, cuerpo 16/400, pequeño 14/400, botón 19/700. Escalado de texto del sistema permitido hasta 2× (guía de Android; las etiquetas de la barra de pestañas, hasta 1.3×).
- Espaciado en múltiplos de 8 (4, 8, 16, 24, 32, 48, 64). Márgenes de pantalla de 16 a 32 dp. Radios: 12 campos, 16 botón de acción, 20 tarjetas, 999 píldoras.
- Áreas táctiles de 48 × 48 dp o más (guía de Android); botones de 48 dp de alto. Si el elemento visible es más chico, se amplía la zona táctil (`hitSlop`).
- Móvil primero: no hay hover; el estado equivalente es «presionado». Estados de foco para lectores de pantalla y teclado externo con anillo de 3 px en `ink`.
- Movimiento sobrio: 150–250 ms, ease-out; respetar `AccessibilityInfo.isReduceMotionEnabled`.
- Solo tema claro (`userInterfaceStyle: light`).
- Arte de plantas y accesorios: PNG con fondo transparente, contorno oscuro (`#2C1E18`) y lienzo cuadrado uniforme, para que se vean sobre los tintes. Las plantas se muestran sobre tarjetas con el tinte de su área.
- Gráficas sobre tarjetas `campo`: barras `accent`, pista `divisor`, etiquetas `ink`.

## 9. Convenciones de código

- TypeScript estricto, sin `any` sin justificación.
- Componentes funcionales, hooks, un componente por archivo.
- Lógica de negocio en funciones puras dentro de `features/*/domain`, con pruebas.
- Esquemas Zod compartidos entre formulario, app y Edge Functions.
- Archivos en `kebab-case`, componentes en `PascalCase`, tablas y columnas en `snake_case`.
- Fechas de hábitos como `date` en la zona horaria del usuario; marcas de tiempo en UTC. Los topes diarios usan la fecha del hábito.
- Textos de interfaz en archivos de idioma (preparado para i18n). Tono cercano, sin culpa.
- Commits pequeños en formato convencional (`feat:`, `fix:`, `chore:`).
- Todo acceso a datos pasa por repositorios en `db/`.

## 10. Seguridad y privacidad

- RLS activa en todas las tablas; las RPC verifican `auth.uid()`.
- Tokens de sesión en `expo-secure-store`.
- Variables públicas en `EXPO_PUBLIC_*`; secretos solo en Supabase.
- Eliminación de cuenta dentro de la app y política de privacidad (requisitos de las tiendas): antes de publicar, no en la demo.
- Auth con confirmación de correo y recuperación de contraseña con un código enviado por correo.
- La zona horaria del perfil se actualiza desde el dispositivo al abrir la app.
- La ubicación solo se usa para recordatorios y no se comparte.
- Recopilar lo mínimo; no hay texto libre del usuario en el MVP.

## 11. Notificaciones y ubicación

- Locales con **ventana móvil**: avisos con fecha concreta para los próximos 7 días, recalculados al abrir la app, al editar hábitos o ajustes y al completar (cancela el segundo aviso). Máximo 60 programados por el límite de 64 de iOS. Sin disparadores semanales repetitivos (SDD 7.1).
- Estilos (pregunta 7): `resumen_nocturno` (una notificación a las 21:00 con los hábitos de mañana), `recordatorio_suave` (una por hábito), `recordatorio_y_animo` (con mensajes motivacionales rotativos) y `minimo` (solo los hábitos con «Avisarme» activado, campo `notificar`).
- La P6 ajusta los estilos según la tabla de precedencia (sección 5).
- Momento flexible (`varia`): ventana a las 17:00 con segundo aviso a las 20:00 si no hay respuesta.
- `momento_fijo` del catálogo gana sobre la P5.
- Permisos pedidos en contexto, no al abrir la app.
- Geofencing (**versión básica, última entrega, primer recorte**): opcional por hábito, se ofrece al editar y no en el formulario. Hasta 3 lugares (`habit_places`), radio de 100–200 m, una notificación al día y un máximo de 20 regiones activas. Sin permiso, el hábito sigue con recordatorio por hora.

## 12. Comandos

```
npm install
npx expo start               # desarrollo
npx expo start --dev-client  # con development build
npm run lint
npm run typecheck            # tsc --noEmit
npm test
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile preview --platform android
supabase db push
supabase functions deploy generate-plan
```

## 13. Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | App | URL del proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | App | Clave pública |
| `AI_PROVIDER` | Secreto de Edge Function | `gemini` (por defecto), `claude` u `openai` |
| `AI_API_KEY` | Secreto de Edge Function | Clave del proveedor de IA (Google AI Studio para Gemini) |
| `AI_MODEL` | Secreto de Edge Function | Modelo a usar |
| `AI_DAILY_LIMIT` | Secreto de Edge Function | Generaciones por usuario al día |

Nunca subir `.env` al repositorio.

## 14. Definición de terminado

Una tarea está terminada cuando:

- Compila sin errores de tipos y pasa lint.
- La lógica de negocio tiene pruebas de Jest en verde.
- Funciona en Android (iOS se valida antes de publicar).
- Cubre estados de carga, vacío y error.
- Cumple contraste, áreas táctiles y reglas de la sección 8 (sin hex sueltos, sin estados solo por color).
- No introduce secretos ni llamadas a la IA desde la app.

El MVP está terminado cuando el flujo formulario → plan → hábitos → check-in → planta y monedas → estadísticas funciona, se pueden ver y completar hábitos sin conexión, las notificaciones por hora y día llegan en un dispositivo Android físico y no hay errores críticos abiertos.

## 15. Decisiones

**Tomadas en la v3:** ritmo de XP (4 XP por nivel con topes), `tiempo_de_calidad`, precedencia P7/P6, campos nuevos del catálogo, precios de accesorios.

**Tomadas en la v4:** demo funcional, offline completo con punto de control el día 9, reprogramación a día libre, ventana móvil de notificaciones, valores por defecto del modo tradicional, mensaje del tope de monedas y rutas en `src/app/`.

**Tomadas en la v5:** demo solo en Android; Gemini gratuito detrás de `AiProvider`; geofencing básico como última entrega; fuera de la demo Lottie, Sentry, CI, temporizador y eliminar cuenta; fase 3 en el nivel 30; `semanas_y_suelta` en nivel 1; horas 08:00, 13:00, 17:00, 20:30 y resumen 21:00; los hábitos simultáneos descuentan del presupuesto; cuenta obligatoria con confirmación de correo; progresión y límite de hábitos del plan; rachas por hábito; check-in solo hoy; sin notificación matutina; plan sin conexión bloqueado; mezcla de modos; jardín con 5 plantas; accesorio en una planta a la vez; archivar en vez de borrar; categoría fija; Claude redacta los textos.

**Pendientes:**

1. Nombres de los 15 accesorios (los define el usuario).
2. Validar los textos del catálogo semilla.
3. Revisar el borrador de `docs/textos.md`.
4. Validar la tolerancia de 7 días del servidor (la ventana de 7 días de avisos y reprogramación ya está aprobada).
