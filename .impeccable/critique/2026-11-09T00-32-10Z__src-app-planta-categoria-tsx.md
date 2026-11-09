---
target: Detalles de la planta
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\planta\\[categoria].tsx"
target_fingerprint: "sha256:9d2cb023e8ea2ef5d2e4f33fedc583435887bfcea57aa5fc382f12ad5804ed50"
target_path: "C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\planta\\[categoria].tsx"
timestamp: 2026-11-09T00-32-10Z
slug: src-app-planta-categoria-tsx
---
Method: design review only (detector not applicable, native platform)

Revisión de código y capturas del usuario (teléfono físico, letra normal). Sin capturas con letra grande.

| # | Heurística | Puntos | Nota |
|---|---|---|---|
| 1 | Estado del sistema | 3 | Barra de pestaña corregida; falta confirmarla en teléfono |
| 2 | Mundo real | 4 | Lenguaje cercano, sin XP ni niveles |
| 3 | Control y libertad | 3 | Tocar de nuevo quita el objeto |
| 4 | Consistencia | 3 | Misma tarjeta de hábito que Hoy y Hábitos |
| 5 | Prevención de errores | 3 | Sin confirmaciones innecesarias; un objeto por tipo |
| 6 | Reconocer, no recordar | 3 | Las celdas de objeto solo muestran la imagen |
| 7 | Flexibilidad | 2 | Tocar o deslizar; sin atajos |
| 8 | Minimalismo | 3 | Sin «Lleva: …», más limpia |
| 9 | Recuperación de errores | 3 | Avisos en Snackbar |
| 10 | Ayuda | 2 | Sin ayuda contextual |
| Total | | 29/40 | Bueno |

## Corregido en este pase

- Pestañas de tipo: la palabra se partía con letra grande o en pantallas angostas.
- Avisos flotantes: tapaban las pestañas de tipo y podían quedar bajo la barra del sistema.
- Rol de TalkBack de las pestañas de tipo: radiogroup en vez de tablist.
- Carrusel: al cambiar de fase ignoraba «reducir movimiento».

## Sin abrir

- Observación: las celdas de objeto sin seleccionar usan borde `divisor`, como las opciones del formulario.
- Pendiente general: anillo de foco.
