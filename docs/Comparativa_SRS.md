# Comparativa: SRS v4.0 contra Habit Green

Qué requerimientos del SRS (versión 4.0, 13 de noviembre de 2026) cumple la app y cuáles no, revisado contra el código y los documentos del proyecto el 22 de noviembre de 2026. El detalle de cada función está en el [SDD](sdd.md) y las decisiones, en la [bitácora de IA](Bitacora_IA.md).

**Leyenda:** ✅ cumple · 🟡 parcial · ❌ no cumple · ⚪ sin medir

## Resumen

| Grupo | ✅ | 🟡 | ❌ | ⚪ |
|---|---|---|---|---|
| RF «Must have» (10) | 4 | 4 | 2 | |
| RF «Should have» (3) | 1 | 1 | 1 | |
| RNF (11) | 2 | 3 | 1 | 5 |
| Interfaz (7) | 4 | 3 | | |
| Restricciones (4) | 1 | 3 | | |
| Casos de uso (15) | 11 | 1 | 3 | |

Faltan por completo: introspección (RF-04, UC-11), modo enfoque (RF-14, UC-13), checklist de barreras (RF-17, UC-10) y reducir avisos con el tiempo (RNF-08).

## 1. Requerimientos funcionales

### «Must have»

| RF | Requerimiento | Estado | Cómo está en la app |
|---|---|---|---|
| RF-01 | Recordatorios personalizados | ✅ | Hora por hábito, días de la semana y avisos locales con una ventana de 7 días. El 22 nov se corrigió que un aviso retrasado se perdiera y se pidió el permiso de alarmas exactas para que lleguen a su hora (pendiente de la development build). |
| RF-02 | Gestión de horarios en espacios libres | 🟡 | Hay tiempo diario, momentos del día (mañana, mediodía, tarde, noche) y el plan nuevo se acomoda en el tiempo libre. No hay agenda ni detección de choques entre horas. |
| RF-03 | Secuencia progresiva de micro-pasos | ✅ | Cada meta tiene 3 niveles en el catálogo y el nivel 1 dura 5 min o menos. Aplica a los hábitos del plan, no a los propios. |
| RF-04 | Preguntas de introspección basadas en valores | ❌ | No existe. |
| RF-08 | Recompensa y refuerzo inmediato | ✅ | Monedas con animación, crecimiento de la planta y celebración al cambiar de fase. |
| RF-09 | Flexibilidad de metas sin penalización | ✅ | Editar días y duración, pausar, reprogramar un día fallado y «hacerlo más ligero». |
| RF-13 | Mensajes motivacionales periódicos | 🟡 | El estilo «Recordatorio y ánimo» rota mensajes dentro de los avisos. No hay aviso por logros como «3 días seguidos». |
| RF-14 | Reducción de distracciones (enfoque, «No molestar») | ❌ | No existe. El temporizador quedó fuera de la demo. |
| RF-15 | Reajuste dinámico con punto medio | 🟡 | Revisión cada 7 días: con menos del 50 % en 14 días el hábito baja un nivel solo, con la opción «Mantenerlo como estaba». El SRS pide menos del 40 % en 7 días y una ventana en el detalle del hábito. |
| RF-19 | Formulario de reajuste por incumplimiento | 🟡 | La pregunta 6 del formulario identifica el obstáculo una vez y ajusta el plan. No hay formulario después de cada incumplimiento. |

### «Should have»

| RF | Requerimiento | Estado | Cómo está en la app |
|---|---|---|---|
| RF-16 | Refuerzo en hitos clave | 🟡 | Celebración de fase de la planta y barra de avance del día. Sin hitos del 50 % u 80 % ni audio. |
| RF-17 | Checklist de barreras ante incumplimiento | ❌ | La reprogramación ofrece mover el día, pero no pregunta qué pasó. |
| RF-18 | Recordatorio nocturno con resumen | ✅ | El estilo «Resumen nocturno» avisa a las 21:00 con los hábitos de mañana. La hora es fija; el SRS pide que la configure el usuario. |

### «Won't have»

| RF | Requerimiento | Estado | Nota |
|---|---|---|---|
| RF-05 | Temporizadores con descanso | No se hizo | Coincide con el SRS. |
| RF-06 | Micro-hábitos sin configuración de tiempo | Sí se hizo | Hábitos «sin duración fija» y sin hora obligatoria. |
| RF-07 | Estudio compartido | No se hizo | Coincide con el SRS. |
| RF-10 | Sistema de recordatorios | Sí se hizo | Cubierto por RF-01, sin el botón en la notificación. |
| RF-11 | Notificación de seguimiento tras inactividad | No se hizo | En su lugar, al abrir la app se ofrece reprogramar lo no hecho. |
| RF-12 | Programación de recordatorios | Sí se hizo | Cubierto por RF-01. |

## 2. Requerimientos no funcionales

| RNF | Requerimiento | Estado | Nota |
|---|---|---|---|
| RNF-01 | Respuesta en menos de 1.5 s | ⚪ | Sin medir. Todo se lee y escribe en SQLite local. |
| RNF-02 | Arranque en frío en menos de 2 s | ⚪ | Sin medir. |
| RNF-03 | Menos de 15 MB de datos al día | ⚪ | Sin medir. No hay presencia virtual. |
| RNF-04 | Menos del 3 % de batería al día | ⚪ | Sin medir. El geofencing (Entrega 10) puede afectarlo. |
| RNF-05 | Cifrado en tránsito y en reposo | 🟡 | TLS hacia Supabase, cifrado en reposo de Supabase y sesión en `expo-secure-store`. La base SQLite del teléfono no está cifrada. |
| RNF-06 | Notificaciones no invasivas y configurables | ✅ | 4 estilos, horas por momento, segundo aviso y opción de apagarlas. |
| RNF-07 | Sin penalización por fallo | ✅ | Nunca se resta XP ni monedas; un día movido no cuenta como fallado. |
| RNF-08 | Reducción gradual de avisos | ❌ | No existe. |
| RNF-09 | Comunicación autocompasiva | 🟡 | Textos sin culpa en [textos.md](textos.md). Falta la lista de cotejo TCC/ACT validada. |
| RNF-10 | Disponibilidad del 99 % | ⚪ | Supabase gratuito no garantiza disponibilidad; la app funciona sin conexión. |
| RNF-11 | Paridad Android e iOS | 🟡 | La demo es solo Android; iOS se valida antes de publicar. |

## 3. Interfaz y restricciones

| ID | Requerimiento | Estado | Nota |
|---|---|---|---|
| RI-01 | Diseño limpio y estético | ✅ | [Guía de UX/UI](Guía%20de%20UX%20UI.md), áreas táctiles de 48 dp y contraste revisado. |
| RI-02 | Campos rápidos basados en valores TCC/ACT | 🟡 | El formulario es de selección rápida, pero pregunta por hábitos, no por valores. |
| RI-03 | Indicadores al 50 % y 100 %, con audio opcional | 🟡 | Solo la barra de avance del día. |
| RI-04 | Marcar como hecho desde la notificación | ✅ | Botón «Hecho» en el aviso de un hábito: abre Hoy y lo marca con sus monedas (22 nov, falta la prueba en el teléfono). |
| RI-05 | Gamificación no punitiva | ✅ | Jardín, monedas, tienda y rachas. |
| RI-06 | Tono autocompasivo en notificaciones | ✅ | |
| RI-07 | API de notificaciones del sistema | 🟡 | Avisos locales sí; «No molestar» no. Usa una development build, no Expo Go. |
| RR-01 | Tecnologías web y móviles | 🟡 | Solo móvil. |
| RR-02 | MVP dentro de 2026-2 | 🟡 | En curso; faltan las Entregas 9 y 10. |
| RR-03 | Mínimo de exigencia en el reajuste | ✅ | El nivel 1 en versión corta es el piso, subir pide 85 % y hay un cupo total de hábitos. |
| RR-04 | Anonimato de la introspección | 🟡 | No hay introspección. La IA solo recibe claves del formulario, sin nombre ni correo. |

## 4. Casos de uso

| UC | Caso de uso | Estado |
|---|---|---|
| UC-01 | Completar formulario de perfil | ✅ |
| UC-02 | Generar plan de hábitos | ✅ |
| UC-03 | Consultar plan y micro-pasos | ✅ (detalle del plan) |
| UC-04 | Marcar micro-paso como completado | ✅ |
| UC-05 | Recibir recompensa | ✅ |
| UC-06 | Configurar recordatorios | ✅ |
| UC-07 | Recibir recordatorio | ✅ |
| UC-08 | Ajustar o pausar meta | ✅ |
| UC-09 | Reevaluar meta con punto medio | 🟡 (umbrales distintos, ver RF-15) |
| UC-10 | Responder checklist de barreras | ❌ |
| UC-11 | Responder pregunta de introspección | ❌ |
| UC-12 | Consultar progreso | ✅ |
| UC-13 | Activar modo enfoque | ❌ |
| UC-14 | Recibir resumen nocturno | ✅ |
| UC-15 | Confirmar plan generado | ✅ |

## 5. Siguientes pasos

**Fáciles de cerrar en la app:**
1. ~~**RI-04:** botón «Hecho» en el aviso.~~ Hecho el 22 nov.
2. **RF-17 y RF-19 (UC-10):** en la tarjeta de reprogramación, preguntar qué pasó (tiempo, energía o recursos) y sugerir un ajuste en un toque.
3. **RF-18:** elegir la hora del resumen nocturno en «Avisos y horas».

**Grandes:** introspección (RF-04, RI-02, UC-11) y modo enfoque (RF-14, UC-13). Se pueden agregar como una entrega nueva o pasarlos a «Should have» o «Won't have» en el SRS, con su justificación.

**Para alinear el SRS con la app (versión 5.0):**
- Subir RF-06, RF-10 y RF-12 de «Won't have», porque ya están hechos.
- Ajustar RF-15 y UC-09 a 50 % en 14 días.
- Cambiar «Expo Go» por «development build» en RI-07.
- Anotar que la demo es solo Android (RNF-11).
