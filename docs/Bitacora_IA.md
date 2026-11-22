# Bitácora de IA: Habit Green

Registro de las decisiones importantes del proyecto desde su inicio: qué se propuso, quién lo propuso, qué se aceptó, qué cambió y qué se descartó. El detalle de cada regla vive en el [SDD](sdd.md), la [definición](definicion.md), el [backlog](backlog.md), la [Guía de UX/UI](Guía%20de%20UX%20UI.md) y [textos.md](textos.md); aquí solo queda el qué y el porqué.

Última actualización: 22 de noviembre de 2026.

## 1. Cómo se trabajó

- **Roles.** El usuario (una sola persona, a medio tiempo y con poca experiencia en el stack) define el producto, decide y prueba cada entrega en su teléfono Android. Claude (asistente de IA) propone, implementa por partes, explica cada pieza y no avanza sin la prueba del usuario.
- **Método.** Entregas verticales (de la base al geofencing) y, después, bloques de pulido. Antes de cada bloque, Claude confirma qué hará y hace todas sus preguntas; las respuestas del usuario mandan.
- **Herramientas.** Expo + React Native + TypeScript, Supabase (Postgres, Auth, RLS, Edge Functions), SQLite para trabajar sin conexión, EAS para la development build, Gemini detrás de `AiProvider` y la skill **Impeccable** para planear y revisar el diseño (`shape`, `critique`, `audit`, `polish`). Los mockups de Figma solo se leen.
- **Prioridad cuando chocan:** reglas de negocio, accesibilidad de la guía, mockups de Figma y decisiones del usuario ganan sobre las sugerencias de Impeccable.

**Estados que usa esta bitácora**

| Estado | Significado |
|---|---|
| Aceptada | Se hizo tal como se propuso. |
| Modificada | Se hizo, pero el usuario la cambió (al proponerla o después de probarla). |
| Descartada | El usuario decidió no hacerla. |
| Pendiente | Aprobada o abierta, todavía sin hacer. |

## 2. Línea de tiempo

| Fecha | Hito |
|---|---|
| Oct 2026 | Definición del proyecto v2 a v5 y SDD (formulario con claves, catálogo semilla, motor determinista con IA solo para textos). |
| 26 oct | Primer commit del proyecto. |
| 1–5 nov | Entrega 1 (base, Auth, componentes) y Entrega 2 (formulario de 7 pasos, motor del plan, `generate-plan`). |
| 2 nov | Entrega 3: development build, SQLite, sincronización, Hoy y Hábitos sin conexión. |
| 3–8 nov | Entrega 4: recompensas, jardín, tienda y renovación visual «Jardín alegre». |
| 17 nov | Entrega 5 (notificaciones) y Entrega 6 (reprogramación). |
| 18 nov | Entrega 7 (estadísticas y rachas) y Entrega 8 (progresión). |
| 19–20 nov | Pulidos antes del APK, bloques A a D. |
| 20 nov | Se descarta el APK de preview. Empieza «Varios planes por usuario». |
| 20–21 nov | Varios planes, fases 1 a 4; detalle del plan; arreglo de SonarQube; fusión en `master`. |
| 21–22 nov | 7 metas por área, candado de un solo toque, Perfil como índice y esta bitácora. |

## 3. Decisiones por tema

### 3.1 Producto y alcance

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Dos modos de uso: tradicional y guiado (formulario de 7 preguntas) | Definición del proyecto | Modificada | El 20 nov el modo deja de ser una restricción (3.3). |
| Demo solo en Android; iOS después | Definición v5 | Aceptada | |
| Demo en 10 entregas verticales; geofencing al final como primer recorte | Definición v5 | Aceptada | Entrega 10 pendiente. |
| APK de preview como cierre de la demo (Entrega 9.3) | Definición v4/v5 | Descartada | El usuario la quitó el 20 nov; la entrega es la app en el teléfono. |
| Fuera de la demo: Lottie, Sentry, CI, temporizador de `distraccion`, eliminar cuenta | Definición v5 | Aceptada | Se agregan antes de publicar. |

### 3.2 IA

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Gemini gratuito detrás de `AiProvider` (también Claude u OpenAI) | Definición v5 | Aceptada | La clave solo en secretos de Supabase. |
| La IA solo redacta textos; números, días y niveles salen del código y del catálogo | Definición v2 | Aceptada | Si falla dos veces, plan de catálogo. |
| Títulos de la IA de 3 a 30 caracteres | Claude (bloque A) | Aceptada | Mismo límite que el nombre de un hábito. |
| La IA no menciona minutos en hábitos sin duración | Claude (fase 2) | Aceptada | |

### 3.3 Formulario y plan

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Respuestas guardadas como claves estables, no como texto | Definición v2 | Aceptada | |
| Al elegir un tercero, entra y se quita el primero, sin advertencia | Usuario | Aceptada | |
| Formulario con flecha y barra fijas arriba y «Siguiente» fijo abajo | Usuario / Claude (bloque A) | Aceptada | |
| Retomar el formulario y la revisión donde se quedó al cerrar la app | Usuario (bloque C) | Aceptada | |
| **Varios planes por usuario: un plan por área** | Usuario (20 nov) | Aceptada | P1 de una sola área; las sugerencias solo de esa área. |
| Planes siguientes en 3 pasos (área, objetivos, historial) | Claude, elegido por el usuario | Aceptada | P4 a P7 se reusan del primer plan. |
| Tiempo diario: uno por plan | Claude | Modificada | El usuario eligió **un tiempo global**; el plan nuevo se acomoda en el tiempo libre y avisa si no cabe. |
| Hábitos **sin duración** (recordatorios) | Usuario | Aceptada | 23 filas del catálogo en 0 min con la regla del usuario: todo lo que no es hacer algo durante un tiempo. Cualquier hábito se puede editar a minutos. |
| **Sin modo fijo**: «Mis planes» en Perfil (crear y terminar plan) | Usuario / Claude | Aceptada | Al terminar, los hábitos pasan a ser propios. |
| 7 metas por área (19 metas nuevas con sus 3 niveles) | Usuario | Aceptada | Lista y niveles propuestos por Claude y validados por el usuario. |
| Más sugerencias al agregar un hábito al plan | Usuario | Aceptada | Claude propuso mostrar las 3 versiones de cada meta («un poco más retador»); el usuario lo eligió. |

### 3.4 Progresión y límites

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Revisión cada 7 días; subir es opcional, bajar es automático con «Mantenerlo como estaba» | Definición v5 / Entrega 8 | Aceptada | Tarjetas en Hoy. |
| Límite de 4 hábitos del plan y desbloqueo a los 90 días | Definición v5 | Modificada | Con varios planes, cada plan tiene su revisión y su desbloqueo. |
| Límite de hábitos del usuario guiado | Usuario | Modificada | Primero 3 propios; luego 3 en total (plan y propios), más 1 por subida y libre a los 90 días; «Reanudar» también lo respeta. La fase 5 lo cambia a 3 por plan con planes que se ganan. |
| Pausados no cuentan para el límite | Claude, elegido por el usuario | Aceptada | |
| Detalle del plan: hacerlo más ligero, sacar del plan y agregar un hábito a mano | Claude, aprobado por el usuario | Aceptada | Subir sigue siendo solo con la revisión. |

### 3.5 Hábitos

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Categoría fija; «Eliminar» archiva y conserva el historial | Definición v5 | Aceptada | |
| Nombre de 3 a 30 caracteres y descripción hasta 100, con contador | Usuario (lista de pulidos) | Aceptada | Al editar se respeta el largo de los títulos que ya eran más largos. |
| Salir con cambios: «Guardar / Descartar / Cancelar» | Usuario | Aceptada | |
| Borrador al crear un hábito con «¿Seguimos?» | Claude, elegido por el usuario | Aceptada | El botón «Empezar de nuevo» se cambió a «Cancelar» porque no cabía. |
| Límite de hábitos manuales con diálogo | Usuario (lista de pulidos) | Modificada | Ver 3.4. |

### 3.6 Recompensas, jardín y tienda

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Ritmo de XP: 4 XP por nivel con topes diarios; precios 30–250 | Definición v3 | Aceptada | |
| Protección de monedas (pago único por hábito y día) | Usuario | Aceptada | |
| Un accesorio en una sola planta a la vez | Definición v5 | Modificada | El usuario pidió que **un objeto pueda estar en varias plantas**, con uno por tipo en cada una. |
| Aviso «Le pusimos … en lugar de …» al reemplazar desde la Tienda | Claude | Aceptada | |
| Bloquear la planta si se borra un hábito antes de 24 h | Usuario (lista de pulidos) | Descartada | Claude recomendó no hacerlo: choca con 4 reglas y no evita abusos. |

### 3.7 Notificaciones

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Ventana móvil de 7 días con tope de 60 avisos | Definición v4 | Aceptada | Por el límite de 64 de iOS. |
| La P7 decide cuántos avisos llegan; la P6 solo su contenido | Definición v3 | Aceptada | |
| Apoyo de las semanas 3 y 4 calculado por plan | Claude (fase 1) | Aceptada | |

### 3.8 Sesión y sin conexión

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Todo funciona sin conexión salvo crear el plan y comprar | Definición v4 | Aceptada | |
| La sesión solo caduca tras 60 días sin conexión | Usuario (bloque C) | Aceptada | Aviso «Tu sesión caducó…» una sola vez, 10 s, con desvanecido. |
| Cambio de día con la app abierta, en silencio | Claude, elegido por el usuario | Aceptada | |
| La base local se revisa al entrar: si es de otra cuenta, se vacía | Claude | Aceptada | Nació de un error que mostraba hábitos de otra cuenta. |

### 3.9 Diseño visual y accesibilidad

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Dirección «Jardín alegre» (referencias Finch, Todoist/TickTick) | Usuario | Aceptada | |
| Todo lo tocable de 48 dp o más | Claude (revisión de Impeccable) | Aceptada | El usuario lo pidió para toda la app. |
| Hoy sin pendientes con «Ver mis hábitos» | Claude | Aceptada | |
| Detalle del plan, acomodo «secciones apiladas» | Claude (vista previa), elegido por el usuario | Modificada | Tras el critique: meta del plan, «Resumen» único y sugerencia de «más ligero». |
| «Terminar plan» como enlace rojo | Claude | Modificada | El usuario pidió botón verde ovalado abajo, con confirmación. |
| Perfil como índice con pantallas | Claude, elegido por el usuario | Aceptada | El correo pasa a un encabezado arriba. |
| Un solo toque por acción (candado en botones y en la navegación) | Claude, a partir de un error que reportó el usuario | Aceptada | |

### 3.10 Calidad y repositorio

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| `tsc`, lint y Jest en verde antes de cada entrega | Proyecto (AGENTS.md) | Aceptada | |
| Rama `feat/varios-planes`, fusión en `master` y borrado de la rama | Usuario | Aceptada | |
| Arreglar el bug que reprobaba el Quality Gate de SonarQube (`sort()` sin comparación) | Claude | Aceptada | No se toca la configuración de SonarQube (decisión del usuario). |

## 4. Propuestas de Claude que no se hicieron o se cambiaron

| Propuesta | Estado | Qué pasó |
|---|---|---|
| APK de preview (Entrega 9.3) | Descartada | El usuario quitó el APK del plan. |
| Pantalla «¡Tu cuenta está lista!» y diálogo propio en Empezar | Descartada | El usuario pidió ignorarlas. |
| Mostrar el año en el selector de fecha | Descartada | El usuario pidió ignorarlo. |
| Planta del área en el detalle del plan | Descartada | No la eligió. |
| No repetir la duración en la fila del hábito | Descartada | No la eligió en el critique. |
| Marcar el hábito o ver su avance desde el detalle del plan | Descartada | «Ninguna por ahora». |
| Sugerencias de otras áreas o ampliar el catálogo | Modificada | Primero se eligieron las versiones de cada meta; después el usuario pidió 7 metas por área. |
| Tiempo diario por plan | Modificada | Quedó un tiempo global. |
| Límite solo de hábitos propios | Modificada | Pasó a total y luego a «3 por plan» (pendiente). |

## 5. Pendientes

| Pendiente | Origen |
|---|---|
| Fase 5 de límites: 3 hábitos por plan y planes que se ganan con las subidas | Varios planes |
| Commit de los pulidos de Perfil (filas iguales, interruptor, títulos de planes) y su verificación en el teléfono | Critique de Perfil |
| Título cortado «Alejar el» en un hábito | Visto en Hoy |
| Entrega 9.1 y 9.2: recorrido completo con TalkBack y corrección de errores | Backlog |
| Entrega 10: geofencing básico | Backlog |
| Nombres de los 15 accesorios y validación de textos del catálogo | Definición §15 |
| Revertir los datos de prueba del historial (Entrega 7) al terminar todas las entregas | Decisión del usuario |

## 6. Reglas de trabajo acordadas

- Antes de cada bloque, confirmar qué se hará y hacer todas las preguntas.
- Commits y push solo cuando el usuario los pide.
- Las pantallas de Figma no se modifican.
- No enviar toques al teléfono del usuario sin permiso; las capturas y lecturas son solo de consulta.
- Las claves (IA, servicio de Supabase, contraseña de correo) nunca van en la app ni se escriben en la conversación.
- No se tocan la configuración de SonarQube ni los datos de prueba hasta terminar las entregas.
- Explicar cada pieza en español: qué hace, por qué así y cómo probarla.
