---
target: Jardín
total_score: 22
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\(tabs)\\jardin.tsx"
target_fingerprint: "sha256:c85c89f1cb9932ad70fb270f52b5ada5b58d01d5c0935c8c6c0c1f679a1e6553"
target_path: "C:\\Users\\santi\\OneDrive\\Escritorio\\AppMovil\\HabitGreen\\src\\app\\(tabs)\\jardin.tsx"
timestamp: 2026-11-06T06-31-40Z
slug: src-app-tabs-jardin-tsx
---
Method: design review only (detector not applicable, native platform). Revisión del código, sin ver la pantalla: no había teléfono conectado.

## Design Health Score

| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Estado visible | 2 | No se distingue la fase de cada planta |
| 2 | Lenguaje real | 3 | «Jardín» y «Plantas» conviven entre app y mockup |
| 3 | Control y libertad | 3 | Falta comprobar «atrás» en el teléfono |
| 4 | Consistencia | 3 | Hoy muestra el saldo y Jardín no |
| 5 | Prevención de errores | n/a | No hay datos que capturar ni acciones destructivas |
| 6 | Reconocer, no recordar | 2 | Bolsa solo con icono, sin saldo cerca |
| 7 | Eficiencia | 2 | No indica qué planta necesita atención |
| 8 | Diseño minimalista | 2 | La misma frase se repite en varias tarjetas |
| 9 | Recuperarse de errores | 3 | Hay «Reintentar», pero el mensaje no da la causa |
| 10 | Ayuda | 2 | Solo explica el crecimiento si la planta no tiene hábitos |
| Total | | 22/36 | Aceptable (61 %) |

## Design Specificity Verdict

El concepto es muy propio de Habit Green, pero hoy se comporta como una cuadrícula genérica de categorías. El motivo principal es el arte: la pantalla todavía no puede cumplir su promesa de mostrar el progreso. Deterministic scan: not applicable (native platform).

## Overall Impression

La mayor oportunidad es que abrir el Jardín sea la recompensa del día.

## What's Working

- No muestra XP ni niveles, y el lector de pantalla describe la fase y los objetos con palabras.
- Tiene una sola acción coral y tocar una planta es un gesto evidente.
- Cubre carga y error, con opción de reintentar.

## Priority Issues

1. [P1] Todas las plantas son la misma imagen. Los 15 archivos de planta son idénticos. Solución: arte final o, mientras tanto, 3 imágenes provisionales distintas por fase. Comando: /impeccable delight, cuando exista el arte.
2. [P1] La misma frase se repite en 3 o 4 tarjetas de quien recién empieza. Solución: una línea corta, como «Sin hábitos aún», y la explicación en Detalles. Cambia el SDD: lo decide el usuario. Comando: /impeccable clarify.
3. [P2] Las tarjetas sin hábitos no llevan a ninguna parte. Solución: en Detalles, un botón «Agregar hábito» con la categoría ya elegida. Comando: /impeccable onboard.
4. [P2] Pantalla casi vacía si las categorías no se han descargado; `es.jardin.vacio` existe, pero Jardín no lo usa. Solución: mostrar ese estado vacío. Comando: /impeccable harden.
5. [P2] La bolsa no da contexto: es solo un icono y el saldo no está en esta pantalla. Solución: mostrar el saldo junto a la bolsa, si el usuario está de acuerdo. Comando: /impeccable layout.

## Persona Red Flags

- Quien vuelve tras abandonar (propia del proyecto): varias tarjetas le piden lo que aún no hizo y ninguna señala lo que ya logró.
- Jordan, primera vez: puede no asociar la bolsa con la Tienda ni saber cómo crece una planta.
- Casey, una mano y con prisa: la bolsa queda lejos del pulgar. Lo pide el mockup.

## Minor Observations

- La quinta tarjeta queda sola en su fila, igual que en el mockup.
- El botón coral cuadrado está repetido en Hábitos y Jardín.

## Questions to Consider

- ¿Qué debería ver alguien en Jardín el día que su planta cambió de fase?
