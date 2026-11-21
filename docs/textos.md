# Habit Green: textos (borrador para revisión)

Borrador de los textos de la app y de los prompts de la IA. Tono: cercano, en tuteo, sin culpa. Nunca se mencionan fallos, rachas perdidas ni penalizaciones.
Al implementar, estos textos pasan a `src/i18n/es.ts` (interfaz) y a `supabase/functions/_shared/prompts.ts` (IA). `{hábito}`, `{día}`, `{n}`, etc. son variables.

**Estado:** pendiente de revisión por el usuario. Los nombres de los accesorios son provisionales.

## 1. Notificaciones

### Por estilo (P7)

| Estilo | Título | Cuerpo |
| --- | --- | --- |
| `recordatorio_suave` | {hábito} | Es un buen momento para tus {duración}. («10 min», «1 h 25 min»). Sin duración definida: Es un buen momento para tu hábito. |
| `recordatorio_y_animo` | {hábito} | {mensaje de ánimo} |
| `resumen_nocturno` | Mañana te esperan {n} hábitos | {hábito 1}, {hábito 2} y {hábito 3}. Descansa bien. |
| `resumen_nocturno` (1 hábito) | Mañana te espera un hábito | {hábito}. Descansa bien. |
| Segundo aviso (`olvido`) | ¿Un momento para {hábito}? | Todavía estás a tiempo hoy. |
| Momento flexible, 17:00 | {hábito} | Cuando encuentres un hueco esta tarde. |
| Momento flexible, 20:00 | {hábito} | Si aún te queda energía, son solo {duración}. Sin duración definida: Si aún te queda energía, todavía estás a tiempo. |
| Con `distraccion` + ánimo (una línea) | {hábito} | {duración} y listo. {mensaje de ánimo corto} (sin duración definida, solo el mensaje corto) |
| Fin de la ventana (día 7) | Tus hábitos te esperan | Abre Habit Green para seguir recibiendo tus avisos. |
| Con `olvido` + `resumen_nocturno` (uno al día, a la hora del momento) | ¿Un momento para tus hábitos de hoy? | {hábito 1}, {hábito 2} y {hábito 3}. Todavía estás a tiempo. |
| Geofencing | Estás en {lugar} | Buen momento para {hábito}. |

### Mensajes de ánimo rotativos

Se toma el siguiente de la lista cada vez, sin repetir dos días seguidos.

1. Un paso pequeño también cuenta.
2. Tu planta está creciendo contigo.
3. Hoy no tiene que ser perfecto, solo empezar.
4. Unos minutos para ti valen mucho.
5. Vas construyendo algo que dura.
6. Lo importante es volver, no la perfección.
7. Hazlo a tu ritmo.
8. Cada vez se vuelve un poco más fácil.
9. Pequeño hoy, grande con el tiempo.
10. Tu yo de mañana te lo va a agradecer.

Versiones cortas (para `distraccion`): «Tú puedes.», «Paso a paso.», «A tu ritmo.»

### Apoyo de las semanas 3 y 4 (`semanas_y_suelta`)

| Semana | Notificación (lunes) | Mensaje en Hoy |
| --- | --- | --- |
| 3 | Llevas dos semanas | Esta es la etapa en la que muchos lo sueltan. Si hoy cuesta, la versión corta también vale. |
| 4 | Ya casi es parte de tu rutina | Un mes de pequeños pasos. Sigue a tu ritmo; no hace falta hacer más. |

La notificación del lunes usa el título de la tabla y, como cuerpo, el mismo mensaje de Hoy.

## 2. Permisos

| Momento | Texto |
| --- | --- |
| Antes de pedir notificaciones (revisión del plan o al elegir la hora de un recordatorio) | Te avisaremos a la hora de cada hábito, de forma suave. Puedes cambiarlo cuando quieras en Perfil. Botones: «Ahora no» y «Activar avisos». |
| Android ya no deja preguntar | Los avisos están apagados en tu teléfono. Para usar recordatorios, actívalos en Ajustes. Botones: «Ahora no» y «Abrir ajustes». |
| Hábito con recordatorio y avisos apagados (formulario) | Los avisos están apagados en tu teléfono: este recordatorio no sonará hasta que los actives. Botón: «Activar avisos». |
| Antes de pedir ubicación (detalle del hábito) | Para avisarte al llegar a este lugar, Habit Green necesita tu ubicación, también en segundo plano. Solo se usa para estos avisos y no se comparte. |
| Permiso negado | Sin problema: tu hábito seguirá avisándote por hora. |

## 3. Check-in, recompensas y celebraciones

| Situación | Texto |
| --- | --- |
| Check-in | ¡Hecho! +10 monedas |
| Tope de monedas | ¡Hoy ya ganaste todas tus monedas! Este hábito igual cuenta para tu progreso. |
| Deshacer | Lo desmarcamos. |
| Cambio a fase 2 | ¡Tu planta de {categoría} está creciendo! Tu constancia se nota. |
| Cambio a fase 3 | ¡Tu planta de {categoría} floreció! Esto ya es parte de ti. |
| Planta sin hábitos (tarjeta del Jardín) | Sin hábitos aún |
| Planta sin hábitos (Detalles y lector de pantalla) | Crece cuando agregues un hábito de esta área. |
| Jardín sin datos descargados | Todavía estamos trayendo tus plantas. Si no tienes conexión, aparecerán cuando te conectes. |
| Tienda, saldo insuficiente | Te faltan {n} monedas. |
| Hoja de compra, título | ¿Comprar {objeto}? |
| Hoja de compra, texto | Se agregará a tu colección y podrás equiparlo cuando quieras. |
| Hoja de compra, botones | Comprar por {n} / Ahora no |
| Compra hecha, título | ¡Ya es tuyo! |
| Compra hecha, texto | {objeto} se agregó a tu colección. Gracias por seguir cuidando tus hábitos. |
| Compra hecha, botones | Equipar ahora / Seguir en la tienda |
| Objeto que ya era tuyo | Este objeto ya está en tu colección. |
| Fase bloqueada | Sigue cuidando tu planta para descubrirla. |
| Objetos, sin compras | Todavía no tienes {tipo}. Consíguelos en la Tienda. |
| Objeto que también lleva otra planta (TalkBack) | {nombre}, también lo lleva tu planta de {categorías}. Toca para ponérselo. |
| «Equipar ahora» reemplazó otro objeto | Le pusimos {nuevo} en lugar de {anterior}. |

## 4. Reprogramación

| Situación | Texto |
| --- | --- |
| Propuesta (tarjeta en Hoy) | Movimos «{hábito}» {destino}. Puedes cambiarlo. ({destino}: «a hoy», «a mañana» o «al jueves 19».) Botones: «Elegir otro día», «Está bien» y el enlace «Dejarlo» |
| Varias propuestas | {n} de {total} |
| Sin día disponible | Esta semana está completa para «{hábito}». La dejamos para la próxima. Botón: «Entendido» |
| Elegir otro día (diálogo) | ¿Qué día te queda mejor? Opciones: «Hoy», «Mañana», «Jue 19». Enlace: «Cancelar» |
| Al mover (aviso de éxito) | Listo: «{hábito}» quedó {destino}. ({destino}: «para hoy», «para mañana» o «para el jueves 19».) Al dejarla no hay aviso. |
| Con `desanimo`, uno (aviso suave) | Movimos «{hábito}» {destino}. |
| Con `desanimo`, varios (aviso suave) | Acomodamos {n} hábitos en días libres. |
| Hábito movido, en su tarjeta | Reprogramado para hoy |
| Error al guardar | No pudimos guardar el cambio. Inténtalo de nuevo. |

## Asistente de hábito: salir y límites (pulidos antes del APK)

| Situación | Texto |
| --- | --- |
| Salir con cambios | ¿Guardar los cambios? · Si sales ahora, se pierde lo que cambiaste. · Botones: «Guardar», «Descartar», «Cancelar» |
| Nombre largo | Usa {n} caracteres o menos. (30; al editar, el largo actual si era mayor) |
| Descripción larga | Usa {n} caracteres o menos. (100) |
| Contador (TalkBack) | {n} de {max} caracteres |
| Correo largo | El correo puede tener hasta {n} caracteres. (50) |

## Estados de inactividad (pulidos antes del APK)

| Situación | Texto |
| --- | --- |
| Casilla de una lista de ayer | Cambió el día. Ya actualizamos tu lista. |
| Borrador al crear un hábito | Tienes un hábito sin terminar. ¿Seguimos? · Botones: «Cancelar», «Seguir» |
| Límite al reanudar un hábito en pausa | Ya tienes {n} hábitos activos. · Para reanudar este, pausa o elimina otro. Conforme avances en tu plan podrás tener más. · Botón: «Entendido» |
| Límite de hábitos (guiado, plan y propios) | Ya tienes {n} hábitos. · Para sumar otro, pausa o elimina uno. Conforme avances en tu plan podrás agregar más. · Botón: «Entendido» |
| Sesión cerrada sola (bienvenida e inicio de sesión; se ve una vez y se quita a los 10 s) | Tu sesión caducó. Vuelve a iniciar sesión. |

## 5. Progresión

| Situación | Texto |
| --- | --- |
| Subir nivel | Te está saliendo muy bien «{título actual}». ¿Probamos con «{nuevo título}» ({duración} min)? Botones: «Sí, vamos», «Más adelante» (nombra el hábito actual: decisión del usuario, Entrega 8) |
| Hábito nuevo | Ya tienes esto dominado. ¿Sumamos «{hábito nuevo}»? |
| Bajar nivel | Vamos a hacer «{título actual}» más ligero por ahora: «{nuevo título}». Lo importante es mantener el ritmo. (decisión del usuario, Entrega 8) |
| Nivel 1 → duración reducida | Probemos una versión más corta de «{título}»: {duración} min. |
| No cabe en el presupuesto | Tu día está completo. Si quieres sumar algo, puedes subir tu tiempo diario en Perfil. Botones: «Ir a Perfil», «Entendido» |
| Volver a la duración normal (nuevo, por validar) | Te está saliendo muy bien con «{título}». ¿Volvemos a {duración} min? |
| Bajar: botones (nuevo, por validar) | «Entendido», «Mantenerlo como estaba» |
| Ya en la versión corta, menos del 50 % (nuevo, por validar) | Lo importante es seguir con «{título}», aunque sea poquito. Aquí seguimos contigo. Botón: «Entendido» |
| Al aceptar subir (nuevo, por validar) | ¡Listo! Ahora es «{título}». |
| Al aceptar un hábito nuevo (nuevo, por validar) | Sumamos «{título}» a tu plan. |
| Ya no hay lugar en el plan (nuevo, por validar) | Tu plan ya tiene todos los hábitos que caben por ahora. |
| Presupuesto superado (manual) | Con este hábito, algunos días suman {n}. Subimos tu tiempo diario a {n}; puedes cambiarlo en Perfil. ({n} en horas y minutos, por ejemplo «1 h 10 min») |

## 6. Estados de pantalla

| Pantalla | Vacío | Error |
| --- | --- | --- |
| Hoy | Hoy no tienes pendientes · Disfruta el día. Tus hábitos vuelven pronto. · Botón: «Ver mis hábitos» | No pudimos cargar tus hábitos. Reintentar |
| Hábitos | Todavía no tienes hábitos. Crea el primero. | No pudimos cargar tus hábitos. Reintentar |
| Estadísticas | Cuando completes tus primeros hábitos, aquí verás tu avance. | No pudimos calcular tus estadísticas. Reintentar |
| Jardín | (siempre hay 5 plantas) | No pudimos cargar tu jardín. Reintentar |
| Tienda | — | No pudimos cargar la tienda. Reintentar |
| Generando plan | Estamos preparando tu plan… (a los 10 s: «Sigue en proceso…») | Necesitas conexión para crear tu plan. Reintentar |
| Sin conexión (banner) | Sin conexión. Tus cambios se guardan y se sincronizan después. | — |

**Rachas:** «Racha actual: {n}» y «Tu mejor racha: {n}» (juntas solo si la mejor es mayor, separadas por «·»). Al romperse: «Tu mejor racha fue de {n}. ¿Empezamos otra?». Con `desanimo`, solo la mejor racha. Sin ninguna racha todavía, no se dice nada.

**Progreso:** pestañas «Diario», «Semanal» y «Mensual»; en Mensual, «Mes» y «Año». «Cumpliste {n} de {total} esta semana / este mes / este año» («esa semana / ese mes / ese año» en periodos pasados). Sin nada que contar: «Todavía no hay nada que contar esta semana.» o «No tenías hábitos esa semana.». Diario: «Llevas {n} de {total} hoy», «Hiciste {n} de {total} el lunes 16», «El jueves 19 te tocan {total} hábitos» («te toca 1 hábito»), «Hoy no tienes hábitos.», «Este día no tenías hábitos.», «Este día no te toca ningún hábito.». Estados: «Hecho», «Sin marcar», «Pendiente», «Te toca», «Reprogramado», «No toca». Racha corta: «Mejor: {n}». Botón «Hoy» (TalkBack: «Volver a hoy»). Por hábito: «{n} de {total}» y «Sin días en este periodo». Flechas: «Semana anterior» y «Semana siguiente» (o mes y año). Filtro por área: «Todos» y el nombre de cada área; hoja «Mostrar»; TalkBack: «Filtrar por área: {área}» y, al tocar fuera, «Cerrar sin cambiar el filtro».

**Nota de apoyo profesional** (revisión del plan, con `manejar_estres`): «Estos hábitos ayudan a sentirte mejor día a día. Si el malestar es intenso o no mejora, hablar con un profesional de la salud puede ayudarte.»

## 7. Accesorios (nombres provisionales)

| Orden | Precio | Sombrero | Lentes | Maceta |
| --- | --- | --- | --- | --- |
| 1 | 30 | Gorra | Lentes redondos | Maceta de barro |
| 2 | 60 | Sombrero de paja | Lentes de sol | Maceta de rayas |
| 3 | 100 | Boina | Lentes de corazón | Maceta colgante |
| 4 | 150 | Corona de flores | Lentes de estrella | Maceta de cerámica |
| 5 | 250 | Corona dorada | Monóculo | Maceta dorada |

## 8. Prompts de la IA

Los dos prompts piden **solo JSON** y se validan con Zod (SDD 5.9). La IA recibe claves y parámetros, nunca nombre ni correo.

### `generate-plan` (instrucciones de sistema)

```
Eres el redactor de Habit Green, una app de hábitos en español (tuteo) para personas de 22 a 45 años.
Recibes un plan ya calculado: objetivos, nivel, duración en minutos, días y el obstáculo principal de la persona.
Tu única tarea es redactar textos. No cambies números, días, horarios ni niveles.

Reglas:
- Devuelve solo JSON con esta forma: {"resumen": string, "habitos": [{"objetivo": string, "titulo": string, "descripcion": string}]}.
- Un elemento en "habitos" por cada objetivo recibido, con la misma clave "objetivo".
- "titulo": de 3 a 30 caracteres, empieza con un verbo y menciona la duración si aplica.
- "descripcion": hasta 200 caracteres, concreta y amable.
- "resumen": hasta 300 caracteres, explica por qué el plan empieza pequeño.
- Tono cercano y sin culpa. No menciones fallos ni rachas.
- Prohibido: consejos médicos, diagnósticos, dietas, cantidades de comida o agua, horas de sueño, montos de dinero o consejos de inversión.
- Si el obstáculo es "poco_tiempo", destaca que son hábitos de pocos minutos. Si es "desanimo", destaca que no pasa nada si un día no sale.
```

**Mensaje de usuario (ejemplo):**

```
{"historial":"empieza_y_deja","obstaculo":"olvido","habitos":[{"objetivo":"mover_mas","nivel":1,"titulo_base":"Caminar 5 min","duracion_min":5,"dias_semana":[1,2,4,6]}]}
```

### `adjust-plan` (instrucciones de sistema)

```
Eres el redactor de Habit Green, una app de hábitos en español (tuteo) para personas de 22 a 45 años.
Un hábito cambió de nivel o se agrega uno nuevo. Recibes la dirección del cambio ("subir", "bajar" o "nuevo"), el objetivo, el nivel, la duración en minutos, los días, el título base del catálogo y el obstáculo principal de la persona.
Tu única tarea es redactar el título y la descripción. No cambies números, días ni niveles.

Reglas:
- Devuelve solo JSON con esta forma: {"titulo": string, "descripcion": string}.
- "titulo": de 3 a 30 caracteres, empieza con un verbo, conserva la idea del título base y menciona la duración si el título base la menciona.
- "descripcion": hasta 200 caracteres, concreta y amable.
- Si la dirección es "bajar", el tono normaliza el ajuste: hacerlo más ligero también es avanzar. Nunca hables de fallar.
- Tono cercano y sin culpa. No menciones rachas.
- Prohibido: consejos médicos, diagnósticos, dietas, cantidades de comida o agua, horas de sueño, montos de dinero o consejos de inversión.
```

Se quitó el campo `mensaje` del borrador (Entrega 8): los mensajes de la tarjeta son fijos (sección 5).

**Mensaje de usuario (ejemplo):**

```
{"direccion":"subir","objetivo":"dormir_mejor","nivel":2,"titulo_base":"…","duracion_min":10,"dias_semana":[1,2,3,4,5],"historial":"empieza_y_deja","obstaculo":"olvido"}
```

## Perfil

| Elemento | Texto |
| --- | --- |
| Secciones | Avisos · Horas · Tiempo diario · Cuenta |
| Avisos apagados en Android | Los avisos están apagados en tu teléfono. Actívalos para recibir tus recordatorios. Botón: «Abrir ajustes». |
| Estilo (fila) | Resumen nocturno · Aviso suave · Aviso con ánimo · Lo mínimo |
| Estilo (diálogo) | ¿Cómo te acompañamos? Opciones: los textos de la pregunta 7. |
| Nota de horas | Se usan para tus hábitos nuevos, el resumen y el horario flexible. Cada hábito conserva su hora. |
| Tiempo diario (diálogo) | ¿Cuánto tiempo al día quieres dedicarle? Ruedas «Horas» y «Minutos»; con total 0: «Elige tu tiempo al día.» Botones: «Cancelar», «Aceptar». |
| Tiempo diario: referencia | Tu día con más hábitos suma {n}. |
| Tiempo diario: por debajo (diálogo) | Tu día con más hábitos suma {n}. Puedes guardarlo igual; tus hábitos no cambian. |
| Tiempo diario: máximo | Puedes elegir hasta {n} al día. |
| Tiempo diario por debajo de los hábitos (Perfil) | Algunos días tus hábitos suman {n}. Puedes ajustarlos cuando quieras. |
| Sin ajustes todavía | Tus ajustes llegarán en cuanto te conectes. |
| Error al guardar | No pudimos guardar el cambio. Inténtalo de nuevo. |

## Duración del hábito

| Elemento | Texto |
| --- | --- |
| Título del diálogo | ¿Cuánto dura? |
| Columnas | Horas · Minutos |
| Ayuda | Desliza o toca un número para escribirlo. |
| Sin elegir (0 h 0 min) | Elige cuánto dura. |
| Formato | «25 min», «1 h», «1 h 25 min» |
| Sin duración (solo hábitos propios; valor inicial al crear y al dejar 0 h 0 min) | Sin duración fija |
| Límite de un hábito del plan | Tu plan permite hasta {n} por hábito, según tu tiempo diario. |
