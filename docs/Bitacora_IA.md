# Bitácora de IA: Habit Green

Registro de las decisiones importantes del proyecto desde su inicio: qué se propuso, quién lo propuso, qué se aceptó, qué cambió y qué se descartó. El detalle de cada regla vive en el [SDD](sdd.md), la [definición](definicion.md), el [backlog](backlog.md), la [Guía de UX/UI](Guía%20de%20UX%20UI.md) y [textos.md](textos.md); aquí solo queda el qué y el porqué.

Última actualización: 22 de noviembre de 2026.

**Fuentes:** los documentos del proyecto, el historial de commits y los registros de las sesiones de trabajo del 26 de octubre al 22 de noviembre, es decir, los mensajes del usuario y sus respuestas a las preguntas de Claude. Cuando Claude marcaba una opción como «Recomendada» y el usuario la eligió, la fila dice «Claude». Si el origen no está claro, se nombra el documento de donde sale.

## 1. Cómo se trabajó

- **Roles.** El usuario (una sola persona, a medio tiempo y con poca experiencia en el stack) define el producto, decide y prueba cada entrega en su teléfono Android. Claude (asistente de IA) propone, implementa por partes, explica cada pieza y no avanza sin la prueba del usuario.
- **Método.** Entregas verticales (de la base al geofencing) y, después, bloques de pulido. Antes de cada bloque, Claude confirma qué hará y hace todas sus preguntas; las respuestas del usuario mandan. Cuando el mockup de Figma y el SDD no coinciden, Claude pregunta cuál seguir.
- **Herramientas.** Expo + React Native + TypeScript, Supabase (Postgres, Auth, RLS, Edge Functions), SQLite para trabajar sin conexión, EAS para la development build, Gemini detrás de `AiProvider` y la skill **Impeccable** para planear y revisar el diseño (`shape`, `critique`, `audit`, `polish`). Los mockups de Figma se leen con el MCP de Figma; cuando el plan gratuito llegó a su límite, el usuario mandó capturas.
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
| 26 oct | Primer commit. Claude revisa los documentos y recomienda servidores MCP. Encuentra que `.env` no estaba en `.gitignore`, que no había remoto de Git y que `app.json` estaba incompleto. |
| 30 oct | Se conecta el MCP de Figma y se deciden las diferencias entre los mockups y el SDD. Se borran las tablas del prototipo anterior en Supabase. |
| 1 nov | Entrega 1 (base, Auth, componentes) y Entrega 2 (formulario de 7 pasos, motor del plan, `generate-plan`). La clave de Google AI Studio se guarda en los secretos de Supabase. |
| 2 nov | Entrega 3 en dos partes: development build, SQLite, sincronización, Hoy y Hábitos sin conexión. |
| 3 nov | Entrega 4 con arte provisional. El usuario abre la revisión visual desde la Entrega 1 con capturas: login, formulario, Preparando y «Tu plan está listo». |
| 3–5 nov | Entrega 2 actualizada: Hoy, Hábitos y crear/editar hábito según los mockups. Las reglas de Material Design pasan a la Guía de UX/UI. |
| 5 nov | Protección contra el abuso de monedas. |
| 6 nov | Se instala Impeccable (PRODUCT.md y DESIGN.md) y se elige la dirección visual «Jardín alegre». |
| 6–8 nov | Entrega 4 actualizada con las pantallas de Figma: Jardín, Tienda y Detalles de la planta. |
| 9–17 nov | Entrega 5: notificaciones, permisos, ajustes en Perfil y duración libre de los hábitos. |
| 17–18 nov | Entrega 6 (reprogramación). |
| 18 nov | Entrega 7 (estadísticas y rachas, con datos de prueba) y Entrega 8 (progresión). |
| 19–20 nov | Pulidos antes del APK, bloques A a D. |
| 20 nov | Se descarta el APK de preview. Empieza «Varios planes por usuario». |
| 20–21 nov | Varios planes, fases 1 a 4; detalle del plan; arreglo de SonarQube; fusión en `master`. |
| 21–22 nov | 7 metas por área, candado de un solo toque, Perfil como índice y esta bitácora. |
| 22 nov | Ajustes: un solo cupo total de hábitos, botón «Hecho» en los avisos, avisos retrasados que ya no se pierden, permiso de alarmas exactas y cada plan con al menos un hábito. |

## 3. Decisiones por tema

### 3.1 Producto y alcance

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Dos modos de uso: tradicional y guiado (formulario de 7 preguntas) | Definición del proyecto | Modificada | El 20 nov el modo deja de ser una restricción (3.3). |
| Demo solo en Android; iOS después | Definición v5 | Aceptada | |
| Demo en 10 entregas verticales; geofencing al final como primer recorte | Definición v5 | Aceptada | El 22 nov el usuario recortó el geofencing (Entrega 10) y el recorrido con TalkBack (9.1 y 9.2) para generar el APK. |
| Terminar las entregas con arte provisional y, al cerrar la 4, revisar el diseño desde la Entrega 1 | Usuario (3 nov) | Aceptada | |
| APK de preview como cierre de la demo (Entrega 9.3) | Definición v4/v5 | Aceptada | El usuario la quitó el 20 nov y la retomó el 22 nov para poder compartir la app. Antes se crearon las variables `EXPO_PUBLIC_*` en EAS: sin ellas, el APK se cerraba al abrir. |
| Fuera de la demo: Lottie, Sentry, CI, temporizador de `distraccion`, eliminar cuenta | Definición v5 | Aceptada | Se agregan antes de publicar. |
| Borrar las tablas del prototipo anterior en Supabase (2 oct) | Claude | Aceptada | No chocaban con las nuevas, pero eran de otro diseño. |
| Correos de Auth con un SMTP propio de Gmail | Claude (opción 1), elegida por el usuario | Aceptada | La contraseña de aplicación de Gmail se escribe solo en el panel de Supabase. |

### 3.2 IA

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Gemini gratuito detrás de `AiProvider` (también Claude u OpenAI) | Definición v5 | Aceptada | La clave solo en secretos de Supabase; el usuario la escribió ahí, nunca en la conversación. |
| La IA solo redacta textos; números, días y niveles salen del código y del catálogo | Definición v2 | Aceptada | Si falla dos veces, plan de catálogo. |
| Títulos de la IA de 3 a 30 caracteres | Claude (bloque A) | Aceptada | Mismo límite que el nombre de un hábito. |
| La IA no menciona minutos en hábitos sin duración | Claude (fase 2) | Aceptada | |

### 3.3 Formulario y plan

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Respuestas guardadas como claves estables, no como texto | Definición v2 | Aceptada | |
| Elección de modo en una pantalla nueva después de «Empezar» | Claude (30 oct) | Modificada | El mockup tenía un solo botón. Desde el 20 nov ya no hay modo fijo. |
| Flecha atrás en «Empezar» para salir del onboarding (cierra la sesión) | Claude | Aceptada | |
| Al elegir un tercero, entra y se quita el primero, sin advertencia | Usuario (3 nov) | Aceptada | |
| El texto no se mueve al ponerse en negritas | Usuario (3 nov) | Aceptada | Aplica a todo campo de selección. |
| Preparando con los mensajes del mockup y la planta animada | Usuario | Aceptada | |
| Hasta 3 hábitos en «Tu plan está listo»; si exceden el tiempo, se agregan y el tiempo sube | Claude | Aceptada | El límite de 3 sale del texto del mockup. |
| 4 sugerencias y «Sugerir otros hábitos» trae otras 4 | Usuario | Aceptada | |
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
| Límite de 4 hábitos del plan y desbloqueo a los 90 días | Definición v5 | Modificada | Con varios planes, cada plan tiene su revisión y su desbloqueo, y el tope bajó a 3 (fase 5). |
| Límite de hábitos del usuario guiado | Usuario | Modificada | Primero 3 propios; luego 3 en total (plan y propios), más 1 por subida y libre a los 90 días. Fase 5 (22 nov): 3 por plan, 1 plan más por subida y propios aparte. Ese mismo día el usuario sintió que eran demasiados (se empezaba con hasta 6) y quedó **un solo cupo total**: 3 + 1 por subida, sin límite sin planes y libre a los 90 días. |
| El desbloqueo de cualquier plan libera el cupo | Claude, elegido por el usuario | Aceptada | Después solo cuenta el tiempo diario. |
| «Sacar del plan» respetaba el límite de propios | Claude, elegido por el usuario | Modificada | Con el cupo total ya no hace falta: sacar no cambia el total. «Terminar plan» siempre se permite. |
| Crear un plan necesita un lugar libre, también el primero, y trae solo los hábitos que caben | Claude, elegido por el usuario | Aceptada | Sin lugar sale un diálogo, como con «+» y «Reanudar». Reemplazó a «planes que se ganan». |
| Pausados no cuentan para el límite | Claude, elegido por el usuario | Aceptada | |
| Detalle del plan: hacerlo más ligero, sacar del plan y agregar un hábito a mano | Claude, aprobado por el usuario | Aceptada | Subir sigue siendo solo con la revisión. |

### 3.5 Hábitos

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Categoría fija; «Eliminar» archiva y conserva el historial | Definición v5 | Aceptada | El mockup «Editar hábito» dejaba cambiarla; se mantuvo fija (Claude, 3 nov). |
| Hábitos agrupados por categoría con chips de filtro, en vez de «pendientes / diarios» del mockup | Claude (2 nov) | Modificada | El 3 nov el usuario quitó los chips: secciones por categoría, ocultando las vacías, y se puede marcar desde ahí. |
| Marcar en Hábitos solo los programados para hoy | Claude | Aceptada | |
| Crear hábito: orden y estilo del mockup más los campos del SDD (duración y hora) | Claude | Aceptada | Frecuencia solo diaria o por días de la semana; por mes o por año, para después. |
| Asistente de 3 pasos, reloj de Android para la hora y regreso a Hábitos al crear | Usuario | Aceptada | El reloj puede cambiar más adelante. La descripción es opcional. |
| Duración como una fila en el paso 3 | Claude | Aceptada | |
| Menú ⋮ con globo verde; un hábito pausado muestra el símbolo de pausa y «Reanudar» | Usuario | Aceptada | |
| El tiempo diario sube solo, pero nunca baja solo | SDD 6.5 (Claude preguntó) | Aceptada | El usuario decidió dejarlo así. |
| Tiempo diario editable en Perfil, agregado a la Entrega 5 | Claude | Aceptada | El aviso ya decía «puedes cambiarlo en Perfil». |
| Hábitos sin duración, solo los que crea el usuario | Claude (16 nov) | Modificada | El 20 nov también los del plan (3.3). |
| Duración libre: ruedas de horas y minutos en las que también se puede escribir | Claude, ampliada por el usuario | Aceptada | El usuario no quería un selector cerrado. Sin plan no hay tope; con plan, el tope depende de sus respuestas. |
| Texto para 0 h 0 min: «Sin duración fija», sin botón aparte | Claude, sobre la idea del usuario | Aceptada | El usuario pidió «Sin definir» o algo parecido; un hábito nuevo empieza así. |
| Nombre de 3 a 30 caracteres y descripción hasta 100, con contador | Usuario (lista de pulidos) | Aceptada | Al editar se respeta el largo de los títulos que ya eran más largos. |
| Salir con cambios: «Guardar / Descartar / Cancelar» | Usuario | Aceptada | |
| Borrador al crear un hábito con «¿Seguimos?» | Claude, elegido por el usuario | Aceptada | El botón «Empezar de nuevo» se cambió a «Cancelar» porque no cabía. |
| Límite de hábitos manuales con diálogo | Usuario (lista de pulidos) | Modificada | Ver 3.4. |

### 3.6 Recompensas, jardín y tienda

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Ritmo de XP: 4 XP por nivel con topes diarios; precios 30–250 | Definición v3 | Aceptada | |
| Deshacer quita solo las monedas que haya; el saldo nunca baja de 0 | Claude | Aceptada | |
| Comprar solo con conexión; equipar y quitar, también sin conexión | Claude | Aceptada | |
| Protección de monedas | Usuario pidió validarla (5 nov) | Modificada | Claude ofreció dos opciones; el usuario pidió más y casos de uso. Quedó **C + E**: un solo pago por hábito y día, y eliminar también devuelve. |
| Arte provisional: una imagen genérica | Usuario | Modificada | Con Impeccable, 3 fases provisionales por planta y dibujos provisionales para los accesorios, para que se note el cambio. |
| Carrusel de Detalles de la planta = sus 3 fases; las siguientes, bloqueadas | Claude | Aceptada | |
| Objetos en Detalles: se ponen y se quitan sin confirmación, y se ven en la planta | Usuario | Aceptada | |
| «Equipar ahora» lleva a Detalles → Objetos y la app elige la planta | Usuario / Claude | Aceptada | La Tienda se abre sin una planta elegida. |
| Detalles → Hábitos con casilla y menú ⋮, en vez de la tarjeta simple de Figma | Claude | Aceptada | |
| Tocar un objeto que no alcanza o que ya es tuyo abre la hoja adaptada | Claude | Aceptada | |
| Quitar el mensaje «Lleva x objeto» | Usuario | Aceptada | |
| Jardín: frase corta para las plantas sin hábitos y saldo junto a la bolsa | Claude (Impeccable) | Aceptada | |
| Hoy muestra la planta más avanzada; «Tu planta crece con cada paso» | Claude (Impeccable) | Aceptada | Antes decía «árbol». |
| Un accesorio en una sola planta a la vez | Definición v5 | Modificada | El usuario pidió que **un objeto pueda estar en varias plantas**, con uno por tipo en cada una. |
| Aviso «Le pusimos … en lugar de …» al reemplazar desde la Tienda | Claude | Aceptada | |
| Bloquear la planta si se borra un hábito antes de 24 h | Usuario (lista de pulidos) | Descartada | Claude recomendó no hacerlo: choca con 4 reglas y no evita abusos. |

### 3.7 Notificaciones y Perfil

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Ventana móvil de 7 días con tope de 60 avisos | Definición v4 | Aceptada | Por el límite de 64 de iOS. |
| La P7 decide cuántos avisos llegan; la P6 solo su contenido | Definición v3 | Aceptada | |
| Avisos a hora aproximada, sin pedir alarmas exactas | Claude (9 nov) | Modificada | Claude dijo que llegarían «unos minutos» tarde, pero Android los retrasa hasta 1 hora. El 22 nov, al no llegar dos avisos, el usuario eligió pedir el permiso de alarmas exactas (con development build nueva). |
| No perder los avisos retrasados: al recalcular se conservan los pendientes de hábitos sin marcar | Claude (22 nov), tras un error que reportó el usuario | Aceptada | Antes se cancelaba todo y se perdían. |
| Botón «Hecho» en el aviso: abre Hoy y lo marca | Claude, elegido por el usuario | Aceptada | Sin marcar en segundo plano: haría falta `expo-task-manager` y no es fiable con la app cerrada. |
| Pedir el permiso al guardar un hábito con hora | Claude | Modificada | El usuario decidió que los recordatorios empiecen apagados y que el hábito nuevo empiece en «Ninguno» hasta que acepte el permiso. |
| Si rechaza el permiso al confirmar el plan, se quitan las horas | Claude | Aceptada | |
| «Avisarme» es la fila «Recordatorios» del hábito, sin interruptor nuevo | Claude | Aceptada | |
| Cambiar la hora de un momento solo cambia lo general, no los hábitos ya creados | Claude | Aceptada | |
| Bajar el tiempo diario por debajo de un día: se permite, con aviso | Claude | Aceptada | |
| Tiempo diario con las mismas ruedas, hasta 8 h, con la suma del día más cargado | Claude | Aceptada | |
| Perfil en una sola pantalla con los avisos arriba | Claude (16 nov) | Modificada | El 21 nov pasó a índice con pantallas (3.10). |
| Apoyo de las semanas 3 y 4 calculado por plan | Claude (fase 1) | Aceptada | |

### 3.8 Reprogramación y estadísticas

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Ofrecer la reprogramación con una tarjeta arriba en Hoy | Claude | Aceptada | |
| Revisar 7 días atrás, mover hasta 7 días adelante y no volver a mover | SDD (propuesta por validar) | Aceptada | Aprobada por el usuario el 18 nov. |
| Si hay varios días sin hacer, ofrecer solo el más reciente | Claude | Aceptada | |
| Tarjeta con dos botones en fila y el enlace «Dejarlo» | Claude (Impeccable `shape`) | Aceptada | |
| Primer diseño de Progreso: resumen, gráfica, hábitos y filtro con píldoras | Claude (Impeccable), elegido por el usuario | Modificada | Al probarlo, al usuario no le gustó el filtro; se rehízo sobre el diseño viejo de Figma. |
| Progreso con pestañas Diario / Semanal / Mensual, sin filtro, agrupado por área | Claude, sobre el diseño viejo de Figma | Aceptada | La vista anual queda como botón «Año» en Mensual. |
| Cumplimiento como «12 de 15»; los hábitos de hoy cuentan solo si ya se hicieron | Claude | Aceptada | |
| Un hábito pausado cuenta hasta su último registro | Claude | Aceptada | La app no guarda desde cuándo está en pausa. |
| Diario: hoy se puede marcar; los días pasados solo se consultan; se ven hasta 7 días adelante | Claude | Aceptada | |
| Racha con icono de llama y número | Claude | Aceptada | |
| Fichas y vistas elegidas en una maqueta | Usuario | Aceptada | Ficha B, Semanal A con fechas, Mensual B, día de hoy A y racha C con el verde de A. |
| Navegación: pestañas dentro de la pantalla, sin menú lateral ni pila | Claude, a pedido del usuario | Aceptada | Deslizar ya cambia entre las pestañas de abajo. |
| Botón «Hoy» y recorrido por semanas de lunes a domingo | Usuario | Aceptada | |
| Cambiar de semana deslizando | Usuario | Modificada | Al probarlo, el deslizamiento cambiaba de pantalla; el usuario pidió flechas. |
| Datos de prueba desde el 1 de agosto en 2 hábitos reales y 2 de prueba | Usuario pidió los datos; Claude propuso el alcance | Aceptada | Al revisar antes del APK (22 nov) ya no existían: la cuenta de prueba se había reemplazado. |

### 3.9 Sesión y sin conexión

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Todo funciona sin conexión salvo crear el plan y comprar | Definición v4 | Aceptada | |
| La sesión se lee del teléfono para entrar sin conexión | Claude | Aceptada | Nació de un error al abrir la app en modo avión. |
| La sesión solo caduca tras 60 días sin conexión | Usuario (bloque C) | Aceptada | Aviso «Tu sesión caducó…» una sola vez, 10 s, con desvanecido. |
| Cambio de día con la app abierta, en silencio | Claude, elegido por el usuario | Aceptada | |
| La base local se revisa al entrar: si es de otra cuenta, se vacía | Claude | Aceptada | Nació de un error que mostraba hábitos de otra cuenta. |

### 3.10 Diseño visual y accesibilidad

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| 5 pestañas del SDD, no las 4 del mockup | Claude (30 oct) | Aceptada | La pestaña «Estadísticas» se llamó después «Progreso» porque no cabía. |
| Solo correo y contraseña, sin Google ni Facebook | Claude (30 oct) | Aceptada | El inicio social queda para antes de publicar. |
| Lexend Deca del mockup con contraste accesible, en vez de Nunito del SDD | Claude (30 oct) | Aceptada | |
| Borde `#C98B58` al enfocar, barra de Hoy en ese tono al 30 % y placeholders grises | Usuario (3 nov) | Modificada | Los reemplazó la paleta verde del 6 nov. |
| Reglas de Material Design en la Guía de UX/UI, con el SDD remitiendo a ella | Usuario pidió la revisión; Claude evaluó | Aceptada | |
| Impeccable: Android, momentos cortos, «El jardín paciente», controles «cálidos y táctiles» | Claude | Aceptada | Respuestas del usuario a `init` y `document`. |
| Renovar la paleta sin cambiar el acomodo de Figma | Claude | Aceptada | Referencias elegidas por el usuario: Finch, Todoist y TickTick. |
| Dirección visual | Claude recomendó «A, con los colores por área de C» | Modificada | El usuario eligió **C, «Jardín alegre»**. |
| Cambiar de pestaña deslizando, además de tocando | Usuario (5 nov) | Aceptada | Probado en el teléfono. |
| En Hoy y en la Tienda, solo la lista se desplaza; lo de arriba queda fijo | Usuario | Aceptada | |
| Todo lo tocable de 48 dp o más | Claude (revisión de Impeccable) | Aceptada | El usuario lo pidió para toda la app. |
| Hoy sin pendientes con «Ver mis hábitos» | Claude | Aceptada | |
| Detalle del plan, acomodo «secciones apiladas» | Claude (vista previa), elegido por el usuario | Modificada | Tras el critique: meta del plan, «Resumen» único y sugerencia de «más ligero». |
| «Terminar plan» como enlace rojo | Claude | Modificada | El usuario pidió botón verde ovalado abajo, con confirmación. |
| Perfil como índice con pantallas | Claude, elegido por el usuario | Aceptada | El correo pasa a un encabezado arriba. |
| Cada plan conserva al menos un hábito; «Eliminar» el último ofrece «Terminar plan» | Usuario (22 nov), diálogo propuesto por Claude | Aceptada | Pausarlo sí se permite. |
| Un solo toque por acción (candado en botones y en la navegación) | Claude, a partir de un error que reportó el usuario | Aceptada | |

### 3.11 Calidad y repositorio

| Decisión | Propuesta por | Estado | Notas |
|---|---|---|---|
| Agregar `.env` a `.gitignore` | Claude (26 oct) | Aceptada | |
| `tsc`, lint y Jest en verde antes de cada entrega | Proyecto (AGENTS.md) | Aceptada | |
| Un commit por entrega con el nombre que da el usuario, fusión en `master` y borrado de las ramas viejas | Usuario | Aceptada | Desde el 20 nov, mensajes en formato convencional (`feat:`, `fix:`). |
| Claude lanza las development builds de EAS | Claude | Aceptada | |
| Rama `feat/varios-planes`, fusión en `master` y borrado de la rama | Usuario | Aceptada | |
| Arreglar el bug que reprobaba el Quality Gate de SonarQube (`sort()` sin comparación) | Claude | Aceptada | No se toca la configuración de SonarQube (decisión del usuario). |

## 4. Propuestas de Claude que no se hicieron o se cambiaron

| Propuesta | Estado | Qué pasó |
|---|---|---|
| Dirección visual «A, con los colores por área de C» | Modificada | El usuario eligió C completa. |
| Dos formas de proteger las monedas | Modificada | No le convencieron; pidió más opciones y casos de uso, y eligió C + E. |
| Chips de filtro en Hábitos | Modificada | El usuario los quitó. |
| Pedir el permiso de avisos al guardar un hábito con hora | Modificada | Los recordatorios empiezan apagados hasta aceptar el permiso. |
| «Sin duración» solo en hábitos propios | Modificada | Después también en los del plan. |
| Primer diseño de Progreso | Modificada | Se rehízo sobre el diseño viejo de Figma. |
| Perfil en una sola pantalla con los avisos arriba | Modificada | Pasó a índice con pantallas. |
| APK de preview (Entrega 9.3) | Descartada | El usuario quitó el APK del plan. |
| Pantalla «¡Tu cuenta está lista!» y diálogo propio en Empezar | Descartada | El usuario pidió ignorarlas. |
| Mostrar el año en el selector de fecha | Descartada | El usuario pidió ignorarlo. |
| Planta del área en el detalle del plan | Descartada | No la eligió. |
| No repetir la duración en la fila del hábito | Descartada | No la eligió en el critique. |
| Marcar el hábito o ver su avance desde el detalle del plan | Descartada | «Ninguna por ahora». |
| Sugerencias de otras áreas o ampliar el catálogo | Modificada | Primero se eligieron las versiones de cada meta; después el usuario pidió 7 metas por área. |
| Tiempo diario por plan | Modificada | Quedó un tiempo global. |
| Límite solo de hábitos propios | Modificada | Pasó a total, luego a «3 por plan» con los propios aparte y, por agobio, a un solo cupo total (22 nov). |

## 5. Pendientes

| Pendiente | Origen |
|---|---|
| Prueba en el teléfono del cupo total de hábitos | Varios planes |
| Título cortado «Alejar el» en un hábito | Visto en Hoy |
| Entrega 9.1 y 9.2: recorrido completo con TalkBack y corrección de errores | Backlog |
| Nombres de los 15 accesorios, arte final y validación de textos del catálogo | Definición §15 |
| Frecuencias por mes, por año y «cada cierto tiempo» al crear un hábito | Mockup «Crear hábito», para después |

## 6. Reglas de trabajo acordadas

- Antes de cada bloque, confirmar qué se hará y hacer todas las preguntas.
- Commits y push solo cuando el usuario los pide.
- Las pantallas de Figma no se modifican; los cambios van en la app.
- No enviar toques al teléfono del usuario sin permiso; las capturas y lecturas son solo de consulta.
- Las claves (IA, servicio de Supabase, contraseña de correo) nunca van en la app ni se escriben en la conversación.
- No se toca la configuración de SonarQube.
- Explicar cada pieza en español: qué hace, por qué así y cómo probarla.
